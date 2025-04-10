/// Module escrow_system
module escrow_system::dispute;

// Importing necessary modules from sui
use sui::event;
use sui::clock::{Self, Clock};

// Importing necessary modules from standard library
use std::string::{Self, String};

use escrow_system::escrow::{Self, EscrowContract};

// Error codes
const ENotAuthorized: u64 = 1;
const EInvalidState: u64 = 2;
// const EDisputeNotFound: u64 = 3;
const EAlreadyVoted: u64 = 4;
// const EDisputeActive: u64 = 5;
const EVotingPeriodEnded: u64 = 6;
const EVotingPeriodNotEnded: u64 = 7;
const EEvidenceSubmissionEnded: u64 = 8;
const EEvidenceTooLarge: u64 = 9;
// const EDisputeAlreadyFinalized: u64 = 10;

// Resolution outcomes
const OUTCOME_PENDING: u8 = 0;
const OUTCOME_CLIENT_WINS: u8 = 1;
const OUTCOME_FREELANCER_WINS: u8 = 2;
const OUTCOME_SPLIT: u8 = 3;

// Dispute States
const STATE_CREATED: u8 = 0;
const STATE_EVIDENCE_COLLECTION: u8 = 1;
const STATE_VOTING: u8 = 2;
const STATE_FINALIZED: u8 = 3;
const STATE_WITHDRAWN: u8 = 4;

// Configurations constants
const MAX_EVIDENCE_LENGTH: u64 = 10000; // Maximum character length for evidence
const EVIDENCE_PERIOD: u64 = 3 * 24 * 60 * 60 * 1000; // 3 days in milliseconds
const VOTING_PERIOD: u64 = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

// Dispute object/struct
public struct Dispute has key, store {
    id: UID,
    escrow_id: address,
    opened_by: address,
    client: address,
    freelancer: address,
    reason: String,
    client_evidence: String,
    freelancer_evidence: String,
    votes_for_client: u64,
    votes_for_freelancer: u64,
    outcome: u8,
    state: u8,
    voters: vector<address>,
    created_at: u64,
    evidence_end_time: u64,
    voting_end_time: u64,
    // resolved_at: u64,
}

// Events
public struct DisputeCreated has copy, drop {
    dispute_id: address,
    escrow_id: address,
    opened_by: address,
    created_at: u64,
}

public struct DisputeResolved has copy, drop {
    dispute_id: address,
    escrow_id: address,
    outcome: u8,
    client_votes: u64,
    freelancer_votes: u64,
}

public struct DisputeWithdrawn has copy, drop {
    dispute_id: address,
    escrow_id: address,
    withdrawn_by: address,
    withdrawn_at: u64,
}

public struct EvidenceSubmitted has copy, drop {
    dispute_id: address,
    submitted_by: address,
    is_client: bool,
}

public struct VoteCast has copy,drop {
    dispute_id: address,
    voter: address,
    vote_for_client: bool,
}

// ==== Key Functions ====

/// Create a new dispute for an escrow contract
/// 
/// # Arguments
/// * `escrow` - The escrow contract object
/// * `reason` - The reason for the dispute
/// * `clock` - The clock object to get the current time
/// * `ctx` - The transaction context
/// 
/// # Returns
/// * A new dispute object
/// 
/// # Errors
/// * `ENotAuthorized` - If the sender is not the client or freelancer
public fun create_dispute(
    escrow: &mut EscrowContract,
    reason: String,
    clock: &Clock,
    ctx: &mut TxContext,
): Dispute {
    let sender = ctx.sender();
    // Get both client and Freelancer addresses
    let (client, freelancer, _, _, _) = escrow::get_escrow_details(escrow);

    // Only clients and freelancers can open a dispute
    assert!(sender == client || sender == freelancer, ENotAuthorized);
    // Create dispute object
    let current_time = clock::timestamp_ms(clock);

    let dispute = Dispute {
        id: object::new(ctx),
        escrow_id: object::id_address(escrow),
        opened_by: sender,
        client,
        freelancer,
        reason,
        client_evidence: string::utf8(b""),
        freelancer_evidence: string::utf8(b""),
        votes_for_client: 0,
        votes_for_freelancer: 0,
        outcome: OUTCOME_PENDING,
        state: STATE_EVIDENCE_COLLECTION,
        voters: vector::empty<address>(),
        created_at: current_time,
        evidence_end_time: current_time + EVIDENCE_PERIOD,
        voting_end_time: current_time + VOTING_PERIOD,
    };

    // Open dispute
    escrow::open_dispute(escrow, reason, ctx);

    // Emit event
    event::emit(DisputeCreated {
        dispute_id: object::id_address(&dispute),
        escrow_id: object::id_address(escrow),
        opened_by: sender,
        created_at: current_time,
    });

    dispute
}

/// Submit evidence for a dispute (by client or freelancer)
/// 
/// # Arguments
/// * `dispute` - The dispute to submit evidence for
/// * `evidence` - The evidence being submitted
/// * `clock` - Clock object for timestamp
/// * `ctx` - Transaction context
///
/// # Errors
/// * `ENotAuthorized` - If sender is not client or freelancer
/// * `EEvidenceSubmissionEnded` - If evidence submission period has ended
/// * `EEvidenceTooLarge` - If evidence exceeds max length
/// * `EInvalidState` - If dispute is not in evidence collection state
public fun submit_evidence(dispute: &mut Dispute, evidence: String, clock: &Clock, ctx: &mut TxContext) {
    let sender = ctx.sender();

    // Check dispute state
    assert!(dispute.state == STATE_EVIDENCE_COLLECTION, EInvalidState);

    // Check if evidence submission period is still active
    let current_time = clock::timestamp_ms(clock);
    assert!(current_time <= dispute.evidence_end_time, EEvidenceSubmissionEnded);

    // Check evidence length
    assert!(string::length(&evidence) <= MAX_EVIDENCE_LENGTH, EEvidenceTooLarge);

    let mut is_client = false;
    if (sender == dispute.client) {
        dispute.client_evidence = evidence;
        is_client = true;
    } else if (sender == dispute.freelancer) {
        dispute.freelancer_evidence = evidence;
    } else {
        assert!(false, ENotAuthorized);
    };

    // Emit event
    event::emit(EvidenceSubmitted {
        dispute_id: object::id_address(dispute),
        submitted_by: sender,
        is_client,
    });

    // If both parties have submitted evidence and evidence period is over,
    // transition to voting state
    if (current_time >= dispute.evidence_end_time && 
        !string::is_empty(&dispute.client_evidence) && 
        !string::is_empty(&dispute.freelancer_evidence)) {
        dispute.state = STATE_VOTING;
    }
}

/// Update previously submitted evidence
/// 
/// # Arguments
/// * `dispute` - The dispute to update evidence for
/// * `evidence` - The updated evidence
/// * `clock` - Clock object for timestamp
/// * `ctx` - Transaction context
///
/// # Errors
/// * Same as submit_evidence
public fun update_evidence(
    dispute: &mut Dispute, 
    evidence: String, 
    clock: &Clock,
    ctx: &mut TxContext
) {
    // Reuse submit_evidence logic
    submit_evidence(dispute, evidence, clock, ctx)
}

/// Cast vote on dispute
/// 
/// # Arguments
/// * `dispute` - The dispute to vote on
/// * `vote_for_client` - Whether the vote is for the client (true) or freelancer (false)
/// * `clock` - Clock object for timestamp
/// * `ctx` - Transaction context
///
/// # Errors
/// * `EVotingPeriodEnded` - If voting period has ended
/// * `EInvalidState` - If dispute is not in voting state
/// * `EAlreadyVoted` - If sender has already voted
public fun vote(dispute: &mut Dispute, vote_for_client: bool, clock: &Clock, ctx: &mut TxContext) {
    let sender = ctx.sender();

    // Check dispute state
    assert!(dispute.state == STATE_VOTING, EInvalidState);

    // Check if voting period is still active
    let current_time = clock::timestamp_ms(clock);
    assert!(current_time <= dispute.voting_end_time, EVotingPeriodEnded);

    // Check if user already voted
    let mut i = 0;
    
    while (i < vector::length(&dispute.voters)) {
        if (*vector::borrow(&dispute.voters, i) == sender) {
            assert!(false, EAlreadyVoted);
        };
        i = i + 1;
    };
    // Record vote
    vector::push_back(&mut dispute.voters, sender);
    if (vote_for_client) {
        dispute.votes_for_client = dispute.votes_for_client + 1;
    } else {
        dispute.votes_for_freelancer = dispute.votes_for_freelancer + 1;
    };

    // Emit event
    event::emit(VoteCast {
        dispute_id: object::id_address(dispute),
        voter: sender,
        vote_for_client,
    });
}

/// Finalize dispute and determine outcome
/// 
/// # Arguments
/// * `dispute` - The dispute to finalize
/// * `escrow` - The associated escrow contract
/// * `clock` - Clock object for timestamp
/// * `ctx` - Transaction context
///
/// # Errors
/// * `EVotingPeriodNotEnded` - If voting period has not ended
/// * `EInvalidState` - If dispute is not in voting state
/// * `EDisputeAlreadyFinalized` - If dispute is already finalized
public fun finalize_dispute(dispute: &mut Dispute, clock: &Clock, _ctx: &mut TxContext) {
    // Check dispute state
    assert!(dispute.state == STATE_VOTING, EInvalidState);

    // Check if voting period has ended
    let current_time = clock::timestamp_ms(clock);
    assert!(current_time > dispute.voting_end_time, EVotingPeriodNotEnded);

    // Determine outcome
    if (dispute.votes_for_client > dispute.votes_for_freelancer) {
        dispute.outcome = OUTCOME_CLIENT_WINS;
    } else if (dispute.votes_for_freelancer > dispute.votes_for_client) {
        dispute.outcome = OUTCOME_FREELANCER_WINS;
    } else {
        dispute.outcome = OUTCOME_SPLIT;
    };

    // Update dispute state
    dispute.state = STATE_FINALIZED;

    // Emit event
    event::emit(DisputeResolved {
        dispute_id: object::id_address(dispute),
        escrow_id: dispute.escrow_id,
        outcome: dispute.outcome,
        client_votes: dispute.votes_for_client,
        freelancer_votes: dispute.votes_for_freelancer,
    });
}

/// Withdraw a dispute (can only be done by the dispute opener)
/// 
/// # Arguments
/// * `dispute` - The dispute to withdraw
/// * `escrow` - The associated escrow contract
/// * `clock` - Clock object for timestamp
/// * `ctx` - Transaction context
///
/// # Errors
/// * `ENotAuthorized` - If sender is not the dispute opener
/// * `EInvalidState` - If dispute is already finalized
public fun withdraw_dispute(
    dispute: &mut Dispute,
    clock: &Clock,
    ctx: &mut TxContext
) {
    let sender = tx_context::sender(ctx);
    
    // Only the dispute opener can withdraw it
    assert!(sender == dispute.opened_by, ENotAuthorized);
    
    // Cannot withdraw finalized dispute
    assert!(dispute.state != STATE_FINALIZED && dispute.state != STATE_WITHDRAWN, EInvalidState);
    
    // Update state
    dispute.state = STATE_WITHDRAWN;
    
    // Emit event
    event::emit(DisputeWithdrawn {
        dispute_id: object::id_address(dispute),
        escrow_id: dispute.escrow_id,
        withdrawn_by: sender,
        withdrawn_at: clock::timestamp_ms(clock),
    });
}

// ==== Helper Functions ====

// Get dispute details
public fun get_dispute_details(dispute: &Dispute): (address, address, address, u8, u8, u64, u64, u64, u64) {
    (
        dispute.escrow_id,
        dispute.client,
        dispute.freelancer,
        dispute.outcome,
        dispute.state,
        dispute.votes_for_client,
        dispute.votes_for_freelancer,
        dispute.evidence_end_time,
        dispute.voting_end_time,
    )
}

// Check if address has voted
public fun has_voted(dispute: &Dispute, voter: address): bool {
    let mut i = 0;

    while (i < vector::length(&dispute.voters)) {
        if (*vector::borrow(&dispute.voters, i) == voter) {
            return true
        };
        i = i + 1;
    };

    false
}

// Get vote count
public fun get_vote_count(dispute: &Dispute): (u64, u64) {
    (dispute.votes_for_client, dispute.votes_for_freelancer)
}

/// Get remaining time for voting
/// 
/// # Arguments
/// * `dispute` - The dispute to check
/// * `clock` - Clock object for timestamp
///
/// # Returns
/// * Remaining milliseconds for voting, 0 if period has ended
public fun get_remaining_voting_time(dispute: &Dispute, clock: &Clock): u64 {
    let current_time = clock::timestamp_ms(clock);
    if (current_time >= dispute.voting_end_time) {
        return 0
    } else {
        return dispute.voting_end_time - current_time
    }
}

/// Get dispute state as a string
/// 
/// # Arguments
/// * `dispute` - The dispute to check
///
/// # Returns
/// * String representation of the dispute state
public fun get_dispute_state_string(dispute: &Dispute): String {
    if (dispute.state == STATE_CREATED) {
        return string::utf8(b"Created")
    } else if (dispute.state == STATE_EVIDENCE_COLLECTION) {
        return string::utf8(b"Evidence Collection")
    } else if (dispute.state == STATE_VOTING) {
        return string::utf8(b"Voting")
    } else if (dispute.state == STATE_FINALIZED) {
        return string::utf8(b"Finalized")
    } else if (dispute.state == STATE_WITHDRAWN) {
        return string::utf8(b"Withdrawn")
    } else {
        return string::utf8(b"Unknown")
    }
}

/// Get dispute outcome as a string
/// 
/// # Arguments
/// * `dispute` - The dispute to check
///
/// # Returns
/// * String representation of the dispute outcome
public fun get_dispute_outcome_string(dispute: &Dispute): String {
    if (dispute.outcome == OUTCOME_PENDING) {
        return string::utf8(b"Pending")
    } else if (dispute.outcome == OUTCOME_CLIENT_WINS) {
        return string::utf8(b"Client Wins")
    } else if (dispute.outcome == OUTCOME_FREELANCER_WINS) {
        return string::utf8(b"Freelancer Wins")
    } else if (dispute.outcome == OUTCOME_SPLIT) {
        return string::utf8(b"Split")
    } else {
        return string::utf8(b"Unknown")
    }
}

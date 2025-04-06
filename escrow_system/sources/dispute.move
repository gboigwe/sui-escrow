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
const EDisputeNotFound: u64 = 3;
const EAlreadyVoted: u64 = 4;
const EDisputeActive: u64 = 5;
const EVotingPeriodEnded: u64 = 6;
const EVotingPeriodNotEnded: u64 = 7;

// Resolution outcomes
const OUTCOME_PENDING: u8 = 0;
const OUTCOME_CLIENT_WINS: u8 = 1;
const OUTCOME_FREELANCER_WINS: u8 = 2;
const OUTCOME_SPLIT: u8 = 3;

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
    voters: vector<address>,
    created_at: u64,
    voting_end_time: u64,
}

// Events
public struct DisputeResolved has copy, drop {
    dispute_id: address,
    escrow_id: address,
    outcome: u8,
    client_votes: u64,
    freelancer_votes: u64,
}

public struct VoteCast has copy,drop {
    dispute_id: address,
    voter: address,
    vote_for_client: bool,
}

// ==== Key Functions ====

// Create a new dispute for an escrow contract
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
    let voting_period = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

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
        voters: vector::empty<address>(),
        created_at: current_time,
        voting_end_time: current_time + voting_period,
    };

    // Open dispute
    escrow::open_dispute(escrow, reason, ctx);

    dispute
}

// Submit evidence (by client or freelancer)
public fun submit_evidence(dispute: &mut Dispute, evidence: String, ctx: &mut TxContext) {
    let sender = ctx.sender();

    if (sender == dispute.client) {
        dispute.client_evidence = evidence;
    } else if (sender == dispute.freelancer) {
        dispute.freelancer_evidence = evidence;
    } else {
        assert!(false, ENotAuthorized);
    }
}

// Cast vote on dispute
public fun vote(dispute: &mut Dispute, vote_for_client: bool, clock: &Clock, ctx: &mut TxContext) {
    let sender = ctx.sender();

    // Check if voting period is still active
    let current_time = clock.timestamp_ms();
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

// Finalize dispute and determine outcome
public fun finalize_dispute(dispute: &mut Dispute, clock: &Clock, _ctx: &mut TxContext) {
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

    // Emit event
    event::emit(DisputeResolved {
        dispute_id: object::id_address(dispute),
        escrow_id: dispute.escrow_id,
        outcome: dispute.outcome,
        client_votes: dispute.votes_for_client,
        freelancer_votes: dispute.votes_for_freelancer,
    });
}


// ==== Helper Functions ====

// Get dispute details
public fun get_dispute_details(dispute: &Dispute): (address, address, address, u8, u64, u64, u64) {
    (
        dispute.escrow_id,
        dispute.client,
        dispute.freelancer,
        dispute.outcome,
        dispute.votes_for_client,
        dispute.votes_for_freelancer,
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

// Get time remaining time for voting
public fun get_remaining_voting_time(dispute: &Dispute, clock: &Clock): u64 {
    let current_time = clock::timestamp_ms(clock);
    if (current_time >= dispute.voting_end_time) {
        return 0
    } else {
        return dispute.voting_end_time - current_time
    }
}

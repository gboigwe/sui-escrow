/// Module: escrow_system
module escrow_system::escrow;

// Imporing necessary modules from Sui
use sui::balance::{Self, Balance};
use sui::sui::SUI;
use sui::coin::{Self, Coin};
use sui::event;
use sui::clock::{Self, Clock};

// Importing necessary modules from standard library
use std::string::{Self, String};

// Error codes
const ENotAuthorized: u64 = 1;
const EInvalidState: u64 = 2;
const EInsufficientFunds: u64 = 3;
const EInvalidMilestone: u64 = 4;
const EInvalidAmount: u64 = 5;
const EDeadlineExceeded: u64 = 6;
const EMilestoneAmountMismatch: u64 = 7;
const EInvalidTimeParameters: u64 = 8;

// Status Enum values
const STATUS_ACTIVE: u8 = 0;
const STATUS_COMPLETED: u8 = 1;
const STATUS_DISPUTED: u8 = 2;
const STATUS_CANCELLED: u8 = 3;
// const STATUS_EXPIRED: u8 = 4;

// Milestone status
const MILESTONE_PENDING: u8 = 0;
const MILESTONE_SUBMITTED: u8 = 1;
const MILESTONE_APPROVED: u8 = 2;
const MILESTONE_REJECTED: u8 = 3;
// const MILESTONE_AUTOAPPROVED: u8 = 4;
// const MILESTONE_DISPUTED: u8 = 5;

// Main escrow contract object/struct
public struct EscrowContract has key {
    id: UID,
    client: address,
    freelancer: address,
    total_amount: u64,
    remaining_balance: Balance<SUI>,
    status: u8,
    milestones: vector<Milestone>,
    created_at: u64,
    end_date: u64,
    description: String,
}

// Milestone object/struct
public struct Milestone has store {
    description: String,
    amount: u64,
    status: u8,
    deadline: u64,
    submission_note: String,
    rejection_reason: String,
}

// Capability for admin functions
public struct EscrowAdmin has key {
    id: UID,
}

// Events
public struct EscrowCreated has copy, drop {
    escrow_id: address,
    client: address,
    freelancer: address,
    total_amount: u64,
}

public struct MilestoneCompleted has copy, drop {
    escrow_id: address,
    milestone_index: u64,
    amount: u64,
}

public struct MilestoneRejected has copy, drop {
    escrow_id: address,
    milestone_index: u64,
    reason: String,
}

public struct ContractCompleted has copy, drop {
    escrow_id: address,
    total_paid: u64,
}

public struct ContractCancelled has copy, drop {
    escrow_id: address,
    cancelled_by: address,
    refund_amount: u64,
}

public struct DisputeOpened has copy, drop {
    escrow_id: address,
    opened_by: address,
    reason: String,
}

/// Initialize the escrow module
/// 
/// # Arguments
/// * `ctx` - Transaction context
fun init(ctx: &mut TxContext) {
    // Create the EscrowAdmin object and transfer Admin Capability
    transfer::transfer(
        EscrowAdmin {id: object::new(ctx)},
        tx_context::sender(ctx),
    )
}

// ==== Core Functions ====

/// Create a new escrow contract
/// 
/// # Arguments
/// * `client` - The client address
/// * `freelancer` - The freelancer address
/// * `description` - The description of the escrow contract
/// * `end_date` - The end date of the escrow contract
/// * `payment` - The payment coin
/// * `clock` - The clock object
/// * `ctx` - The transaction context
/// 
/// # Returns
/// * The address of the escrow contract
public fun create_escrow(
    client: address,
    freelancer: address,
    description: String,
    end_date: u64,
    payment: Coin<SUI>,
    clock: &Clock,
    ctx: &mut TxContext
): address {
    let total_amount = coin::value(&payment);
    let balance = coin::into_balance(payment);
    
    // Validate end_date is in the future
    let current_time = clock::timestamp_ms(clock);
    assert!(end_date > current_time, EInvalidTimeParameters);
    
    // Validate payment amount
    assert!(total_amount > 0, EInvalidAmount);

    let escrow = EscrowContract {
        id: object::new(ctx),
        client,
        freelancer,
        total_amount,
        remaining_balance: balance,
        status: STATUS_ACTIVE,
        milestones: vector::empty<Milestone>(),
        created_at: current_time,
        end_date,
        description,
    };

    let escrow_id = object::id_address(&escrow);

    // Emit event
    event::emit(EscrowCreated {
        escrow_id,
        client,
        freelancer,
        total_amount,
    });

    // Transfer Ownership of escrow to shared state
    transfer::share_object(escrow);

    // Return the escrow ID which is the address of the escrow contract 
    escrow_id
}

/// Add a milestone to an escrow contract
/// 
/// # Arguments
/// * `escrow` - The escrow contract
/// * `description` - The description of the milestone
/// * `amount` - The amount of the milestone
/// * `deadline` - The deadline of the milestone
/// * `clock` - The clock object
/// * `ctx` - The transaction context
public fun add_milestone(
    escrow: &mut EscrowContract,
    description: String,
    amount: u64,
    deadline: u64,
    clock: &Clock,
    ctx: &mut TxContext
) {
    // Only clients can add milestones
    assert!(tx_context::sender(ctx) == escrow.client, ENotAuthorized);
    // The contract must still be active
    assert!(escrow.status == STATUS_ACTIVE, EInvalidState);

    // Validate Deadline
    let current_time = clock::timestamp_ms(clock);
    assert!(deadline > current_time, EDeadlineExceeded);
    assert!(deadline < escrow.end_date, EInvalidTimeParameters);

    // validate amount
    assert!(amount > 0, EInvalidAmount);
    assert!(amount <= balance::value(&escrow.remaining_balance), EInsufficientFunds);
    
    // Ensure that total milestone amounts don't exceed contract total
    let total_milestone_amount = get_total_milestone_amount(escrow) + amount;
    assert!(total_milestone_amount <= escrow.total_amount, EMilestoneAmountMismatch);

    let milestone = Milestone {
        description,
        amount,
        status: MILESTONE_PENDING,
        deadline,
        submission_note: string::utf8(b""),
        rejection_reason: string::utf8(b"")
    };

    vector::push_back(&mut escrow.milestones, milestone);
}

/// Submit a milestone as completed by a freelancer
/// 
/// # Arguments
/// * `escrow` - The escrow contract
/// * `milestone_index` - The index of the milestone
/// * `submission_note` - The note of the milestone
/// * `ctx` - The transaction context
public fun submit_milestone(
    escrow: &mut EscrowContract,
    milestone_index: u64,
    submission_note: String,
    ctx: &mut TxContext
) {
    // Only freelancers can submit milestones
    assert!(tx_context::sender(ctx) == escrow.freelancer, ENotAuthorized);
    // The contract must still be active
    assert!(escrow.status == STATUS_ACTIVE, EInvalidState);
    // The Milestone index must be valid
    assert!(milestone_index < vector::length(&escrow.milestones), EInvalidMilestone);

    // Get the milestone
    let milestone = vector::borrow_mut(&mut escrow.milestones, milestone_index);
    // The milestone must be pending
    assert!(milestone.status == MILESTONE_PENDING, EInvalidState);

    // Update the milestone status and submission note
    milestone.status = MILESTONE_SUBMITTED;
    milestone.submission_note = submission_note;
}

/// Approve a milestone and release payment (client)
/// 
/// # Arguments
/// * `escrow` - The escrow contract
/// * `milestone_index` - The index of the milestone
/// * `ctx` - The transaction context
public fun approve_milestone(escrow: &mut EscrowContract, milestone_index: u64, ctx: &mut TxContext) {
    // Only clients can approve milestones
    assert!(tx_context::sender(ctx) == escrow.client, ENotAuthorized);
    // The contract must still be active
    assert!(escrow.status == STATUS_ACTIVE, EInvalidState);
    // The milestone index must be valid
    assert!(milestone_index < vector::length(&escrow.milestones), EInvalidMilestone);

    // Get the milestone
    let milestone = vector::borrow_mut(& mut escrow.milestones, milestone_index);
    assert!(milestone.status == MILESTONE_SUBMITTED, EInvalidState);

    // Update the milestone status to approved
    milestone.status = MILESTONE_APPROVED;

    // Release payment
    let payment_amount = milestone.amount;
    let payment = coin::take(&mut escrow.remaining_balance, payment_amount, ctx);

    // Transfer the payment to the freelancer
    transfer::public_transfer(payment, escrow.freelancer);

    // Emit event
    event::emit(MilestoneCompleted {
        escrow_id: object::id_address(escrow),
        milestone_index,
        amount: payment_amount,
    });

    // Check if all milestones are completed
    check_contract_completion(escrow, ctx);
}

/// Reject a milestone submission (client)
/// 
/// # Arguments
/// * `escrow` - The escrow contract
/// * `milestone_index` - The index of the milestone
/// * `rejection_reason` - The reason for rejecting the milestone
/// * `ctx` - The transaction context
public fun reject_milestone(
    escrow: &mut EscrowContract,
    milestone_index: u64,
    rejection_reason: String,
    ctx: &mut TxContext
) {
    // Only clients can reject milestones
    assert!(tx_context::sender(ctx) == escrow.client, ENotAuthorized);
    // Contract must still be active
    assert!(escrow.status == STATUS_ACTIVE, EInvalidState);
    // Milestone index must be valid
    assert!(milestone_index < vector::length(&escrow.milestones), EInvalidMilestone);

    // Get the milestone
    let milestone = vector::borrow_mut(&mut escrow.milestones, milestone_index);
    assert!(milestone.status == MILESTONE_SUBMITTED, EInvalidState);

    milestone.status = MILESTONE_REJECTED;
    milestone.rejection_reason = rejection_reason;

    // Emit event
    event::emit(MilestoneRejected {
        escrow_id: object::uid_to_address(&escrow.id),
        milestone_index,
        reason: milestone.rejection_reason,
    });
}

/// Open a dispute (both parties)
/// 
/// # Arguments
/// * `escrow` - The escrow contract
/// * `reason` - The reason for the dispute
/// * `ctx` - The transaction context
public fun open_dispute(escrow: &mut EscrowContract, reason: String, ctx: &mut TxContext) {
    let sender = tx_context::sender(ctx);
    // Only clients or freelancers can open disputes
    assert!(sender == escrow.client || sender == escrow.freelancer, ENotAuthorized);
    // Contract must still be active
    assert!(escrow.status == STATUS_ACTIVE, EInvalidState);

    escrow.status = STATUS_DISPUTED;

    // Emit event
    event::emit(DisputeOpened {
        escrow_id: object::id_address(escrow),
        opened_by: sender,
        reason,
    });
}

/// Cancel contract (only if both agree or if no milestonees added yet)
/// 
/// # Arguments
/// * `escrow` - The escrow contract
/// * `client_agreed` - Whether the client agrees to cancel
/// * `freelancer_agreed` - Whether the freelancer agrees to cancel
/// * `ctx` - The transaction context
public fun cancel_contract(
    escrow: &mut EscrowContract,
    client_agreed: bool,
    freelancer_agreed: bool,
    ctx: &mut TxContext
) {
    let sender = tx_context::sender(ctx);
    // Only clients or freelancers can cancel contracts
    assert!(sender == escrow.client || sender == escrow.freelancer, ENotAuthorized);
    // Contract must still be active
    assert!(escrow.status == STATUS_ACTIVE, EInvalidState);

    // Check cancellation conditions
    // 1. Both parties agree, OR
    // 2. No milestones added and client is cancelling, OR
    // 3. No milestones with submissions and client is cancelling
    let can_cancel = (client_agreed && freelancer_agreed) ||
        (vector::length(&escrow.milestones) == 0 && sender == escrow.client) ||
        (!has_submitted_milestones(escrow) && sender == escrow.client);

    assert!(can_cancel, ENotAuthorized);

    // Process refund to client
    let refund_amount = balance::value(&escrow.remaining_balance);
    let refund = coin::from_balance(balance::split(&mut escrow.remaining_balance, refund_amount), ctx);
    transfer::public_transfer(refund, escrow.client);
    
    // Update contract status
    escrow.status = STATUS_CANCELLED;
    
    // Emit event
    event::emit(ContractCancelled {
        escrow_id: object::id_address(escrow),
        cancelled_by: sender,
        refund_amount,
    });
}

// ==== Helper Functions ====

/// Check if contract can be completed (all milestones approved)
/// 
/// # Arguments
/// * `escrow` - The escrow contract
/// * `ctx` - The transaction context
public fun check_contract_completion(escrow: &mut EscrowContract, ctx: &mut TxContext) {
    // check if all milestones are completed
    let mut all_completed = true;
    let mut i = 0;

    while (i < vector::length(&escrow.milestones)) {
        let milestone = vector::borrow(&escrow.milestones, i);
        if (milestone.status != MILESTONE_APPROVED) {
            all_completed = false;
            break
        };
        i = i + 1;
    };

    // If all milestones are completed, mark the contract as completed
    if (all_completed) {
        escrow.status = STATUS_COMPLETED;

        // Handle any remaining balance (refund client)
        let remaining = balance::value(&escrow.remaining_balance);
        if (remaining > 0) {
            let refund = coin::from_balance(balance::split(&mut escrow.remaining_balance, remaining), ctx);
            transfer::public_transfer(refund, escrow.client);
        };
        
        // Emit completion event
        event::emit(ContractCompleted {
            escrow_id: object::id_address(escrow),
            total_paid: escrow.total_amount - remaining,
        });
    }
}

/// Get the total milestone amount in an escrow
/// 
/// # Arguments
/// * `escrow` - The escrow contract
/// 
/// # Returns
/// * The total milestone amount
public fun get_total_milestone_amount(escrow: &EscrowContract): u64 {
    let mut total = 0;
    let mut i = 0;

    while (i < vector::length(&escrow.milestones)) {
        let milestone = vector::borrow(&escrow.milestones, i);
        total = total + milestone.amount;
        i = i + 1;
    };

    total
}

/// Check if the contract has any submitted milestones
/// 
/// # Arguments
/// * `escrow` - The escrow contract
/// 
/// # Returns
/// * Whether the contract has any submitted milestones
public fun has_submitted_milestones(escrow: &EscrowContract): bool {
    let mut i = 0;
    
    while (i < vector::length(&escrow.milestones)) {
        let milestone = vector::borrow(&escrow.milestones, i);
        if (milestone.status == MILESTONE_SUBMITTED || 
            milestone.status == MILESTONE_APPROVED) {
            return true
        };
        i = i + 1;
    };
    
    false
}

// ==== View Functions ====

/// Get escrow details
/// 
/// # Arguments
/// * `escrow` - The escrow contract
/// 
/// # Returns
/// * The escrow details
public fun get_escrow_details(escrow: &EscrowContract): (address, address, u64, u64, u8) {
    (
        escrow.client,
        escrow.freelancer,
        escrow.total_amount,
        balance::value(&escrow.remaining_balance),
        escrow.status,
    )
}

/// Get milestone details
/// 
/// # Arguments
/// * `escrow` - The escrow contract
/// * `milestone_index` - The index of the milestone
/// 
/// # Returns
/// * The milestone details
public fun get_milestone_details(escrow: &EscrowContract, milestone_index: u64): (String, u64, u8, u64) {
    let milestone = vector::borrow(&escrow.milestones, milestone_index);
    (
        milestone.description,
        milestone.amount,
        milestone.status,
        milestone.deadline,
    )
}

/// Get the number of milestones
/// 
/// # Arguments
/// * `escrow` - The escrow contract
/// 
/// # Returns
/// * The number of milestones
public fun get_milestones_count(escrow: &EscrowContract): u64 {
    vector::length(&escrow.milestones)
}

/// Resolve a disputed escrow based on dispute outcome
/// 
/// # Arguments
/// * `escrow` - The escrow contract to resolve
/// * `outcome` - The outcome of the dispute (1=client wins, 2=freelancer wins, 3=split)
/// * `ctx` - Transaction context
///
/// # Errors
/// * `EInvalidState` - If contract is not in disputed state
public fun resolve_dispute(
    escrow: &mut EscrowContract,
    outcome: u8,
    ctx: &mut TxContext
) {
    // Contract must be in disputed state
    assert!(escrow.status == STATUS_DISPUTED, EInvalidState);
    
    let remaining = balance::value(&escrow.remaining_balance);
    if (remaining > 0) {
        // Outcome 1: Client wins - return all funds to client
        if (outcome == 1) {
            let refund = coin::from_balance(balance::split(&mut escrow.remaining_balance, remaining), ctx);
            transfer::public_transfer(refund, escrow.client);
        } 
        // Outcome 2: Freelancer wins - send all funds to freelancer
        else if (outcome == 2) {
            let payment = coin::from_balance(balance::split(&mut escrow.remaining_balance, remaining), ctx);
            transfer::public_transfer(payment, escrow.freelancer);
        } 
        // Outcome 3: Split - divide funds equally between client and freelancer
        else if (outcome == 3) {
            let half_amount = remaining / 2;
            
            // Send half to freelancer
            let payment = coin::from_balance(balance::split(&mut escrow.remaining_balance, half_amount), ctx);
            transfer::public_transfer(payment, escrow.freelancer);
            
            // Send remaining to client (might include dust if odd amount)
            let remaining_after_split = balance::value(&escrow.remaining_balance);
            let refund = coin::from_balance(balance::split(&mut escrow.remaining_balance, remaining_after_split), ctx);
            transfer::public_transfer(refund, escrow.client);
        }
    };
    
    // Mark contract as completed
    escrow.status = STATUS_COMPLETED;
    
    // Emit event
    event::emit(ContractCompleted {
        escrow_id: object::id_address(escrow),
        total_paid: escrow.total_amount - remaining,
    });
}

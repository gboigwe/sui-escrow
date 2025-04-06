/// Module: escrow_system
module escrow_system::escrow;

// Imporing necessary modules from Sui
use sui::balance::Balance;
use sui::sui::SUI;
use sui::coin::{Self, Coin};
use sui::event;

// Importing necessary modules from standard library
use std::string::{Self, String};

// Error codes
const ENotAuthorized: u64 = 1;
const EInvalidState: u64 = 2;
const EInsufficientFunds: u64 = 3;
const EMilestonesRequired: u64 = 4;
const EInvalidMilestone: u64 = 5;

// Status Enum values
const STATUS_ACTIVE: u8 = 0;
const STATUS_COMPLETED: u8 = 1;
const STATUS_DISPUTED: u8 = 2;
const STATUS_CANCELLED: u8 = 3;

// Milestone status
const MILESTONE_PENDING: u8 = 0;
const MILESTONE_SUBMITTED: u8 = 1;
const MILESTONE_APPROVED: u8 = 2;
const MILESTONE_REJECTED: u8 = 3;

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

public struct DisputeOpened has copy, drop {
    escrow_id: address,
    opened_by: address,
    reason: String,
}

// ==== Initialization and Creation Functions ====
fun init(ctx: &mut TxContext) {
    // Create the EscrowAdmin object and transfer Admin Capability
    transfer::transfer(
        EscrowAdmin {id: object::new(ctx)},
        tx_context::sender(ctx),
    )
}

// ==== Core Functions ====

// Create a new escrow contract
public fun create_escrow(
    client: address,
    freelancer: address,
    description: String,
    end_date: u64,
    payment: Coin<SUI>,
    ctx: &mut TxContext
): address {
    let total_amount = coin::value(&payment);
    let balance = coin::into_balance(payment);

    let escrow = EscrowContract {
        id: object::new(ctx),
        client,
        freelancer,
        total_amount,
        remaining_balance: balance,
        status: STATUS_ACTIVE,
        milestones: vector::empty<Milestone>(),
        created_at: tx_context::epoch(ctx),
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

// Add a milestone to an escrow contract
public fun add_milestone(
    escrow: &mut EscrowContract,
    description: String,
    amount: u64,
    deadline: u64,
    ctx: &mut TxContext
) {
    // Only clients can add milestones
    assert!(ctx.sender() == escrow.client, ENotAuthorized);
    // The contract must still be active
    assert!(escrow.status == STATUS_ACTIVE, EInvalidState);

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

//Submit a milestone as completed by a freelancer
public fun submit_milestone(
    escrow: &mut EscrowContract,
    milestone_index: u64,
    submission_note: String,
    ctx: &mut TxContext
) {
    // Only freelancers can submit milestones
    assert!(ctx.sender() == escrow.freelancer, ENotAuthorized);
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

// Approve a milestone and release payment (client)
public fun approve_milestone(escrow: &mut EscrowContract, milestone_index: u64, ctx: &mut TxContext) {
    // Only clients can approve milestones
    assert!(ctx.sender() == escrow.client, ENotAuthorized);
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
    };
}

// Reject a milestone submission (client)
public fun reject_milestone(
    escrow: &mut EscrowContract,
    milestone_index: u64,
    rejection_reason: String,
    ctx: &mut TxContext
) {
    // Only clients can reject milestones
    assert!(ctx.sender() == escrow.client, ENotAuthorized);
    // Contract must still be active
    assert!(escrow.status == STATUS_ACTIVE, EInvalidState);
    // Milestone index must be valid
    assert!(milestone_index < vector::length(&escrow.milestones), EInvalidMilestone);

    // Get the milestone
    let milestone = vector::borrow_mut(&mut escrow.milestones, milestone_index);
    assert!(milestone.status == MILESTONE_SUBMITTED, EInvalidState);

    milestone.status = MILESTONE_REJECTED;
    milestone.rejection_reason = rejection_reason;    
}

// Open a dispute (both parties)
public fun open_dispute(escrow: &mut EscrowContract, reason: String, ctx: &mut TxContext) {
    let sender = ctx.sender();
    // Only clients or freelancers can open disputes
    assert!(sender == escrow.client || sender == escrow.freelancer, ENotAuthorized);
    // Contract must still be active
    assert!(escrow.status == STATUS_ACTIVE, EInvalidState);

    escrow.status = STATUS_DISPUTED;

    // Emit event
    event::emit(DisputeOpened {
        escrow_id: object::id_address(escrow),
        opened_by: ctx.sender(),
        reason,
    });
}

// ==== Helper Functions ====

// Get escrow details
public fun get_escrow_details(escrow: &EscrowContract): (address, address, u64, u64, u8) {
    (
        escrow.client,
        escrow.freelancer,
        escrow.total_amount,
        escrow.remaining_balance.value(),
        escrow.status,
    )
}

// Get milestone details
public fun get_milestone_details(escrow: &EscrowContract, milestone_index: u64): (String, u64, u8, u64) {
    let milestone = escrow.milestones.borrow(milestone_index);
    (
        milestone.description,
        milestone.amount,
        milestone.status,
        milestone.deadline,
    )
}

// Get the number of milestones
public fun get_milestones_count(escrow: &EscrowContract): u64 {
    escrow.milestones.length()
}

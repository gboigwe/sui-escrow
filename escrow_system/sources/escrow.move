/// Module: escrow_system
module escrow_system::escrow;

// Imporing necessary modules from Sui
use sui::balance::Balance;
use sui::sui::SUI;
use sui::coin::{Self, Coin};
use sui::event;

// Importing necessary modules from standard library
use std::string::String;

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
const STATUS_CANCELED: u8 = 3;

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

public struct MilestoneCreated has copy, drop {
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


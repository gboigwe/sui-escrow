// src/utils/suiClient.ts
import { getFullnodeUrl, SuiClient } from '@mysten/sui/client';
import { Transaction } from '@mysten/sui/transactions';
import { bcs } from '@mysten/sui/bcs';

// Create a client connected to testnet
export const suiClient = new SuiClient({ 
  url: getFullnodeUrl('testnet') 
});

// Package ID for the deployed escrow system
export const PACKAGE_ID = '0xf7d8812792958b71341c5aee094ac84e32df4ba6564bbccb771c0178983f2f2e';
export const ESCROW_MODULE = 'escrow';
export const DISPUTE_MODULE = 'dispute';

/**
 * Create a transaction for creating an escrow contract
 */
export function createEscrowContractTx(tx: Transaction, {
    clientAddress,
    freelancerAddress,
    description,
    endDate,
    paymentAmount,
  }: {
    clientAddress: string,
    freelancerAddress: string,
    description: string,
    endDate: number, // timestamp in milliseconds
    paymentAmount: string | number, // in MIST (SUI * 10^9)
  }) {
    // Set Gas Budget explicitly
    tx.setGasBudget(30000000); // Set a higher gas budget
  
    // Split the coin to get the exact amount
    const [coin] = tx.splitCoins(tx.gas, [tx.pure(bcs.U64.serialize(paymentAmount.toString()))]);
  
    // Get a clock object
    const clock = tx.object('0x6');
  
    // Call the create_escrow function
    tx.moveCall({
      target: `${PACKAGE_ID}::${ESCROW_MODULE}::create_escrow`,
      arguments: [
        tx.pure(bcs.Address.serialize(clientAddress)),
        tx.pure(bcs.Address.serialize(freelancerAddress)),
        tx.pure(bcs.String.serialize(description)),
        tx.pure(bcs.U64.serialize(endDate.toString())),
        coin,
        clock,
      ],
    });
  }

/**
 * Create a transaction for adding a milestone to an escrow contract
 */
export function addMilestoneTx(tx: Transaction, {
  escrowObjectId,
  description,
  amount,
  deadline,
}: {
  escrowObjectId: string,
  description: string,
  amount: string | number, // in MIST
  deadline: number, // timestamp in milliseconds
}) {
  // Get a clock object
  const clock = tx.object('0x6');
  
  // Call the add_milestone function
  tx.moveCall({
    target: `${PACKAGE_ID}::${ESCROW_MODULE}::add_milestone`,
    arguments: [
      tx.object(escrowObjectId),
      tx.pure(bcs.String.serialize(description)),
      tx.pure(bcs.U64.serialize(amount.toString())),
      tx.pure(bcs.U64.serialize(deadline.toString())),
      clock,
    ],
  });
}

/**
 * Create a transaction for submitting a milestone
 */
export function submitMilestoneTx(tx: Transaction, {
  escrowObjectId,
  milestoneIndex,
  submissionNote,
}: {
  escrowObjectId: string,
  milestoneIndex: number,
  submissionNote: string,
}) {
  // Call the submit_milestone function
  tx.moveCall({
    target: `${PACKAGE_ID}::${ESCROW_MODULE}::submit_milestone`,
    arguments: [
      tx.object(escrowObjectId),
      tx.pure(bcs.U64.serialize(milestoneIndex.toString())),
      tx.pure(bcs.String.serialize(submissionNote)),
    ],
  });
}

/**
 * Create a transaction for approving a milestone
 */
export function approveMilestoneTx(tx: Transaction, {
  escrowObjectId,
  milestoneIndex,
}: {
  escrowObjectId: string,
  milestoneIndex: number,
}) {
  // Call the approve_milestone function
  tx.moveCall({
    target: `${PACKAGE_ID}::${ESCROW_MODULE}::approve_milestone`,
    arguments: [
      tx.object(escrowObjectId),
      tx.pure(bcs.U64.serialize(milestoneIndex.toString())),
    ],
  });
}

/**
 * Create a transaction for rejecting a milestone
 */
export function rejectMilestoneTx(tx: Transaction, {
  escrowObjectId,
  milestoneIndex,
  rejectionReason,
}: {
  escrowObjectId: string,
  milestoneIndex: number,
  rejectionReason: string,
}) {
  // Call the reject_milestone function
  tx.moveCall({
    target: `${PACKAGE_ID}::${ESCROW_MODULE}::reject_milestone`,
    arguments: [
      tx.object(escrowObjectId),
      tx.pure(bcs.U64.serialize(milestoneIndex.toString())),
      tx.pure(bcs.String.serialize(rejectionReason)),
    ],
  });
}

/**
 * Create a transaction for opening a dispute
 */
export function openDisputeTx(tx: Transaction, {
  escrowObjectId,
  reason,
}: {
  escrowObjectId: string,
  reason: string,
}) {
  // Get a clock object
  const clock = tx.object('0x6');
  
  // Call the create_dispute function
  tx.moveCall({
    target: `${PACKAGE_ID}::${DISPUTE_MODULE}::create_dispute`,
    arguments: [
      tx.object(escrowObjectId),
      tx.pure(bcs.String.serialize(reason)),
      clock,
    ],
  });
}

/**
 * Create a transaction for cancelling a contract
 */
export function cancelContractTx(tx: Transaction, {
  escrowObjectId,
  clientAgreed,
  freelancerAgreed,
}: {
  escrowObjectId: string,
  clientAgreed: boolean,
  freelancerAgreed: boolean,
}) {
  // Call the cancel_contract function
  tx.moveCall({
    target: `${PACKAGE_ID}::${ESCROW_MODULE}::cancel_contract`,
    arguments: [
      tx.object(escrowObjectId),
      tx.pure(bcs.Bool.serialize(clientAgreed)),
      tx.pure(bcs.Bool.serialize(freelancerAgreed)),
    ],
  });
}

// Fetching functions
export const getEscrowContract = async (escrowObjectId: string) => {
  try {
    const escrowObject = await suiClient.getObject({
      id: escrowObjectId,
      options: {
        showContent: true,
      }
    });
    
    if (escrowObject.data?.content) {
      // Parse the escrow object data
      const content = escrowObject.data.content;
      if (content && 'fields' in content) {
        const fields = content.fields as Record<string, any>;
        return {
          id: escrowObjectId,
          client: fields.client as string,
          freelancer: fields.freelancer as string,
          totalAmount: BigInt(fields.total_amount || '0'),
          remainingBalance: BigInt(fields.remaining_balance?.fields?.value || '0'),
          status: Number(fields.status || '0'),
          milestones: parseMilestones(fields.milestones),
          createdAt: Number(fields.created_at || '0'),
          endDate: Number(fields.end_date || '0'),
          description: fields.description as string || '',
        };
      }
    }
    
    throw new Error('Failed to parse escrow data');
  } catch (error) {
    console.error('Error fetching escrow contract:', error);
    throw error;
  }
};

// Helper function to parse milestones from the contract response
function parseMilestones(milestonesField: any) {
  if (!milestonesField || !('fields' in milestonesField) || !milestonesField.fields.contents) {
    return [];
  }
  
  try {
    return milestonesField.fields.contents.map((milestone: any) => {
      const fields = milestone.fields;
      return {
        description: fields.description || '',
        amount: BigInt(fields.amount || '0'),
        status: Number(fields.status || '0'),
        deadline: Number(fields.deadline || '0'),
        submissionNote: fields.submission_note || '',
        rejectionReason: fields.rejection_reason || '',
      };
    });
  } catch (error) {
    console.error('Error parsing milestones:', error);
    return [];
  }
};

// Fetch user's escrow contracts
export const getUserEscrowContracts = async (address: string) => {
  try {
    // Query for owned objects that match the escrow type
    const ownedObjects = await suiClient.getOwnedObjects({
      owner: address,
      filter: {
        StructType: `${PACKAGE_ID}::${ESCROW_MODULE}::EscrowContract`
      },
      options: {
        showContent: true,
      }
    });
    
    const result = [];
    
    // Process directly owned objects
    if (ownedObjects.data && ownedObjects.data.length > 0) {
      for (const obj of ownedObjects.data) {
        if (obj.data?.content && 'fields' in obj.data.content) {
          const fields = obj.data.content.fields as Record<string, any>;
          
          // Check if the user is a client or freelancer in this contract
          if (fields.client === address || fields.freelancer === address) {
            result.push({
              id: obj.data.objectId,
              client: fields.client,
              freelancer: fields.freelancer,
              totalAmount: BigInt(fields.total_amount || '0'),
              remainingBalance: BigInt(fields.remaining_balance?.fields?.value || '0'),
              status: Number(fields.status || '0'),
              milestones: parseMilestones(fields.milestones),
              createdAt: Number(fields.created_at || '0'),
              endDate: Number(fields.end_date || '0'),
              description: fields.description || '',
            });
          }
        }
      }
    }
    
    return result;
  } catch (error) {
    console.error('Error fetching user escrow contracts:', error);
    return [];
  }
};

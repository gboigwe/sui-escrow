// src/utils/suiClient.ts
import { getFullnodeUrl, SuiClient } from '@mysten/sui/client';
import { Transaction } from '@mysten/sui/transactions';
import { bcs } from '@mysten/sui/bcs';
import { EscrowContract } from './contracts';

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
    // Debugging
    console.log("Creating escrow contract with payment amount:", paymentAmount);
    console.log("Payment amount type:", typeof paymentAmount);
    
    // Set Gas Budget explicitly - increase for larger transactions
    const gasBudget = BigInt(paymentAmount) > BigInt(5 * 1_000_000_000) 
      ? 200_000_000  // 0.2 SUI for large transactions
      : 100_000_000; // 0.1 SUI for normal transactions
    
    tx.setGasBudget(gasBudget);
  
    // Split the coin to get the exact amount
    console.log("Serializing amount:", paymentAmount.toString());
    const serializedAmount = bcs.U64.serialize(paymentAmount.toString());
    console.log("Serialized amount:", serializedAmount);
    
    const [coin] = tx.splitCoins(
      tx.gas, 
      [tx.pure(serializedAmount)]
    );
  
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
export const getUserEscrowContracts = async (address: string): Promise<EscrowContract[]> => {
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
    
    // Also query for dynamic fields and shared objects where the user is involved
    // Since EscrowContract is shared, we need to query differently
    
    const result: EscrowContract[] = [];
    
    // Process directly owned objects if any
    if (ownedObjects.data && ownedObjects.data.length > 0) {
      for (const obj of ownedObjects.data) {
        if (obj.data?.content && 'fields' in obj.data.content) {
          const fields = obj.data.content.fields as Record<string, any>;
          
          // Add all objects where the user is client or freelancer
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
    
    // Since EscrowContract is shared, let's also try to query events to find contracts
    const events = await suiClient.queryEvents({
      query: {
        MoveEventType: `${PACKAGE_ID}::${ESCROW_MODULE}::EscrowCreated`
      },
      limit: 50,
      order: 'descending'
    });
    
    // Process events to find contracts where user is involved
    if (events.data && events.data.length > 0) {
      for (const event of events.data) {
        if (event.parsedJson) {
          const parsedJson = event.parsedJson as any;
          
          // Check if user is involved in this contract
          if (parsedJson.client === address || parsedJson.freelancer === address) {
            // Fetch the actual object data
            try {
              const objectData = await getEscrowContract(parsedJson.escrow_id);
              
              // Check if we already have this contract
              if (!result.find(c => c.id === objectData.id)) {
                result.push(objectData);
              }
            } catch (err) {
              console.error('Error fetching contract:', err);
            }
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

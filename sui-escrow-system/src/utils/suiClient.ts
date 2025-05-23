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
    
    // tx.setGasBudget(gasBudget);
  
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

export const getEscrowContract = async (escrowObjectId: string): Promise<EscrowContract> => {
  try {
    console.log('🔍 Fetching contract:', escrowObjectId);
    
    const escrowObject = await suiClient.getObject({
      id: escrowObjectId,
      options: {
        showContent: true,
      }
    });
    
    console.log('📦 Raw escrow object data:', escrowObject.data);
    
    if (escrowObject.data?.content) {
      const content = escrowObject.data.content;
      console.log('📄 Object content:', content);
      
      if (content && 'fields' in content) {
        const fields = content.fields as Record<string, any>;
        console.log('🔧 Raw fields:', fields);
        console.log('💰 total_amount:', fields.total_amount, typeof fields.total_amount);
        console.log('💳 remaining_balance:', fields.remaining_balance);
        
        // Parse amounts with explicit BigInt conversion
        const totalAmount = BigInt(fields.total_amount || '0');
        const remainingBalance = BigInt(fields.remaining_balance || '0'); // ← FIXED THIS LINE

        console.log('💰 Parsed totalAmount:', totalAmount.toString());
        console.log('💳 Parsed remainingBalance:', remainingBalance.toString());
        
        const contractData: EscrowContract = {
          id: escrowObjectId,
          client: fields.client as string,
          freelancer: fields.freelancer as string,
          totalAmount,
          remainingBalance,
          status: Number(fields.status || '0'),
          milestones: parseMilestones(fields.milestones),
          createdAt: Number(fields.created_at || '0'),
          endDate: Number(fields.end_date || '0'),
          description: fields.description as string || '',
        };
        
        console.log('✅ Final contract data with proper types:', {
          ...contractData,
          totalAmount: contractData.totalAmount.toString(),
          remainingBalance: contractData.remainingBalance.toString(),
        });
        
        return contractData;
      }
    }
    
    throw new Error('Failed to parse escrow data');
  } catch (error) {
    console.error('❌ Error fetching escrow contract:', error);
    throw error;
  }
};

// Helper function to parse milestones from the contract response
function parseMilestones(milestonesField: any) {
  if (!milestonesField || !Array.isArray(milestonesField)) {
    return [];
  }
  
  try {
    return milestonesField.map((milestone: any) => {
      // Handle the nested fields structure
      const fields = milestone.fields || milestone;
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
}

// Fetch user's escrow contracts by querying events
export const getUserEscrowContracts = async (address: string): Promise<EscrowContract[]> => {
  try {
    const result: EscrowContract[] = [];
    
    console.log('Querying escrow contracts for address:', address);
    
    // Query for EscrowCreated events where user is client or freelancer
    const events = await suiClient.queryEvents({
      query: {
        MoveEventType: `${PACKAGE_ID}::${ESCROW_MODULE}::EscrowCreated`
      },
      limit: 100,
      order: 'descending'
    });
    
    console.log('Found escrow creation events:', events.data.length);
    
    // Filter events where user is client or freelancer
    for (const event of events.data) {
      if (event.parsedJson) {
        const eventData = event.parsedJson as any;
        
        console.log('Processing event data:', eventData);
        
        // Check if user is client or freelancer in this contract
        if (eventData.client === address || eventData.freelancer === address) {
          try {
            console.log(`Fetching contract details for escrow_id: ${eventData.escrow_id}`);
            
            // Fetch the full contract details using the escrow_id from event
            const contract = await getEscrowContract(eventData.escrow_id);
            
            // Validate that the contract data is complete
            if (contract && contract.id && contract.client && contract.freelancer) {
              result.push(contract);
              console.log(`✅ Successfully added contract:`, {
                id: contract.id,
                totalAmount: contract.totalAmount.toString(),
                remainingBalance: contract.remainingBalance.toString()
              });
            } else {
              console.warn(`❌ Invalid contract data for ${eventData.escrow_id}:`, contract);
            }
          } catch (error) {
            console.error(`❌ Error fetching contract ${eventData.escrow_id}:`, error);
          }
        }
      }
    }
    
    console.log(`✅ Total user contracts found: ${result.length}`);
    return result.sort((a, b) => b.createdAt - a.createdAt);
    
  } catch (error) {
    console.error('❌ Error fetching user escrow contracts:', error);
    return [];
  }
};

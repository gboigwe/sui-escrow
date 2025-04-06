// src/hooks/useEscrow.ts
import { useEffect, useState } from 'react';
import { useWallet } from '../context/WalletContext';
import { SuiObjectResponse } from '@mysten/sui/client';
import { useSignAndExecuteTransaction } from '@mysten/dapp-kit';

// Replace with your package ID after deployment
const PACKAGE_ID = '0x...'; // You'll get this after deploying your contract

export type EscrowContract = {
  id: string;
  client: string;
  freelancer: string;
  totalAmount: number;
  remainingBalance: number;
  status: number;
  milestones: Milestone[];
  createdAt: number;
  endDate: number;
  description: string;
};

export type Milestone = {
  description: string;
  amount: number;
  status: number;
  deadline: number;
  submissionNote: string;
  rejectionReason: string;
};

// Mock data for testing the UI without a deployed contract
const MOCK_CONTRACTS: EscrowContract[] = [
  {
    id: "mock-contract-1",
    client: "0x1234567890abcdef1234567890abcdef12345678",
    freelancer: "0xabcdef1234567890abcdef1234567890abcdef12",
    totalAmount: 5000000000, // 5 SUI
    remainingBalance: 3000000000,
    status: 0, // Active
    milestones: [
      {
        description: "Frontend Implementation",
        amount: 2000000000,
        status: 2, // Approved
        deadline: Date.now() + 86400000 * 7, // 7 days from now
        submissionNote: "Completed the frontend implementation as requested.",
        rejectionReason: "",
      },
      {
        description: "Backend Integration",
        amount: 3000000000,
        status: 0, // Pending
        deadline: Date.now() + 86400000 * 14, // 14 days from now
        submissionNote: "",
        rejectionReason: "",
      },
    ],
    createdAt: Date.now() - 86400000 * 3, // 3 days ago
    endDate: Date.now() + 86400000 * 30, // 30 days from now
    description: "Build a decentralized escrow system",
  }
];

export const useEscrow = () => {
  const { address } = useWallet();
  const { mutate: signAndExecuteTransaction } = useSignAndExecuteTransaction();
  
  const [ownedContracts, setOwnedContracts] = useState<EscrowContract[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch contracts where the current address is either client or freelancer
  const fetchContracts = async () => {
    if (!address) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // For development without a contract, use mock data
      setOwnedContracts(MOCK_CONTRACTS);
      
      // When contract is ready, use this instead of mock data:
      /*
      const response = await suiClient.getOwnedObjects({
        owner: address,
        filter: {
          MatchAll: [
            {
              StructType: `${PACKAGE_ID}::escrow::EscrowContract`
            }
          ]
        },
        options: {
          showContent: true,
          showDisplay: true
        }
      });
      
      const contracts = response.data
        .map((obj) => parseEscrowObject(obj))
        .filter((contract): contract is EscrowContract => contract !== null);
      
      setOwnedContracts(contracts);
      */
    } catch (err) {
      console.error('Failed to fetch contracts:', err);
      setError('Failed to fetch contracts. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Create a new escrow contract
  const createEscrow = async (
    freelancerAddress: string,
    description: string,
    endDate: number,
    amount: number
  ) => {
    if (!address) return null;
    
    try {
      // With the current version, we need to create a transaction object differently
      // This is a simplified mock implementation for the UI to work
      console.log(`Creating escrow contract: ${freelancerAddress}, ${description}, ${endDate}, ${amount}`);
      
      // For testing without a contract, just simulate success
      // In a real implementation, you'd execute a transaction
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate transaction time
      
      // Simulate updating the UI with a new contract
      const newMockContract: EscrowContract = {
        ...MOCK_CONTRACTS[0],
        id: `mock-contract-${Date.now()}`,
        client: address,
        freelancer: freelancerAddress,
        description: description,
        totalAmount: amount,
        remainingBalance: amount,
        createdAt: Date.now(),
        endDate: endDate,
        milestones: [],
      };
      
      setOwnedContracts(prevContracts => [...prevContracts, newMockContract]);
      
      return newMockContract.id;
    } catch (err) {
      console.error('Failed to create escrow:', err);
      setError('Failed to create escrow. Please try again.');
      return null;
    }
  };

  // Add a milestone to an escrow contract
  const addMilestone = async (
    escrowId: string,
    description: string,
    amount: number,
    deadline: number
  ) => {
    if (!address) return false;
    
    try {
      // Log the action for debugging
      console.log(`Adding milestone to ${escrowId}: ${description}, ${amount}, ${deadline}`);
      
      // Simulate transaction time
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Update UI with the new milestone
      const updatedContracts = [...ownedContracts];
      const contractIndex = updatedContracts.findIndex(c => c.id === escrowId);
      
      if (contractIndex >= 0) {
        updatedContracts[contractIndex].milestones.push({
          description,
          amount,
          status: 0, // Pending
          deadline,
          submissionNote: "",
          rejectionReason: "",
        });
        
        setOwnedContracts(updatedContracts);
      }
      
      return true;
    } catch (err) {
      console.error('Failed to add milestone:', err);
      setError('Failed to add milestone. Please try again.');
      return false;
    }
  };

  // Submit a milestone as completed (by freelancer)
  const submitMilestone = async (
    escrowId: string,
    milestoneIndex: number,
    submissionNote: string
  ) => {
    if (!address) return false;
    
    try {
      // Log the action for debugging
      console.log(`Submitting milestone ${milestoneIndex} for ${escrowId}: ${submissionNote}`);
      
      // Simulate transaction time
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Update UI state
      const updatedContracts = [...ownedContracts];
      const contractIndex = updatedContracts.findIndex(c => c.id === escrowId);
      
      if (contractIndex >= 0 && milestoneIndex < updatedContracts[contractIndex].milestones.length) {
        updatedContracts[contractIndex].milestones[milestoneIndex].status = 1; // Submitted
        updatedContracts[contractIndex].milestones[milestoneIndex].submissionNote = submissionNote;
        
        setOwnedContracts(updatedContracts);
      }
      
      return true;
    } catch (err) {
      console.error('Failed to submit milestone:', err);
      setError('Failed to submit milestone. Please try again.');
      return false;
    }
  };

  // Approve a milestone and release payment (by client)
  const approveMilestone = async (
    escrowId: string,
    milestoneIndex: number
  ) => {
    if (!address) return false;
    
    try {
      // Log the action for debugging
      console.log(`Approving milestone ${milestoneIndex} for ${escrowId}`);
      
      // Simulate transaction time
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Update UI state
      const updatedContracts = [...ownedContracts];
      const contractIndex = updatedContracts.findIndex(c => c.id === escrowId);
      
      if (contractIndex >= 0 && milestoneIndex < updatedContracts[contractIndex].milestones.length) {
        const milestone = updatedContracts[contractIndex].milestones[milestoneIndex];
        milestone.status = 2; // Approved
        
        // Update remaining balance
        updatedContracts[contractIndex].remainingBalance -= milestone.amount;
        
        setOwnedContracts(updatedContracts);
      }
      
      return true;
    } catch (err) {
      console.error('Failed to approve milestone:', err);
      setError('Failed to approve milestone. Please try again.');
      return false;
    }
  };

  // Reject a milestone submission (by client)
  const rejectMilestone = async (
    escrowId: string,
    milestoneIndex: number,
    rejectionReason: string
  ) => {
    if (!address) return false;
    
    try {
      // Log the action for debugging
      console.log(`Rejecting milestone ${milestoneIndex} for ${escrowId}: ${rejectionReason}`);
      
      // Simulate transaction time
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Update UI state
      const updatedContracts = [...ownedContracts];
      const contractIndex = updatedContracts.findIndex(c => c.id === escrowId);
      
      if (contractIndex >= 0 && milestoneIndex < updatedContracts[contractIndex].milestones.length) {
        updatedContracts[contractIndex].milestones[milestoneIndex].status = 3; // Rejected
        updatedContracts[contractIndex].milestones[milestoneIndex].rejectionReason = rejectionReason;
        
        setOwnedContracts(updatedContracts);
      }
      
      return true;
    } catch (err) {
      console.error('Failed to reject milestone:', err);
      setError('Failed to reject milestone. Please try again.');
      return false;
    }
  };

  // Helper function for future use when we have a real contract
  const parseEscrowObject = (obj: SuiObjectResponse): EscrowContract | null => {
    if (!obj.data || !obj.data.content || obj.data.content.dataType !== "moveObject") {
      return null;
    }
    
    const fields = obj.data.content.fields as any;
    
    return {
      id: obj.data.objectId,
      client: fields.client,
      freelancer: fields.freelancer,
      totalAmount: Number(fields.total_amount),
      remainingBalance: Number(fields.remaining_balance?.fields?.value || 0),
      status: Number(fields.status),
      milestones: (fields.milestones || []).map((m: any) => ({
        description: m.fields.description,
        amount: Number(m.fields.amount),
        status: Number(m.fields.status),
        deadline: Number(m.fields.deadline),
        submissionNote: m.fields.submission_note,
        rejectionReason: m.fields.rejection_reason,
      })),
      createdAt: Number(fields.created_at),
      endDate: Number(fields.end_date),
      description: fields.description,
    };
  };

  // Load contracts when component mounts or address changes
  useEffect(() => {
    if (address) {
      fetchContracts();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address]); // Intentionally omitting fetchContracts from deps

  return {
    ownedContracts,
    loading,
    error,
    createEscrow,
    addMilestone,
    submitMilestone,
    approveMilestone,
    rejectMilestone,
    fetchContracts,
  };
};

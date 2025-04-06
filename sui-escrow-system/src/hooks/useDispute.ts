// src/hooks/useDispute.ts
import { useState } from 'react';
import { useWallet } from '../context/WalletContext';
import { SuiObjectResponse } from '@mysten/sui/client';
import { useSignAndExecuteTransaction } from '@mysten/dapp-kit';

// Replace with your package ID after deployment
const PACKAGE_ID = '0x...'; // You'll get this after deploying your contract

// System clock object ID on Sui
const CLOCK_OBJECT_ID = '0x6';

export type Dispute = {
  id: string;
  escrowId: string;
  openedBy: string;
  client: string;
  freelancer: string;
  reason: string;
  clientEvidence: string;
  freelancerEvidence: string;
  votesForClient: number;
  votesForFreelancer: number;
  outcome: number;
  voters: string[];
  createdAt: number;
  votingEndTime: number;
};

// Mock dispute data for testing UI
const MOCK_DISPUTES: Dispute[] = [
  {
    id: "mock-dispute-1",
    escrowId: "mock-contract-1",
    openedBy: "0x1234567890abcdef1234567890abcdef12345678", // client
    client: "0x1234567890abcdef1234567890abcdef12345678",
    freelancer: "0xabcdef1234567890abcdef1234567890abcdef12",
    reason: "Work not meeting requirements specified in the contract",
    clientEvidence: "The delivered work does not include the responsive design we agreed upon.",
    freelancerEvidence: "The responsive design was not mentioned in the milestone description.",
    votesForClient: 3,
    votesForFreelancer: 2,
    outcome: 0, // Pending
    voters: ["0xvoter1", "0xvoter2", "0xvoter3", "0xvoter4", "0xvoter5"],
    createdAt: Date.now() - 86400000 * 2, // 2 days ago
    votingEndTime: Date.now() + 86400000 * 5, // 5 days from now
  }
];

export const useDispute = () => {
  const { address } = useWallet();
  
  const [disputes, setDisputes] = useState<Dispute[]>(MOCK_DISPUTES);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch all active disputes
  const fetchDisputes = async () => {
    if (!address) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // For development without a contract, use mock data
      setDisputes(MOCK_DISPUTES);
      
      // When contract is ready, use this instead:
      /*
      const response = await suiClient.getOwnedObjects({
        owner: address,
        filter: {
          MatchAll: [
            {
              StructType: `${PACKAGE_ID}::dispute::Dispute`
            }
          ]
        },
        options: {
          showContent: true,
        }
      });
      
      const parsedDisputes = response.data
        .map((obj) => parseDisputeObject(obj))
        .filter((dispute): dispute is Dispute => dispute !== null);
      
      setDisputes(parsedDisputes);
      */
    } catch (err) {
      console.error('Failed to fetch disputes:', err);
      setError('Failed to fetch disputes. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Create a new dispute for an escrow contract
  const createDispute = async (
    escrowId: string,
    reason: string
  ) => {
    if (!address) return null;
    
    try {
      // Log the action for debugging
      console.log(`Creating dispute for ${escrowId}: ${reason}`);
      
      // Simulate transaction time
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // For mock UI, create a new dispute
      const newDispute: Dispute = {
        id: `mock-dispute-${Date.now()}`,
        escrowId,
        openedBy: address,
        client: MOCK_DISPUTES[0].client,
        freelancer: MOCK_DISPUTES[0].freelancer,
        reason,
        clientEvidence: "",
        freelancerEvidence: "",
        votesForClient: 0,
        votesForFreelancer: 0,
        outcome: 0, // Pending
        voters: [],
        createdAt: Date.now(),
        votingEndTime: Date.now() + 86400000 * 7, // 7 days from now
      };
      
      setDisputes([...disputes, newDispute]);
      
      return newDispute.id;
    } catch (err) {
      console.error('Failed to create dispute:', err);
      setError('Failed to create dispute. Please try again.');
      return null;
    }
  };

  // Submit evidence for a dispute
  const submitEvidence = async (
    disputeId: string,
    evidence: string
  ) => {
    if (!address) return false;
    
    try {
      // Log the action for debugging
      console.log(`Submitting evidence for dispute ${disputeId}: ${evidence}`);
      
      // Simulate transaction time
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Update UI state
      const updatedDisputes = [...disputes];
      const disputeIndex = updatedDisputes.findIndex(d => d.id === disputeId);
      
      if (disputeIndex >= 0) {
        // Update the evidence based on who's submitting
        const dispute = updatedDisputes[disputeIndex];
        if (address === dispute.client) {
          dispute.clientEvidence = evidence;
        } else if (address === dispute.freelancer) {
          dispute.freelancerEvidence = evidence;
        }
        
        setDisputes(updatedDisputes);
      }
      
      return true;
    } catch (err) {
      console.error('Failed to submit evidence:', err);
      setError('Failed to submit evidence. Please try again.');
      return false;
    }
  };

  // Vote on a dispute
  const voteOnDispute = async (
    disputeId: string,
    voteForClient: boolean
  ) => {
    if (!address) return false;
    
    try {
      // Log the action for debugging
      console.log(`Voting on dispute ${disputeId}: ${voteForClient ? 'for client' : 'for freelancer'}`);
      
      // Simulate transaction time
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Update UI state
      const updatedDisputes = [...disputes];
      const disputeIndex = updatedDisputes.findIndex(d => d.id === disputeId);
      
      if (disputeIndex >= 0) {
        const dispute = updatedDisputes[disputeIndex];
        if (voteForClient) {
          dispute.votesForClient += 1;
        } else {
          dispute.votesForFreelancer += 1;
        }
        
        // Add voter to the list
        if (!dispute.voters.includes(address)) {
          dispute.voters.push(address);
        }
        
        setDisputes(updatedDisputes);
      }
      
      return true;
    } catch (err) {
      console.error('Failed to vote on dispute:', err);
      setError('Failed to vote on dispute. Please try again.');
      return false;
    }
  };

  // Finalize a dispute after voting period ends
  const finalizeDispute = async (disputeId: string) => {
    if (!address) return false;
    
    try {
      // Log the action for debugging
      console.log(`Finalizing dispute ${disputeId}`);
      
      // Simulate transaction time
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Update UI state
      const updatedDisputes = [...disputes];
      const disputeIndex = updatedDisputes.findIndex(d => d.id === disputeId);
      
      if (disputeIndex >= 0) {
        const dispute = updatedDisputes[disputeIndex];
        
        // Determine the outcome based on votes
        if (dispute.votesForClient > dispute.votesForFreelancer) {
          dispute.outcome = 1; // Client wins
        } else if (dispute.votesForFreelancer > dispute.votesForClient) {
          dispute.outcome = 2; // Freelancer wins
        } else {
          dispute.outcome = 3; // Tie/Split
        }
        
        setDisputes(updatedDisputes);
      }
      
      return true;
    } catch (err) {
      console.error('Failed to finalize dispute:', err);
      setError('Failed to finalize dispute. Please try again.');
      return false;
    }
  };

  // Helper function for future use when we have a real contract
  const parseDisputeObject = (obj: SuiObjectResponse): Dispute | null => {
    if (!obj.data || !obj.data.content || obj.data.content.dataType !== "moveObject") {
      return null;
    }
    
    const fields = obj.data.content.fields as any;
    
    return {
      id: obj.data.objectId,
      escrowId: fields.escrow_id,
      openedBy: fields.opened_by,
      client: fields.client,
      freelancer: fields.freelancer,
      reason: fields.reason,
      clientEvidence: fields.client_evidence,
      freelancerEvidence: fields.freelancer_evidence,
      votesForClient: Number(fields.votes_for_client),
      votesForFreelancer: Number(fields.votes_for_freelancer),
      outcome: Number(fields.outcome),
      voters: fields.voters,
      createdAt: Number(fields.created_at),
      votingEndTime: Number(fields.voting_end_time),
    };
  };

  return {
    disputes,
    loading,
    error,
    createDispute,
    submitEvidence,
    voteOnDispute,
    finalizeDispute,
    fetchDisputes,
  };
};

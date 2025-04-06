import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useWallet } from '../../context/WalletContext';
import { useDispute, Dispute } from '../../hooks/useDispute';

const DisputeDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { address, isConnected, connect, suiClient } = useWallet();
  const { submitEvidence, voteOnDispute, finalizeDispute } = useDispute();
  
  const [dispute, setDispute] = useState<Dispute | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [evidence, setEvidence] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<string>('');

  // Format date from timestamp
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString();
  };

  // Calculate time remaining for voting
  const calculateTimeRemaining = useCallback(() => {
    if (!dispute) return '';
    
    const now = Date.now();
    const end = dispute.votingEndTime;
    
    if (now >= end) {
      return 'Voting period has ended';
    }
    
    const diff = end - now;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${days}d ${hours}h ${minutes}m remaining`;
  }, [dispute]);

  // Fetch dispute details
  const fetchDisputeDetails = useCallback(async () => {
    if (!id) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // For development without a real contract, use mock data
      // This is a placeholder - in a real app you'd fetch from the blockchain
      const mockDisputes = [
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
      
      const foundDispute = mockDisputes.find(d => d.id === id);
      
      if (foundDispute) {
        setDispute(foundDispute);
      } else {
        setError('Dispute not found');
      }
      
      /* In a real application, you would use something like this:
      const response = await suiClient.getObject({
        id,
        options: {
          showContent: true,
        }
      });
      
      if (response.data && response.data.content && response.data.content.dataType === "moveObject") {
        const fields = response.data.content.fields as any;
        
        setDispute({
          id,
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
          voters: fields.voters || [],
          createdAt: Number(fields.created_at),
          votingEndTime: Number(fields.voting_end_time),
        });
      } else {
        setError('Dispute not found or invalid format');
      }
      */
    } catch (err) {
      console.error('Failed to fetch dispute details:', err);
      setError('Failed to fetch dispute details. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [id, suiClient]);

  // Handle submitting evidence
  const handleSubmitEvidence = async () => {
    if (!id || !evidence.trim()) return;
    
    setIsSubmitting(true);
    
    try {
      const success = await submitEvidence(id, evidence);
      
      if (success) {
        setEvidence('');
        fetchDisputeDetails();
      }
    } catch (err) {
      console.error('Error submitting evidence:', err);
      setError('Failed to submit evidence. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle voting
  const handleVote = async (voteForClient: boolean) => {
    if (!id) return;
    
    setIsSubmitting(true);
    
    try {
      const success = await voteOnDispute(id, voteForClient);
      
      if (success) {
        fetchDisputeDetails();
      }
    } catch (err) {
      console.error('Error voting on dispute:', err);
      setError('Failed to vote on dispute. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle finalizing dispute
  const handleFinalizeDispute = async () => {
    if (!id) return;
    
    setIsSubmitting(true);
    
    try {
      const success = await finalizeDispute(id);
      
      if (success) {
        fetchDisputeDetails();
      }
    } catch (err) {
      console.error('Error finalizing dispute:', err);
      setError('Failed to finalize dispute. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Check if user has already voted
  const hasVoted = () => {
    if (!dispute || !address) return false;
    return dispute.voters.includes(address);
  };

  // Check if dispute can be finalized
  const canFinalize = () => {
    if (!dispute) return false;
    return Date.now() > dispute.votingEndTime && dispute.outcome === 0;
  };

  // Get outcome text
  const getOutcomeText = () => {
    if (!dispute) return '';
    
    switch (dispute.outcome) {
      case 0: return 'Pending';
      case 1: return 'Client Won';
      case 2: return 'Freelancer Won';
      case 3: return 'Split Decision';
      default: return 'Unknown';
    }
  };

  // Update time remaining periodically
  useEffect(() => {
    if (dispute && dispute.outcome === 0) {
      const timer = setInterval(() => {
        setTimeRemaining(calculateTimeRemaining());
      }, 60000); // Update every minute
      
      setTimeRemaining(calculateTimeRemaining());
      
      return () => clearInterval(timer);
    }
  }, [dispute, calculateTimeRemaining]);

  // Fetch dispute when component mounts
  useEffect(() => {
    if (isConnected && id) {
      fetchDisputeDetails();
    }
  }, [isConnected, id, fetchDisputeDetails]);

  // Check if current user is client or freelancer
  const isClient = dispute && address === dispute.client;
  const isFreelancer = dispute && address === dispute.freelancer;

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <p className="text-gray-600 mb-4">Connect your wallet to view dispute details</p>
        <button
          onClick={connect}
          className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none"
        >
          Connect Wallet
        </button>
      </div>
    );
  }

  if (loading) {
    return <div className="text-center p-8">Loading dispute details...</div>;
  }

  if (error) {
    return (
      <div className="bg-red-100 text-red-700 p-4 rounded-md max-w-3xl mx-auto my-6">
        <p>{error}</p>
        <button
          onClick={() => navigate('/')}
          className="mt-4 px-4 py-2 text-sm font-medium text-indigo-700 bg-indigo-100 rounded-md hover:bg-indigo-200 focus:outline-none"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  if (!dispute) {
    return (
      <div className="text-center p-8">
        <p className="text-gray-600 mb-4">Dispute not found</p>
        <button
          onClick={() => navigate('/')}
          className="px-4 py-2 text-sm font-medium text-indigo-700 bg-indigo-100 rounded-md hover:bg-indigo-200 focus:outline-none"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dispute Details</h1>
        <p className="text-sm text-gray-500 mt-1">
          Created on {formatDate(dispute.createdAt)} by {dispute.openedBy.substring(0, 6)}...{dispute.openedBy.substring(dispute.openedBy.length - 4)}
        </p>
      </div>
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-lg font-medium text-gray-900">Dispute Reason</h2>
            <p className="mt-2 text-gray-700">{dispute.reason}</p>
          </div>
          <div className="text-right">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
              {getOutcomeText()}
            </span>
            {dispute.outcome === 0 && (
              <p className="text-sm text-gray-500 mt-1">{timeRemaining}</p>
            )}
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <h3 className="text-md font-medium text-gray-900 mb-2">Client</h3>
            <p className="text-sm text-gray-700">
              {dispute.client.substring(0, 6)}...{dispute.client.substring(dispute.client.length - 4)}
            </p>
            <div className="mt-4">
              <h4 className="text-sm font-medium text-gray-900 mb-1">Client Evidence</h4>
              {dispute.clientEvidence ? (
                <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded">{dispute.clientEvidence}</p>
              ) : (
                <p className="text-sm text-gray-500 italic">No evidence submitted</p>
              )}
            </div>
          </div>
          
          <div>
            <h3 className="text-md font-medium text-gray-900 mb-2">Freelancer</h3>
            <p className="text-sm text-gray-700">
              {dispute.freelancer.substring(0, 6)}...{dispute.freelancer.substring(dispute.freelancer.length - 4)}
            </p>
            <div className="mt-4">
              <h4 className="text-sm font-medium text-gray-900 mb-1">Freelancer Evidence</h4>
              {dispute.freelancerEvidence ? (
                <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded">{dispute.freelancerEvidence}</p>
              ) : (
                <p className="text-sm text-gray-500 italic">No evidence submitted</p>
              )}
            </div>
          </div>
        </div>
        
        {/* Show evidence submission form for client or freelancer */}
        {(isClient || isFreelancer) && dispute.outcome === 0 && (
          <div className="mt-6 border-t border-gray-200 pt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Submit Evidence</h3>
            <div className="mb-4">
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                value={evidence}
                onChange={(e) => setEvidence(e.target.value)}
                rows={4}
                placeholder="Provide evidence to support your case..."
              />
            </div>
            <button
              onClick={handleSubmitEvidence}
              disabled={isSubmitting || !evidence.trim()}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Evidence'}
            </button>
          </div>
        )}
      </div>
      
      {/* Voting section */}
      {dispute.outcome === 0 && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Vote on Dispute</h2>
          
          <div className="flex justify-between items-center p-4 bg-gray-50 rounded-md mb-6">
            <div className="text-center w-1/3">
              <p className="text-sm text-gray-500">Client</p>
              <p className="text-lg font-bold text-indigo-600">{dispute.votesForClient}</p>
              <p className="text-xs text-gray-500">votes</p>
            </div>
            <div className="text-center w-1/3">
              <p className="text-sm text-gray-500">VS</p>
            </div>
            <div className="text-center w-1/3">
              <p className="text-sm text-gray-500">Freelancer</p>
              <p className="text-lg font-bold text-indigo-600">{dispute.votesForFreelancer}</p>
              <p className="text-xs text-gray-500">votes</p>
            </div>
          </div>
          
          {hasVoted() ? (
            <div className="text-center">
              <p className="text-green-600">You have already voted on this dispute.</p>
            </div>
          ) : Date.now() > dispute.votingEndTime ? (
            <div className="text-center">
              <p className="text-yellow-600">Voting period has ended.</p>
            </div>
          ) : !isClient && !isFreelancer ? (
            <div className="flex justify-center space-x-4">
              <button
                onClick={() => handleVote(true)}
                disabled={isSubmitting}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Processing...' : 'Vote for Client'}
              </button>
              <button
                onClick={() => handleVote(false)}
                disabled={isSubmitting}
                className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700 focus:outline-none disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Processing...' : 'Vote for Freelancer'}
              </button>
            </div>
          ) : (
            <div className="text-center">
              <p className="text-yellow-600">Parties involved in the dispute cannot vote.</p>
            </div>
          )}
        </div>
      )}
      
      {/* Finalize dispute button */}
      {canFinalize() && (
        <div className="flex justify-center mt-6">
          <button
            onClick={handleFinalizeDispute}
            disabled={isSubmitting}
            className="px-6 py-3 text-base font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Finalizing...' : 'Finalize Dispute'}
          </button>
        </div>
      )}
      
      {/* Back link */}
      <div className="mt-6 text-center">
        <button
          onClick={() => navigate(`/contract/${dispute.escrowId}`)}
          className="text-indigo-600 hover:text-indigo-900"
        >
          Back to Contract
        </button>
      </div>
    </div>
  );
};

export default DisputeDetails;

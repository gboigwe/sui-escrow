import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useWallet } from '../../context/WalletContext';
import { useEscrow, EscrowContract } from '../../hooks/useEscrow';
import { useDispute } from '../../hooks/useDispute';
import MilestoneForm from './MilestoneForm';
import MilestoneList from './MilestoneList';

const ContractDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { address, isConnected, connect, suiClient } = useWallet();
  const { ownedContracts } = useEscrow();
  const { createDispute } = useDispute();
  
  const [contract, setContract] = useState<EscrowContract | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [disputeReason, setDisputeReason] = useState('');
  const [isDisputeModalOpen, setIsDisputeModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Status text mapping
  const getStatusText = (status: number) => {
    switch (status) {
      case 0: return 'Active';
      case 1: return 'Completed';
      case 2: return 'Disputed';
      case 3: return 'Cancelled';
      default: return 'Unknown';
    }
  };

  // Status color mapping
  const getStatusColor = (status: number) => {
    switch (status) {
      case 0: return 'bg-green-100 text-green-800';
      case 1: return 'bg-blue-100 text-blue-800';
      case 2: return 'bg-yellow-100 text-yellow-800';
      case 3: return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Format date from timestamp
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString();
  };

  // Format SUI amount
  const formatAmount = (amount: number) => {
    return (amount / 1_000_000_000).toFixed(9) + ' SUI';
  };

  // Fetch contract details
  const fetchContractDetails = useCallback(async () => {
    if (!id) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // First try to find it in owned contracts (for demonstration)
      const foundContract = ownedContracts.find(c => c.id === id);
      
      if (foundContract) {
        setContract(foundContract);
      } else {
        // If not found in owned contracts, try to fetch directly
        // In a real implementation, you'd query the blockchain
        setError('Contract not found in your contracts');
      }
    } catch (err) {
      console.error('Failed to fetch contract details:', err);
      setError('Failed to fetch contract details. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [id, ownedContracts]);

  // Handle opening a dispute
  const handleOpenDispute = async () => {
    if (!id || !contract) return;
    
    setIsSubmitting(true);
    
    try {
      const disputeId = await createDispute(id, disputeReason);
      
      if (disputeId) {
        setIsDisputeModalOpen(false);
        setDisputeReason('');
        fetchContractDetails();
      }
    } catch (err) {
      console.error('Error opening dispute:', err);
      setError('Failed to open dispute. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Check if current user is client or freelancer
  const isClient = contract && address === contract.client;
  const isFreelancer = contract && address === contract.freelancer;
  const isParticipant = isClient || isFreelancer;

  useEffect(() => {
    if (isConnected && id) {
      fetchContractDetails();
    }
  }, [isConnected, id, fetchContractDetails]);

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <p className="text-gray-600 mb-4">Connect your wallet to view contract details</p>
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
    return <div className="text-center p-8">Loading contract details...</div>;
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

  if (!contract) {
    return (
      <div className="text-center p-8">
        <p className="text-gray-600 mb-4">Contract not found</p>
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
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{contract.description}</h1>
          <div className="mt-2 flex items-center">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(contract.status)}`}>
              {getStatusText(contract.status)}
            </span>
            <span className="ml-4 text-sm text-gray-500">
              Created: {formatDate(contract.createdAt)}
            </span>
            <span className="ml-4 text-sm text-gray-500">
              Due: {formatDate(contract.endDate)}
            </span>
          </div>
        </div>
        
        {isParticipant && contract.status === 0 && (
          <button
            onClick={() => setIsDisputeModalOpen(true)}
            className="px-4 py-2 text-sm font-medium text-yellow-700 bg-yellow-100 rounded-md hover:bg-yellow-200 focus:outline-none"
          >
            Open Dispute
          </button>
        )}
      </div>
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Contract Details</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-sm text-gray-500">Client</p>
            <p className="text-base font-medium text-gray-900">{contract.client}</p>
          </div>
          
          <div>
            <p className="text-sm text-gray-500">Freelancer</p>
            <p className="text-base font-medium text-gray-900">{contract.freelancer}</p>
          </div>
          
          <div>
            <p className="text-sm text-gray-500">Total Amount</p>
            <p className="text-base font-medium text-gray-900">{formatAmount(contract.totalAmount)}</p>
          </div>
          
          <div>
            <p className="text-sm text-gray-500">Remaining Balance</p>
            <p className="text-base font-medium text-gray-900">{formatAmount(contract.remainingBalance)}</p>
          </div>
        </div>
      </div>
      
      {/* Only client can add milestones when contract is active */}
      {isClient && contract.status === 0 && (
        <MilestoneForm
          escrowId={contract.id}
          totalAmount={contract.totalAmount}
          onMilestoneAdded={fetchContractDetails}
        />
      )}
      
      <MilestoneList
        escrowId={contract.id}
        milestones={contract.milestones}
        clientAddress={contract.client}
        freelancerAddress={contract.freelancer}
        refreshData={fetchContractDetails}
      />

      {/* Open Dispute Modal */}
      {isDisputeModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 m-4 max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Open Dispute</h3>
            <div className="mb-4">
              <label htmlFor="disputeReason" className="block text-sm font-medium text-gray-700 mb-1">
                Reason for Dispute
              </label>
              <textarea
                id="disputeReason"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                value={disputeReason}
                onChange={(e) => setDisputeReason(e.target.value)}
                required
                rows={4}
                placeholder="Explain why you are opening a dispute..."
              />
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setIsDisputeModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                onClick={handleOpenDispute}
                className="px-4 py-2 text-sm font-medium text-white bg-yellow-600 rounded-md hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
                disabled={isSubmitting || !disputeReason.trim()}
              >
                {isSubmitting ? 'Submitting...' : 'Open Dispute'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContractDetails;

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useWallet } from '../../context/WalletContext';
import { motion, AnimatePresence } from 'framer-motion';
import MilestoneList from './MilestoneList';
import MilestoneForm from './MilestoneForm';

// Mock data interface (to be replaced with actual contract data)
interface Milestone {
  description: string;
  amount: number;
  status: number;
  deadline: number;
  submissionNote: string;
  rejectionReason: string;
}

interface EscrowContract {
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
}

// Mock data (to be replaced with data from smart contract)
const MOCK_CONTRACTS: EscrowContract[] = [
  {
    id: "contract-1",
    client: "0x1234567890abcdef1234567890abcdef12345678",
    freelancer: "0xabcdef1234567890abcdef1234567890abcdef12",
    totalAmount: 5000000000, // 5 SUI (in MIST)
    remainingBalance: 3000000000,
    status: 0, // Active
    milestones: [
      {
        description: "Website Design",
        amount: 2000000000,
        status: 2, // Approved
        deadline: Date.now() + 86400000 * 7, // 7 days from now
        submissionNote: "Completed the design as requested. Figma file link: https://figma.com/file/...",
        rejectionReason: "",
      },
      {
        description: "Frontend Development",
        amount: 3000000000,
        status: 0, // Pending
        deadline: Date.now() + 86400000 * 14, // 14 days from now
        submissionNote: "",
        rejectionReason: "",
      },
    ],
    createdAt: Date.now() - 86400000 * 3, // 3 days ago
    endDate: Date.now() + 86400000 * 30, // 30 days from now
    description: "Portfolio website redesign with React and TailwindCSS",
  },
  {
    id: "contract-2",
    client: "0x1234567890abcdef1234567890abcdef12345678",
    freelancer: "0xdef1234567890abcdef1234567890abcdef123456",
    totalAmount: 3000000000, // 3 SUI
    remainingBalance: 3000000000,
    status: 0, // Active
    milestones: [],
    createdAt: Date.now() - 86400000 * 1, // 1 day ago
    endDate: Date.now() + 86400000 * 20, // 20 days from now
    description: "Mobile app UI design for e-commerce platform",
  }
];

const ContractDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { address, isConnected, connect } = useWallet();
  const pageTopRef = useRef<HTMLDivElement>(null);
  
  // State
  const [contract, setContract] = useState<EscrowContract | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [disputeReason, setDisputeReason] = useState("");
  const [isDisputeModalOpen, setIsDisputeModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [milestoneFormVisible, setMilestoneFormVisible] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

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
      case 0: return 'bg-green-100 text-green-800 border-green-200';
      case 1: return 'bg-blue-100 text-blue-800 border-blue-200';
      case 2: return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 3: return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Format date from timestamp
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Format SUI amount from MIST
  const formatAmount = (amount: number) => {
    return (amount / 1_000_000_000).toFixed(9) + ' SUI';
  };

  // Check if current user is client or freelancer
  const isClient = contract && address === contract.client;
  const isFreelancer = contract && address === contract.freelancer;
  const isParticipant = isClient || isFreelancer;

  // Calculate progress percentage
  const calculateProgress = (contract: EscrowContract) => {
    if (contract.milestones.length === 0) return 0;
    const completedMilestones = contract.milestones.filter(m => m.status === 2).length;
    return Math.round((completedMilestones / contract.milestones.length) * 100);
  };

  // Calculate remaining time
  const calculateRemainingTime = (deadline: number) => {
    const now = Date.now();
    const timeRemaining = deadline - now;
    
    if (timeRemaining <= 0) {
      return 'Deadline passed';
    }
    
    const days = Math.floor(timeRemaining / (1000 * 60 * 60 * 24));
    
    if (days > 30) {
      const months = Math.floor(days / 30);
      return `${months} month${months > 1 ? 's' : ''} remaining`;
    } else if (days > 0) {
      return `${days} day${days > 1 ? 's' : ''} remaining`;
    } else {
      const hours = Math.floor(timeRemaining / (1000 * 60 * 60));
      return `${hours} hour${hours > 1 ? 's' : ''} remaining`;
    }
  };

  // Fetch contract details
  const fetchContractDetails = useCallback(async () => {
    if (!id) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // This would be replaced with an actual smart contract call
      // For now, using mock data
      const foundContract = MOCK_CONTRACTS.find(c => c.id === id);
      
      if (foundContract) {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 800));
        setContract(foundContract);
      } else {
        setError('Contract not found. Please check the contract ID.');
      }
    } catch (err) {
      console.error('Failed to fetch contract details:', err);
      setError('Failed to fetch contract details. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  // Handle opening a dispute
  const handleOpenDispute = async () => {
    if (!id || !contract) return;
    
    setIsSubmitting(true);
    
    try {
      // This would be replaced with an actual smart contract call
      // For now, simulating the action
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update the local state to simulate the change
      setContract(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          status: 2, // Disputed
        };
      });
      
      setIsDisputeModalOpen(false);
      setDisputeReason('');
    } catch (err) {
      console.error('Error opening dispute:', err);
      setError('Failed to open dispute. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle milestone added
  const handleMilestoneAdded = () => {
    setMilestoneFormVisible(false);
    setRefreshTrigger(prev => prev + 1);
  };

  // Fetch contract data on component mount
  useEffect(() => {
    if (isConnected && id) {
      fetchContractDetails();
    }
  }, [isConnected, id, fetchContractDetails, refreshTrigger]);

  // Scroll to top when viewing a new contract
  useEffect(() => {
    if (pageTopRef.current) {
      pageTopRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [id]);

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center h-64 bg-white rounded-xl shadow-lg p-8 text-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-indigo-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        <p className="text-gray-600 mb-6 text-lg">Connect your wallet to view contract details</p>
        <button
          onClick={connect}
          className="px-6 py-3 text-base font-medium text-white bg-indigo-600 rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
        >
          Connect Wallet
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="w-16 h-16 relative">
          <div className="absolute top-0 right-0 bottom-0 left-0 animate-ping rounded-full bg-indigo-400 opacity-75"></div>
          <div className="rounded-full bg-indigo-500 w-16 h-16 flex items-center justify-center relative">
            <svg className="w-8 h-8 text-white animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
            </svg>
          </div>
        </div>
        <p className="mt-4 text-lg text-gray-600">Loading contract details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 p-8 rounded-xl shadow-md max-w-3xl mx-auto">
        <div className="flex items-center mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h3 className="text-lg font-medium text-red-800">Error</h3>
        </div>
        <p className="text-red-700 mb-6">{error}</p>
        <div className="flex gap-4">
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
          >
            Back to Dashboard
          </button>
          <button
            onClick={fetchContractDetails}
            className="px-4 py-2 text-sm font-medium text-indigo-700 bg-indigo-100 rounded-lg hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="text-center py-12">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <p className="text-gray-600 mb-6 text-lg">Contract not found</p>
        <button
          onClick={() => navigate('/')}
          className="px-4 py-2 text-sm font-medium text-indigo-700 bg-indigo-100 rounded-lg hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto" ref={pageTopRef}>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="space-y-8"
      >
        {/* Contract Header Section */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                <span>Contract ID:</span>
                <span className="font-mono">{contract.id}</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">{contract.description}</h1>
            </div>
            <div className="flex gap-3">
              <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(contract.status)}`}>
                {getStatusText(contract.status)}
              </span>
              {isParticipant && contract.status === 0 && (
                <button
                  onClick={() => setIsDisputeModalOpen(true)}
                  className="px-3 py-1 rounded-full text-sm font-medium text-yellow-700 bg-yellow-50 border border-yellow-200 hover:bg-yellow-100 transition-colors"
                >
                  Open Dispute
                </button>
              )}
            </div>
          </div>
          
          <div className="px-6 py-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-1">
                <p className="text-sm text-gray-500">Created</p>
                <p className="text-gray-900 font-medium">{formatDate(contract.createdAt)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-gray-500">Deadline</p>
                <p className="text-gray-900 font-medium">{formatDate(contract.endDate)}</p>
                <p className="text-sm text-indigo-600">{calculateRemainingTime(contract.endDate)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-gray-500">Total Value</p>
                <p className="text-gray-900 font-medium">{formatAmount(contract.totalAmount)}</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Contract Parties Section */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Contract Parties</h2>
          </div>
          <div className="px-6 py-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className={`p-5 rounded-lg ${isClient ? 'bg-indigo-50 border border-indigo-100' : 'bg-gray-50 border border-gray-100'}`}>
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isClient ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-200 text-gray-600'}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">Client</h3>
                    {isClient && <span className="text-xs text-indigo-600 font-medium">You</span>}
                  </div>
                </div>
                <div className="bg-white p-3 rounded border border-gray-200 font-mono text-sm break-all">
                  {contract.client}
                </div>
                {isClient && (
                  <div className="mt-4 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Total Contract Value:</span>
                      <span className="text-sm font-medium">{formatAmount(contract.totalAmount)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Released Value:</span>
                      <span className="text-sm font-medium">{formatAmount(contract.totalAmount - contract.remainingBalance)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Remaining Balance:</span>
                      <span className="text-sm font-medium">{formatAmount(contract.remainingBalance)}</span>
                    </div>
                  </div>
                )}
              </div>
              
              <div className={`p-5 rounded-lg ${isFreelancer ? 'bg-purple-50 border border-purple-100' : 'bg-gray-50 border border-gray-100'}`}>
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isFreelancer ? 'bg-purple-100 text-purple-600' : 'bg-gray-200 text-gray-600'}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">Freelancer</h3>
                    {isFreelancer && <span className="text-xs text-purple-600 font-medium">You</span>}
                  </div>
                </div>
                <div className="bg-white p-3 rounded border border-gray-200 font-mono text-sm break-all">
                  {contract.freelancer}
                </div>
                {isFreelancer && (
                  <div className="mt-4 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Total Contract Value:</span>
                      <span className="text-sm font-medium">{formatAmount(contract.totalAmount)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Received Value:</span>
                      <span className="text-sm font-medium">{formatAmount(contract.totalAmount - contract.remainingBalance)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Pending Value:</span>
                      <span className="text-sm font-medium">{formatAmount(contract.remainingBalance)}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Progress Section */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">Progress Overview</h2>
            <span className="text-sm text-gray-500">{contract.milestones.filter(m => m.status === 2).length} of {contract.milestones.length} milestones completed</span>
          </div>
          <div className="px-6 py-5">
            <div className="mb-2 flex justify-between">
              <span className="text-sm font-medium text-gray-700">
                {calculateProgress(contract)}% Complete
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2.5 rounded-full transition-all duration-700 ease-out"
                style={{ width: `${calculateProgress(contract)}%` }}
              ></div>
            </div>
            
            <div className="mt-8 flex flex-col sm:flex-row sm:justify-end gap-4">
              {isClient && contract.status === 0 && (
                <button
                  onClick={() => setMilestoneFormVisible(true)}
                  className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg shadow hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors flex items-center justify-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                  Add Milestone
                </button>
              )}
              <button
                onClick={() => navigate(isClient ? '/client-dashboard' : '/freelancer-dashboard')}
                className="px-4 py-2 bg-white text-gray-700 font-medium rounded-lg border border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors flex items-center justify-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                </svg>
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
        
        {/* Milestones Section */}
        <div>
          <AnimatePresence>
            {milestoneFormVisible && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <MilestoneForm 
                  escrowId={contract.id} 
                  totalAmount={contract.totalAmount} 
                  onMilestoneAdded={handleMilestoneAdded}
                  onCancel={() => setMilestoneFormVisible(false)}
                />
              </motion.div>
            )}
          </AnimatePresence>
          
          <MilestoneList
            escrowId={contract.id}
            milestones={contract.milestones}
            clientAddress={contract.client}
            freelancerAddress={contract.freelancer}
            refreshData={() => setRefreshTrigger(prev => prev + 1)}
          />
        </div>
        
        {/* Dispute Modal */}
        {isDisputeModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden">
              <div className="bg-gradient-to-r from-yellow-500 to-amber-500 px-6 py-4">
                <h3 className="text-lg font-semibold text-white">Open Dispute</h3>
              </div>
              <div className="p-6">
                <div className="mb-4">
                  <label htmlFor="disputeReason" className="block text-sm font-medium text-gray-700 mb-1">
                    Reason for Dispute
                  </label>
                  <textarea
                    id="disputeReason"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                    value={disputeReason}
                    onChange={(e) => setDisputeReason(e.target.value)}
                    required
                    rows={4}
                    placeholder="Explain why you are opening a dispute..."
                  />
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-100 mb-6">
                  <div className="flex items-start">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-600 mt-0.5 mr-1.5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <div className="ml-2">
                      <p className="text-sm text-yellow-700">
                        Opening a dispute will lock the contract until the dispute is resolved. This process involves community voting.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end space-x-4">
                  <button
                    onClick={() => setIsDisputeModalOpen(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleOpenDispute}
                    className="px-4 py-2 text-sm font-medium text-white bg-yellow-600 rounded-lg hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 transition-colors disabled:bg-yellow-400 disabled:cursor-not-allowed"
                    disabled={isSubmitting || !disputeReason.trim()}
                  >
                    {isSubmitting ? (
                      <div className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Processing...
                      </div>
                    ) : "Open Dispute"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default ContractDetails;

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import MilestoneList from './MilestoneList';
import MilestoneForm from './MilestoneForm';
import useEscrow from '../../hooks/useEscrow';
import { 
  formatSuiAmount, 
  calculateProgress, 
  calculateRemainingTime,
  formatStatusText,
  CONTRACT_STATUS
} from '../../utils/contracts';
import CustomConnectButton from '../common/CustomConnectButton';

const ContractDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const pageTopRef = useRef<HTMLDivElement>(null);
  const { 
    isConnected, 
    address, 
    loadContract, 
    currentContract, 
    loading, 
    error, 
    openDispute,
    cancelContract,
    refresh
  } = useEscrow();
  
  // UI state
  const [disputeReason, setDisputeReason] = useState("");
  const [isDisputeModalOpen, setIsDisputeModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [milestoneFormVisible, setMilestoneFormVisible] = useState(false);
  const [transactionHash, setTransactionHash] = useState<string | null>(null);

  // Check if current user is client or freelancer
  const isClient = currentContract && address === currentContract.client;
  const isFreelancer = currentContract && address === currentContract.freelancer;
  const isParticipant = Boolean(isClient) || Boolean(isFreelancer);

  // Load contract data
  const fetchContractDetails = useCallback(async () => {
    if (!id || !isConnected) return;
    
    try {
      await loadContract(id);
    } catch (err) {
      console.error('Failed to fetch contract details:', err);
    }
  }, [id, isConnected, loadContract]);

  // Handle opening a dispute
  const handleOpenDispute = async () => {
    if (!id || !currentContract) return;
    
    setIsSubmitting(true);
    setTransactionHash(null);
    
    try {
      const result = await openDispute(id, disputeReason);
      
      if (result.success) {
        // Set transaction hash
        setTransactionHash(result.txDigest || null);
        
        // Close modal and reset after successful transaction
        setTimeout(() => {
          setIsDisputeModalOpen(false);
          setDisputeReason('');
          refresh();
        }, 3000);
      } else {
        console.error('Error opening dispute:', result.error);
        setIsSubmitting(false);
      }
    } catch (err) {
      console.error('Error opening dispute:', err);
      setIsSubmitting(false);
    }
  };

  // Handle cancelling a contract
  const handleCancelContract = async () => {
    if (!id || !currentContract) return;
    
    setIsSubmitting(true);
    
    try {
      // Determine who is cancelling
      const clientAgreed = Boolean(isClient);
      const freelancerAgreed = Boolean(isFreelancer);
      
      const result = await cancelContract(id, clientAgreed, freelancerAgreed);
      
      if (result.success) {
        // Refresh contract data
        refresh();
        
        // Show success message
        setIsSubmitting(false);
      } else {
        console.error('Error cancelling contract:', result.error);
        setIsSubmitting(false);
      }
    } catch (err) {
      console.error('Error cancelling contract:', err);
      setIsSubmitting(false);
    }
  };

  // Handle milestone added
  const handleMilestoneAdded = () => {
    setMilestoneFormVisible(false);
    refresh();
  };

  // Fetch contract data on component mount and when ID changes
  useEffect(() => {
    if (isConnected && id) {
      fetchContractDetails();
    }
  }, [isConnected, id, fetchContractDetails]);

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
        <CustomConnectButton
          variant="primary"
          size="lg"
          label="Connect Wallet"
          className="shadow-md transition-colors"
        />
      </div>
    );
  }

  if (loading && !currentContract) {
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

  if (!currentContract) {
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
                <span className="font-mono">{currentContract.id}</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">{currentContract.description}</h1>
            </div>
            <div className="flex gap-3">
              <span className={`px-3 py-1 rounded-full text-sm font-medium border ${
                currentContract.status === CONTRACT_STATUS.ACTIVE 
                  ? 'bg-green-100 text-green-800 border-green-200'
                  : currentContract.status === CONTRACT_STATUS.COMPLETED
                  ? 'bg-blue-100 text-blue-800 border-blue-200'
                  : currentContract.status === CONTRACT_STATUS.DISPUTED
                  ? 'bg-yellow-100 text-yellow-800 border-yellow-200'
                  : 'bg-red-100 text-red-800 border-red-200'
              }`}>
                {formatStatusText(currentContract.status)}
              </span>
              {isParticipant && currentContract.status === CONTRACT_STATUS.ACTIVE && (
                <button
                  onClick={() => setIsDisputeModalOpen(true)}
                  className="px-3 py-1 rounded-full text-sm font-medium text-yellow-700 bg-yellow-50 border border-yellow-200 hover:bg-yellow-100 transition-colors"
                >
                  Open Dispute
                </button>
              )}
              {isClient && currentContract.status === CONTRACT_STATUS.ACTIVE && currentContract.milestones.length === 0 && (
                <button
                  onClick={handleCancelContract}
                  disabled={isSubmitting}
                  className="px-3 py-1 rounded-full text-sm font-medium text-red-700 bg-red-50 border border-red-200 hover:bg-red-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Processing...' : 'Cancel Contract'}
                </button>
              )}
            </div>
          </div>
          
          <div className="px-6 py-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-1">
                <p className="text-sm text-gray-500">Created</p>
                <p className="text-gray-900 font-medium">{new Date(currentContract.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-gray-500">Deadline</p>
                <p className="text-gray-900 font-medium">{new Date(currentContract.endDate).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}</p>
                <p className="text-sm text-indigo-600">{calculateRemainingTime(currentContract.endDate).text}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-gray-500">Total Value</p>
                <p className="text-gray-900 font-medium">{formatSuiAmount(currentContract.totalAmount)}</p>
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
                  {currentContract.client}
                </div>
                {isClient && (
                  <div className="mt-4 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Total Contract Value:</span>
                      <span className="text-sm font-medium">{formatSuiAmount(currentContract.totalAmount)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Released Value:</span>
                      <span className="text-sm font-medium">{formatSuiAmount(currentContract.totalAmount - currentContract.remainingBalance)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Remaining Balance:</span>
                      <span className="text-sm font-medium">{formatSuiAmount(currentContract.remainingBalance)}</span>
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
                  {currentContract.freelancer}
                </div>
                {isFreelancer && (
                  <div className="mt-4 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Total Contract Value:</span>
                      <span className="text-sm font-medium">{formatSuiAmount(currentContract.totalAmount)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Received Value:</span>
                      <span className="text-sm font-medium">{formatSuiAmount(currentContract.totalAmount - currentContract.remainingBalance)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Pending Value:</span>
                      <span className="text-sm font-medium">{formatSuiAmount(currentContract.remainingBalance)}</span>
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
            <span className="text-sm text-gray-500">{currentContract.milestones.filter(m => m.status === 2).length} of {currentContract.milestones.length} milestones completed</span>
          </div>
          <div className="px-6 py-5">
            <div className="mb-2 flex justify-between">
              <span className="text-sm font-medium text-gray-700">
                {calculateProgress(currentContract)}% Complete
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2.5 rounded-full transition-all duration-700 ease-out"
                style={{ width: `${calculateProgress(currentContract)}%` }}
              ></div>
            </div>
            
            <div className="mt-8 flex flex-col sm:flex-row sm:justify-end gap-4">
              {isClient && currentContract.status === CONTRACT_STATUS.ACTIVE && (
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
                  escrowId={currentContract.id} 
                  totalAmount={currentContract.remainingBalance} 
                  onMilestoneAdded={handleMilestoneAdded}
                  onCancel={() => setMilestoneFormVisible(false)}
                />
              </motion.div>
            )}
          </AnimatePresence>
          
          <MilestoneList
            escrowId={currentContract.id}
            milestones={currentContract.milestones}
            clientAddress={currentContract.client}
            freelancerAddress={currentContract.freelancer}
            refreshData={refresh}
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
                {transactionHash ? (
                  <div className="mb-6">
                    <div className="flex items-center justify-center mb-4">
                      <div className="bg-yellow-100 rounded-full p-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                      </div>
                    </div>
                    <h4 className="text-center text-lg font-medium text-gray-900 mb-2">Dispute Opened Successfully!</h4>
                    <p className="text-sm text-gray-600 mb-4 text-center">
                      Your dispute has been opened on the blockchain. The contract is now in a disputed state.
                    </p>
                    
                    <p className="text-sm text-gray-600 mb-2">Transaction Hash:</p>
                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 mb-4">
                      <p className="font-mono text-xs text-gray-800 break-all">{transactionHash}</p>
                    </div>
                    
                    <div className="text-center">
                      <a 
                        href={`https://suiscan.xyz/testnet/tx/${transactionHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-yellow-600 hover:text-yellow-800 inline-block mb-2"
                      >
                        View on Explorer
                      </a>
                    </div>
                  </div>
                ) : (
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
                      disabled={isSubmitting}
                    />
                  </div>
                )}
                
                {!transactionHash && (
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
                )}
                
                <div className="flex justify-end space-x-4">
                  <button
                    onClick={() => setIsDisputeModalOpen(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
                    disabled={isSubmitting}
                  >
                    {transactionHash ? 'Close' : 'Cancel'}
                  </button>
                  {!transactionHash && (
                    <button
                      onClick={handleOpenDispute}
                      className="px-4 py-2 text-sm font-medium text-white bg-yellow-600 rounded-lg hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 transition-colors disabled:bg-yellow-400 disabled:cursor-not-allowed flex items-center"
                      disabled={isSubmitting || !disputeReason.trim()}
                    >
                      {isSubmitting ? (
                        <div className="flex items-center">
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Processing on Blockchain...
                        </div>
                      ) : "Open Dispute"}
                    </button>
                  )}
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

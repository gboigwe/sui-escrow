import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWallet } from '../../context/WalletContext';

interface Milestone {
  description: string;
  amount: number;
  status: number;
  deadline: number;
  submissionNote: string;
  rejectionReason: string;
}

interface MilestoneListProps {
  escrowId: string;
  milestones: Milestone[];
  clientAddress: string;
  freelancerAddress: string;
  refreshData: () => void;
}

const MilestoneList: React.FC<MilestoneListProps> = ({
  // escrowId,
  milestones,
  clientAddress,
  freelancerAddress,
  refreshData,
}) => {
  const { address } = useWallet();
  
  // State for modal dialogs
  const [selectedMilestoneIndex, setSelectedMilestoneIndex] = useState<number | null>(null);
  const [submissionNote, setSubmissionNote] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeModal, setActiveModal] = useState<'submit' | 'reject' | null>(null);
  
  // Expanded milestone details for mobile view
  const [expandedMilestones, setExpandedMilestones] = useState<number[]>([]);

  // Determine if current user is client or freelancer
  const isClient = address === clientAddress;
  const isFreelancer = address === freelancerAddress;

  // Status text mapping
  const getStatusText = (status: number) => {
    switch (status) {
      case 0: return 'Pending';
      case 1: return 'Submitted';
      case 2: return 'Approved';
      case 3: return 'Rejected';
      default: return 'Unknown';
    }
  };

  // Status color mapping
  const getStatusColor = (status: number) => {
    switch (status) {
      case 0: return 'bg-gray-100 text-gray-800 border-gray-200';
      case 1: return 'bg-blue-100 text-blue-800 border-blue-200';
      case 2: return 'bg-green-100 text-green-800 border-green-200';
      case 3: return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Format date from timestamp
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Format SUI amount from MIST
  const formatAmount = (amount: number) => {
    return (amount / 1_000_000_000).toFixed(9) + ' SUI';
  };
  
  // Calculate remaining time
  const calculateRemainingTime = (deadline: number) => {
    const now = Date.now();
    const timeRemaining = deadline - now;
    
    if (timeRemaining <= 0) {
      return {
        text: 'Overdue',
        isOverdue: true
      };
    }
    
    const days = Math.floor(timeRemaining / (1000 * 60 * 60 * 24));
    
    if (days > 30) {
      const months = Math.floor(days / 30);
      return {
        text: `${months} month${months > 1 ? 's' : ''} left`,
        isOverdue: false
      };
    } else if (days > 0) {
      return {
        text: `${days} day${days > 1 ? 's' : ''} left`,
        isOverdue: false
      };
    } else {
      const hours = Math.floor(timeRemaining / (1000 * 60 * 60));
      return {
        text: `${hours} hour${hours > 1 ? 's' : ''} left`,
        isOverdue: false,
        isUrgent: true
      };
    }
  };

  // Toggle milestone expansion for mobile view
  const toggleMilestoneExpansion = (index: number) => {
    setExpandedMilestones(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index) 
        : [...prev, index]
    );
  };

  // Handle milestone submission
  const handleSubmitMilestone = async () => {
    if (selectedMilestoneIndex === null) return;
    
    setIsSubmitting(true);
    
    try {
      // Here we would call the smart contract
      // For now, let's simulate a delay and success
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Close modal and refresh data
      setSubmissionNote('');
      setSelectedMilestoneIndex(null);
      setActiveModal(null);
      refreshData();
    } catch (error) {
      console.error('Error submitting milestone:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle milestone approval
  const handleApproveMilestone = async () => {
    // const handleApproveMilestone = async (index: number) => {
    setIsSubmitting(true);
    
    try {
      // Here we would call the smart contract
      // For now, let's simulate a delay and success
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Refresh data
      refreshData();
    } catch (error) {
      console.error('Error approving milestone:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle milestone rejection
  const handleRejectMilestone = async () => {
    if (selectedMilestoneIndex === null) return;
    
    setIsSubmitting(true);
    
    try {
      // Here we would call the smart contract
      // For now, let's simulate a delay and success
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Close modal and refresh data
      setRejectionReason('');
      setSelectedMilestoneIndex(null);
      setActiveModal(null);
      refreshData();
    } catch (error) {
      console.error('Error rejecting milestone:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open modal for submitting/rejecting milestone
  const openModal = (type: 'submit' | 'reject', index: number) => {
    setSelectedMilestoneIndex(index);
    setActiveModal(type);
  };

  // Close modal
  const closeModal = () => {
    setSelectedMilestoneIndex(null);
    setActiveModal(null);
    setSubmissionNote('');
    setRejectionReason('');
  };

  return (
    <>
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900">Project Milestones</h2>
          <span className="text-sm text-gray-500">{milestones.length} milestone{milestones.length !== 1 ? 's' : ''}</span>
        </div>
        
        {milestones.length === 0 ? (
          <div className="px-6 py-10 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <p className="text-gray-500 mb-2">No milestones have been added yet.</p>
            {isClient && (
              <p className="text-sm text-gray-500">
                Create milestones to track project progress and release payments.
              </p>
            )}
            {isFreelancer && (
              <p className="text-sm text-gray-500">
                The client needs to add milestones before you can submit work.
              </p>
            )}
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {milestones.map((milestone, index) => {
              const timeInfo = calculateRemainingTime(milestone.deadline);
              const isExpanded = expandedMilestones.includes(index);
              
              return (
                <li key={index} className="hover:bg-gray-50 transition-colors">
                  {/* Desktop view */}
                  <div className="hidden md:flex items-center px-6 py-4">
                    <div className="flex-1">
                      <div className="flex items-center">
                        <div 
                          className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                            milestone.status === 2 
                              ? 'bg-green-100 text-green-600' 
                              : milestone.status === 3 
                                ? 'bg-red-100 text-red-600'
                                : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {milestone.status === 2 ? (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          ) : milestone.status === 3 ? (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                          ) : (
                            <span>{index + 1}</span>
                          )}
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-900">{milestone.description}</h4>
                          <div className="flex items-center mt-1 text-xs text-gray-500">
                            <span className="mr-2">Due: {formatDate(milestone.deadline)}</span>
                            {timeInfo.isOverdue ? (
                              <span className="text-red-600 font-medium">{timeInfo.text}</span>
                            ) : timeInfo.isUrgent ? (
                              <span className="text-yellow-600 font-medium">{timeInfo.text}</span>
                            ) : (
                              <span className="text-gray-500">{timeInfo.text}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {milestone.status === 1 && milestone.submissionNote && (
                        <div className="mt-2 ml-11">
                          <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded-lg border border-gray-200">
                            <span className="font-medium">Submission Note:</span> {milestone.submissionNote}
                          </div>
                        </div>
                      )}
                      
                      {milestone.status === 3 && milestone.rejectionReason && (
                        <div className="mt-2 ml-11">
                          <div className="text-xs text-red-700 bg-red-50 p-2 rounded-lg border border-red-100">
                            <span className="font-medium">Rejection Reason:</span> {milestone.rejectionReason}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-900">{formatAmount(milestone.amount)}</div>
                        <div className="mt-1">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(milestone.status)}`}>
                            {getStatusText(milestone.status)}
                          </span>
                        </div>
                      </div>
                      
                      <div>
                        {isFreelancer && milestone.status === 0 && (
                          <button
                            onClick={() => openModal('submit', index)}
                            className="inline-flex items-center px-2.5 py-1.5 text-xs font-medium rounded text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                          >
                            Submit Work
                          </button>
                        )}
                        
                        {isClient && milestone.status === 1 && (
                          <div className="flex flex-col space-y-2">
                            <button
                              onClick={() => handleApproveMilestone()}
                              disabled={isSubmitting}
                              className="inline-flex items-center px-2.5 py-1.5 text-xs font-medium rounded text-green-700 bg-green-100 hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {isSubmitting ? 'Processing...' : 'Approve'}
                            </button>
                            <button
                              onClick={() => openModal('reject', index)}
                              disabled={isSubmitting}
                              className="inline-flex items-center px-2.5 py-1.5 text-xs font-medium rounded text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              Reject
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Mobile view */}
                  <div className="md:hidden p-4">
                    <button 
                      className="w-full flex justify-between items-center focus:outline-none"
                      onClick={() => toggleMilestoneExpansion(index)}
                    >
                      <div className="flex items-center">
                        <div 
                          className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center mr-3 ${
                            milestone.status === 2 
                              ? 'bg-green-100 text-green-600' 
                              : milestone.status === 3 
                                ? 'bg-red-100 text-red-600'
                                : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {milestone.status === 2 ? (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          ) : milestone.status === 3 ? (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                          ) : (
                            <span className="text-xs">{index + 1}</span>
                          )}
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-900">{milestone.description}</h4>
                        </div>
                      </div>
                      
                      <div className="flex items-center">
                        <span className={`mr-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(milestone.status)}`}>
                          {getStatusText(milestone.status)}
                        </span>
                        <svg 
                          className={`h-5 w-5 text-gray-400 transition-transform duration-200 ${isExpanded ? 'transform rotate-180' : ''}`} 
                          xmlns="http://www.w3.org/2000/svg" 
                          viewBox="0 0 20 20" 
                          fill="currentColor"
                        >
                          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </button>
                    
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="pt-3 pb-1 space-y-3">
                            <div className="flex justify-between text-xs">
                              <span className="text-gray-500">Due Date:</span>
                              <span className="text-gray-900">{formatDate(milestone.deadline)}</span>
                            </div>
                            
                            <div className="flex justify-between text-xs">
                              <span className="text-gray-500">Amount:</span>
                              <span className="text-gray-900 font-medium">{formatAmount(milestone.amount)}</span>
                            </div>
                            
                            <div className="flex justify-between text-xs">
                              <span className="text-gray-500">Time Remaining:</span>
                              {timeInfo.isOverdue ? (
                                <span className="text-red-600 font-medium">{timeInfo.text}</span>
                              ) : timeInfo.isUrgent ? (
                                <span className="text-yellow-600 font-medium">{timeInfo.text}</span>
                              ) : (
                                <span className="text-gray-900">{timeInfo.text}</span>
                              )}
                            </div>
                            
                            {milestone.status === 1 && milestone.submissionNote && (
                              <div>
                                <p className="text-xs text-gray-500 mb-1">Submission Note:</p>
                                <p className="text-xs text-gray-900 bg-gray-50 p-2 rounded-lg border border-gray-200">
                                  {milestone.submissionNote}
                                </p>
                              </div>
                            )}
                            
                            {milestone.status === 3 && milestone.rejectionReason && (
                              <div>
                                <p className="text-xs text-red-700 mb-1">Rejection Reason:</p>
                                <p className="text-xs text-red-900 bg-red-50 p-2 rounded-lg border border-red-100">
                                  {milestone.rejectionReason}
                                </p>
                              </div>
                            )}
                            
                            <div className="pt-2">
                              {isFreelancer && milestone.status === 0 && (
                                <button
                                  onClick={() => openModal('submit', index)}
                                  className="w-full py-2 text-xs font-medium text-indigo-700 bg-indigo-100 rounded hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                                >
                                  Submit Work
                                </button>
                              )}
                              
                              {isClient && milestone.status === 1 && (
                                <div className="flex flex-col space-y-2">
                                  <button
                                    onClick={() => handleApproveMilestone()}
                                    disabled={isSubmitting}
                                    className="w-full py-2 text-xs font-medium text-green-700 bg-green-100 rounded hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    {isSubmitting ? 'Processing...' : 'Approve'}
                                  </button>
                                  <button
                                    onClick={() => openModal('reject', index)}
                                    disabled={isSubmitting}
                                    className="w-full py-2 text-xs font-medium text-red-700 bg-red-100 rounded hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    Reject
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
      
      {/* Submit Work Modal */}
      {activeModal === 'submit' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden"
          >
            <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 px-6 py-4">
              <h3 className="text-lg font-semibold text-white">Submit Work</h3>
            </div>
            <div className="p-6">
              <div className="mb-6">
                <label htmlFor="submissionNote" className="block text-sm font-medium text-gray-700 mb-2">
                  Submission Details
                </label>
                <textarea
                  id="submissionNote"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                  value={submissionNote}
                  onChange={(e) => setSubmissionNote(e.target.value)}
                  rows={5}
                  placeholder="Describe the work you've completed for this milestone (links, details, etc.)..."
                />
              </div>
              
              <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100 mb-6">
                <div className="flex items-start">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-600 mt-0.5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="text-sm text-indigo-700">
                      Once submitted, the client will be able to review your work and either approve or reject it.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end space-x-4">
                <button
                  onClick={closeModal}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitMilestone}
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors flex items-center"
                  disabled={isSubmitting || !submissionNote.trim()}
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Submitting...
                    </>
                  ) : "Submit Work"}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
      
      {/* Reject Work Modal */}
      {activeModal === 'reject' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden"
          >
            <div className="bg-gradient-to-r from-red-500 to-red-600 px-6 py-4">
              <h3 className="text-lg font-semibold text-white">Reject Submission</h3>
            </div>
            <div className="p-6">
              <div className="mb-6">
                <label htmlFor="rejectionReason" className="block text-sm font-medium text-gray-700 mb-2">
                  Rejection Reason
                </label>
                <textarea
                  id="rejectionReason"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={5}
                  placeholder="Explain why you are rejecting this milestone submission..."
                />
              </div>
              
              <div className="bg-red-50 p-4 rounded-lg border border-red-100 mb-6">
                <div className="flex items-start">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-600 mt-0.5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="text-sm text-red-700">
                      Provide clear feedback on what needs to be fixed. The freelancer will need to resubmit the work after making the requested changes.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end space-x-4">
                <button
                  onClick={closeModal}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRejectMilestone}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors flex items-center"
                  disabled={isSubmitting || !rejectionReason.trim()}
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Rejecting...
                    </>
                  ) : "Reject Submission"}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </>
  );
};

export default MilestoneList;

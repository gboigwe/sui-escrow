// src/components/EscrowContract/MilestoneList.tsx
import React, { useState } from 'react';
import { useWallet } from '../../context/WalletContext';
import { useEscrow, Milestone } from '../../hooks/useEscrow';

interface MilestoneListProps {
  escrowId: string;
  milestones: Milestone[];
  clientAddress: string;
  freelancerAddress: string;
  refreshData: () => void;
}

const MilestoneList: React.FC<MilestoneListProps> = ({
  escrowId,
  milestones,
  clientAddress,
  freelancerAddress,
  refreshData,
}) => {
  const { address } = useWallet();
  const { submitMilestone, approveMilestone, rejectMilestone, error } = useEscrow();
  
  const [selectedMilestoneIndex, setSelectedMilestoneIndex] = useState<number | null>(null);
  const [submissionNote, setSubmissionNote] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeModal, setActiveModal] = useState<'submit' | 'reject' | null>(null);

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
      case 0: return 'bg-gray-100 text-gray-800';
      case 1: return 'bg-blue-100 text-blue-800';
      case 2: return 'bg-green-100 text-green-800';
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

  // Handle milestone submission
  const handleSubmitMilestone = async () => {
    if (selectedMilestoneIndex === null) return;
    
    setIsSubmitting(true);
    
    try {
      const success = await submitMilestone(
        escrowId,
        selectedMilestoneIndex,
        submissionNote
      );
      
      if (success) {
        setSubmissionNote('');
        setSelectedMilestoneIndex(null);
        setActiveModal(null);
        refreshData();
      }
    } catch (err) {
      console.error('Error submitting milestone:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle milestone approval
  const handleApproveMilestone = async (index: number) => {
    setIsSubmitting(true);
    
    try {
      const success = await approveMilestone(escrowId, index);
      
      if (success) {
        refreshData();
      }
    } catch (err) {
      console.error('Error approving milestone:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle milestone rejection
  const handleRejectMilestone = async () => {
    if (selectedMilestoneIndex === null) return;
    
    setIsSubmitting(true);
    
    try {
      const success = await rejectMilestone(
        escrowId,
        selectedMilestoneIndex,
        rejectionReason
      );
      
      if (success) {
        setRejectionReason('');
        setSelectedMilestoneIndex(null);
        setActiveModal(null);
        refreshData();
      }
    } catch (err) {
      console.error('Error rejecting milestone:', err);
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
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="p-5 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Project Milestones</h3>
        <p className="mt-1 text-sm text-gray-500">
          {milestones.length} milestone{milestones.length !== 1 ? 's' : ''}
        </p>
      </div>
      
      {error && (
        <div className="m-5 p-3 bg-red-100 text-red-700 rounded-md">
          {error}
        </div>
      )}

      {milestones.length === 0 ? (
        <div className="p-5 text-center text-gray-500">
          No milestones have been added yet.
        </div>
      ) : (
        <ul className="divide-y divide-gray-200">
          {milestones.map((milestone, index) => (
            <li key={index} className="p-5 hover:bg-gray-50">
              <div className="flex justify-between">
                <div className="w-2/3">
                  <h4 className="text-sm font-medium text-gray-900">{milestone.description}</h4>
                  <p className="mt-1 text-xs text-gray-500">Due: {formatDate(milestone.deadline)}</p>
                  
                  {milestone.status === 1 && (
                    <div className="mt-2 text-xs text-gray-700 bg-gray-50 p-2 rounded">
                      <p className="font-medium">Submission Note:</p>
                      <p>{milestone.submissionNote}</p>
                    </div>
                  )}
                  
                  {milestone.status === 3 && (
                    <div className="mt-2 text-xs text-red-700 bg-red-50 p-2 rounded">
                      <p className="font-medium">Rejection Reason:</p>
                      <p>{milestone.rejectionReason}</p>
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(milestone.status)}`}>
                    {getStatusText(milestone.status)}
                  </span>
                  <p className="mt-1 text-sm font-medium text-gray-900">{formatAmount(milestone.amount)}</p>
                  
                  <div className="mt-3 flex justify-end space-x-2">
                    {isFreelancer && milestone.status === 0 && (
                      <button
                        onClick={() => openModal('submit', index)}
                        className="inline-flex items-center px-2.5 py-1.5 text-xs font-medium rounded text-blue-700 bg-blue-100 hover:bg-blue-200"
                      >
                        Submit Work
                      </button>
                    )}
                    
                    {isClient && milestone.status === 1 && (
                      <>
                        <button
                          onClick={() => handleApproveMilestone(index)}
                          disabled={isSubmitting}
                          className="inline-flex items-center px-2.5 py-1.5 text-xs font-medium rounded text-green-700 bg-green-100 hover:bg-green-200"
                        >
                          {isSubmitting ? 'Processing...' : 'Approve'}
                        </button>
                        <button
                          onClick={() => openModal('reject', index)}
                          disabled={isSubmitting}
                          className="inline-flex items-center px-2.5 py-1.5 text-xs font-medium rounded text-red-700 bg-red-100 hover:bg-red-200"
                        >
                          Reject
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
      
      {/* Submit Milestone Modal */}
      {activeModal === 'submit' && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 m-4 max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Submit Milestone</h3>
            <div className="mb-4">
              <label htmlFor="submissionNote" className="block text-sm font-medium text-gray-700 mb-1">
                Submission Note
              </label>
              <textarea
                id="submissionNote"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                value={submissionNote}
                onChange={(e) => setSubmissionNote(e.target.value)}
                required
                rows={4}
                placeholder="Describe the work you've completed for this milestone..."
              />
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={closeModal}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitMilestone}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Milestone'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Reject Milestone Modal */}
      {activeModal === 'reject' && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 m-4 max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Reject Milestone</h3>
            <div className="mb-4">
              <label htmlFor="rejectionReason" className="block text-sm font-medium text-gray-700 mb-1">
                Rejection Reason
              </label>
              <textarea
                id="rejectionReason"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                required
                rows={4}
                placeholder="Explain why you are rejecting this milestone submission..."
              />
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={closeModal}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                onClick={handleRejectMilestone}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Rejecting...' : 'Reject Milestone'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MilestoneList;

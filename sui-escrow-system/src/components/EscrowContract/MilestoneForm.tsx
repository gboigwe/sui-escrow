import React, { useState } from 'react';
import { motion } from 'framer-motion';
import useEscrow from '../../hooks/useEscrow';
import { formatSuiAmount } from '../../utils/contracts';

interface MilestoneFormProps {
  escrowId: string;
  totalAmount: bigint;
  contractEndDate: number; // Added this line
  onMilestoneAdded: () => void;
  onCancel: () => void;
}

const MilestoneForm: React.FC<MilestoneFormProps> = ({ 
  escrowId, 
  totalAmount, 
  contractEndDate, // Added this line
  onMilestoneAdded,
  onCancel
}) => {
  
  const { addMilestone } = useEscrow();
  
  // Form state
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [deadline, setDeadline] = useState('');
  
  // Validation state
  const [errors, setErrors] = useState<{
    description?: string;
    amount?: string;
    deadline?: string;
  }>({});
  
  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [transactionHash, setTransactionHash] = useState<string | null>(null);
  
  // Validate individual field
  const validateField = (field: keyof typeof errors) => {
    let error = '';
    
    switch (field) {
      case 'description':
        if (!description.trim()) {
          error = 'Description is required';
        }
        break;
      
      case 'amount':
        if (!amount) {
          error = 'Amount is required';
        } else if (isNaN(Number(amount)) || Number(amount) <= 0) {
          error = 'Amount must be a valid positive number';
        } else if (BigInt(Math.floor(Number(amount) * 1_000_000_000)) > totalAmount) {
          error = `Amount cannot exceed total contract value (${formatSuiAmount(totalAmount)})`;
        }
        break;
      
      case 'deadline':
        if (!deadline) {
          error = 'Deadline is required';
        } else {
          const deadlineDate = new Date(deadline);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          
          // Check if deadline is in the future
          if (deadlineDate <= today) {
            error = 'Deadline must be in the future';
          }
          
          // NEW: Check if deadline is before contract end date
          const contractEndDateObj = new Date(contractEndDate);
          if (deadlineDate >= contractEndDateObj) {
            error = `Milestone deadline must be before contract end date (${contractEndDateObj.toLocaleDateString()})`;
          }
        }
        break;
    }
    
    if (error) {
      setErrors(prev => ({ ...prev, [field]: error }));
      return false;
    } else {
      setErrors(prev => ({ ...prev, [field]: undefined }));
      return true;
    }
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all fields
    const isDescriptionValid = validateField('description');
    const isAmountValid = validateField('amount');
    const isDeadlineValid = validateField('deadline');
    
    if (!isDescriptionValid || !isAmountValid || !isDeadlineValid) {
      return;
    }
    
    setIsSubmitting(true);
    setTransactionHash(null);
    
    try {
      // Call the addMilestone function from useEscrow hook
      const result = await addMilestone(
        escrowId,
        description,
        amount,
        deadline
      );
      
      if (result.success) {
        // Set the transaction hash
        setTransactionHash(result.txDigest || null);
        
        // Show success message for a moment, then close the form
        setTimeout(() => {
          // Notify parent component
          onMilestoneAdded();
          
          // Reset form
          setDescription('');
          setAmount('');
          setDeadline('');
          setErrors({});
        }, 3000);
      } else {
        console.error('Error adding milestone:', result.error);
        setErrors({
          description: 'Failed to add milestone. Please try again.'
        });
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error('Error adding milestone:', error);
      setErrors({
        description: 'Failed to add milestone. Please try again.'
      });
      setIsSubmitting(false);
    }
  };

  // Calculate max date for deadline input (contract end date minus 1 day)
  const maxDeadlineDate = new Date(contractEndDate - 86400000).toISOString().split('T')[0];

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="bg-white rounded-xl shadow-lg overflow-hidden mb-6 border border-indigo-100"
    >
      <div className="px-6 py-4 bg-indigo-50 border-b border-indigo-100 flex justify-between items-center">
        <h3 className="text-lg font-semibold text-indigo-900">Add New Milestone</h3>
        <button
          onClick={onCancel}
          className="text-gray-500 hover:text-gray-700 transition-colors"
          aria-label="Close"
          disabled={isSubmitting}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
      
      <form onSubmit={handleSubmit} className="p-6">
        {transactionHash ? (
          <div className="mb-6">
            <div className="flex items-center justify-center mb-4">
              <div className="bg-green-100 rounded-full p-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <h4 className="text-center text-lg font-medium text-gray-900 mb-2">Milestone Added Successfully!</h4>
            <p className="text-sm text-gray-600 mb-4 text-center">Your milestone has been added to the contract on the blockchain.</p>
            
            <p className="text-sm text-gray-600 mb-2">Transaction Hash:</p>
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 mb-4">
              <p className="font-mono text-xs text-gray-800 break-all">{transactionHash}</p>
            </div>
            
            <div className="text-center">
              <a 
                href={`https://suiscan.xyz/testnet/tx/${transactionHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-indigo-600 hover:text-indigo-800 inline-block mb-2"
              >
                View on Explorer
              </a>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Contract deadline info */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-600 mt-0.5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <div>
                  <p className="text-sm text-yellow-800">
                    <strong>Important:</strong> Milestone deadline must be before the contract end date: {' '}
                    <strong>{new Date(contractEndDate).toLocaleDateString()}</strong>
                  </p>
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Milestone Description
              </label>
              <textarea
                id="description"
                className={`w-full px-3 py-2 border ${errors.description ? 'border-red-300' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 ${errors.description ? 'focus:ring-red-500 focus:border-red-500' : 'focus:ring-indigo-500 focus:border-indigo-500'}`}
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  if (errors.description) {
                    setErrors({ ...errors, description: undefined });
                  }
                }}
                onBlur={() => validateField('description')}
                rows={3}
                placeholder="Describe what needs to be completed for this milestone..."
                disabled={isSubmitting}
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">{errors.description}</p>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
                  Amount (SUI)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    id="amount"
                    className={`w-full px-3 py-2 pl-9 border ${errors.amount ? 'border-red-300' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 ${errors.amount ? 'focus:ring-red-500 focus:border-red-500' : 'focus:ring-indigo-500 focus:border-indigo-500'}`}
                    value={amount}
                    onChange={(e) => {
                      setAmount(e.target.value);
                      if (errors.amount) {
                        setErrors({ ...errors, amount: undefined });
                      }
                    }}
                    onBlur={() => validateField('amount')}
                    placeholder="0.0"
                    disabled={isSubmitting}
                  />
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <span className="text-gray-500">SUI</span>
                  </div>
                </div>
                {errors.amount ? (
                  <p className="mt-1 text-sm text-red-600">{errors.amount}</p>
                ) : (
                  <p className="mt-1 text-xs text-gray-500">
                    Total contract value: {formatSuiAmount(totalAmount)}
                  </p>
                )}
              </div>
              
              <div>
                <label htmlFor="deadline" className="block text-sm font-medium text-gray-700 mb-1">
                  Deadline
                </label>
                <div className="relative">
                  <input
                    type="date"
                    id="deadline"
                    className={`w-full px-3 py-2 pl-9 border ${errors.deadline ? 'border-red-300' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 ${errors.deadline ? 'focus:ring-red-500 focus:border-red-500' : 'focus:ring-indigo-500 focus:border-indigo-500'}`}
                    value={deadline}
                    onChange={(e) => {
                      setDeadline(e.target.value);
                      if (errors.deadline) {
                        setErrors({ ...errors, deadline: undefined });
                      }
                    }}
                    onBlur={() => validateField('deadline')}
                    min={new Date().toISOString().split('T')[0]}
                    max={maxDeadlineDate}
                    disabled={isSubmitting}
                  />
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
                {errors.deadline && (
                  <p className="mt-1 text-sm text-red-600">{errors.deadline}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  Must be before: {new Date(contractEndDate).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        )}
        
        <div className="mt-6 flex justify-end space-x-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
            disabled={isSubmitting}
          >
            {transactionHash ? 'Close' : 'Cancel'}
          </button>
          {!transactionHash && (
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors flex items-center"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Adding to Blockchain...
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                  Add Milestone
                </>
              )}
            </button>
          )}
        </div>
      </form>
    </motion.div>
  );
};

export default MilestoneForm;

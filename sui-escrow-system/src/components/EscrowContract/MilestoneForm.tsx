import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface MilestoneFormProps {
  escrowId: string;
  totalAmount: number;
  onMilestoneAdded: () => void;
  onCancel: () => void;
}

const MilestoneForm: React.FC<MilestoneFormProps> = ({ 
  escrowId, 
  totalAmount, 
  onMilestoneAdded,
  onCancel
}) => {
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
  
  // Format SUI amount from MIST
  const formatAmount = (amount: number) => {
    return (amount / 1_000_000_000).toFixed(9) + ' SUI';
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    const newErrors: {
      description?: string;
      amount?: string;
      deadline?: string;
    } = {};
    
    if (!description.trim()) {
      newErrors.description = 'Description is required';
    }
    
    if (!amount) {
      newErrors.amount = 'Amount is required';
    } else if (isNaN(Number(amount)) || Number(amount) <= 0) {
      newErrors.amount = 'Amount must be a positive number';
    } else if (Number(amount) * 1_000_000_000 > totalAmount) {
      newErrors.amount = `Amount cannot exceed total contract value (${formatAmount(totalAmount)})`;
    }
    
    if (!deadline) {
      newErrors.deadline = 'Deadline is required';
    } else {
      const deadlineDate = new Date(deadline);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (deadlineDate <= today) {
        newErrors.deadline = 'Deadline must be in the future';
      }
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Here we would call the smart contract to add the milestone
      // For now, let's simulate a delay and success
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Notify parent component
      onMilestoneAdded();
      
      // Reset form
      setDescription('');
      setAmount('');
      setDeadline('');
      setErrors({});
    } catch (error) {
      console.error('Error adding milestone:', error);
      // In a real app, we'd handle the error more elegantly
    } finally {
      setIsSubmitting(false);
    }
  };

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
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
      
      <form onSubmit={handleSubmit} className="p-6">
        <div className="space-y-6">
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
              rows={3}
              placeholder="Describe what needs to be completed for this milestone..."
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
                  placeholder="0.0"
                />
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <span className="text-gray-500">SUI</span>
                </div>
              </div>
              {errors.amount ? (
                <p className="mt-1 text-sm text-red-600">{errors.amount}</p>
              ) : (
                <p className="mt-1 text-xs text-gray-500">
                  Total contract value: {formatAmount(totalAmount)}
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
                  min={new Date().toISOString().split('T')[0]}
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
            </div>
          </div>
        </div>
        
        <div className="mt-6 flex justify-end space-x-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
            disabled={isSubmitting}
          >
            Cancel
          </button>
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
                Adding...
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
        </div>
      </form>
    </motion.div>
  );
};

export default MilestoneForm;

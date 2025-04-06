import React, { useState } from 'react';
import { useEscrow } from '../../hooks/useEscrow';

interface MilestoneFormProps {
  escrowId: string;
  totalAmount: number;
  onMilestoneAdded: () => void;
}

const MilestoneForm: React.FC<MilestoneFormProps> = ({ escrowId, totalAmount, onMilestoneAdded }) => {
  const { addMilestone, error } = useEscrow();
  
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [deadline, setDeadline] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setIsSubmitting(true);
    
    try {
      // Convert amount to MIST (1 SUI = 10^9 MIST)
      const amountInMist = Math.floor(parseFloat(amount) * 1_000_000_000);
      
      // Convert deadline to epoch milliseconds
      const deadlineInMs = new Date(deadline).getTime();
      
      const success = await addMilestone(
        escrowId,
        description,
        amountInMist,
        deadlineInMs
      );
      
      if (success) {
        // Reset form
        setDescription('');
        setAmount('');
        setDeadline('');
        
        // Notify parent component
        onMilestoneAdded();
      }
    } catch (err) {
      console.error('Error adding milestone:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white p-5 rounded-lg shadow-md mb-6">
      <h3 className="text-lg font-semibold mb-4">Add New Milestone</h3>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Milestone Description
          </label>
          <textarea
            id="description"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            rows={2}
            placeholder="Describe what needs to be completed for this milestone..."
          />
        </div>
        
        <div className="mb-4">
          <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
            Amount (SUI)
          </label>
          <input
            type="number"
            id="amount"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
            min="0.000000001"
            step="0.000000001"
            placeholder="0.0"
          />
          <p className="mt-1 text-sm text-gray-500">
            Total contract amount: {(totalAmount / 1_000_000_000).toFixed(9)} SUI
          </p>
        </div>
        
        <div className="mb-4">
          <label htmlFor="deadline" className="block text-sm font-medium text-gray-700 mb-1">
            Deadline
          </label>
          <input
            type="date"
            id="deadline"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            required
            min={new Date().toISOString().split('T')[0]}
          />
        </div>
        
        <div className="flex justify-end">
          <button
            type="submit"
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Adding...' : 'Add Milestone'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default MilestoneForm;

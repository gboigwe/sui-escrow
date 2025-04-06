import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEscrow } from '../../hooks/useEscrow';
import { useWallet } from '../../context/WalletContext';

const ContractCreationForm: React.FC = () => {
  const { isConnected, connect } = useWallet();
  const { createEscrow, error } = useEscrow();
  const navigate = useNavigate();

  const [freelancerAddress, setFreelancerAddress] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isConnected) {
      connect();
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Convert amount to MIST (1 SUI = 10^9 MIST)
      const amountInMist = Math.floor(parseFloat(amount) * 1_000_000_000);
      
      // Convert end date to epoch milliseconds
      const endDateInMs = new Date(endDate).getTime();
      
      const escrowId = await createEscrow(
        freelancerAddress,
        description,
        endDateInMs,
        amountInMist
      );
      
      if (escrowId) {
        // Redirect to the contract details page
        navigate(`/contract/${escrowId}`);
      }
    } catch (err) {
      console.error('Error creating contract:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6">Create New Escrow Contract</h2>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="freelancerAddress" className="block text-sm font-medium text-gray-700 mb-1">
            Freelancer Address
          </label>
          <input
            type="text"
            id="freelancerAddress"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            value={freelancerAddress}
            onChange={(e) => setFreelancerAddress(e.target.value)}
            required
            placeholder="0x..."
          />
        </div>
        
        <div className="mb-4">
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Project Description
          </label>
          <textarea
            id="description"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            rows={4}
            placeholder="Describe the project and expectations..."
          />
        </div>
        
        <div className="mb-4">
          <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
            Total Amount (SUI)
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
        </div>
        
        <div className="mb-6">
          <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
            Project Deadline
          </label>
          <input
            type="date"
            id="endDate"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            required
            min={new Date().toISOString().split('T')[0]}
          />
        </div>
        
        <div className="flex justify-end">
          <button
            type="button"
            className="mr-3 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            onClick={() => navigate('/')}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            disabled={isSubmitting || !isConnected}
          >
            {isSubmitting ? 'Creating...' : isConnected ? 'Create Contract' : 'Connect Wallet'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ContractCreationForm;

import React, { useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useWallet } from '../../context/WalletContext';
import { useEscrow, EscrowContract } from '../../hooks/useEscrow';

const FreelancerDashboard: React.FC = () => {
  const { address, isConnected, connect } = useWallet();
  const { ownedContracts, loading, error, fetchContracts } = useEscrow();

  // Filter contracts where current user is the freelancer
  const freelancerContracts = ownedContracts.filter(
    (contract) => contract.freelancer === address
  );

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

  // Format date from timestamp - Keeping this but commenting to avoid ESLint warning
  /* const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString();
  }; */

  // Format SUI amount
  const formatAmount = (amount: number) => {
    return (amount / 1_000_000_000).toFixed(9) + ' SUI';
  };

  // Get next actionable milestone
  const getNextMilestone = (contract: EscrowContract) => {
    if (contract.status !== 0) return null;
    
    // Find first pending milestone
    const pendingMilestone = contract.milestones.find(m => m.status === 0);
    if (pendingMilestone) {
      return {
        type: 'pending',
        milestone: pendingMilestone
      };
    }
    
    // Find first submitted milestone
    const submittedMilestone = contract.milestones.find(m => m.status === 1);
    if (submittedMilestone) {
      return {
        type: 'submitted',
        milestone: submittedMilestone
      };
    }
    
    return null;
  };

  // Get milestone status counts - Keeping this but commenting to avoid ESLint warning
  /* const getMilestoneStatus = (contract: EscrowContract) => {
    const total = contract.milestones.length;
    if (total === 0) return 'No milestones';
    
    const approved = contract.milestones.filter(m => m.status === 2).length;
    const pending = contract.milestones.filter(m => m.status === 0).length;
    const submitted = contract.milestones.filter(m => m.status === 1).length;
    
    return `${approved}/${total} completed`;
  }; */

  // Calculate earned amount
  const getEarnedAmount = (contract: EscrowContract) => {
    const earnedAmount = contract.milestones
      .filter(m => m.status === 2)
      .reduce((total, milestone) => total + milestone.amount, 0);
    
    return formatAmount(earnedAmount);
  };

  // Memoize fetchContracts to avoid dependency array issues
  const memoizedFetchContracts = useCallback(() => {
    fetchContracts();
  }, [fetchContracts]);

  useEffect(() => {
    if (isConnected) {
      memoizedFetchContracts();
    }
  }, [isConnected, memoizedFetchContracts]);

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <p className="text-gray-600 mb-4">Connect your wallet to view your contracts</p>
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
    return <div className="text-center p-8">Loading your contracts...</div>;
  }

  if (error) {
    return (
      <div className="bg-red-100 text-red-700 p-4 rounded-md">
        <p>{error}</p>
        <button
          onClick={memoizedFetchContracts}
          className="mt-4 px-4 py-2 text-sm font-medium text-indigo-700 bg-indigo-100 rounded-md hover:bg-indigo-200 focus:outline-none"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900">My Freelance Contracts</h2>
      </div>

      {freelancerContracts.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <p className="text-gray-500">You don't have any freelance contracts yet.</p>
          <p className="mt-2 text-sm text-gray-500">
            When a client creates a contract with your address, it will appear here.
          </p>
        </div>
      ) : (
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Project
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Client
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Earned
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Next Action
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {freelancerContracts.map((contract) => {
                const nextMilestone = getNextMilestone(contract);
                
                return (
                  <tr key={contract.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <Link to={`/contract/${contract.id}`} className="text-indigo-600 hover:text-indigo-900">
                        {contract.description.length > 30
                          ? `${contract.description.substring(0, 30)}...`
                          : contract.description}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {contract.client.substring(0, 6)}...{contract.client.substring(contract.client.length - 4)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{formatAmount(contract.totalAmount)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{getEarnedAmount(contract)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(contract.status)}`}>
                        {getStatusText(contract.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {contract.status === 0 && nextMilestone ? (
                        nextMilestone.type === 'pending' ? (
                          <span className="text-sm text-orange-600">Submit work</span>
                        ) : (
                          <span className="text-sm text-blue-600">Waiting for approval</span>
                        )
                      ) : (
                        <span className="text-sm text-gray-500">
                          {contract.status === 1 ? 'Completed' : 
                           contract.status === 2 ? 'Dispute in progress' : 
                           contract.status === 3 ? 'Cancelled' : 'No action needed'}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default FreelancerDashboard;

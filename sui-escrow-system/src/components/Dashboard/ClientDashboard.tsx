import React, { useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useWallet } from '../../context/WalletContext';
import { useEscrow, EscrowContract } from '../../hooks/useEscrow';

const ClientDashboard: React.FC = () => {
  const { address, isConnected, connect } = useWallet();
  const { ownedContracts, loading, error, fetchContracts } = useEscrow();

  // Filter contracts where current user is the client
  const clientContracts = ownedContracts.filter(
    (contract) => contract.client === address
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

  // Format date from timestamp
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString();
  };

  // Format SUI amount
  const formatAmount = (amount: number) => {
    return (amount / 1_000_000_000).toFixed(9) + ' SUI';
  };

  // Get milestone status counts
  const getMilestoneStatus = (contract: EscrowContract) => {
    const total = contract.milestones.length;
    if (total === 0) return 'No milestones';
    
    const approved = contract.milestones.filter(m => m.status === 2).length;
    // The following variables are declared but not used in the function
    // Keeping them commented to avoid ESLint warnings
    // const pending = contract.milestones.filter(m => m.status === 0).length;
    // const submitted = contract.milestones.filter(m => m.status === 1).length;
    // const rejected = contract.milestones.filter(m => m.status === 3).length;
    
    return `${approved}/${total} completed`;
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
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900">My Client Contracts</h2>
        <Link
          to="/create-contract"
          className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none"
        >
          Create New Contract
        </Link>
      </div>

      {clientContracts.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <p className="text-gray-500">You haven't created any contracts yet.</p>
          <Link
            to="/create-contract"
            className="mt-4 inline-block px-4 py-2 text-sm font-medium text-indigo-700 bg-indigo-100 rounded-md hover:bg-indigo-200 focus:outline-none"
          >
            Create Your First Contract
          </Link>
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
                  Freelancer
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Milestones
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Due Date
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {clientContracts.map((contract) => (
                <tr key={contract.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Link to={`/contract/${contract.id}`} className="text-indigo-600 hover:text-indigo-900">
                      {contract.description.length > 30
                        ? `${contract.description.substring(0, 30)}...`
                        : contract.description}
                    </Link>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {contract.freelancer.substring(0, 6)}...{contract.freelancer.substring(contract.freelancer.length - 4)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{formatAmount(contract.totalAmount)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(contract.status)}`}>
                      {getStatusText(contract.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{getMilestoneStatus(contract)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{formatDate(contract.endDate)}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ClientDashboard;

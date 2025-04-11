import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useWallet } from '../../context/WalletContext';
import { motion } from 'framer-motion';
import CustomConnectButton from '../common/CustomConnectButton';

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

const ClientDashboard: React.FC = () => {
  const { address, isConnected } = useWallet();
  const [contracts, setContracts] = useState<EscrowContract[]>([]);
  const [loading, setLoading] = useState(true);

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
    
    return `${approved}/${total} completed`;
  };
  
  // Fetch contracts
  useEffect(() => {
    if (isConnected) {
      // Simulate network delay
      const timer = setTimeout(() => {
        // Filter for contracts where current user is the client
        const clientContracts = MOCK_CONTRACTS.filter(
          (contract) => contract.client === address || contract.client === "0x1234567890abcdef1234567890abcdef12345678"
        );
        setContracts(clientContracts);
        setLoading(false);
      }, 800);
      
      return () => clearTimeout(timer);
    }
  }, [isConnected, address]);

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center h-64 bg-white shadow-md rounded-lg p-8 text-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-indigo-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        <p className="text-gray-600 mb-6 text-lg">Connect your wallet to access your client dashboard</p>
        <CustomConnectButton
          variant="primary"
          size="lg"
          label="Connect Wallet"
          className="shadow-md transition-colors"
        />
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="space-y-8"
    >
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">My Client Contracts</h2>
          <p className="text-gray-600 mt-1">Track and manage contracts where you are the client</p>
        </div>
        <Link
          to="/create-contract"
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="-ml-1 mr-2 h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          Create New Contract
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <svg className="animate-spin h-8 w-8 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      ) : contracts.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Your Contracts</h3>
              <span className="bg-gray-100 text-gray-800 text-xs font-medium px-3 py-1 rounded-full">
                0 Total
              </span>
            </div>
          </div>
          
          <div className="p-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-full mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-gray-600 text-lg mb-2">You haven't created any contracts yet.</p>
            <p className="text-gray-500 mb-6">Start by creating your first contract with a freelancer.</p>
            <Link
              to="/create-contract"
              className="px-6 py-3 text-base font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 shadow-md transition-colors"
            >
              Create Your First Contract
            </Link>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Your Contracts</h3>
              <span className="bg-indigo-100 text-indigo-800 text-xs font-medium px-3 py-1 rounded-full">
                {contracts.length} Total
              </span>
            </div>
          </div>
          
          <div className="overflow-x-auto">
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
                {contracts.map((contract) => (
                  <tr key={contract.id} className="hover:bg-gray-50 cursor-pointer transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap" onClick={() => window.location.href = `/contract/${contract.id}`}>
                      <div className="text-sm font-medium text-indigo-600 hover:text-indigo-900">
                        <Link to={`/contract/${contract.id}`}>
                          {contract.description.length > 30
                            ? `${contract.description.substring(0, 30)}...`
                            : contract.description}
                        </Link>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Created {new Date(contract.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 font-mono">
                        {contract.freelancer.substring(0, 6)}...{contract.freelancer.substring(contract.freelancer.length - 4)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{formatAmount(contract.totalAmount)}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {formatAmount(contract.remainingBalance)} remaining
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(contract.status)}`}>
                        {getStatusText(contract.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{getMilestoneStatus(contract)}</div>
                      {contract.milestones.length > 0 && (
                        <div className="w-24 bg-gray-200 rounded-full h-1.5 mt-1.5">
                          <div 
                            className="bg-indigo-600 h-1.5 rounded-full" 
                            style={{ 
                              width: `${(contract.milestones.filter(m => m.status === 2).length / contract.milestones.length) * 100}%` 
                            }}
                          ></div>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{formatDate(contract.endDate)}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {Math.ceil((contract.endDate - Date.now()) / (1000 * 60 * 60 * 24))} days left
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900">Your Client Address</h3>
          </div>
          <div className="bg-gray-50 p-4 rounded-md">
            <p className="text-sm text-gray-500 mb-1">Your wallet address:</p>
            <div className="flex items-center justify-between">
              <code className="text-indigo-700 font-mono bg-indigo-50 px-2 py-1 rounded text-sm overflow-x-auto max-w-xs">
                {address}
              </code>
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(address || '');
                }}
                className="ml-2 p-1 text-gray-500 hover:text-indigo-600 transition-colors"
                title="Copy to clipboard"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900">How It Works</h3>
          </div>
          <ol className="space-y-2 text-gray-600">
            <li className="flex">
              <span className="bg-indigo-100 text-indigo-800 font-medium rounded-full w-5 h-5 flex items-center justify-center text-xs mr-2 mt-0.5">1</span>
              <span>Create an escrow contract and define milestones</span>
            </li>
            <li className="flex">
              <span className="bg-indigo-100 text-indigo-800 font-medium rounded-full w-5 h-5 flex items-center justify-center text-xs mr-2 mt-0.5">2</span>
              <span>Funds are locked in the contract until work is approved</span>
            </li>
            <li className="flex">
              <span className="bg-indigo-100 text-indigo-800 font-medium rounded-full w-5 h-5 flex items-center justify-center text-xs mr-2 mt-0.5">3</span>
              <span>Review and approve completed work to release payments</span>
            </li>
          </ol>
        </div>
      </div>

      <div className="bg-gradient-to-r from-indigo-50 to-indigo-100 rounded-lg shadow-md p-6">
        <div className="flex flex-col md:flex-row items-center">
          <div className="md:w-2/3 mb-6 md:mb-0 md:pr-8">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Ready to hire a freelancer?</h3>
            <p className="text-gray-600 mb-4">
              Create a new contract with clearly defined milestones and secure payment terms.
              Our smart contract system ensures your funds are only released when work meets your requirements.
            </p>
            <Link
              to="/create-contract"
              className="inline-flex items-center text-indigo-600 font-medium hover:text-indigo-800 transition-colors"
            >
              <span>Create a new contract</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </Link>
          </div>
          <div className="md:w-1/3 flex justify-center">
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ClientDashboard;

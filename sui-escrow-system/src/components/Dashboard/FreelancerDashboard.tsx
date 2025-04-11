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
    id: "contract-3",
    client: "0xfedcba9876543210fedcba9876543210fedcba98",
    freelancer: "0xabcdef1234567890abcdef1234567890abcdef12", 
    totalAmount: 7000000000, // 7 SUI
    remainingBalance: 7000000000,
    status: 0, // Active
    milestones: [
      {
        description: "Logo Design",
        amount: 1500000000,
        status: 0, // Pending
        deadline: Date.now() + 86400000 * 5, // 5 days from now
        submissionNote: "",
        rejectionReason: "",
      },
      {
        description: "Brand Guidelines",
        amount: 2500000000,
        status: 0, // Pending
        deadline: Date.now() + 86400000 * 10, // 10 days from now
        submissionNote: "",
        rejectionReason: "",
      },
      {
        description: "Marketing Materials",
        amount: 3000000000,
        status: 0, // Pending
        deadline: Date.now() + 86400000 * 15, // 15 days from now
        submissionNote: "",
        rejectionReason: "",
      }
    ],
    createdAt: Date.now() - 86400000 * 1, // 1 day ago
    endDate: Date.now() + 86400000 * 20, // 20 days from now
    description: "Branding package for tech startup",
  }
];

const FreelancerDashboard: React.FC = () => {
  const { address, isConnected, connect } = useWallet();
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

  // Get earned amount
  const getEarnedAmount = (contract: EscrowContract) => {
    const earnedAmount = contract.milestones
      .filter(m => m.status === 2)
      .reduce((total, milestone) => total + milestone.amount, 0);
    
    return formatAmount(earnedAmount);
  };

  // Get next milestone status
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
  
  // Fetch contracts
  useEffect(() => {
    if (isConnected) {
      // Simulate network delay
      const timer = setTimeout(() => {
        // Filter for contracts where current user is the freelancer
        const freelancerContracts = MOCK_CONTRACTS.filter(
          (contract) => contract.freelancer === address || contract.freelancer === "0xabcdef1234567890abcdef1234567890abcdef12"
        );
        setContracts(freelancerContracts);
        setLoading(false);
      }, 800);
      
      return () => clearTimeout(timer);
    }
  }, [isConnected, address]);

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center h-64 bg-white shadow-md rounded-lg p-8 text-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-purple-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        <p className="text-gray-600 mb-6 text-lg">Connect your wallet to access your freelancer dashboard</p>
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
      <div>
        <h2 className="text-2xl font-bold text-gray-900">My Freelance Contracts</h2>
        <p className="text-gray-600 mt-1">Track and manage contracts where you are the freelancer</p>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <svg className="animate-spin h-8 w-8 text-purple-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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
            <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-gray-600 text-lg mb-2">You don't have any freelance contracts yet.</p>
            <p className="text-gray-500">When a client creates a contract with your address, it will appear here.</p>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Your Contracts</h3>
              <span className="bg-purple-100 text-purple-800 text-xs font-medium px-3 py-1 rounded-full">
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
                {contracts.map((contract) => {
                  const nextMilestone = getNextMilestone(contract);
                  
                  return (
                    <tr key={contract.id} className="hover:bg-gray-50 cursor-pointer transition-colors">
                      <td className="px-6 py-4" onClick={() => window.location.href = `/contract/${contract.id}`}>
                        <div className="text-sm font-medium text-purple-600 hover:text-purple-900">
                          <Link to={`/contract/${contract.id}`}>
                            {contract.description.length > 30
                              ? `${contract.description.substring(0, 30)}...`
                              : contract.description}
                          </Link>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {contract.milestones.length} milestone{contract.milestones.length !== 1? 's' : ''}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 font-mono">
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
                            <span className="text-sm text-orange-600 font-medium">Submit work</span>
                          ) : (
                            <span className="text-sm text-blue-600 font-medium">Waiting for approval</span>
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
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900">Your Freelance Address</h3>
          </div>
          <div className="bg-gray-50 p-4 rounded-md">
            <p className="text-sm text-gray-500 mb-1">Share this address with clients to receive contracts:</p>
            <div className="flex items-center justify-between">
              <code className="text-purple-700 font-mono bg-purple-50 px-2 py-1 rounded text-sm overflow-x-auto max-w-xs">
                {address}
              </code>
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(address || '');
                }}
                className="ml-2 p-1 text-gray-500 hover:text-purple-600 transition-colors"
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
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900">How It Works</h3>
          </div>
          <ol className="space-y-2 text-gray-600">
            <li className="flex">
              <span className="bg-purple-100 text-purple-800 font-medium rounded-full w-5 h-5 flex items-center justify-center text-xs mr-2 mt-0.5">1</span>
              <span>Clients create escrow contracts with defined milestones</span>
            </li>
            <li className="flex">
              <span className="bg-purple-100 text-purple-800 font-medium rounded-full w-5 h-5 flex items-center justify-center text-xs mr-2 mt-0.5">2</span>
              <span>Complete work for each milestone and submit for approval</span>
            </li>
            <li className="flex">
              <span className="bg-purple-100 text-purple-800 font-medium rounded-full w-5 h-5 flex items-center justify-center text-xs mr-2 mt-0.5">3</span>
              <span>Receive automatic payments when the client approves your work</span>
            </li>
          </ol>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="flex flex-col md:flex-row">
          <div className="md:w-2/3 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Getting started as a freelancer</h3>
            <p className="text-gray-600 mb-4">
              Follow these steps to start receiving payments through SuiEscrow:
            </p>
            <ol className="space-y-3 text-gray-600 ml-5 list-decimal">
              <li>Share your address with potential clients</li>
              <li>Once a client creates a contract with your address, you'll see it on your dashboard</li>
              <li>Review the contract terms, milestones, and deadlines</li>
              <li>Complete and submit each milestone for client approval</li>
              <li>Receive automatic payments as milestones are approved</li>
            </ol>
            <div className="mt-6 flex items-center text-sm text-purple-600">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <span>No platform fees or hidden charges - you receive 100% of your earnings</span>
            </div>
          </div>
          <div className="md:w-1/3 bg-gradient-to-br from-purple-500 to-indigo-600 p-6 flex items-center justify-center">
            <div className="text-center">
              <div className="h-16 w-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h4 className="text-lg font-medium text-white mb-2">Secure Payments</h4>
              <p className="text-indigo-100">
                Funds are locked in smart contracts and automatically released when milestones are approved.
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default FreelancerDashboard;

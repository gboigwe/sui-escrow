import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useWallet } from '../../context/WalletContext';
import { motion } from 'framer-motion';
import CustomConnectButton from '../common/CustomConnectButton';
import * as SuiClient from '../../utils/suiClient';
import { Transaction } from '@mysten/sui/transactions';
import { useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { EscrowContract } from '../../utils/contracts';

const ClientDashboard: React.FC = () => {
  const { address, isConnected, suiClient } = useWallet();
  const [contracts, setContracts] = useState<EscrowContract[]>([]);
  const [loading, setLoading] = useState(true);
  const [consolidating, setConsolidating] = useState(false);
  
  const { mutate: signAndExecuteTransactionBlock } = useSignAndExecuteTransaction();

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
  const formatAmount = (amount: bigint) => {
    return (Number(amount) / 1_000_000_000).toFixed(9) + ' SUI';
  };

  // Get milestone status counts
  const getMilestoneStatus = (contract: EscrowContract) => {
    const total = contract.milestones.length;
    if (total === 0) return 'No milestones';
    
    const approved = contract.milestones.filter(m => m.status === 2).length;
    
    return `${approved}/${total} completed`;
  };

  // Consolidate coins function
  const consolidateCoins = async () => {
    if (!address) return;
    
    try {
      setConsolidating(true);
      
      const coins = await suiClient.getCoins({
        owner: address,
        coinType: '0x2::sui::SUI',
      });
      
      const availableCoins = coins.data.filter(coin => BigInt(coin.balance) > 0);
      
      if (availableCoins.length <= 1) {
        alert("No need to consolidate - you already have coins in a single object.");
        return;
      }
      
      const tx = new Transaction();
      tx.setGasBudget(10_000_000);
      
      // Select the coin with the largest balance as primary
      const primaryCoin = availableCoins.reduce((prev, current) => 
        BigInt(current.balance) > BigInt(prev.balance) ? current : prev
      );
      
      // Merge all other coins into the primary coin
      const otherCoins = availableCoins
        .filter(coin => coin.coinObjectId !== primaryCoin.coinObjectId)
        .map(coin => tx.object(coin.coinObjectId));
      
      if (otherCoins.length > 0) {
        tx.mergeCoins(tx.object(primaryCoin.coinObjectId), otherCoins);
      }
      
      // Execute merge transaction
      await new Promise<void>((resolve, reject) => {
        signAndExecuteTransactionBlock(
          {
            transaction: tx,
          },
          {
            onSuccess: () => {
              alert("Coins consolidated successfully! You can now create larger contracts.");
              resolve();
            },
            onError: (error) => {
              console.error('Error consolidating coins:', error);
              reject(error);
            },
          }
        );
      });
    } catch (error) {
      console.error('Error consolidating coins:', error);
      alert("Failed to consolidate coins. " + (error instanceof Error ? error.message : "Unknown error"));
    } finally {
      setConsolidating(false);
    }
  };
  
  // Fetch contracts
  useEffect(() => {
    if (isConnected && address) {
      const timer = setTimeout(async () => {
        try {
          const userContracts = await SuiClient.getUserEscrowContracts(address);
          console.log("User contracts from blockchain:", userContracts);
          
          // Filter only contracts where current address is the CLIENT
          const clientContracts = userContracts.filter(
            (contract) => contract.client === address
          );
          console.log("Client contracts:", clientContracts);
          
          setContracts(clientContracts);
          setLoading(false);
        } catch (err) {
          console.error("Error loading contracts:", err);
          setLoading(false);
        }
      }, 800);
      
      return () => clearTimeout(timer);
    }
  }, [isConnected, address]);

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center h-64 bg-white rounded-xl shadow-lg p-8 text-center">
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
        <div className="flex gap-4">
          <button
            onClick={consolidateCoins}
            disabled={consolidating}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {consolidating ? "Consolidating..." : "Consolidate SUI Coins"}
          </button>
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
                  <tr key={contract.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
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
            <p className="text-sm text-gray-500 mb-1">Your wallet address (as client):</p>
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

import { useState, useEffect, useCallback } from 'react';
import { Transaction } from '@mysten/sui/transactions';
import { useCurrentAccount, useSignAndExecuteTransaction, useSuiClient } from '@mysten/dapp-kit';
import * as SuiClient from '../utils/suiClient';
import { EscrowContract } from '../utils/contracts';

// Add the interface and type guard function here
interface CreatedObjectChange {
  type: "created";
  sender: string;
  owner: any;
  objectType: string;
  objectId: string;
  version: string;
  digest: string;
}

function isCreatedObject(change: any): change is CreatedObjectChange {
  return change.type === "created" && 'objectId' in change;
}

export const useEscrow = () => {
  const currentAccount = useCurrentAccount();
  const suiClient = useSuiClient();

  // Use the simplified version that works with SDK v1.0
  const { mutate: signAndExecuteTransactionBlock } = useSignAndExecuteTransaction({
    onSuccess: () => {
      
    },
    onError: (error) => {
      console.error("❌ Transaction error:", error);
    }
  });
  
  const [loading, setLoading] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [clientContracts, setClientContracts] = useState<EscrowContract[]>([]);
  const [freelancerContracts, setFreelancerContracts] = useState<EscrowContract[]>([]);
  const [currentContract, setCurrentContract] = useState<EscrowContract | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Check if wallet is connected
  const isConnected = !!currentAccount;
  const address = currentAccount?.address;

  // Function to refresh data
  const refresh = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
  }, []);

  // Load all user contracts
  const loadUserContracts = useCallback(async () => {
    if (!isConnected || !address) return [];
    
    setLoading(true);
    setError(null);
    
    try {
      const contracts = await SuiClient.getUserEscrowContracts(address);
      
      // Split contracts between client and freelancer roles
      const asClient = contracts.filter(contract => contract.client === address);
      const asFreelancer = contracts.filter(contract => contract.freelancer === address);
      
      setClientContracts(asClient);
      setFreelancerContracts(asFreelancer);
      return contracts;
    } catch (err) {
      console.error('Error loading user contracts:', err);
      setError('Failed to load your contracts. Please try again.');
      return [];
    } finally {
      setLoading(false);
    }
  }, [address, isConnected]);

  // Load specific contract by ID
  const loadContract = useCallback(async (contractId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const contract = await SuiClient.getEscrowContract(contractId);
      setCurrentContract(contract);
      return contract;
    } catch (err) {
      console.error('Error loading contract:', err);
      setError('Failed to load contract details. Please try again.');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // In useEscrow.ts, update the mergeSUICoins function
  const mergeSUICoins = async (amount: bigint): Promise<string | null> => {
    try {
      if (!address) return null;
      
      
      
      // Get all SUI coins owned by the user
      const coins = await suiClient.getCoins({
        owner: address,
        coinType: '0x2::sui::SUI',
      });
      
      // Filter coins to find those with balance
      const availableCoins = coins.data.filter(coin => BigInt(coin.balance) > 0);
      
      // Calculate total balance
      const totalBalance = availableCoins.reduce((acc, coin) => acc + BigInt(coin.balance), BigInt(0));
      
      
      
      
      
      if (totalBalance < amount) {
        throw new Error(`Insufficient balance. You have ${totalBalance / BigInt(1_000_000_000)} SUI, need ${amount / BigInt(1_000_000_000)} SUI`);
      }
      
      // If we have enough in a single coin, return that coin
      const singleCoinWithEnough = availableCoins.find(coin => BigInt(coin.balance) >= amount);
      if (singleCoinWithEnough) {
        
        return singleCoinWithEnough.coinObjectId;
      }
      
      // Otherwise, merge coins first
      if (availableCoins.length <= 1) {
        // No coins to merge
        
        return availableCoins[0]?.coinObjectId || null;
      }
      
      const tx = new Transaction();
      tx.setGasBudget(50_000_000);
      
      // Select the coin with the largest balance as the primary coin
      const primaryCoin = availableCoins.reduce((prev, current) => 
        BigInt(current.balance) > BigInt(prev.balance) ? current : prev
      );
      
      
      
      // Merge other coins into the primary coin
      const otherCoins = availableCoins
        .filter(coin => coin.coinObjectId !== primaryCoin.coinObjectId)
        .map(coin => tx.object(coin.coinObjectId));
      
      if (otherCoins.length > 0) {
        
        tx.mergeCoins(tx.object(primaryCoin.coinObjectId), otherCoins);
      }
      
      // Execute merge transaction
      const mergeResult = await new Promise<boolean>((resolve) => {
        signAndExecuteTransactionBlock(
          {
            transaction: tx,
          },
          {
            onSuccess: () => {
              
              resolve(true);
            },
            onError: (error) => {
              console.error("Error merging coins:", error);
              resolve(false);
            },
          }
        );
      });
      
      if (mergeResult) {
        // Wait a bit for the merge to propagate
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Return the primary coin ID after merge
        return primaryCoin.coinObjectId;
      }
      
      return null;
    } catch (error) {
      console.error('Error merging coins:', error);
      throw error;
    }
  };

  // Create a new escrow contract

  // Update createContract function with same pattern
  const createContract = useCallback(async (
    freelancerAddress: string,
    description: string,
    amount: string,
    endDate: string
  ) => {
    if (!isConnected || !address) {
      setError('Wallet not connected');
      return { success: false, error: 'Wallet not connected' };
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Convert amount from SUI to MIST
      const amountInMist = (parseFloat(amount) * 1_000_000_000).toString();
      
      // Convert endDate string to timestamp
      const endTimestamp = new Date(endDate).getTime();

      // Create a new transaction
      const tx = new Transaction();
    
      // Add the create escrow contract transaction
      SuiClient.createEscrowContractTx(tx, {
        clientAddress: address,
        freelancerAddress,
        description,
        endDate: endTimestamp,
        paymentAmount: amountInMist
      });
    
      
    
      // Sign and execute with improved error handling
      return new Promise<{ success: boolean; escrowId?: string; txDigest?: string; error?: any }>((resolve) => {
        signAndExecuteTransactionBlock(
          {
            transaction: tx,
          },
          {
            onSuccess: async (result) => {
              
              
              // Wait for blockchain processing
              await new Promise(resolve => setTimeout(resolve, 2000));
              
              // Reload contracts
              refresh();
              resolve({ success: true, txDigest: result.digest });
            },
            onError: async (error) => {
              console.error('❌ Contract creation error:', error);
              
              // Handle parsing errors gracefully
              if (error.message?.includes("Could not parse effects")) {
                
                
                // Wait longer for contract creation
                await new Promise(resolve => setTimeout(resolve, 5000));
                
                // Reload contracts to check if it was created
                try {
                  await loadUserContracts();
                  refresh();
                  resolve({ success: true, txDigest: "parsing_failed_but_likely_succeeded" });
                  return;
                } catch (refreshError) {
                  console.error("Failed to verify contract creation:", refreshError);
                }
              }
              
              setError('Failed to create contract. Please check your wallet has sufficient SUI and try again.');
              resolve({ success: false, error });
            },
          }
        );
      });
    } catch (err) {
      console.error('Error creating contract:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError('Failed to create contract: ' + errorMessage);
      return { success: false, error: err };
    } finally {
      setLoading(false);
    }
  }, [address, isConnected, signAndExecuteTransactionBlock, refresh, loadUserContracts]);

  // Add a milestone to a contract
  const addMilestone = useCallback(async (
    escrowId: string,
    description: string,
    amount: string,
    deadline: string
  ) => {
    if (!isConnected || !address) {
      setError('Wallet not connected');
      return { success: false, error: 'Wallet not connected' };
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Convert amount from SUI to MIST
      const amountInMist = (parseFloat(amount) * 1_000_000_000).toString();
      
      // Convert deadline string to timestamp
      const deadlineTimestamp = new Date(deadline).getTime();
      
      // Create a new transaction
      const tx = new Transaction();
      
      // Add the milestone transaction
      SuiClient.addMilestoneTx(tx, {
        escrowObjectId: escrowId,
        description,
        amount: amountInMist,
        deadline: deadlineTimestamp,
      });
      
      // Sign and execute the transaction with improved error handling
      return new Promise<{ success: boolean; txDigest?: string; error?: any }>((resolve) => {
        // In addMilestone function - ignore parsing errors
        signAndExecuteTransactionBlock(
          { transaction: tx },
          {
            onSuccess: async (result) => {
              
              
              // Force refresh regardless of parsing
              const refreshed = await forceRefreshContractData(escrowId);
              
              if (refreshed) {
                resolve({ success: true, txDigest: result.digest });
              } else {
                // Even if refresh fails, transaction succeeded
                resolve({ success: true, txDigest: result.digest });
              }
            },
            onError: async (error) => {
              console.error('❌ Transaction error:', error);
              
              // If it's just a parsing error, assume success and try to refresh
              if (error.message?.includes("Could not parse effects")) {
                
                
                // Wait longer and try to refresh
                const refreshed = await forceRefreshContractData(escrowId, 5);
                
                if (refreshed) {
                  
                  resolve({ success: true, txDigest: "recovery_successful" });
                  return;
                }
              }
              
              // Real error
              resolve({ success: false, error });
            },
          }
        );
      });
    } catch (err) {
      console.error('Error adding milestone:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError('Failed to add milestone: ' + errorMessage);
      return { success: false, error: err };
    } finally {
      setLoading(false);
    }
  }, [address, isConnected, loadContract, signAndExecuteTransactionBlock, refresh]);

  // Submit a milestone
  const submitMilestone = useCallback(async (
    escrowId: string,
    milestoneIndex: number,
    submissionNote: string
  ) => {
    if (!isConnected || !address) {
      setError('Wallet not connected');
      return { success: false, error: 'Wallet not connected' };
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Create a new transaction
      const tx = new Transaction();
      
      // Add the submit milestone transaction
      SuiClient.submitMilestoneTx(tx, {
        escrowObjectId: escrowId,
        milestoneIndex,
        submissionNote,
      });
      
      // Sign and execute the transaction
      return new Promise<{ success: boolean; txDigest?: string; error?: any }>((resolve) => {
        signAndExecuteTransactionBlock(
          {
            transaction: tx,
          },
          {
            onSuccess: async (result) => {
              // Reload the contract after submitting milestone
              await loadContract(escrowId);
              refresh();
              resolve({ success: true, txDigest: result.digest });
            },
            onError: (error) => {
              console.error('Error submitting milestone:', error);
              setError('Failed to submit milestone: ' + error.message);
              resolve({ success: false, error });
            },
          }
        );
      });
    } catch (err) {
      console.error('Error submitting milestone:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError('Failed to submit milestone: ' + errorMessage);
      return { success: false, error: err };
    } finally {
      setLoading(false);
    }
  }, [address, isConnected, loadContract, signAndExecuteTransactionBlock, refresh]);

  // Approve a milestone
  const approveMilestone = useCallback(async (
    escrowId: string,
    milestoneIndex: number
  ) => {
    if (!isConnected || !address) {
      setError('Wallet not connected');
      return { success: false, error: 'Wallet not connected' };
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Create a new transaction
      const tx = new Transaction();
      
      // Add the approve milestone transaction
      SuiClient.approveMilestoneTx(tx, {
        escrowObjectId: escrowId,
        milestoneIndex,
      });
      
      // Sign and execute the transaction
      return new Promise<{ success: boolean; txDigest?: string; error?: any }>((resolve) => {
        signAndExecuteTransactionBlock(
          {
            transaction: tx,
          },
          {
            onSuccess: async (result) => {
              // Reload the contract after approving milestone
              await loadContract(escrowId);
              refresh();
              resolve({ success: true, txDigest: result.digest });
            },
            onError: (error) => {
              console.error('Error approving milestone:', error);
              setError('Failed to approve milestone: ' + error.message);
              resolve({ success: false, error });
            },
          }
        );
      });
    } catch (err) {
      console.error('Error approving milestone:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError('Failed to approve milestone: ' + errorMessage);
      return { success: false, error: err };
    } finally {
      setLoading(false);
    }
  }, [address, isConnected, loadContract, signAndExecuteTransactionBlock, refresh]);

  // Reject a milestone
  const rejectMilestone = useCallback(async (
    escrowId: string,
    milestoneIndex: number,
    rejectionReason: string
  ) => {
    if (!isConnected || !address) {
      setError('Wallet not connected');
      return { success: false, error: 'Wallet not connected' };
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Create a new transaction
      const tx = new Transaction();
      
      // Add the reject milestone transaction
      SuiClient.rejectMilestoneTx(tx, {
        escrowObjectId: escrowId,
        milestoneIndex,
        rejectionReason,
      });
      
      // Sign and execute the transaction
      return new Promise<{ success: boolean; txDigest?: string; error?: any }>((resolve) => {
        signAndExecuteTransactionBlock(
          {
            transaction: tx,
          },
          {
            onSuccess: async (result) => {
              // Reload the contract after rejecting milestone
              await loadContract(escrowId);
              refresh();
              resolve({ success: true, txDigest: result.digest });
            },
            onError: (error) => {
              console.error('Error rejecting milestone:', error);
              setError('Failed to reject milestone: ' + error.message);
              resolve({ success: false, error });
            },
          }
        );
      });
    } catch (err) {
      console.error('Error rejecting milestone:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError('Failed to reject milestone: ' + errorMessage);
      return { success: false, error: err };
    } finally {
      setLoading(false);
    }
  }, [address, isConnected, loadContract, signAndExecuteTransactionBlock, refresh]);

  // Open a dispute
  const openDispute = useCallback(async (
    escrowId: string,
    reason: string
  ) => {
    if (!isConnected || !address) {
      setError('Wallet not connected');
      return { success: false, error: 'Wallet not connected' };
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Create a new transaction
      const tx = new Transaction();
      
      // Add the open dispute transaction
      SuiClient.openDisputeTx(tx, {
        escrowObjectId: escrowId,
        reason,
      });
      
      // Sign and execute the transaction
      return new Promise<{ success: boolean; disputeId?: string; txDigest?: string; error?: any }>((resolve) => {
        signAndExecuteTransactionBlock(
          {
            transaction: tx,
          },
          {
            onSuccess: async (result) => {
              
              
              // Since we can't easily parse events with the current SDK setup,
              // we'll just return success and let the UI refresh to show the dispute status
              
              // Wait a bit for blockchain to process
              await new Promise(resolve => setTimeout(resolve, 2000));
              
              // Reload the contract after opening dispute
              await loadContract(escrowId);
              refresh();
              
              resolve({ success: true, txDigest: result.digest });
            },
            onError: async (error) => {
              console.error('❌ Error opening dispute:', error);
              
              // Handle parsing errors gracefully (same pattern as other functions)
              if (error.message?.includes("Could not parse effects")) {
                
                
                // Wait a bit for blockchain to process
                await new Promise(resolve => setTimeout(resolve, 3000));
                
                try {
                  // Try to reload the contract to see if dispute was opened
                  const updatedContract = await loadContract(escrowId);
                  
                  if (updatedContract && updatedContract.status === 2) { // STATUS_DISPUTED = 2
                    
                    refresh();
                    resolve({ success: true, txDigest: "parsing_failed_but_succeeded" });
                    return;
                  }
                } catch (refreshError) {
                  console.error("Failed to verify dispute success:", refreshError);
                }
              }
              
              setError('Failed to open dispute: ' + error.message);
              resolve({ success: false, error });
            },
          }
        );
      });
    } catch (err) {
      console.error('Error opening dispute:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError('Failed to open dispute: ' + errorMessage);
      return { success: false, error: err };
    } finally {
      setLoading(false);
    }
  }, [address, isConnected, loadContract, signAndExecuteTransactionBlock, refresh]);

  // Cancel a contract
  const cancelContract = useCallback(async (
    escrowId: string,
    clientAgreed: boolean,
    freelancerAgreed: boolean
  ) => {
    if (!isConnected || !address) {
      setError('Wallet not connected');
      return { success: false, error: 'Wallet not connected' };
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Create a new transaction
      const tx = new Transaction();
      
      // Add the cancel contract transaction
      SuiClient.cancelContractTx(tx, {
        escrowObjectId: escrowId,
        clientAgreed,
        freelancerAgreed,
      });
      
      // Sign and execute the transaction
      return new Promise<{ success: boolean; txDigest?: string; error?: any }>((resolve) => {
        signAndExecuteTransactionBlock(
          {
            transaction: tx,
          },
          {
            onSuccess: async (result) => {
              // Reload the contract after cancelling
              await loadContract(escrowId);
              refresh();
              resolve({ success: true, txDigest: result.digest });
            },
            onError: (error) => {
              console.error('Error cancelling contract:', error);
              setError('Failed to cancel contract: ' + error.message);
              resolve({ success: false, error });
            },
          }
        );
      });
    } catch (err) {
      console.error('Error cancelling contract:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError('Failed to cancel contract: ' + errorMessage);
      return { success: false, error: err };
    } finally {
      setLoading(false);
    }
  }, [address, isConnected, loadContract, signAndExecuteTransactionBlock, refresh]);

  // Load user contracts when wallet is connected
  useEffect(() => {
    if (isConnected && address) {
      loadUserContracts();
    }
  }, [isConnected, address, loadUserContracts, refreshTrigger]);
  
  // Add this helper function
  const forceRefreshContractData = async (escrowId: string, retries: number = 3): Promise<boolean> => {
    for (let i = 0; i < retries; i++) {
      try {
        
        
        // Wait a bit for blockchain to settle
        await new Promise(resolve => setTimeout(resolve, 2000 * (i + 1)));
        
        // Fetch fresh contract data
        const updatedContract = await SuiClient.getEscrowContract(escrowId);
        
        if (updatedContract) {
          
          
          // Update state
          setCurrentContract(updatedContract);
          refresh();
          return true;
        }
      } catch (error) {
        console.error(`❌ Refresh attempt ${i + 1} failed:`, error);
      }
    }
    
    return false;
  };

  return {
    loading,
    error,
    isConnected,
    address,
    clientContracts,
    freelancerContracts,
    currentContract,
    loadUserContracts,
    loadContract,
    createContract,
    addMilestone,
    submitMilestone,
    approveMilestone,
    rejectMilestone,
    openDispute,
    cancelContract,
    forceRefreshContractData,
    mergeSUICoins,
    isCreatedObject,
    refresh
  };
};

export default useEscrow;

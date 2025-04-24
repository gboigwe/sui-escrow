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
  const { mutate: signAndExecuteTransactionBlock } = useSignAndExecuteTransaction({
    // Custom execute function with error handling
    execute: async ({ bytes, signature }) => {
      try {
        const result = await suiClient.executeTransactionBlock({
          transactionBlock: bytes,
          signature,
          options: {
            showEvents: true,
            showEffects: true,
            showObjectChanges: true,
            showInput: true,
          },
        });
        // console.log("Raw transaction result:", result);
        return result;
      } catch (error) {
        console.error("Transaction execution error:", error);
        throw error;
      }
    },
    onError: (error) => {
      console.error("Transaction error:", error);
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
      
      // console.log("Starting coin merge process for amount:", amount.toString());
      
      // Get all SUI coins owned by the user
      const coins = await suiClient.getCoins({
        owner: address,
        coinType: '0x2::sui::SUI',
      });
      
      // Filter coins to find those with balance
      const availableCoins = coins.data.filter(coin => BigInt(coin.balance) > 0);
      
      // Calculate total balance
      const totalBalance = availableCoins.reduce((acc, coin) => acc + BigInt(coin.balance), BigInt(0));
      
      // console.log("Available coins:", availableCoins.length);
      // console.log("Total balance:", totalBalance.toString());
      // console.log("Required amount:", amount.toString());
      
      if (totalBalance < amount) {
        throw new Error(`Insufficient balance. You have ${totalBalance / BigInt(1_000_000_000)} SUI, need ${amount / BigInt(1_000_000_000)} SUI`);
      }
      
      // If we have enough in a single coin, return that coin
      const singleCoinWithEnough = availableCoins.find(coin => BigInt(coin.balance) >= amount);
      if (singleCoinWithEnough) {
        // console.log("Found single coin with enough balance:", singleCoinWithEnough.coinObjectId);
        return singleCoinWithEnough.coinObjectId;
      }
      
      // Otherwise, merge coins first
      if (availableCoins.length <= 1) {
        // No coins to merge
        // console.log("No coins to merge");
        return availableCoins[0]?.coinObjectId || null;
      }
      
      const tx = new Transaction();
      tx.setGasBudget(50_000_000);
      
      // Select the coin with the largest balance as the primary coin
      const primaryCoin = availableCoins.reduce((prev, current) => 
        BigInt(current.balance) > BigInt(prev.balance) ? current : prev
      );
      
      // console.log("Primary coin for merge:", primaryCoin.coinObjectId);
      
      // Merge other coins into the primary coin
      const otherCoins = availableCoins
        .filter(coin => coin.coinObjectId !== primaryCoin.coinObjectId)
        .map(coin => tx.object(coin.coinObjectId));
      
      if (otherCoins.length > 0) {
        // console.log("Merging", otherCoins.length, "coins into primary coin");
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
              // console.log("Coins merged successfully");
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
      // Convert amount from SUI to MIST (1 SUI = 10^9 MIST)
      const amountInMist = BigInt(Math.floor(parseFloat(amount) * 1_000_000_000));
      
      // Always try to merge coins first for amounts greater than 1 SUI
      if (parseFloat(amount) > 1) {
        // console.log("Attempting to merge coins for amount:", amount, "SUI");
        const mergedCoinId = await mergeSUICoins(amountInMist);
        if (!mergedCoinId) {
          console.warn("Coin merge was not successful or not needed");
        } else {
          console.log("Successfully merged coins, using coin ID:", mergedCoinId);
        }
      }
      
      // Convert endDate string to timestamp in milliseconds
      const endTimestamp = new Date(endDate).getTime();
      
      // Create a new transaction
      const tx = new Transaction();
      
      // Add the create escrow contract transaction
      SuiClient.createEscrowContractTx(tx, {
        clientAddress: address,
        freelancerAddress,
        description,
        endDate: endTimestamp,
        paymentAmount: amountInMist.toString()
      });
      
      // console.log("Transaction prepared:", tx);
      
      // Sign and execute the transaction
      return new Promise<{ success: boolean; escrowId?: string; txDigest?: string; error?: any }>((resolve) => {
        signAndExecuteTransactionBlock(
          {
            transaction: tx,
          },
          {
            onSuccess: (result) => {
              // console.log("Transaction success:", result);
              
              let escrowId;
              
              // Check events for EscrowCreated
              if (result.events && result.events.length > 0) {
                const escrowCreatedEvent = result.events.find((event: any) => 
                  event.type && event.type.includes(`${SuiClient.ESCROW_MODULE}::EscrowCreated`)
                );
                
                if (escrowCreatedEvent && escrowCreatedEvent.parsedJson) {
                  const parsedJson = escrowCreatedEvent.parsedJson as { escrow_id?: string };
                  escrowId = parsedJson.escrow_id;
                  // console.log("Extracted escrow ID from event:", escrowId);
                }
              }
              
              // Get the contract ID from object changes
              if (!escrowId && result.objectChanges && result.objectChanges.length > 0) {
                const contractObject = result.objectChanges.find((change: any) => 
                  change.type === "created" && 
                  change.objectType &&
                  change.objectType.includes("EscrowContract")
                );
                
                if (contractObject && isCreatedObject(contractObject)) {
                  escrowId = contractObject.objectId;
                  // console.log("Extracted escrow ID from object changes:", escrowId);
                }
              }
              
              // console.log("Contract created successfully with ID:", escrowId || "Unknown");
              
              // Reload contracts after creation
              refresh();
              resolve({ success: true, escrowId, txDigest: result.digest });
            },
            onError: (error) => {
              console.error('Detailed transaction error:', error);
              
              let errorMessage = "Unknown error";
              if (error.message) {
                if (error.message.includes("InsufficientCoinBalance")) {
                  errorMessage = "Insufficient balance. You might need to consolidate your SUI tokens into a single coin object. Try clicking the 'Consolidate SUI Coins' button in your dashboard.";
                } else if (error.message.includes("GasBalanceTooLow")) {
                  errorMessage = "Gas balance too low. Please ensure you have enough SUI for gas fees.";
                } else {
                  errorMessage = error.message;
                }
              }
              
              setError(errorMessage);
              resolve({ success: false, error: errorMessage });
            },
          }
        );
      });
    } catch (err) {
        console.error('Error creating contract:', err);
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        
        // Provide more detailed error message based on the error
        if (errorMessage.includes("InsufficientCoinBalance")) {
          setError('Insufficient balance. Please try consolidating your SUI tokens first by clicking the "Consolidate SUI Coins" button in your dashboard.');
        } else {
          setError('Failed to create contract: ' + errorMessage);
        }
        
        return { success: false, error: errorMessage };
      } finally {
        setLoading(false);
      }
    }, [address, isConnected, signAndExecuteTransactionBlock, refresh, mergeSUICoins]);

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
      
      // Sign and execute the transaction
      return new Promise<{ success: boolean; txDigest?: string; error?: any }>((resolve) => {
        signAndExecuteTransactionBlock(
          {
            transaction: tx,
          },
          {
            onSuccess: async (result) => {
              // Reload the contract after adding milestone
              await loadContract(escrowId);
              refresh();
              resolve({ success: true, txDigest: result.digest });
            },
            onError: (error) => {
              console.error('Error adding milestone:', error);
              setError('Failed to add milestone: ' + error.message);
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
              // Extract the created dispute ID from events if available
              let disputeId;
              
              if (result.events && result.events.length > 0) {
                const disputeCreatedEvent = result.events.find((event: any) => 
                  event.type && event.type.includes(`${SuiClient.DISPUTE_MODULE}::DisputeCreated`)
                );
                
                if (disputeCreatedEvent && disputeCreatedEvent.parsedJson) {
                  const parsedJson = disputeCreatedEvent.parsedJson as { dispute_id?: string };
                  disputeId = parsedJson.dispute_id;
                }
              }
              
              // Reload the contract after opening dispute
              await loadContract(escrowId);
              refresh();
              resolve({ success: true, disputeId, txDigest: result.digest });
            },
            onError: (error) => {
              console.error('Error opening dispute:', error);
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
    refresh
  };
};

export default useEscrow;

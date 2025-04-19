// src/hooks/useEscrow.ts
import { useState, useEffect, useCallback } from 'react';
import { Transaction } from '@mysten/sui/transactions';
import { useCurrentAccount, useSignAndExecuteTransaction, useSuiClient } from '@mysten/dapp-kit';
import * as SuiClient from '../utils/suiClient';
import { EscrowContract } from '../utils/contracts';

export const useEscrow = () => {
  const currentAccount = useCurrentAccount();
  const suiClient = useSuiClient();
  const { mutate: signAndExecuteTransactionBlock } = useSignAndExecuteTransaction({
  // Custom execute function with error handling
  execute: async ({ bytes, signature }) => {
    try {
      return await suiClient.executeTransactionBlock({
          transactionBlock: bytes,
          signature,
          options: {
            showEvents: true,
            showEffects: true,
            showObjectChanges: true, // Add this
          },
      });
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
    
    // try {
    //   // Convert amount from SUI to MIST (1 SUI = 10^9 MIST)
    //   const amountInMist = (parseFloat(amount) * 1_000_000_000).toString();
      
    //   // Convert endDate string to timestamp in milliseconds
    //   const endTimestamp = new Date(endDate).getTime();
      
    //   // Create a new transaction
    //   const tx = new Transaction();
      
    //   // Add the create escrow contract transaction
    //   SuiClient.createEscrowContractTx(tx, {
    //     clientAddress: address,
    //     freelancerAddress,
    //     description,
    //     endDate: endTimestamp,
    //     paymentAmount: amountInMist
    //   });
      
    //   // Sign and execute the transaction
    //   return new Promise<{ success: boolean; escrowId?: string; txDigest?: string; error?: any }>((resolve) => {
    //     signAndExecuteTransactionBlock(
    //       {
    //         transaction: tx,
    //       },
    //       {
    //         onSuccess: (result) => {
    //           // Extract the created escrow ID from events if available
    //           let escrowId;
              
    //           if ('events' in result && result.events && result.events.length > 0) {
    //             const escrowCreatedEvent = result.events.find(event => 
    //               event.type.includes(`${SuiClient.ESCROW_MODULE}::EscrowCreated`)
    //             );
                
    //             if (escrowCreatedEvent && 'parsedJson' in escrowCreatedEvent && escrowCreatedEvent.parsedJson) {
    //               const parsedJson = escrowCreatedEvent.parsedJson as Record<string, any>;
    //               escrowId = parsedJson.escrow_id;
    //             }
    //           }
              
    //           // Reload contracts after creation
    //           refresh();
    //           resolve({ success: true, escrowId, txDigest: result.digest });
    //         },
    //         onError: (error) => {
    //           console.error('Error creating contract:', error);
    //           setError('Failed to create contract: ' + error.message);
    //           resolve({ success: false, error });
    //         },
    //       }
    //     );
    //   });
    // } catch (err) {
    // Inside the createContract function
    try {
      // Convert amount from SUI to MIST (1 SUI = 10^9 MIST)
      const amountInMist = (parseFloat(amount) * 1_000_000_000).toString();
      
      // Convert endDate string to timestamp in milliseconds
      const endTimestamp = new Date(endDate).getTime();

      // Create a new transaction
      const tx = new Transaction();
    
      // Set gas budget explicitly
      tx.setGasBudget(30000000);
    
      // Add the create escrow contract transaction
      SuiClient.createEscrowContractTx(tx, {
        clientAddress: address,
        freelancerAddress,
        description,
        endDate: endTimestamp,
        paymentAmount: amountInMist
      });
    
      console.log("Transaction prepared:", tx);
    
      // Sign and execute the transaction with more detailed error handling
      return new Promise<{ success: boolean; escrowId?: string; txDigest?: string; error?: any }>((resolve) => {
        signAndExecuteTransactionBlock(
          {
            transaction: tx,
          },
          {
            onSuccess: (result) => {
              console.log("Transaction success:", result);
              // Process result...
              resolve({ success: true, txDigest: result.digest });
            },
            onError: (error) => {
              console.error('Detailed transaction error:', error);
              // Add more descriptive error message
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
  }, [address, isConnected, signAndExecuteTransactionBlock, refresh]);

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
              
              if ('events' in result && result.events && result.events.length > 0) {
                const disputeCreatedEvent = result.events.find(event => 
                  event.type.includes(`${SuiClient.DISPUTE_MODULE}::DisputeCreated`)
                );
                
                if (disputeCreatedEvent && 'parsedJson' in disputeCreatedEvent && disputeCreatedEvent.parsedJson) {
                  const parsedJson = disputeCreatedEvent.parsedJson as Record<string, any>;
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

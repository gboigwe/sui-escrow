import React, { useState } from 'react';
import { useCurrentAccount, useSignAndExecuteTransaction, useSuiClient } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';

const TestSui: React.FC = () => {
  const currentAccount = useCurrentAccount();
  const suiClient = useSuiClient();
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
  const [result, setResult] = useState<string>('');

  const testSimpleTransaction = () => {
    if (!currentAccount) {
      setResult('No wallet connected');
      return;
    }

    const tx = new Transaction();
    // Fixed: Using tx.pure.u64() for numbers and tx.pure.address() for addresses
    tx.transferObjects(
      [tx.splitCoins(tx.gas, [tx.pure.u64(1000000)])], 
      tx.pure.address(currentAccount.address)
    );

    signAndExecute(
      { transaction: tx },
      {
        onSuccess: (result) => {
          setResult(`✅ SUCCESS: ${result.digest}`);
          console.log('Transaction succeeded:', result);
        },
        onError: (error) => {
          setResult(`❌ ERROR: ${error.message}`);
          console.error('Transaction failed:', error);
        },
      }
    );
  };

  const testContractQuery = async () => {
    try {
      const contract = await suiClient.getObject({
        id: "0x1dd31bb27336f2521d71ffc6dba1575de81d904bbda20da4242bac458b7621d7", // Your latest contract
        options: { showContent: true }
      });
      
      setResult(`📄 CONTRACT DATA: ${JSON.stringify(contract, null, 2)}`);
      console.log('Contract data:', contract);
    } catch (error) {
      setResult(`❌ QUERY ERROR: ${error}`);
      console.error('Query failed:', error);
    }
  };

  const testYourContract = async () => {
    try {
      // Test your specific contract ID
      const contractId = "0x1dd31bb27336f2521d71ffc6dba1575de81d904bbda20da4242bac458b7621d7";
      
      console.log(`🔍 Testing contract: ${contractId}`);
      
      const contract = await suiClient.getObject({
        id: contractId,
        options: { 
          showContent: true,
          showOwner: true,
          showType: true 
        }
      });
      
      if (contract.data?.content && 'fields' in contract.data.content) {
        const fields = contract.data.content.fields as Record<string, any>;
        
        const contractInfo = {
          id: contractId,
          client: fields.client,
          freelancer: fields.freelancer,
          totalAmount: fields.total_amount,
          remainingBalance: fields.remaining_balance,
          status: fields.status,
          milestones: fields.milestones,
          description: fields.description,
          createdAt: fields.created_at,
          endDate: fields.end_date
        };
        
        setResult(`🎯 YOUR CONTRACT INFO:\n${JSON.stringify(contractInfo, null, 2)}`);
        console.log('Your contract info:', contractInfo);
      } else {
        setResult(`❌ Could not parse contract content`);
      }
    } catch (error) {
      setResult(`❌ CONTRACT ERROR: ${error}`);
      console.error('Contract query failed:', error);
    }
  };

  const directContractQuery = async () => {
    try {
      const response = await fetch('https://fullnode.testnet.sui.io:443', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'sui_getObject',
          params: [
            "0x1dd31bb27336f2521d71ffc6dba1575de81d904bbda20da4242bac458b7621d7",
            { showContent: true }
          ]
        })
      });
      
      const data = await response.json();
      console.log('Direct RPC result:', data);
      setResult(`🔧 DIRECT RPC: ${JSON.stringify(data, null, 2)}`);
    } catch (error) {
      setResult(`❌ DIRECT RPC ERROR: ${error}`);
    }
  };

  const testNetworkConnection = async () => {
    try {
      // Test basic network connectivity
      const chainId = await suiClient.getChainIdentifier();
      const latestCheckpoint = await suiClient.getLatestCheckpointSequenceNumber();
      
      setResult(`🌐 NETWORK INFO:\nChain ID: ${chainId}\nLatest Checkpoint: ${latestCheckpoint}`);
      console.log('Network info:', { chainId, latestCheckpoint });
    } catch (error) {
      setResult(`❌ NETWORK ERROR: ${error}`);
      console.error('Network test failed:', error);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg max-w-4xl mx-auto">
      <h2 className="text-xl font-bold mb-4">🧪 Sui Connection Diagnostic</h2>
      
      <div className="space-y-4">
        <div className="bg-blue-50 p-3 rounded">
          <strong>Connected Account:</strong> {currentAccount?.address || 'Not connected'}
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <button 
            onClick={testNetworkConnection}
            className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 text-sm"
          >
            🌐 Test Network
          </button>
          
          <button 
            onClick={testSimpleTransaction}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
          >
            💸 Simple Transaction
          </button>
          
          <button 
            onClick={testContractQuery}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
          >
            📋 SDK Query
          </button>
          
          <button 
            onClick={testYourContract}
            className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 text-sm"
          >
            🎯 Your Contract
          </button>
          
          <button 
            onClick={directContractQuery}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
          >
            🔧 Direct RPC
          </button>
          
          <button 
            onClick={() => setResult('')}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 text-sm"
          >
            🗑️ Clear
          </button>
        </div>
        
        <div className="bg-gray-100 p-4 rounded max-h-96 overflow-auto">
          <pre className="text-xs whitespace-pre-wrap font-mono">{result || 'Click a button to run tests...'}</pre>
        </div>
        
        <div className="bg-yellow-50 p-3 rounded text-sm">
          <strong>🎯 Test Strategy:</strong>
          <ol className="list-decimal list-inside mt-2 space-y-1">
            <li><strong>Test Network</strong> - Verify basic Sui connection</li>
            <li><strong>Simple Transaction</strong> - Test if dApp Kit transactions work</li>
            <li><strong>SDK Query</strong> - Test if object queries work through dApp Kit</li>
            <li><strong>Your Contract</strong> - Test parsing your specific escrow contract</li>
            <li><strong>Direct RPC</strong> - Bypass dApp Kit entirely</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default TestSui;

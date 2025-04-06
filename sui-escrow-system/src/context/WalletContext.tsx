import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import { 
  SuiClientProvider, 
  WalletProvider as DappKitWalletProvider,
  useCurrentAccount, 
  useSignAndExecuteTransaction, 
  useSuiClient 
} from '@mysten/dapp-kit';

// Choose which network to use (testnet, mainnet, or devnet)
const activeNetwork = 'testnet';

type WalletContextType = {
  address: string | null;
  isConnected: boolean;
  connect: () => void;
  disconnect: () => void;
  suiClient: SuiClient;
};

const WalletContext = createContext<WalletContextType | null>(null);

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};

// This is the actual provider that implements the wallet context logic
const WalletContentProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const currentAccount = useCurrentAccount();
  const suiClient = useSuiClient();
  const { mutate: signAndExecuteTransaction } = useSignAndExecuteTransaction();
  
  const [address, setAddress] = useState<string | null>(null);

  useEffect(() => {
    if (currentAccount) {
      setAddress(currentAccount.address);
    } else {
      setAddress(null);
    }
  }, [currentAccount]);

  // These are placeholder functions - you would need to implement them with @mysten/dapp-kit
  // The actual connect/disconnect will be handled by the ConnectButton component
  const connect = async () => {
    console.log("Connect requested - use ConnectButton component instead");
  };

  const disconnect = () => {
    console.log("Disconnect requested - use ConnectButton component instead");
  };

  return (
    <WalletContext.Provider
      value={{
        address,
        isConnected: !!address,
        connect,
        disconnect,
        suiClient,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

// This is the wrapper that provides all the dapp-kit providers
export const WalletKitWrapper: React.FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <SuiClientProvider
      defaultNetwork={activeNetwork}
      networks={{
        testnet: { url: getFullnodeUrl('testnet') },
        mainnet: { url: getFullnodeUrl('mainnet') },
        devnet: { url: getFullnodeUrl('devnet') },
      }}
    >
      <DappKitWalletProvider>
        <WalletContentProvider>{children}</WalletContentProvider>
      </DappKitWalletProvider>
    </SuiClientProvider>
  );
};

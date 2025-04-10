import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import { 
  SuiClientProvider, 
  WalletProvider as DappKitWalletProvider,
  useCurrentAccount, 
  useSuiClient 
} from '@mysten/dapp-kit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Create a client for React Query
const queryClient = new QueryClient();

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
  
  const [address, setAddress] = useState<string | null>(null);

  useEffect(() => {
    if (currentAccount) {
      setAddress(currentAccount.address);
    } else {
      setAddress(null);
    }
  }, [currentAccount]);

  // Enhanced connect function that triggers wallet connection
  const connect = () => {
    // Find the connect wallet button and click it
    const connectButton = document.querySelector('[data-testid="connect-button"]') as HTMLButtonElement;
    if (connectButton) {
      connectButton.click();
    }
  };

  // Disconnect function
  const disconnect = () => {
    // This is handled by the wallet UI directly
    console.log("Disconnect requested - use wallet UI to disconnect");
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
    <QueryClientProvider client={queryClient}>
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
    </QueryClientProvider>
  );
};

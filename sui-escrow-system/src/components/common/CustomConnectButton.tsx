import React, { useState, useEffect, useRef } from 'react';
import { useWallets, useConnectWallet, useCurrentAccount, useDisconnectWallet } from '@mysten/dapp-kit';
import { createPortal } from 'react-dom';

interface CustomConnectButtonProps {
  variant?: 'default' | 'primary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  label?: string;
}

const CustomConnectButton: React.FC<CustomConnectButtonProps> = ({
  variant = 'primary',
  size = 'md',
  className = '',
  label = 'Connect Wallet'
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const wallets = useWallets();
  const { mutate: connectWallet } = useConnectWallet();
  const { mutate: disconnectWallet } = useDisconnectWallet();
  const currentAccount = useCurrentAccount();
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Create a portal container for the modal
  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(null);
  
  useEffect(() => {
    // Create a div for the portal
    const div = document.createElement('div');
    div.id = 'wallet-connect-modal-root';
    document.body.appendChild(div);
    setPortalContainer(div);
    
    // Cleanup function
    return () => {
      if (document.body.contains(div)) {
        document.body.removeChild(div);
      }
    };
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownRef]);

  // Define style variations
  const variants = {
    default: 'bg-white text-gray-800 border border-gray-200 hover:bg-gray-50',
    primary: 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:shadow-lg shadow-indigo-100/40',
    outline: 'bg-transparent border border-indigo-500 text-indigo-600 hover:bg-indigo-50',
  };
  
  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };
  
  // Base styling for the button
  const baseStyle = 'font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500';
  
  // Combine styles based on props
  const buttonStyle = `${baseStyle} ${variants[variant]} ${sizes[size]} ${className}`;

  const handleConnect = (wallet: any) => {
    connectWallet(
      { wallet },
      {
        onSuccess: () => {
          setIsModalOpen(false);
        },
        onError: (error) => {
          console.error("Failed to connect:", error);
        }
      }
    );
  };

  const handleDisconnect = () => {
    disconnectWallet(
      undefined,
      {
        onSuccess: () => {
          setIsDropdownOpen(false);
          console.log("Disconnected successfully");
        },
        onError: (error) => {
          console.error("Failed to disconnect:", error);
        }
      }
    );
  };

  // Format the wallet address for display
  const formatWalletDisplay = () => {
    if (!currentAccount) return '';
    
    // Show first 6 and last 4 characters of the address
    const address = currentAccount.address;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // If already connected, show address with dropdown
  if (currentAccount) {
    return (
      <div className="relative" ref={dropdownRef}>
        <button
          className={`${buttonStyle} flex items-center`}
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        >
          <span className="mr-2">{formatWalletDisplay()}</span>
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className={`h-4 w-4 transition-transform ${isDropdownOpen ? 'transform rotate-180' : ''}`} 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        
        {isDropdownOpen && (
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10 border border-gray-200">
            <div className="px-4 py-2 text-xs text-gray-500 border-b border-gray-200">
              Connected Account
            </div>
            <div className="px-4 py-2 text-sm text-gray-700 break-all">
              {currentAccount.address}
            </div>
            <button
              className="w-full text-left block px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
              onClick={handleDisconnect}
            >
              Disconnect
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className={buttonStyle}
      >
        {label}
      </button>

      {isModalOpen && portalContainer && createPortal(
        <div className="fixed inset-0 z-[9999] overflow-y-auto flex items-center justify-center">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm transition-opacity"
            onClick={() => setIsModalOpen(false)}
          ></div>
          
          {/* Modal */}
          <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full mx-4 md:mx-auto z-[10000]">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-gray-900">Connect Wallet</h3>
                <button
                  type="button"
                  className="text-gray-400 hover:text-gray-500"
                  onClick={() => setIsModalOpen(false)}
                >
                  <span className="sr-only">Close</span>
                  <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="mt-4 space-y-3">
                {wallets.length === 0 ? (
                  <p className="text-center text-gray-500 py-4">No wallets available</p>
                ) : (
                  wallets.map((wallet) => (
                    <button
                      key={wallet.name}
                      className="flex items-center w-full p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                      onClick={() => handleConnect(wallet)}
                    >
                      {wallet.icon && (
                        <img 
                          src={wallet.icon}
                          alt={`${wallet.name} logo`}
                          className="w-8 h-8 mr-3"
                        />
                      )}
                      <span className="font-medium">{wallet.name}</span>
                    </button>
                  ))
                )}
              </div>
              
              <div className="mt-6 text-sm text-gray-500 text-center">
                <p>
                  Don't have a Sui wallet yet?{' '}
                  <a 
                    href="https://docs.sui.io/build/wallet-integration"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-600 hover:text-indigo-500"
                  >
                    Learn More
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>,
        portalContainer
      )}
    </>
  );
};

export default CustomConnectButton;













// // src/components/common/CustomConnectButton.tsx
// import React, { useState } from 'react';
// import { ConnectButton, useWallets } from '@mysten/dapp-kit';

// interface CustomConnectButtonProps {
//   variant?: 'default' | 'primary' | 'outline';
//   size?: 'sm' | 'md' | 'lg';
//   className?: string;
//   label?: string;
// }

// const CustomConnectButton: React.FC<CustomConnectButtonProps> = ({
//   variant = 'primary',
//   size = 'md',
//   className = '',
//   label = 'Connect Wallet'
// }) => {
//   const [showModal, setShowModal] = useState(false);
//   const wallets = useWallets();
  
//   // Define style variations
//   const variants = {
//     default: 'bg-white text-gray-800 border border-gray-200 hover:bg-gray-50',
//     primary: 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:shadow-lg shadow-indigo-100/40',
//     outline: 'bg-transparent border border-indigo-500 text-indigo-600 hover:bg-indigo-50',
//   };
  
//   const sizes = {
//     sm: 'px-3 py-1.5 text-xs',
//     md: 'px-4 py-2 text-sm',
//     lg: 'px-6 py-3 text-base',
//   };
  
//   // Base styling for the button
//   const baseStyle = 'font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500';
  
//   // Combine styles based on props
//   const buttonStyle = `${baseStyle} ${variants[variant]} ${sizes[size]} ${className}`;

//   // Handle connecting to a wallet
//   const handleConnectWallet = async (walletName: string) => {
//     try {
//       const wallet = wallets.find(w => w.name === walletName);
//       if (wallet) {
//         // Wallet's standard connect feature
//         await wallet.features['standard:connect'].connect();
//         setShowModal(false);
//       }
//     } catch (error) {
//       console.error('Failed to connect to wallet:', error);
//     }
//   };
  
//   return (
//     <>
//       {/* Custom button that opens our modal */}
//       <button
//         onClick={() => setShowModal(true)}
//         className={buttonStyle}
//       >
//         {label}
//       </button>

//       {/* Custom modal implementation */}
//       {showModal && (
//         <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
//           <div className="flex items-center justify-center min-h-screen p-4">
//             {/* Background overlay */}
//             <div 
//               className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm transition-opacity"
//               onClick={() => setShowModal(false)}
//             ></div>

//             {/* Modal panel */}
//             <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6 overflow-hidden transform transition-all">
//               <div className="absolute top-3 right-3">
//                 <button
//                   onClick={() => setShowModal(false)}
//                   className="text-gray-400 hover:text-gray-500"
//                 >
//                   <span className="sr-only">Close</span>
//                   <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
//                   </svg>
//                 </button>
//               </div>

//               <h3 className="text-lg font-medium text-gray-900 mb-4">Connect Wallet</h3>
              
//               <div className="space-y-3">
//                 {wallets.length === 0 ? (
//                   <div className="text-center py-4 text-gray-500">
//                     No compatible wallets found
//                   </div>
//                 ) : (
//                   wallets.map((wallet) => (
//                     <button
//                       key={wallet.name}
//                       onClick={() => handleConnectWallet(wallet.name)}
//                       className="flex items-center w-full p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
//                     >
//                       {wallet.icon && (
//                         <img 
//                           src={wallet.icon} 
//                           alt={`${wallet.name} icon`} 
//                           className="w-8 h-8 mr-3"
//                         />
//                       )}
//                       <span className="font-medium">{wallet.name}</span>
//                     </button>
//                   ))
//                 )}
//               </div>
              
//               <div className="mt-4 text-sm text-gray-500">
//                 Don't have a wallet?{' '}
//                 <a 
//                   href="https://docs.sui.io/build/wallet-integration" 
//                   target="_blank" 
//                   rel="noopener noreferrer"
//                   className="text-indigo-600 hover:text-indigo-500"
//                 >
//                   Learn more
//                 </a>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}
//     </>
//   );
// };

// export default CustomConnectButton;

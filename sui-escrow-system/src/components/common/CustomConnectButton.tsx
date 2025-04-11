import React from 'react';
import { ConnectButton } from '@mysten/dapp-kit';
// import { useWallet } from '../../context/WalletContext';

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
  
  // The dapp-kit ConnectButton handles displaying the address automatically
  return (
    <ConnectButton 
      connectText={label}
      className={buttonStyle}
    />
  );
};

export default CustomConnectButton;

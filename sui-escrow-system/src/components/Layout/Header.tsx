import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useWallet } from '../../context/WalletContext';
import { ConnectButton } from '@mysten/dapp-kit';

const Header: React.FC = () => {
  const location = useLocation();
  const { address, isConnected } = useWallet();

  // Navigation links
  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Client Dashboard', path: '/client-dashboard' },
    { name: 'Freelancer Dashboard', path: '/freelancer-dashboard' },
    { name: 'Create Contract', path: '/create-contract' },
  ];

  // Format address for display
  const formatAddress = (addr: string) => {
    if (!addr) return '';
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  return (
    <header className="bg-white shadow-sm">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" aria-label="Top">
        <div className="w-full py-6 flex items-center justify-between border-b border-indigo-500 lg:border-none">
          <div className="flex items-center">
            <Link to="/">
              <span className="text-xl font-bold text-indigo-600">SuiEscrow</span>
            </Link>
            <div className="hidden ml-10 space-x-8 lg:block">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.path}
                  className={`text-base font-medium ${
                    location.pathname === link.path
                      ? 'text-indigo-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {link.name}
                </Link>
              ))}
            </div>
          </div>
          <div className="ml-10 space-x-4">
            {isConnected ? (
              <div className="flex items-center">
                <span className="text-sm text-gray-700 mr-4">
                  {formatAddress(address || '')}
                </span>
                <ConnectButton />
              </div>
            ) : (
              <ConnectButton />
            )}
          </div>
        </div>
        <div className="py-4 flex flex-wrap justify-center space-x-6 lg:hidden">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              to={link.path}
              className={`text-base font-medium ${
                location.pathname === link.path
                  ? 'text-indigo-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {link.name}
            </Link>
          ))}
        </div>
      </nav>
    </header>
  );
};

export default Header;

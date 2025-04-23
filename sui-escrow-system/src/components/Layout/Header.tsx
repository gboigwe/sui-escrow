import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
// import { useWallet } from '../../context/WalletContext';
// import { ConnectButton } from '@mysten/dapp-kit';
import CustomConnectButton from '../common/CustomConnectButton';

const Header: React.FC = () => {
  const location = useLocation();
  // const { address, isConnected } = useWallet();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [animateItems, setAnimateItems] = useState(false);

  // Handle scroll effect for header
  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 10;
      if (isScrolled !== scrolled) {
        setScrolled(isScrolled);
      }
    };

    // Trigger animation after component mounts
    setTimeout(() => setAnimateItems(true), 100);

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [scrolled]);

  // Navigation links
  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Client Dashboard', path: '/client-dashboard' },
    { name: 'Freelancer Dashboard', path: '/freelancer-dashboard' },
    { name: 'Create Contract', path: '/create-contract' },
  ];

  // Format address for display
  // const formatAddress = (addr: string) => {
  //   if (!addr) return '';
  //   return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  // };

  return (
    <header 
      className={`fixed w-full top-0 z-50 transition-all duration-300 ${
        scrolled 
          ? 'bg-white/95 backdrop-blur-md shadow-lg py-3' 
          : 'bg-transparent py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          {/* Logo and Brand */}
          <div className={`flex items-center transition-transform duration-500 ease-out ${animateItems ? 'translate-x-0' : '-translate-x-8'} opacity-0 animate-fadeIn`}>
            <Link to="/" className="flex items-center group">
              <div className="flex items-center">
                <div className="relative">
                  <div className="absolute inset-0 bg-indigo-600 rounded-full blur-md opacity-20 group-hover:opacity-40 transition-opacity"></div>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-9 w-9 text-indigo-600 relative z-10 transition-transform duration-300 ease-out group-hover:scale-110" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
                  </svg>
                </div>
                <div className="ml-2.5">
                  <span className="text-2xl font-extrabold tracking-tight">
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
                      SuiEscrow
                    </span>
                  </span>
                  <div className="text-xs text-gray-500 font-medium -mt-1 tracking-wider">SECURE PAYMENTS</div>
                </div>
              </div>
            </Link>
          </div>
          
          {/* Desktop Navigation */}
          <nav className={`hidden md:flex items-center space-x-1 transition-all duration-500 ease-out ${animateItems ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
            {navLinks.map((link) => {
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.name}
                  to={link.path}
                  className={`relative px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                    isActive 
                      ? 'text-indigo-600 bg-indigo-50' 
                      : 'text-gray-600 hover:text-indigo-600 hover:bg-indigo-50/50'
                  }`}
                >
                  {link.name}
                  {isActive && (
                    <span className="absolute inset-x-0 -bottom-px h-0.5 bg-indigo-600 rounded-full"></span>
                  )}
                </Link>
              );
            })}
          </nav>
          
          {/* Wallet Connection */}
          <div className={`flex items-center transition-all duration-500 ease-out ${animateItems ? 'translate-x-0 opacity-100' : 'translate-x-8 opacity-0'}`}>
            <CustomConnectButton 
              variant="primary"
              size="md"
              className="relative z-10 shadow-md hover:shadow-lg transition-all duration-200 hover:translate-y-[-1px]"
            />
            
            {/* Mobile menu button */}
            <div className="ml-4 md:hidden">
              <button
                type="button"
                className="p-2 rounded-md text-gray-600 hover:text-indigo-600 focus:outline-none"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                <span className="sr-only">Open menu</span>
                <div className="relative w-6 h-6">
                  <span 
                    className={`absolute block w-5 h-0.5 bg-current transform transition-all duration-300 ease-in-out ${
                      mobileMenuOpen ? 'rotate-45 translate-y-0' : '-translate-y-1.5'
                    }`}
                  ></span>
                  <span 
                    className={`absolute block w-5 h-0.5 bg-current transform transition-all duration-300 ease-in-out ${
                      mobileMenuOpen ? 'opacity-0' : 'opacity-100'
                    }`}
                  ></span>
                  <span 
                    className={`absolute block w-5 h-0.5 bg-current transform transition-all duration-300 ease-in-out ${
                      mobileMenuOpen ? '-rotate-45 translate-y-0' : 'translate-y-1.5'
                    }`}
                  ></span>
                </div>
              </button>
            </div>
          </div>
        </div>
        
        {/* Mobile Navigation */}
        <div 
          className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${
            mobileMenuOpen ? 'max-h-60 opacity-100 mt-4' : 'max-h-0 opacity-0'
          }`}
        >
          <div className="pt-2 pb-4 space-y-1">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.name}
                  to={link.path}
                  className={`block px-4 py-3 rounded-lg text-base font-medium ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-600'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-indigo-600'
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.name}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;

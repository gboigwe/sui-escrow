import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-white">
      <div className="max-w-7xl mx-auto py-6 px-4 overflow-hidden sm:px-6 lg:px-8">
        <p className="mt-8 text-center text-base text-gray-500">
          &copy; {new Date().getFullYear()} SuiEscrow. Built on Sui Blockchain.
        </p>
        <p className="text-center text-sm text-gray-500 mt-2">
          Created for Sui Overflow 2025 Hackathon
        </p>
      </div>
    </footer>
  );
};

export default Footer;

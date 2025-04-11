import React, { ReactNode, useEffect, useState } from 'react';
import Header from './Header';
import Footer from './Footer';

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [mounted, setMounted] = useState(false);
  
  // Add a subtle animation effect when the page loads
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-gray-50 to-gray-100">
      {/* Background decorative elements */}
      {/* <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-r from-indigo-500/5 to-purple-500/5"></div>
        <div className="absolute top-20 left-0 w-64 h-64 rounded-full bg-indigo-300/5 blur-3xl"></div>
        <div className="absolute top-40 right-20 w-80 h-80 rounded-full bg-purple-300/5 blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-64 h-64 rounded-full bg-indigo-300/5 blur-3xl"></div>
      </div> */}
      
      {/* Main content with animation */}
      <div className={`flex flex-col flex-grow z-10 transition-opacity duration-500 ease-in-out ${mounted ? 'opacity-100' : 'opacity-0'}`}>
        <Header />
        <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-7xl">
          {children}
        </main>
        <Footer />
      </div>
    </div>
  );
};

export default Layout;

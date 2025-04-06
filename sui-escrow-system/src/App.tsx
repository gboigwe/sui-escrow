import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { WalletKitWrapper } from './context/WalletContext';
import Layout from './components/Layout/Layout';
import ClientDashboard from './components/Dashboard/ClientDashboard';
import FreelancerDashboard from './components/Dashboard/FreelancerDashboard';
import ContractCreationForm from './components/EscrowContract/ContractCreationForm';
import ContractDetails from './components/EscrowContract/ContractDetails';
import DisputeDetails from './components/Dispute/DisputeDetails';

// Simple home page component
const HomePage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Decentralized Escrow & Milestone Payment System</h1>
        <p className="text-xl text-gray-600">Securely manage contracts with milestone-based payments on the Sui blockchain.</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">For Clients</h2>
          <p className="text-gray-600 mb-6">Create escrow contracts, set milestones, and approve work.</p>
          <a href="/client-dashboard" className="inline-block px-5 py-3 text-base font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700">
            View Client Dashboard
          </a>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">For Freelancers</h2>
          <p className="text-gray-600 mb-6">Track contracts, submit work, and get paid securely.</p>
          <a href="/freelancer-dashboard" className="inline-block px-5 py-3 text-base font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700">
            View Freelancer Dashboard
          </a>
        </div>
      </div>
      
      <div className="bg-gray-50 p-8 rounded-lg border border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">How It Works</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex flex-col items-center text-center">
            <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-xl font-bold mb-4">1</div>
            <h3 className="text-lg font-semibold mb-2">Create Contract</h3>
            <p className="text-gray-600">Client creates an escrow contract with defined milestones and locks funds.</p>
          </div>
          
          <div className="flex flex-col items-center text-center">
            <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-xl font-bold mb-4">2</div>
            <h3 className="text-lg font-semibold mb-2">Submit Work</h3>
            <p className="text-gray-600">Freelancer completes work and submits milestones for approval.</p>
          </div>
          
          <div className="flex flex-col items-center text-center">
            <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-xl font-bold mb-4">3</div>
            <h3 className="text-lg font-semibold mb-2">Receive Payment</h3>
            <p className="text-gray-600">Client approves work and smart contract automatically releases payment.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <WalletKitWrapper>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/client-dashboard" element={<ClientDashboard />} />
            <Route path="/freelancer-dashboard" element={<FreelancerDashboard />} />
            <Route path="/create-contract" element={<ContractCreationForm />} />
            <Route path="/contract/:id" element={<ContractDetails />} />
            <Route path="/dispute/:id" element={<DisputeDetails />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      </Router>
    </WalletKitWrapper>
  );
};

export default App;

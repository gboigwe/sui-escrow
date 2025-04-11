import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { WalletKitWrapper } from './context/WalletContext';
import Layout from './components/Layout/Layout';
import HomePage from './components/Home/HomePage';
import ClientDashboard from './components/Dashboard/ClientDashboard';
import FreelancerDashboard from './components/Dashboard/FreelancerDashboard';
import ContractCreationForm from './components/EscrowContract/ContractCreationForm';
import ContractDetails from './components/EscrowContract/ContractDetails';
import './App.css';

function App() {
  return (
    <WalletKitWrapper>
      <Router>
        <div className="min-h-screen">
          <Layout>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/client-dashboard" element={<ClientDashboard />} />
              <Route path="/freelancer-dashboard" element={<FreelancerDashboard />} />
              <Route path="/create-contract" element={<ContractCreationForm />} />
              <Route path="/contract/:id" element={<ContractDetails />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Layout>
        </div>
      </Router>
    </WalletKitWrapper>
  );
}

export default App;

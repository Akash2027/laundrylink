import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';

import LandingPage from './pages/LandingPage';
import CustomerSignup from './pages/CustomerSignup';
import ProviderSignup from './pages/ProviderSignup';
import Login from './pages/Login';
import CustomerHome from './pages/CustomerHome';
import CreateOrder from './pages/CreateOrder';
import TrackOrder from './pages/TrackOrder';
import ProviderDashboard from './pages/ProviderDashboard';
import ProviderOrders from './pages/ProviderOrders';
import ProviderPricing from './pages/ProviderPricing';
import AdminDisputes from './pages/AdminDisputes';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <div className="min-h-screen">
            <Toaster position="top-right" />
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<Login />} />
              <Route path="/customer/signup" element={<CustomerSignup />} />
              <Route path="/provider/signup" element={<ProviderSignup />} />
              <Route path="/customer/home" element={<CustomerHome />} />
              <Route path="/customer/create-order/:providerId" element={<CreateOrder />} />
              <Route path="/customer/track-order/:orderId" element={<TrackOrder />} />
              <Route path="/provider/dashboard" element={<ProviderDashboard />} />
              <Route path="/provider/orders" element={<ProviderOrders />} />
              <Route path="/provider/pricing" element={<ProviderPricing />} />
              <Route path="/admin/disputes" element={<AdminDisputes />} />
            </Routes>
          </div>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
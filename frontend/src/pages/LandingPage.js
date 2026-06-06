import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';

const LandingPage = () => {
  const navigate = useNavigate();
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminCode, setAdminCode] = useState('');
  const [loading, setLoading] = useState(false);

  const verifyAdmin = async () => {
    if (!adminCode) {
      toast.error('Enter admin code');
      return;
    }
    setLoading(true);
    try {
      const response = await axios.post('http://localhost:5000/api/auth/admin/verify', { code: adminCode });
      if (response.data.success) {
        localStorage.setItem('token', response.data.token);
        toast.success('Admin access granted');
        navigate('/admin/disputes');
        setShowAdminModal(false);
      }
    } catch (error) {
      toast.error('Invalid admin code');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-white">
      <nav className="border-b border-gray-100 bg-white sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🧺</span>
            <span className="text-xl font-bold text-gray-800">LaundryLink</span>
          </div>
          <button onClick={() => navigate('/login')} className="px-5 py-2 text-gray-600 hover:text-gray-900 font-medium">
            Sign In
          </button>
        </div>
      </nav>

      <div className="container mx-auto px-6 py-20 text-center">
        <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-4">
          Laundry made <span className="text-blue-600">simple</span>
        </h1>
        <p className="text-lg text-gray-500 max-w-md mx-auto mb-12">
          Professional cleaning at your doorstep. Pickup & delivery.
        </p>

        <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          <div onClick={() => navigate('/customer/signup')} className="bg-white border border-gray-200 rounded-2xl p-8 text-center cursor-pointer hover:shadow-lg transition-shadow">
            <div className="text-5xl mb-3">👤</div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Customer</h2>
            <p className="text-gray-500 text-sm mb-4">Get laundry done from nearby shops</p>
            <button className="mt-2 text-blue-600 font-medium">Get Started →</button>
          </div>

          <div onClick={() => navigate('/provider/signup')} className="bg-white border border-gray-200 rounded-2xl p-8 text-center cursor-pointer hover:shadow-lg transition-shadow">
            <div className="text-5xl mb-3">🏪</div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Provider</h2>
            <p className="text-gray-500 text-sm mb-4">Register your laundry business</p>
            <button className="mt-2 text-blue-600 font-medium">Register →</button>
          </div>
        </div>
      </div>

      <button onClick={() => setShowAdminModal(true)} className="fixed bottom-6 right-6 bg-gray-900 hover:bg-gray-800 text-white px-4 py-2 rounded-full text-sm shadow-lg transition">
        👑 Admin
      </button>

      {showAdminModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Admin Access</h3>
              <button onClick={() => setShowAdminModal(false)} className="text-gray-400 text-2xl">×</button>
            </div>
            <input
              type="text"
              placeholder="Enter 6-digit admin code"
              value={adminCode}
              onChange={(e) => setAdminCode(e.target.value)}
              className="input-field mb-4"
              maxLength={6}
            />
            <button onClick={verifyAdmin} disabled={loading} className="btn-primary w-full">
              {loading ? 'Verifying...' : 'Verify & Login'}
            </button>
            <p className="text-xs text-gray-400 text-center mt-3">Admin code: 123456</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default LandingPage;
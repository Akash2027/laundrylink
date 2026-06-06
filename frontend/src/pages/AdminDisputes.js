import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';

const AdminDisputes = () => {
  const { token, logout } = useAuth();
  const navigate = useNavigate();
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);

  const API_URL = 'http://localhost:5000/api';

  useEffect(() => {
    fetchAllDisputes();
  }, []);

  const fetchAllDisputes = async () => {
    try {
      // Fetch all orders to find disputes
      const response = await axios.get(`${API_URL}/orders/provider/orders`, {
        headers: { Authorization: token }
      });
      // For demo, showing sample disputes
      setDisputes([
        {
          id: 1,
          order_id: 2,
          item_type: 'Shirt',
          missing_quantity: 2,
          description: '2 shirts were missing from the delivery',
          status: 'open',
          created_at: new Date().toISOString()
        }
      ]);
    } catch (error) {
      console.error('Error fetching disputes:', error);
    } finally {
      setLoading(false);
    }
  };

  const resolveDispute = async (disputeId, approve) => {
    try {
      await axios.post(`${API_URL}/disputes/admin-resolve`, {
        dispute_id: disputeId,
        approve: approve,
        admin_notes: approve ? 'Approved by admin' : 'Rejected by admin'
      }, { headers: { Authorization: token } });
      
      toast.success(`Dispute ${approve ? 'approved' : 'rejected'}`);
      fetchAllDisputes();
    } catch (error) {
      toast.error('Failed to resolve dispute');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-lg sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🧺</span>
            <span className="text-xl font-bold text-primary">LaundryLink - Admin</span>
          </div>
          <button onClick={handleLogout} className="text-red-500 hover:text-red-700">Logout</button>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-red-500 to-orange-500 p-6 text-white">
            <h1 className="text-2xl font-bold">Dispute Management</h1>
            <p className="opacity-90">Review and resolve customer disputes</p>
          </div>

          {loading ? (
            <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div></div>
          ) : disputes.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <div className="text-5xl mb-3">✅</div>
              <p>No disputes to review</p>
            </div>
          ) : (
            <div className="divide-y">
              {disputes.map((dispute) => (
                <div key={dispute.id} className="p-6">
                  <div className="flex justify-between items-start flex-wrap gap-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-bold text-lg">Dispute #{dispute.id}</span>
                        <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-xs font-semibold">
                          {dispute.status}
                        </span>
                      </div>
                      <p className="text-gray-600">Order ID: #{dispute.order_id}</p>
                      <p className="text-gray-600 mt-2">
                        <span className="font-medium">Item:</span> {dispute.item_type} <br />
                        <span className="font-medium">Missing Quantity:</span> {dispute.missing_quantity} <br />
                        <span className="font-medium">Description:</span> {dispute.description}
                      </p>
                    </div>
                    
                    <div className="flex gap-3">
                      <button
                        onClick={() => resolveDispute(dispute.id, true)}
                        className="bg-green-500 text-white px-5 py-2 rounded-lg font-semibold hover:bg-green-600"
                      >
                        ✓ Approve Refund
                      </button>
                      <button
                        onClick={() => resolveDispute(dispute.id, false)}
                        className="bg-red-500 text-white px-5 py-2 rounded-lg font-semibold hover:bg-red-600"
                      >
                        ✗ Reject
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDisputes;
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';

const ProviderDashboard = () => {
  const { token, user, logout } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, completed: 0, revenue: 0 });
  const [loading, setLoading] = useState(true);

  const API_URL = 'http://localhost:5000/api';

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await axios.get(`${API_URL}/orders/provider/orders`, {
        headers: { Authorization: token }
      });
      setOrders(response.data.orders);
      
      // Calculate stats
      const total = response.data.orders.length;
      const pending = response.data.orders.filter(o => o.status !== 'delivered').length;
      const completed = response.data.orders.filter(o => o.status === 'delivered').length;
      const revenue = response.data.orders.reduce((sum, o) => sum + parseFloat(o.total_amount), 0);
      
      setStats({ total, pending, completed, revenue });
    } catch (error) {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (orderId, newStatus) => {
    try {
      await axios.put(`${API_URL}/orders/${orderId}/status`, { status: newStatus }, {
        headers: { Authorization: token }
      });
      toast.success(`Order #${orderId} marked as ${newStatus}`);
      fetchOrders();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const statusOptions = ['accepted', 'picked_up', 'washing', 'drying', 'ironing', 'ready', 'delivered'];

  const getStatusBadge = (status) => {
    const colors = {
      requested: 'bg-yellow-100 text-yellow-800',
      accepted: 'bg-blue-100 text-blue-800',
      picked_up: 'bg-purple-100 text-purple-800',
      washing: 'bg-indigo-100 text-indigo-800',
      drying: 'bg-cyan-100 text-cyan-800',
      ironing: 'bg-orange-100 text-orange-800',
      ready: 'bg-green-100 text-green-800',
      delivered: 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white shadow-lg sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🧺</span>
            <span className="text-xl font-bold text-primary">LaundryLink - Provider</span>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/provider/orders')} className="text-gray-600 hover:text-primary">📋 Orders</button>
            <button onClick={() => navigate('/provider/pricing')} className="text-gray-600 hover:text-primary">💰 Pricing</button>
            <span className="text-gray-700">👋 {user?.name}</span>
            <button onClick={handleLogout} className="text-red-500 hover:text-red-700">Logout</button>
          </div>
        </div>
      </nav>

      {/* Stats Cards */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl p-5 shadow-md">
            <div className="text-2xl mb-2">📊</div>
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-gray-500 text-sm">Total Orders</div>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-md">
            <div className="text-2xl mb-2">⏳</div>
            <div className="text-2xl font-bold">{stats.pending}</div>
            <div className="text-gray-500 text-sm">Pending Orders</div>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-md">
            <div className="text-2xl mb-2">✅</div>
            <div className="text-2xl font-bold">{stats.completed}</div>
            <div className="text-gray-500 text-sm">Completed</div>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-md">
            <div className="text-2xl mb-2">💰</div>
            <div className="text-2xl font-bold">₹{stats.revenue}</div>
            <div className="text-gray-500 text-sm">Total Revenue</div>
          </div>
        </div>

        {/* Recent Orders */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-primary to-secondary p-5 text-white">
            <h2 className="text-xl font-bold">Recent Orders</h2>
          </div>
          
          {loading ? (
            <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div></div>
          ) : orders.length === 0 ? (
            <div className="text-center py-12 text-gray-400">No orders yet</div>
          ) : (
            <div className="divide-y">
              {orders.slice(0, 10).map((order) => (
                <div key={order.id} className="p-5 hover:bg-gray-50 transition">
                  <div className="flex justify-between items-start flex-wrap gap-3">
                    <div>
                      <div className="font-bold text-lg">Order #{order.id}</div>
                      <div className="text-gray-500 text-sm">{order.customer_name}</div>
                      <div className="text-gray-500 text-sm">{new Date(order.created_at).toLocaleString()}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold text-primary">₹{order.total_amount}</div>
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadge(order.status)}`}>
                        {order.status}
                      </span>
                    </div>
                  </div>
                  
                  {order.status !== 'delivered' && (
                    <div className="mt-3 flex gap-2 flex-wrap">
                      {statusOptions.map((status) => (
                        <button
                          key={status}
                          onClick={() => updateStatus(order.id, status)}
                          className={`px-3 py-1 rounded-lg text-xs transition ${
                            order.status === status ? 'bg-primary text-white' : 'bg-gray-200 hover:bg-gray-300'
                          }`}
                        >
                          {status.replace('_', ' ')}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProviderDashboard;
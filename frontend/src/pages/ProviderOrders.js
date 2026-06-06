import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';

const ProviderOrders = () => {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState('all');
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
      toast.success(`Order #${orderId} status updated`);
      fetchOrders();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const filteredOrders = filter === 'all' ? orders : orders.filter(o => o.status === filter);

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
          <div className="flex gap-4">
            <button onClick={() => navigate('/provider/dashboard')} className="text-gray-600 hover:text-primary">Dashboard</button>
            <button onClick={() => navigate('/provider/pricing')} className="text-gray-600 hover:text-primary">Pricing</button>
            <button onClick={() => { localStorage.removeItem('token'); navigate('/login'); }} className="text-red-500">Logout</button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-primary to-secondary p-5 text-white">
            <h2 className="text-xl font-bold">All Orders</h2>
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-2 p-4 border-b flex-wrap">
            {['all', 'requested', 'accepted', 'picked_up', 'washing', 'drying', 'ironing', 'ready', 'delivered'].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                  filter === status ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {status === 'all' ? 'All' : status.replace('_', ' ')}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div></div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-12 text-gray-400">No orders found</div>
          ) : (
            <div className="divide-y">
              {filteredOrders.map((order) => (
                <div key={order.id} className="p-5 hover:bg-gray-50 transition">
                  <div className="flex justify-between items-start flex-wrap gap-3 mb-3">
                    <div>
                      <div className="font-bold text-lg">Order #{order.id}</div>
                      <div className="text-gray-600">👤 {order.customer_name}</div>
                      <div className="text-gray-500 text-sm">{order.customer_address}</div>
                      <div className="text-gray-400 text-xs mt-1">{new Date(order.created_at).toLocaleString()}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-primary">₹{order.total_amount}</div>
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold mt-1 ${getStatusBadge(order.status)}`}>
                        {order.status}
                      </span>
                    </div>
                  </div>
                  
                  {order.status !== 'delivered' && order.status !== 'requested' && (
                    <div className="mt-3 pt-3 border-t flex gap-2 flex-wrap">
                      <span className="text-sm text-gray-500 mr-2">Update Status:</span>
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
                  
                  {order.status === 'requested' && (
                    <div className="mt-3 pt-3 border-t">
                      <button
                        onClick={() => updateStatus(order.id, 'accepted')}
                        className="bg-green-500 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-green-600"
                      >
                        Accept Order
                      </button>
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

export default ProviderOrders;
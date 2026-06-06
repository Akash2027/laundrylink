import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';

const TrackOrder = () => {
  const { orderId } = useParams();
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [items, setItems] = useState([]);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const API_URL = 'http://localhost:5000/api';

  const statusSteps = ['requested', 'accepted', 'picked_up', 'washing', 'drying', 'ironing', 'ready', 'delivered'];
  const statusLabels = {
    requested: 'Order Placed',
    accepted: 'Order Accepted',
    picked_up: 'Picked Up',
    washing: 'Washing',
    drying: 'Drying',
    ironing: 'Ironing',
    ready: 'Ready for Delivery',
    delivered: 'Delivered'
  };

  useEffect(() => {
    fetchOrderDetails();
  }, [orderId]);

  const fetchOrderDetails = async () => {
    try {
      const response = await axios.get(`${API_URL}/orders/${orderId}`, {
        headers: { Authorization: token }
      });
      setOrder(response.data.order);
      setItems(response.data.items);
      setImages(response.data.images);
    } catch (error) {
      toast.error('Failed to load order');
    } finally {
      setLoading(false);
    }
  };

  const getCurrentStep = () => {
    return statusSteps.indexOf(order?.status);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('order_id', orderId);
    formData.append('image', file);

    try {
      await axios.post(`${API_URL}/images/upload`, formData, {
        headers: { Authorization: token, 'Content-Type': 'multipart/form-data' }
      });
      toast.success('Image uploaded successfully');
      fetchOrderDetails();
    } catch (error) {
      toast.error('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const raiseDispute = async () => {
    const description = prompt('Describe the issue (missing items, damage, etc.):');
    if (!description) return;

    const itemType = prompt('Which item type has issue? (Shirt/Pant/Saree etc.)');
    const missingQty = prompt('How many items are missing/damaged?');

    try {
      await axios.post(`${API_URL}/disputes/create`, {
        order_id: orderId,
        item_type: itemType,
        missing_quantity: parseInt(missingQty),
        description
      }, { headers: { Authorization: token } });
      toast.success('Dispute raised successfully');
    } catch (error) {
      toast.error('Failed to raise dispute');
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>;
  }

  if (!order) {
    return <div className="text-center py-12">Order not found</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-3xl">
        {/* Order Header */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-6">
          <div className="bg-gradient-to-r from-primary to-secondary p-6 text-white">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold">Order #{order.id}</h1>
                <p className="opacity-90">{order.shop_name}</p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold">₹{order.total_amount}</div>
                <div className="text-sm opacity-90">{new Date(order.created_at).toLocaleDateString()}</div>
              </div>
            </div>
          </div>

          {/* Status Timeline */}
          <div className="p-6 border-b">
            <div className="flex justify-between relative">
              {statusSteps.map((step, index) => {
                const isActive = index <= getCurrentStep();
                const isCurrent = index === getCurrentStep();
                return (
                  <div key={step} className="flex-1 text-center relative">
                    <div className={`w-3 h-3 rounded-full mx-auto mb-2 ${isActive ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                    <div className={`text-xs font-semibold ${isActive ? 'text-green-600' : 'text-gray-400'}`}>
                      {statusLabels[step]}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Order Items */}
          <div className="p-6 border-b">
            <h2 className="font-bold text-lg mb-4">Items</h2>
            <div className="space-y-3">
              {items.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center">
                  <div>
                    <span className="font-medium">{item.quantity}x {item.item_type}</span>
                    <span className="text-gray-500 text-sm ml-2">({item.service_type})</span>
                  </div>
                  <span>₹{item.total_price}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Images */}
          <div className="p-6 border-b">
            <h2 className="font-bold text-lg mb-4">Evidence Photos</h2>
            <div className="grid grid-cols-3 gap-3 mb-4">
              {images.map((img, idx) => (
                <img key={idx} src={img.image_url} alt="Evidence" className="rounded-lg h-24 w-full object-cover" />
              ))}
            </div>
            <label className="btn-outline inline-block cursor-pointer text-center w-full">
              {uploading ? 'Uploading...' : '📸 Upload Photo Evidence'}
              <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
            </label>
          </div>

          {/* Actions */}
          <div className="p-6 flex gap-4">
            {order.status === 'delivered' && (
              <button onClick={raiseDispute} className="btn-outline flex-1">
                ⚠️ Report Issue
              </button>
            )}
            <button onClick={() => navigate(-1)} className="btn-primary flex-1">
              ← Back
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrackOrder;
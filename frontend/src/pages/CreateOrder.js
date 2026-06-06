import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';

const CreateOrder = () => {
  const { providerId } = useParams();
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [provider, setProvider] = useState(null);
  const [pricing, setPricing] = useState([]);
  const [items, setItems] = useState([]);
  const [pickup, setPickup] = useState(true);
  const [delivery, setDelivery] = useState(true);
  const [loading, setLoading] = useState(false);
  const [address, setAddress] = useState(user?.address || '');

  const API_URL = 'http://localhost:5000/api';

  const itemTypes = ['Shirt', 'Pant', 'Saree', 'T-Shirt', 'Jeans', 'Towel', 'Blanket'];
  const serviceTypes = ['Regular Wash', 'Wash + Iron', 'Iron Only', 'Hot Water Wash', 'Dry Cleaning'];

  useEffect(() => {
    fetchProviderDetails();
  }, []);

  const fetchProviderDetails = async () => {
    try {
      const response = await axios.get(`${API_URL}/orders/providers/${providerId}`, {
        headers: { Authorization: token }
      });
      setProvider(response.data.provider);
      setPricing(response.data.pricing);
    } catch (error) {
      toast.error('Failed to load provider');
    }
  };

  const getPrice = (itemType, serviceType) => {
    const priceItem = pricing.find(p => p.item_type === itemType && p.service_type === serviceType);
    return priceItem ? priceItem.price_per_item : 0;
  };

  const addItem = () => {
    setItems([...items, { item_type: 'Shirt', service_type: 'Regular Wash', quantity: 1, price: 0 }]);
  };

  const updateItem = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    if (field === 'item_type' || field === 'service_type') {
      newItems[index].price = getPrice(newItems[index].item_type, newItems[index].service_type);
    }
    setItems(newItems);
  };

  const removeItem = (index) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const calculateTotal = () => {
    let itemsTotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    let pickupFee = pickup ? 30 : 0;
    let deliveryFee = delivery ? 30 : 0;
    
    if (itemsTotal >= 700) {
      pickupFee = 0;
      deliveryFee = 0;
    }
    
    return { itemsTotal, pickupFee, deliveryFee, total: itemsTotal + pickupFee + deliveryFee };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (items.length === 0) {
      toast.error('Add at least one item');
      return;
    }
    
    setLoading(true);
    
    const orderData = {
      provider_id: parseInt(providerId),
      pickup,
      delivery,
      customer_latitude: 12.9716,
      customer_longitude: 77.5946,
      customer_address: address,
      items: items.map(item => ({
        item_type: item.item_type,
        service_type: item.service_type,
        quantity: parseInt(item.quantity)
      }))
    };
    
    try {
      const response = await axios.post(`${API_URL}/orders/create`, orderData, {
        headers: { Authorization: token }
      });
      
      toast.success('Order created successfully!');
      navigate(`/customer/track-order/${response.data.order_id}`);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to create order');
    } finally {
      setLoading(false);
    }
  };

  const { itemsTotal, pickupFee, deliveryFee, total } = calculateTotal();

  if (!provider) {
    return <div className="flex justify-center items-center min-h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-3xl">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-primary to-secondary p-6 text-white">
            <h1 className="text-2xl font-bold">Create Order</h1>
            <p className="opacity-90">{provider.shop_name} - {provider.address}</p>
          </div>
          
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Items Section */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Items to Clean</h2>
                <button type="button" onClick={addItem} className="text-primary font-semibold">+ Add Item</button>
              </div>
              
              {items.length === 0 ? (
                <div className="text-center py-8 text-gray-400">Click "Add Item" to start</div>
              ) : (
                items.map((item, index) => (
                  <div key={index} className="border rounded-lg p-4 mb-3">
                    <div className="grid grid-cols-3 gap-3">
                      <select
                        value={item.item_type}
                        onChange={(e) => updateItem(index, 'item_type', e.target.value)}
                        className="input-field text-sm"
                      >
                        {itemTypes.map(type => <option key={type}>{type}</option>)}
                      </select>
                      
                      <select
                        value={item.service_type}
                        onChange={(e) => updateItem(index, 'service_type', e.target.value)}
                        className="input-field text-sm"
                      >
                        {serviceTypes.map(type => <option key={type}>{type}</option>)}
                      </select>
                      
                      <div className="flex gap-2">
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value))}
                          className="input-field text-sm w-20"
                          min="1"
                        />
                        <button type="button" onClick={() => removeItem(index)} className="text-red-500">✕</button>
                      </div>
                    </div>
                    <div className="text-sm text-gray-500 mt-2">Price: ₹{item.price || getPrice(item.item_type, item.service_type)}/item</div>
                  </div>
                ))
              )}
            </div>
            
            {/* Pickup/Delivery */}
            <div className="border-t pt-4">
              <h2 className="text-xl font-semibold mb-4">Pickup & Delivery</h2>
              <div className="flex gap-6">
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={pickup} onChange={(e) => setPickup(e.target.checked)} className="w-5 h-5" />
                  <span>Pickup (₹30)</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={delivery} onChange={(e) => setDelivery(e.target.checked)} className="w-5 h-5" />
                  <span>Delivery (₹30)</span>
                </label>
              </div>
              <p className="text-xs text-gray-400 mt-2">*Free pickup & delivery on orders above ₹700</p>
            </div>
            
            {/* Address */}
            <div>
              <label className="block font-semibold mb-2">Delivery Address</label>
              <textarea value={address} onChange={(e) => setAddress(e.target.value)} className="input-field" rows="2" required />
            </div>
            
            {/* Price Summary */}
            <div className="bg-gray-50 rounded-xl p-4">
              <h3 className="font-bold mb-3">Price Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span>Items Total:</span><span>₹{itemsTotal}</span></div>
                {pickupFee > 0 && <div className="flex justify-between"><span>Pickup Fee:</span><span>₹{pickupFee}</span></div>}
                {deliveryFee > 0 && <div className="flex justify-between"><span>Delivery Fee:</span><span>₹{deliveryFee}</span></div>}
                <div className="border-t pt-2 font-bold flex justify-between"><span>Total:</span><span>₹{total}</span></div>
              </div>
            </div>
            
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? 'Creating Order...' : `Place Order • ₹${total}`}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateOrder;
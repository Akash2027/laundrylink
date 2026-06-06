import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';

const ProviderPricing = () => {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [provider, setProvider] = useState(null);
  const [pricing, setPricing] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const API_URL = 'http://localhost:5000/api';

  const itemTypes = ['Shirt', 'Pant', 'Saree', 'T-Shirt', 'Jeans', 'Towel', 'Blanket', 'Suit', 'Kurta'];
  const serviceTypes = ['Regular Wash', 'Wash + Iron', 'Iron Only', 'Hot Water Wash', 'Dry Cleaning'];

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await axios.get(`${API_URL}/provider/profile`, {
        headers: { Authorization: token }
      });
      setProvider(response.data.provider);
      setPricing(response.data.pricing);
    } catch (error) {
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const getPrice = (itemType, serviceType) => {
    const priceItem = pricing.find(p => p.item_type === itemType && p.service_type === serviceType);
    return priceItem ? priceItem.price_per_item : '';
  };

  const updatePrice = (itemType, serviceType, value) => {
    const newPrice = parseFloat(value);
    if (isNaN(newPrice)) return;
    
    const existing = pricing.find(p => p.item_type === itemType && p.service_type === serviceType);
    if (existing) {
      setPricing(pricing.map(p => 
        p.item_type === itemType && p.service_type === serviceType 
          ? { ...p, price_per_item: newPrice }
          : p
      ));
    } else {
      setPricing([...pricing, { item_type: itemType, service_type: serviceType, price_per_item: newPrice }]);
    }
  };

  const savePricing = async () => {
    setUpdating(true);
    const pricingData = pricing.map(p => ({
      item_type: p.item_type,
      service_type: p.service_type,
      price_per_item: parseFloat(p.price_per_item)
    }));
    
    try {
      await axios.post(`${API_URL}/provider/set-pricing`, { pricing_data: pricingData }, {
        headers: { Authorization: token }
      });
      toast.success('Pricing saved successfully');
      fetchProfile();
    } catch (error) {
      toast.error('Failed to save pricing');
    } finally {
      setUpdating(false);
    }
  };

  const updateShopDetails = async () => {
    const newRadius = prompt('Enter service radius (km):', provider?.service_radius_km);
    if (newRadius) {
      try {
        await axios.put(`${API_URL}/provider/update`, { service_radius_km: parseFloat(newRadius) }, {
          headers: { Authorization: token }
        });
        toast.success('Service radius updated');
        fetchProfile();
      } catch (error) {
        toast.error('Update failed');
      }
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white shadow-lg sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🧺</span>
            <span className="text-xl font-bold text-primary">LaundryLink - Pricing</span>
          </div>
          <div className="flex gap-4">
            <button onClick={() => navigate('/provider/dashboard')} className="text-gray-600 hover:text-primary">Dashboard</button>
            <button onClick={() => navigate('/provider/orders')} className="text-gray-600 hover:text-primary">Orders</button>
            <button onClick={() => { localStorage.removeItem('token'); navigate('/login'); }} className="text-red-500">Logout</button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        {/* Shop Info */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex justify-between items-start flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">{provider?.shop_name}</h1>
              <p className="text-gray-500 mt-1">{provider?.address}</p>
              <div className="flex gap-4 mt-2">
                <span className="text-sm text-gray-500">📞 {provider?.phone}</span>
                <span className="text-sm text-gray-500">📧 {provider?.email}</span>
                <span className="text-sm text-gray-500">📍 Radius: {provider?.service_radius_km} km</span>
              </div>
            </div>
            <button onClick={updateShopDetails} className="btn-outline text-sm">
              Update Service Radius
            </button>
          </div>
        </div>

        {/* Pricing Table */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-primary to-secondary p-5 text-white flex justify-between items-center">
            <h2 className="text-xl font-bold">Pricing Matrix (₹ per item)</h2>
            <button onClick={savePricing} disabled={updating} className="bg-white text-primary px-4 py-2 rounded-lg font-semibold hover:bg-gray-100">
              {updating ? 'Saving...' : 'Save Changes'}
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Item / Service</th>
                  {serviceTypes.map(service => (
                    <th key={service} className="px-4 py-3 text-left text-sm font-semibold text-gray-600">{service}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {itemTypes.map(item => (
                  <tr key={item} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-800">{item}</td>
                    {serviceTypes.map(service => (
                      <td key={service} className="px-4 py-2">
                        <input
                          type="number"
                          value={getPrice(item, service)}
                          onChange={(e) => updatePrice(item, service, e.target.value)}
                          className="w-24 px-3 py-2 border rounded-lg focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                          placeholder="₹"
                          step="5"
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-4 bg-gray-50 text-sm text-gray-500">
            💡 Tip: Set competitive prices to attract more customers. Premium customers get 10% discount automatically.
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProviderPricing;
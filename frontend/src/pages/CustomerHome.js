import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';

const API_URL = 'https://laundrylink-backend-sa7w.onrender.com/api';

const CustomerHome = () => {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [radius, setRadius] = useState(50);
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user && token) {
      fetchProviders();
    }
  }, [radius, user, token]);

  const fetchProviders = async () => {
    setLoading(true);
    
    // Use user's coordinates from database
    const lat = user?.latitude;
    const lng = user?.longitude;
    
    if (!lat || !lng) {
      toast.error('Your location not set. Please update your profile address.');
      setLoading(false);
      return;
    }
    
    try {
      const response = await axios.get(
        `${API_URL}/orders/providers/nearby?latitude=${lat}&longitude=${lng}`,
        { headers: { Authorization: token } }
      );
      
      let allProvs = response.data.providers || [];
      let filtered = allProvs.filter(p => (p.distance_km || 999) <= radius);
      filtered.sort((a, b) => (a.distance_km || 999) - (b.distance_km || 999));
      
      setProviders(filtered);
    } catch (error) {
      toast.error('Failed to load providers');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">LaundryLink</h1>
        <div className="flex gap-3">
          <span>👤 {user?.name}</span>
          <button onClick={handleLogout} className="text-red-500">Logout</button>
        </div>
      </div>

      <div className="mb-4">
        <label className="block mb-2">Search radius (km):</label>
        <select value={radius} onChange={(e) => setRadius(Number(e.target.value))} className="border p-2 rounded">
          <option value={5}>5 km</option>
          <option value={10}>10 km</option>
          <option value={20}>20 km</option>
          <option value={30}>30 km</option>
          <option value={50}>50 km</option>
        </select>
      </div>

      {loading ? (
        <div>Loading...</div>
      ) : providers.length === 0 ? (
        <div>No providers found within {radius} km</div>
      ) : (
        <div className="space-y-3">
          {providers.map(p => (
            <div key={p.id} className="border p-4 rounded cursor-pointer" onClick={() => navigate(`/customer/create-order/${p.id}`)}>
              <h3 className="font-bold">{p.shop_name}</h3>
              <p className="text-gray-600 text-sm">{p.address}</p>
              <p className="text-blue-600 text-sm mt-1">{p.distance_km?.toFixed(1)} km away</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CustomerHome;
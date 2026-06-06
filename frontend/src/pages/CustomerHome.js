import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from '../components/ThemeToggle';
import ProfileModal from '../components/ProfileModal';
import axios from 'axios';
import toast from 'react-hot-toast';
import { API_URL } from '../config/api';

const CustomerHome = () => {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showProfile, setShowProfile] = useState(false);
  const [radius, setRadius] = useState(10);
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();

  const API_URL = 'http://localhost:5000/api';

  // Available radius options
  const radiusOptions = [5, 10, 20, 30, 50];

  // Get user's location from profile or GPS
  const getUserLocation = () => {
    return new Promise((resolve) => {
      if (user?.latitude && user?.longitude) {
        resolve({ lat: user.latitude, lng: user.longitude });
      } else if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            resolve({ lat: position.coords.latitude, lng: position.coords.longitude });
          },
          () => {
            resolve({ lat: 12.9716, lng: 77.5946 });
          }
        );
      } else {
        resolve({ lat: 12.9716, lng: 77.5946 });
      }
    });
  };

  const fetchProviders = async () => {
    setLoading(true);
    try {
      const location = await getUserLocation();
      
      const response = await axios.get(
        `${API_URL}/orders/providers/nearby?latitude=${location.lat}&longitude=${location.lng}`,
        { headers: { Authorization: token } }
      );
      
    
      let allProvs = response.data.providers || [];
      
      // Filter by radius
      let filtered = allProvs.filter(p => (p.distance_km || 999) <= radius);
      
      // Sort by distance (closest first)
      filtered.sort((a, b) => (a.distance_km || 999) - (b.distance_km || 999));
      
      setProviders(filtered);
    } catch (error) {
      toast.error('Failed to load providers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProviders();
  }, [radius]);

  const handleRadiusChange = (newRadius) => {
    setRadius(newRadius);
  };

  // Find next larger radius options for suggestions
  const getSuggestedRadii = () => {
    const largerRadii = radiusOptions.filter(r => r > radius);
    return largerRadii;
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-primary)' }}>
      {/* Header */}
      <header className="sticky top-0 z-40 border-b" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border)' }}>
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🧺</span>
            <span className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>LaundryLink</span>
          </div>
          
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowProfile(true)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg transition"
              style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}
            >
              <span className="text-lg">👤</span>
              <span className="font-medium hidden sm:inline">{user?.name?.split(' ')[0]}</span>
            </button>
            <button
              onClick={logout}
              className="px-3 py-2 rounded-lg text-red-500 hover:bg-red-50 transition"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Welcome Section */}
      <div className="container mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
          Hello, {user?.name?.split(' ')[0]}! 👋
        </h1>
        <p className="mt-1" style={{ color: 'var(--text-secondary)' }}>
          Find laundry services near you
        </p>
      </div>

      {/* Radius Filter */}
      <div className="container mx-auto px-4 py-2">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Search radius:</span>
          <div className="flex gap-2 flex-wrap">
            {radiusOptions.map((km) => (
              <button
                key={km}
                onClick={() => handleRadiusChange(km)}
                className={`px-3 py-1 rounded-full text-sm transition ${
                  radius === km 
                    ? 'bg-blue-500 text-white' 
                    : 'border'
                }`}
                style={radius !== km ? { borderColor: 'var(--border)', color: 'var(--text-secondary)' } : {}}
              >
                {km} km
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Providers List */}
      <div className="container mx-auto px-4 py-6">
        <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
          Nearby Laundry Services ({providers.length} found)
        </h2>
        
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : providers.length === 0 ? (
          <div className="text-center py-12 rounded-xl" style={{ backgroundColor: 'var(--bg-secondary)' }}>
            <div className="text-5xl mb-3">📍</div>
            <p style={{ color: 'var(--text-secondary)' }}>No laundry shops found within {radius} km</p>
            <div className="flex flex-wrap justify-center gap-2 mt-4">
              {getSuggestedRadii().map((suggestedKm) => (
                <button
                  key={suggestedKm}
                  onClick={() => handleRadiusChange(suggestedKm)}
                  className="px-4 py-2 rounded-lg bg-blue-500 text-white text-sm font-medium hover:bg-blue-600 transition"
                >
                  Try {suggestedKm} km
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {providers.map((provider, index) => (
              <div
                key={provider.id}
                className="p-4 rounded-xl border cursor-pointer transition hover:shadow-md"
                style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border)' }}
                onClick={() => navigate(`/customer/create-order/${provider.id}`)}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">
                        {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '🏪'}
                      </span>
                      <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>{provider.shop_name}</h3>
                      {index < 3 && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700">
                          Top {index + 1}
                        </span>
                      )}
                    </div>
                    <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>{provider.address}</p>
                    <div className="flex flex-wrap gap-3 mt-2">
                      <span className="text-xs px-2 py-1 rounded-full" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-secondary)' }}>
                        📏 {provider.distance_km?.toFixed(1)} km away
                      </span>
                      <span className="text-xs px-2 py-1 rounded-full" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-secondary)' }}>
                        📞 {provider.phone}
                      </span>
                    </div>
                  </div>
                  <button className="px-4 py-2 rounded-lg text-sm bg-blue-500 text-white font-medium">
                    Order
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Theme Toggle & Profile Modal */}
      <ThemeToggle />
      <ProfileModal isOpen={showProfile} onClose={() => setShowProfile(false)} />
    </div>
  );
};

export default CustomerHome;
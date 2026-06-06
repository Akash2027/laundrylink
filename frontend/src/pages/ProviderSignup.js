import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';

const ProviderSignup = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    shop_name: '',
    address: '',
    latitude: '',
    longitude: '',
    service_radius_km: 5,
    services: ['Regular Wash', 'Wash + Iron', 'Dry Cleaning'],
    pricing: {}
  });

  const serviceOptions = [
    { id: 'Regular Wash', label: 'Regular Wash', priceRange: '₹40 - ₹150' },
    { id: 'Wash + Iron', label: 'Wash + Iron', priceRange: '₹60 - ₹200' },
    { id: 'Iron Only', label: 'Iron Only', priceRange: '₹20 - ₹80' },
    { id: 'Hot Water Wash', label: 'Hot Water Wash', priceRange: '₹70 - ₹200' },
    { id: 'Dry Cleaning', label: 'Dry Cleaning', priceRange: '₹100 - ₹350' }
  ];

  const itemTypes = ['Shirt', 'Pant', 'T-Shirt', 'Jeans', 'Saree', 'Towel', 'Blanket', 'Suit', 'Kurta'];

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const toggleService = (serviceId) => {
    if (formData.services.includes(serviceId)) {
      setFormData({ ...formData, services: formData.services.filter(s => s !== serviceId) });
    } else {
      setFormData({ ...formData, services: [...formData.services, serviceId] });
    }
  };

  const updatePricing = (itemType, serviceType, value) => {
    setFormData({
      ...formData,
      pricing: {
        ...formData.pricing,
        [`${itemType}_${serviceType}`]: parseInt(value) || 0
      }
    });
  };

  const getPrice = (itemType, serviceType) => {
    return formData.pricing[`${itemType}_${serviceType}`] || '';
  };

  const getLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData({
            ...formData,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
          toast.success('Location detected!');
        },
        (error) => {
          toast.error('Unable to get location');
        }
      );
    }
  };

  const handleNext = () => {
    if (step === 1) {
      if (!formData.shop_name || !formData.name || !formData.email || !formData.phone || !formData.password) {
        toast.error('Please fill all required fields');
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        toast.error('Passwords do not match');
        return;
      }
      if (formData.password.length < 6) {
        toast.error('Password must be at least 6 characters');
        return;
      }
    }
    if (step === 2) {
      if (!formData.address || !formData.latitude || !formData.longitude) {
        toast.error('Please enter address and get location');
        return;
      }
    }
    if (step === 3) {
      if (formData.services.length === 0) {
        toast.error('Please select at least one service');
        return;
      }
    }
    setStep(step + 1);
  };

  const handleBack = () => {
    setStep(step - 1);
  };

  const handleSubmit = async () => {
    // First register the user
    setLoading(true);
    
    const userResult = await register({
      name: formData.name,
      email: formData.email,
      password: formData.password,
      phone: formData.phone,
      role: 'customer' // Will be updated to provider after business registration
    });
    
    if (!userResult.success) {
      setLoading(false);
      return;
    }
    
    // Then register the provider business
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5000/api/provider/register-business', {
        shop_name: formData.shop_name,
        address: formData.address,
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude),
        service_radius_km: parseFloat(formData.service_radius_km)
      }, { headers: { Authorization: token } });
      
      // Set pricing
      const pricingData = [];
      for (const service of formData.services) {
        for (const item of itemTypes) {
          const price = getPrice(item, service);
          if (price && price > 0) {
            pricingData.push({
              item_type: item,
              service_type: service,
              price_per_item: price
            });
          }
        }
      }
      
      if (pricingData.length > 0) {
        await axios.post('http://localhost:5000/api/provider/set-pricing', {
          pricing_data: pricingData
        }, { headers: { Authorization: token } });
      }
      
      toast.success('Provider registration complete!');
      navigate('/provider/dashboard');
    } catch (error) {
      toast.error('Failed to complete provider registration');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-800 to-pink-700 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20"
        >
          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex justify-between mb-2">
              {[1, 2, 3, 4].map((s) => (
                <div key={s} className={`text-sm ${step >= s ? 'text-yellow-300' : 'text-white/40'}`}>
                  Step {s}
                </div>
              ))}
            </div>
            <div className="h-2 bg-white/20 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-yellow-400 to-pink-500 transition-all duration-300" style={{ width: `${(step / 4) * 100}%` }}></div>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {/* Step 1: Basic Info */}
            {step === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h2 className="text-2xl font-bold text-white mb-6">Basic Information</h2>
                <div className="space-y-4">
                  <input type="text" name="shop_name" value={formData.shop_name} onChange={handleChange} placeholder="Shop Name" className="w-full px-4 py-3 rounded-xl bg-white/20 text-white placeholder-white/50 border border-white/30 focus:border-yellow-400 outline-none" required />
                  <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Owner Full Name" className="w-full px-4 py-3 rounded-xl bg-white/20 text-white placeholder-white/50 border border-white/30 focus:border-yellow-400 outline-none" required />
                  <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="Email Address" className="w-full px-4 py-3 rounded-xl bg-white/20 text-white placeholder-white/50 border border-white/30 focus:border-yellow-400 outline-none" required />
                  <input type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder="Phone Number" className="w-full px-4 py-3 rounded-xl bg-white/20 text-white placeholder-white/50 border border-white/30 focus:border-yellow-400 outline-none" required />
                  <div className="grid md:grid-cols-2 gap-4">
                    <input type="password" name="password" value={formData.password} onChange={handleChange} placeholder="Password" className="w-full px-4 py-3 rounded-xl bg-white/20 text-white placeholder-white/50 border border-white/30 focus:border-yellow-400 outline-none" required />
                    <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} placeholder="Confirm Password" className="w-full px-4 py-3 rounded-xl bg-white/20 text-white placeholder-white/50 border border-white/30 focus:border-yellow-400 outline-none" required />
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 2: Address & Location */}
            {step === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h2 className="text-2xl font-bold text-white mb-6">Business Address</h2>
                <div className="space-y-4">
                  <button type="button" onClick={getLocation} className="px-4 py-2 rounded-lg bg-yellow-400/20 text-yellow-300 text-sm font-semibold hover:bg-yellow-400/30 transition">📍 Use My Location</button>
                  <textarea name="address" value={formData.address} onChange={handleChange} placeholder="Shop Address" rows="3" className="w-full px-4 py-3 rounded-xl bg-white/20 text-white placeholder-white/50 border border-white/30 focus:border-yellow-400 outline-none" required />
                  <div className="grid md:grid-cols-2 gap-4">
                    <input type="text" name="latitude" value={formData.latitude} onChange={handleChange} placeholder="Latitude (auto-filled)" className="w-full px-4 py-3 rounded-xl bg-white/20 text-white placeholder-white/50 border border-white/30" readOnly />
                    <input type="text" name="longitude" value={formData.longitude} onChange={handleChange} placeholder="Longitude (auto-filled)" className="w-full px-4 py-3 rounded-xl bg-white/20 text-white placeholder-white/50 border border-white/30" readOnly />
                  </div>
                  <div>
                    <label className="text-white/70 text-sm mb-2 block">Service Radius (km)</label>
                    <input type="range" name="service_radius_km" min="1" max="25" value={formData.service_radius_km} onChange={handleChange} className="w-full" />
                    <span className="text-white">{formData.service_radius_km} km</span>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 3: Select Services */}
            {step === 3 && (
              <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h2 className="text-2xl font-bold text-white mb-6">Services You Offer</h2>
                <div className="space-y-3">
                  {serviceOptions.map(service => (
                    <label key={service.id} className="flex items-center justify-between p-4 rounded-xl bg-white/10 cursor-pointer hover:bg-white/20 transition">
                      <div>
                        <span className="text-white font-medium">{service.label}</span>
                        <p className="text-white/40 text-sm">{service.priceRange}</p>
                      </div>
                      <input type="checkbox" checked={formData.services.includes(service.id)} onChange={() => toggleService(service.id)} className="w-5 h-5" />
                    </label>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Step 4: Set Pricing */}
            {step === 4 && (
              <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h2 className="text-2xl font-bold text-white mb-6">Set Your Prices (₹ per item)</h2>
                <div className="overflow-x-auto max-h-96 overflow-y-auto">
                  <table className="w-full text-white">
                    <thead className="bg-white/10 sticky top-0">
                      <tr><th className="p-2 text-left">Item</th>{formData.services.map(s => <th key={s} className="p-2 text-left text-sm">{s}</th>)}</tr>
                    </thead>
                    <tbody>
                      {itemTypes.map(item => (
                        <tr key={item} className="border-t border-white/10">
                          <td className="p-2 font-medium">{item}</td>
                          {formData.services.map(service => (
                            <td key={service} className="p-2"><input type="number" value={getPrice(item, service)} onChange={(e) => updatePricing(item, service, e.target.value)} className="w-24 px-2 py-1 rounded bg-white/20 text-white placeholder-white/50 border border-white/30 focus:border-yellow-400 outline-none" placeholder="₹" step="5" /></td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8">
            {step > 1 && <button onClick={handleBack} className="px-6 py-2 rounded-xl bg-white/20 text-white font-semibold hover:bg-white/30 transition">Back</button>}
            {step < 4 && <button onClick={handleNext} className="px-6 py-2 rounded-xl bg-gradient-to-r from-yellow-400 to-pink-500 text-white font-semibold hover:shadow-xl transition ml-auto">Next →</button>}
            {step === 4 && <button onClick={handleSubmit} disabled={loading} className="px-6 py-2 rounded-xl bg-gradient-to-r from-yellow-400 to-pink-500 text-white font-semibold hover:shadow-xl transition ml-auto disabled:opacity-50">{loading ? 'Registering...' : 'Complete Registration →'}</button>}
          </div>

          <p className="text-center text-white/40 mt-6 text-sm">Already have an account? <Link to="/login" className="text-yellow-300">Login</Link></p>
        </motion.div>
      </div>
    </div>
  );
};

export default ProviderSignup;
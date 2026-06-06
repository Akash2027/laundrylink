import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import LocationPickerMap from '../components/LocationPickerMap';
import toast from 'react-hot-toast';

const CustomerSignup = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    address: '',
    latitude: '',
    longitude: ''
  });
  
  const [errors, setErrors] = useState({});
  const [passwordRequirements, setPasswordRequirements] = useState({
    length: false,
    uppercase: false,
    number: false
  });

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) return 'Email is required';
    if (!emailRegex.test(email)) return 'Enter valid email (e.g., name@example.com)';
    return '';
  };

  const validatePassword = (password) => {
    const requirements = {
      length: password.length >= 6,
      uppercase: /[A-Z]/.test(password),
      number: /[0-9]/.test(password)
    };
    setPasswordRequirements(requirements);
    
    if (!password) return 'Password is required';
    if (password.length < 6) return 'Password must be at least 6 characters';
    return '';
  };

  const validatePhone = (phone) => {
    if (!phone) return 'Phone number is required';
    if (!/^\d{10}$/.test(phone)) return 'Enter 10-digit mobile number';
    return '';
  };

  const validateName = (name) => {
    if (!name) return 'Full name is required';
    if (name.length < 2) return 'Enter valid name';
    return '';
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (name === 'email') {
      setErrors(prev => ({ ...prev, email: validateEmail(value) }));
    }
    if (name === 'password') {
      setErrors(prev => ({ ...prev, password: validatePassword(value) }));
      if (formData.confirmPassword && value !== formData.confirmPassword) {
        setErrors(prev => ({ ...prev, confirmPassword: 'Passwords do not match' }));
      } else {
        setErrors(prev => ({ ...prev, confirmPassword: '' }));
      }
    }
    if (name === 'confirmPassword') {
      setErrors(prev => ({ ...prev, confirmPassword: value !== formData.password ? 'Passwords do not match' : '' }));
    }
    if (name === 'phone') {
      setErrors(prev => ({ ...prev, phone: validatePhone(value) }));
    }
    if (name === 'name') {
      setErrors(prev => ({ ...prev, name: validateName(value) }));
    }
  };

  const handlePhoneChange = (e) => {
    let value = e.target.value.replace(/[^0-9]/g, '');
    if (value.length > 10) value = value.slice(0, 10);
    setFormData(prev => ({ ...prev, phone: value }));
    setErrors(prev => ({ ...prev, phone: validatePhone(value) }));
  };

  const handleLocationSelect = (locationData) => {
    setFormData(prev => ({
      ...prev,
      latitude: locationData.lat,
      longitude: locationData.lng,
      address: locationData.address
    }));
    setErrors(prev => ({ ...prev, address: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const newErrors = {
      name: validateName(formData.name),
      email: validateEmail(formData.email),
      phone: validatePhone(formData.phone),
      password: validatePassword(formData.password),
      confirmPassword: formData.password !== formData.confirmPassword ? 'Passwords do not match' : '',
      address: !formData.address ? 'Please select your location on map' : ''
    };
    
    setErrors(newErrors);
    
    const hasError = Object.values(newErrors).some(err => err !== '');
    if (hasError) {
      toast.error('Please fix the errors');
      return;
    }
    
    setLoading(true);
    
    const result = await register({
      name: formData.name,
      email: formData.email,
      password: formData.password,
      phone: `+91 ${formData.phone}`,
      address: formData.address,
      latitude: formData.latitude,
      longitude: formData.longitude,
      role: 'customer'
    });
    
    if (result.success) {
      navigate('/customer/home');
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 py-12" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <button onClick={toggleTheme} className="fixed top-4 right-4 p-2 rounded-full z-10" style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
        {isDark ? '☀️' : '🌙'}
      </button>

      <div className="w-full max-w-md" style={{ backgroundColor: 'var(--bg-secondary)', borderRadius: '24px', boxShadow: 'var(--card-shadow)' }}>
        <div className="p-8">
          <div className="text-center mb-6">
            <div className="text-5xl mb-3">🧺</div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Create Account</h1>
            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Join as a customer</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={`input-field ${errors.name ? 'error' : ''}`}
                placeholder="Full Name"
              />
              {errors.name && <p className="error-text">{errors.name}</p>}
            </div>

            <div>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`input-field ${errors.email ? 'error' : ''}`}
                placeholder="Email Address"
              />
              {errors.email && <p className="error-text">{errors.email}</p>}
            </div>

            <div>
              <div className="flex items-center border rounded-xl" style={{ borderColor: errors.phone ? '#ef4444' : 'var(--border)', backgroundColor: 'var(--bg-secondary)' }}>
                <span className="px-3" style={{ color: 'var(--text-secondary)' }}>+91</span>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={handlePhoneChange}
                  className="w-full px-0 py-3 pr-3 outline-none bg-transparent"
                  style={{ color: 'var(--text-primary)' }}
                  placeholder="98765 43210"
                  maxLength="10"
                />
              </div>
              {errors.phone && <p className="error-text">{errors.phone}</p>}
            </div>

            <div>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={`input-field ${errors.password ? 'error' : ''}`}
                placeholder="Password (min 6 characters)"
              />
              {errors.password && <p className="error-text">{errors.password}</p>}
              
              <div className="mt-2 space-y-1">
                <p className="text-xs" style={{ color: passwordRequirements.length ? '#10b981' : 'var(--text-secondary)' }}>
                  {passwordRequirements.length ? '✓' : '○'} At least 6 characters
                </p>
              </div>
            </div>

            <div>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className={`input-field ${errors.confirmPassword ? 'error' : ''}`}
                placeholder="Confirm Password"
              />
              {errors.confirmPassword && <p className="error-text">{errors.confirmPassword}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                Your Location
              </label>
              <LocationPickerMap onLocationSelect={handleLocationSelect} />
              {errors.address && <p className="error-text">{errors.address}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full"
            >
              {loading ? 'Creating Account...' : 'Sign Up'}
            </button>
          </form>

          <p className="text-center text-sm mt-6" style={{ color: 'var(--text-secondary)' }}>
            Already have an account?{' '}
            <Link to="/login" className="text-blue-500 font-semibold hover:underline">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default CustomerSignup;
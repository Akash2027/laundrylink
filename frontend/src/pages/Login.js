import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from '../components/ThemeToggle';
import toast from 'react-hot-toast';



const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      setEmailError('Email is required');
      return false;
    }
    if (!emailRegex.test(email)) {
      setEmailError('Enter a valid email (e.g., name@example.com)');
      return false;
    }
    setEmailError('');
    return true;
  };

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    validateEmail(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateEmail(email)) return;
    if (!password) {
      toast.error('Password is required');
      return;
    }
    
    setLoading(true);
    const result = await login(email, password);
    
    if (result.success) {
      if (result.user.role === 'customer') {
        navigate('/customer/home');
      } else if (result.user.role === 'provider') {
        navigate('/provider/dashboard');
      } else if (result.user.role === 'admin') {
        navigate('/admin/disputes');
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <ThemeToggle />

      <div className="w-full max-w-md" style={{ backgroundColor: 'var(--bg-secondary)', borderRadius: '24px', boxShadow: 'var(--card-shadow)' }}>
        <div className="p-8">
          <div className="text-center mb-8">
            <div className="text-5xl mb-3">🧺</div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Welcome Back</h1>
            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Sign in to your account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={handleEmailChange}
                className={`input-field ${emailError ? 'error' : ''}`}
                placeholder="you@example.com"
              />
              {emailError && <p className="error-text">{emailError}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-sm mt-6" style={{ color: 'var(--text-secondary)' }}>
            Don't have an account?{' '}
            <Link to="/customer/signup" className="text-blue-500 font-semibold hover:underline">
              Create Account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
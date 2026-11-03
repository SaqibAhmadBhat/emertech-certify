import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { 
  ShieldCheck, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  AlertCircle, 
  Sparkles
} from 'lucide-react';
import { api } from '../api/apiClient';
import auth from '../utils/auth';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const from = location.state?.from?.pathname || null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please provide both email and password.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await api.post('/auth/login', { email, password });
      
      auth.login(response.token, response.user);

      // Trigger custom authChange event for Navbar
      window.dispatchEvent(new Event('authChange'));

      // Role-based redirection
      if (from) {
        navigate(from, { replace: true });
      } else if (response.user.role === 'admin') {
        navigate('/admin', { replace: true });
      } else if (response.user.role === 'university') {
        navigate('/university', { replace: true });
      } else if (response.user.role === 'student') {
        navigate('/student', { replace: true });
      } else {
        navigate('/', { replace: true });
      }

    } catch (err) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  // Demo helpers for easy academic evaluation
  const setDemoCredentials = (role) => {
    if (role === 'admin') {
      setEmail('admin@emertech.local');
      setPassword('admin123');
    } else if (role === 'university') {
      setEmail('vc@gce-tveli.edu.in');
      setPassword('UniversitySecret123');
    } else if (role === 'student') {
      setEmail('saqib.student@gce.edu.in');
      setPassword('StudentSecurePassword123');
    }
    setError(null);
  };

  return (
    <div className="auth-page-root">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-brand-icon">
            <ShieldCheck size={28} />
          </div>
          <h2 className="auth-title">Sign in to Emertech Certify</h2>
          <p className="auth-subtitle">
            Access institutional issuance controls, student certificates, or admin portal
          </p>
        </div>

        {error && (
          <div className="auth-error-alert">
            <AlertCircle size={18} className="error-icon" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <div className="input-with-icon">
              <Mail size={18} className="input-icon" />
              <input
                type="email"
                className="form-input"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <div className="label-row">
              <label className="form-label">Password</label>
            </div>
            <div className="input-with-icon">
              <Lock size={18} className="input-icon" />
              <input
                type={showPassword ? 'text' : 'password'}
                className="form-input"
                placeholder="Enter account password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="btn-toggle-password"
                onClick={() => setShowPassword(!showPassword)}
                aria-label="Toggle password visibility"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn-primary auth-submit-btn"
            disabled={loading}
          >
            {loading ? 'Authenticating...' : 'Sign In'} <ArrowRight size={16} />
          </button>
        </form>

        {/* Academic Demo Helper Pills */}
        <div className="demo-credentials-box">
          <div className="demo-header">
            <Sparkles size={14} className="sparkle-icon" />
            <span>Academic Demonstration Credentials:</span>
          </div>
          <div className="demo-pills-row">
            <button 
              type="button" 
              className="demo-pill admin-pill"
              onClick={() => setDemoCredentials('admin')}
            >
              Admin Demo
            </button>
            <button 
              type="button" 
              className="demo-pill uni-pill"
              onClick={() => setDemoCredentials('university')}
            >
              Institution Demo
            </button>
            <button 
              type="button" 
              className="demo-pill student-pill"
              onClick={() => setDemoCredentials('student')}
            >
              Student Demo
            </button>
          </div>
        </div>

        <div className="auth-footer-prompt">
          <span>Don't have an account yet? </span>
          <Link to="/register" className="auth-link">Register Institution or Student</Link>
        </div>
      </div>
    </div>
  );
}

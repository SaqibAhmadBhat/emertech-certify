import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import Logo from '../components/Logo';

export default function RegisterPage({ onLoginSuccess }) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      const res = await axios.post('/api/v2/auth/register', {
        fullName: formData.fullName.trim(),
        email: formData.email.trim(),
        password: formData.password
      });
      const { token, user } = res.data;

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      onLoginSuccess(user);
      navigate('/student');
    } catch (err) {
      if (err.response?.status === 404 || err.response?.status === 405 || !err.response) {
        setErrorMsg(`Backend API offline or unreachable (HTTP ${err.response?.status || 'Network Error'}). A running backend service is required for registration.`);
      } else {
        setErrorMsg(err.response?.data?.message || 'Registration failed.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '480px', margin: '3rem auto' }}>
      <div className="surface-card">
        <div style={{ textAlign: 'center', marginBottom: '1.8rem' }}>
          <Logo size={42} />
          <h3 style={{ fontSize: '1.4rem', marginTop: '1rem', color: '#FFFFFF' }}>Create User Account</h3>
          <p style={{ color: '#94A3B8', fontSize: '0.85rem' }}>Join the Emertech Certify trust network</p>
        </div>

        {errorMsg && (
          <div style={{
            background: 'rgba(244, 63, 94, 0.1)',
            border: '1px solid rgba(244, 63, 94, 0.3)',
            padding: '0.75rem',
            borderRadius: '6px',
            color: '#F43F5E',
            fontSize: '0.85rem',
            marginBottom: '1.25rem'
          }}>
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Full Legal Name:</label>
            <input
              type="text"
              className="form-input"
              required
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              placeholder="Saqib Ahmad Bhat"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Email Address:</label>
            <input
              type="email"
              className="form-input"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="saqib@gce.edu.in"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password:</label>
            <input
              type="password"
              className="form-input"
              required
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="••••••••"
            />
          </div>

          <div style={{
            background: 'rgba(56, 189, 248, 0.08)',
            border: '1px solid rgba(56, 189, 248, 0.2)',
            borderRadius: '6px',
            padding: '0.75rem',
            fontSize: '0.8rem',
            color: '#94A3B8',
            marginBottom: '1rem'
          }}>
            <strong style={{ color: '#38BDF8' }}>Student Least-Privilege Registration:</strong> Public registration provisions student accounts. You can link your official university enrollment in your student portal using your institution-issued verification token.
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', marginTop: '0.5rem' }}>
            {loading ? 'Registering Account...' : 'Register Account'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.85rem', color: '#94A3B8' }}>
          Already have an account? <Link to="/login" style={{ color: '#38BDF8', textDecoration: 'none' }}>Sign In here</Link>
        </div>
      </div>
    </div>
  );
}

import React from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="auth-page-root">
      <div className="auth-card" style={{ textAlign: 'center' }}>
        <AlertCircle size={48} color="var(--purple-700)" style={{ margin: '0 auto 16px auto' }} />
        <h2 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '8px' }}>Page Not Found</h2>
        <p style={{ color: 'var(--navy-600)', marginBottom: '24px', fontSize: '14px' }}>
          The requested page route does not exist in the Emertech Certify platform.
        </p>
        <Link to="/" className="btn-primary" style={{ display: 'inline-flex', margin: '0 auto' }}>
          <ArrowLeft size={16} /> Return to Home
        </Link>
      </div>
    </div>
  );
}


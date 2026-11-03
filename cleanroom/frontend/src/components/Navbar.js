import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import Logo from './Logo';
import { ShieldCheck, GraduationCap, Building2, UserCircle, LogOut } from 'lucide-react';

export default function Navbar({ user, onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <header className="clean-nav">
      <div className="nav-inner">
        <Link to="/" style={{ textDecoration: 'none' }}>
          <Logo size={36} />
        </Link>

        <nav className="nav-links">
          <Link to="/verify" className={`nav-link ${isActive('/verify') ? 'active' : ''}`}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
              <ShieldCheck size={16} /> Public Verifier
            </span>
          </Link>

          {user && user.role === 'STUDENT' && (
            <Link to="/student" className={`nav-link ${isActive('/student') ? 'active' : ''}`}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                <GraduationCap size={16} /> Student Transcripts
              </span>
            </Link>
          )}

          {user && (user.role === 'INSTITUTION_ADMIN' || user.role === 'SUPER_ADMIN') && (
            <Link to="/institution" className={`nav-link ${isActive('/institution') ? 'active' : ''}`}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                <Building2 size={16} /> Institution Portal
              </span>
            </Link>
          )}

          {user && user.role === 'SUPER_ADMIN' && (
            <Link to="/admin" className={`nav-link ${isActive('/admin') ? 'active' : ''}`}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                Admin Console
              </span>
            </Link>
          )}
        </nav>

        <div className="nav-actions">
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <span style={{ fontSize: '0.85rem', color: '#94A3B8' }}>
                {user.fullName} ({user.role})
              </span>
              <button onClick={onLogout} className="btn btn-secondary btn-sm" title="Sign Out">
                <LogOut size={14} /> Logout
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <Link to="/login" className="btn btn-secondary btn-sm">
                Sign In
              </Link>
              <Link to="/register" className="btn btn-primary btn-sm">
                Get Started
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

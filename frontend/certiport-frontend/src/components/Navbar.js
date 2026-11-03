import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  ShieldCheck, 
  Award, 
  FileCheck, 
  LogOut, 
  Menu, 
  X, 
  Settings,
  FileText
} from 'lucide-react';
import auth from '../utils/auth';

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentUser, setCurrentUser] = useState(auth.getUser());
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleAuthChange = () => {
      setCurrentUser(auth.getUser());
    };

    window.addEventListener('authChange', handleAuthChange);
    return () => window.removeEventListener('authChange', handleAuthChange);
  }, []);

  // Update on route change as well
  useEffect(() => {
    setCurrentUser(auth.getUser());
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    auth.logout();
    navigate('/');
  };

  const role = currentUser ? currentUser.role : null;

  return (
    <header className="navbar-container">
      <div className="navbar-inner">
        {/* Brand / Logo */}
        <Link to="/" className="navbar-brand">
          <div className="brand-icon-wrapper">
            <ShieldCheck className="brand-icon" size={24} />
          </div>
          <div className="brand-text-wrapper">
            <span className="brand-title">Emertech <span className="brand-highlight">Certify</span></span>
            <span className="brand-subtitle">AI & Blockchain Academic Registry</span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="navbar-links desktop-only">
          <Link to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}>
            Home
          </Link>
          <Link to="/verify" className={`nav-link ${location.pathname.startsWith('/verify') ? 'active' : ''}`}>
            <FileCheck size={16} />
            Verify Portal
          </Link>

          {/* Role specific links */}
          {role === 'admin' && (
            <Link to="/admin" className={`nav-link ${location.pathname === '/admin' ? 'active' : ''}`}>
              <Award size={16} />
              Admin Portal
            </Link>
          )}

          {role === 'university' && (
            <>
              <Link to="/university" className={`nav-link ${location.pathname === '/university' ? 'active' : ''}`}>
                <Award size={16} />
                Institution Portal
              </Link>
            </>
          )}

          {role === 'student' && (
            <Link to="/student" className={`nav-link ${location.pathname === '/student' ? 'active' : ''}`}>
              <FileText size={16} />
              My Certificates
            </Link>
          )}

          <Link to="/settings" className={`nav-link ${location.pathname === '/settings' ? 'active' : ''}`}>
            <Settings size={16} />
            System Status
          </Link>
        </nav>

        {/* Desktop Action Buttons */}
        <div className="navbar-actions desktop-only">
          {currentUser ? (
            <div className="user-profile-badge">
              <div className="user-info">
                <span className="user-name">{currentUser.name || currentUser.email}</span>
                <span className={`user-role-pill role-${currentUser.role}`}>
                  {currentUser.role === 'university' ? 'Institution' : currentUser.role.toUpperCase()}
                </span>
              </div>
              <button onClick={handleLogout} className="btn-logout" title="Sign Out">
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <div className="auth-buttons">
              <Link to="/login" className="btn-secondary btn-sm">
                Sign In
              </Link>
              <Link to="/register" className="btn-primary btn-sm">
                Register
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Hamburger Button */}
        <button 
          className="mobile-toggle-btn mobile-only" 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle Navigation Menu"
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Dropdown Menu */}
      {isMobileMenuOpen && (
        <div className="mobile-menu mobile-only">
          <Link to="/" className="mobile-nav-link">Home</Link>
          <Link to="/verify" className="mobile-nav-link">Verify Portal</Link>

          {role === 'admin' && (
            <Link to="/admin" className="mobile-nav-link">Admin Portal</Link>
          )}
          {role === 'university' && (
            <Link to="/university" className="mobile-nav-link">Institution Portal</Link>
          )}
          {role === 'student' && (
            <Link to="/student" className="mobile-nav-link">My Certificates</Link>
          )}

          <Link to="/settings" className="mobile-nav-link">System Status</Link>

          <div className="mobile-auth-section">
            {currentUser ? (
              <div className="mobile-user-details">
                <div className="mobile-user-name">
                  <strong>{currentUser.name || currentUser.email}</strong> ({currentUser.role})
                </div>
                <button onClick={handleLogout} className="btn-danger btn-block">
                  <LogOut size={16} /> Sign Out
                </button>
              </div>
            ) : (
              <div className="mobile-auth-grid">
                <Link to="/login" className="btn-secondary btn-block">Sign In</Link>
                <Link to="/register" className="btn-primary btn-block">Register</Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

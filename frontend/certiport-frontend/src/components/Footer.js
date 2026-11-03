import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="footer-root">
      <div className="footer-container">
        <div className="footer-top-grid">
          {/* Brand & Academic Identity */}
          <div className="footer-brand-col">
            <div className="footer-brand">
              <ShieldCheck className="footer-logo-icon" size={22} />
              <span className="footer-brand-title">Emertech Certify</span>
            </div>
            <p className="footer-desc">
              AI-Assisted Blockchain-Based Academic Certificate Verification System.
              Providing immutable, cryptographic document verification for educational institutions,
              graduates, and global verifiers.
            </p>
            <div className="footer-academic-pill">
              Academic Demonstration | AI & Blockchain Engineering
            </div>
          </div>

          {/* Quick Links */}
          <div className="footer-links-col">
            <h4 className="footer-col-title">Platform Access</h4>
            <ul className="footer-links-list">
              <li><Link to="/">Home Overview</Link></li>
              <li><Link to="/verify">Public Verification Portal</Link></li>
              <li><Link to="/login">Account Sign In</Link></li>
              <li><Link to="/register">Institution & Student Portal</Link></li>
              <li><Link to="/settings">System Architecture & Node Status</Link></li>
            </ul>
          </div>

          {/* Developer & Institution Attribution */}
          <div className="footer-links-col">
            <h4 className="footer-col-title">Author & Engineering Credits</h4>
            <div className="footer-credits-card">
              <p className="credit-role">Developer & Maintainer:</p>
              <p className="credit-name">Saqib Ahmad Bhat</p>
              <p className="credit-detail">B.E. Computer Science and Engineering</p>
              <p className="credit-institution">Government College of Engineering, Tirunelveli</p>
              <p className="credit-sub">AI and Blockchain Engineer Intern Context</p>
            </div>
          </div>
        </div>

        {/* Upstream Attribution & Disclaimer */}
        <div className="footer-attribution-section">
          <p className="footer-disclaimer-text">
            <strong>Open-Source Foundation & Attribution Notice:</strong> Emertech Certify is an academic demonstration developed and customized by <strong>Saqib Ahmad Bhat</strong> based on the open-source <strong>Certiport</strong> project by Alwin James (MIT License). This is an independent educational engineering project; it does not claim original authorship of the upstream Certiport baseline, nor does it imply official corporate commissioning or commercial endorsement by Emertech Innovations Private Limited.
          </p>
        </div>

        {/* Bottom Bar */}
        <div className="footer-bottom-bar">
          <div className="footer-bottom-left">
            <span>© {new Date().getFullYear()} <strong>Emertech Certify</strong> | Academic Demonstration</span>
          </div>
          <div className="footer-bottom-right">
            <span>Developed and customised by <strong>Saqib Ahmad Bhat</strong></span>
          </div>
        </div>
      </div>
    </footer>
  );
}

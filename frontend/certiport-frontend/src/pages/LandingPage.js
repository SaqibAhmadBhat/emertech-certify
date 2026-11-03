import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  ShieldCheck, 
  Search, 
  Cpu, 
  Lock, 
  FileCheck2, 
  Sparkles, 
  Database, 
  ArrowRight, 
  CheckCircle2, 
  Layers, 
  GraduationCap, 
  Building2, 
  FileSearch 
} from 'lucide-react';

export default function LandingPage() {
  const [quickId, setQuickId] = useState('');
  const navigate = useNavigate();

  const handleQuickVerify = (e) => {
    e.preventDefault();
    if (quickId.trim()) {
      navigate(`/verify?id=${encodeURIComponent(quickId.trim())}`);
    } else {
      navigate('/verify');
    }
  };

  return (
    <div className="landing-page-root">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-container">
          <div className="hero-badge">
            <Sparkles size={14} className="hero-badge-icon" />
            <span>AI-Assisted Blockchain Academic Verification System</span>
          </div>

          <h1 className="hero-title">
            Tamper-Proof Academic Certificates Secured by <span className="gradient-text">Ethereum Blockchain</span>
          </h1>

          <p className="hero-subtitle">
            Emertech Certify transforms university credentialing. Academic credentials are cryptographically
            hashed via SHA-256, permanently registered on a Solidity smart contract, and verified in real time
            with AI-assisted OCR data extraction.
          </p>

          {/* Quick Verification Bar */}
          <form onSubmit={handleQuickVerify} className="quick-verify-form">
            <div className="quick-verify-input-group">
              <Search className="search-icon" size={20} />
              <input
                type="text"
                className="quick-verify-input"
                placeholder="Enter Blockchain Certificate ID (e.g. UN01-CERT-ABC123-2026)"
                value={quickId}
                onChange={(e) => setQuickId(e.target.value)}
              />
              <button type="submit" className="btn-primary quick-verify-btn">
                Verify Document <ArrowRight size={16} />
              </button>
            </div>
            <div className="quick-verify-hints">
              <span>Or verify by uploading:</span>
              <Link to="/verify" className="hint-link">Original PDF File</Link>
              <span className="dot-sep">•</span>
              <Link to="/verify" className="hint-link">QR Code Scanner</Link>
            </div>
          </form>

          {/* Key Metric Highlights */}
          <div className="hero-stats-grid">
            <div className="stat-pill">
              <Lock className="stat-icon" size={18} />
              <div>
                <strong>SHA-256</strong>
                <span>Cryptographic Digest</span>
              </div>
            </div>
            <div className="stat-pill">
              <Cpu className="stat-icon" size={18} />
              <div>
                <strong>Local OCR</strong>
                <span>AI Field Extraction</span>
              </div>
            </div>
            <div className="stat-pill">
              <Database className="stat-icon" size={18} />
              <div>
                <strong>Solidity 0.8.19</strong>
                <span>Smart Contract Registry</span>
              </div>
            </div>
            <div className="stat-pill">
              <ShieldCheck className="stat-icon" size={18} />
              <div>
                <strong>Multi-Modal</strong>
                <span>Instant Verification</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Architecture & Workflow */}
      <section className="workflow-section">
        <div className="section-container">
          <div className="section-header">
            <h2 className="section-title">How Emertech Certify Works</h2>
            <p className="section-subtitle">
              A transparent four-stage cryptographic lifecycle guaranteeing credential integrity and permanence.
            </p>
          </div>

          <div className="workflow-grid">
            <div className="workflow-card">
              <div className="step-num">01</div>
              <div className="workflow-icon-box">
                <Building2 size={24} />
              </div>
              <h3 className="workflow-title">Authorized Issuance</h3>
              <p className="workflow-text">
                Approved universities author dynamic certificate templates. The administrator inputs student data or utilizes the <strong>Local AI OCR tool</strong> to auto-fill draft fields.
              </p>
            </div>

            <div className="workflow-card">
              <div className="step-num">02</div>
              <div className="workflow-icon-box">
                <Lock size={24} />
              </div>
              <h3 className="workflow-title">SHA-256 Hashing</h3>
              <p className="workflow-text">
                Puppeteer renders the final certificate into an official A4 PDF containing an embedded QR code. A 256-bit cryptographic digest (bytes32) of the exact binary is computed.
              </p>
            </div>

            <div className="workflow-card">
              <div className="step-num">03</div>
              <div className="workflow-icon-box">
                <Layers size={24} />
              </div>
              <h3 className="workflow-title">Blockchain Registration</h3>
              <p className="workflow-text">
                The document hash, unique Certificate ID, and issuer address are immutably minted onto the <code>CertificateRegistry</code> Solidity smart contract.
              </p>
            </div>

            <div className="workflow-card">
              <div className="step-num">04</div>
              <div className="workflow-icon-box">
                <FileCheck2 size={24} />
              </div>
              <h3 className="workflow-title">Public Verification</h3>
              <p className="workflow-text">
                Employers, universities, and verifiers verify authenticity via Certificate ID, PDF file upload, or QR code scan with tamper detection and revocation tracking.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Role Ecosystem */}
      <section className="ecosystem-section">
        <div className="section-container">
          <div className="section-header">
            <h2 className="section-title">Role-Based Platform Ecosystem</h2>
            <p className="section-subtitle">
              Tailored workflows for educational institutions, graduates, and global verifiers.
            </p>
          </div>

          <div className="ecosystem-grid">
            <div className="ecosystem-card">
              <div className="eco-header">
                <Building2 className="eco-icon" size={28} />
                <h3>Universities & Colleges</h3>
              </div>
              <ul className="eco-list">
                <li><CheckCircle2 size={16} /> Manage institutional accreditation details</li>
                <li><CheckCircle2 size={16} /> Upload custom EJS certificate templates</li>
                <li><CheckCircle2 size={16} /> AI OCR-assisted draft information extraction</li>
                <li><CheckCircle2 size={16} /> On-chain certificate minting & revocation</li>
                <li><CheckCircle2 size={16} /> Track complete issuance history</li>
              </ul>
              <Link to="/login" className="btn-secondary eco-btn">Institution Portal</Link>
            </div>

            <div className="ecosystem-card highlight-card">
              <div className="eco-header">
                <GraduationCap className="eco-icon highlight-icon" size={28} />
                <h3>Students & Graduates</h3>
              </div>
              <ul className="eco-list">
                <li><CheckCircle2 size={16} /> Instant access to digital academic credentials</li>
                <li><CheckCircle2 size={16} /> Download tamper-evident certificate PDFs</li>
                <li><CheckCircle2 size={16} /> Copy immutable Blockchain Verification ID</li>
                <li><CheckCircle2 size={16} /> View real-time blockchain registration status</li>
                <li><CheckCircle2 size={16} /> One-click sharing with prospective employers</li>
              </ul>
              <Link to="/register" className="btn-primary eco-btn">Student Portal</Link>
            </div>

            <div className="ecosystem-card">
              <div className="eco-header">
                <FileSearch className="eco-icon" size={28} />
                <h3>Public Verifiers & Employers</h3>
              </div>
              <ul className="eco-list">
                <li><CheckCircle2 size={16} /> Zero-login verification portal access</li>
                <li><CheckCircle2 size={16} /> Verify credentials using Certificate ID</li>
                <li><CheckCircle2 size={16} /> Binary PDF upload with SHA-256 check</li>
                <li><CheckCircle2 size={16} /> QR code scanning from physical prints</li>
                <li><CheckCircle2 size={16} /> Instant tamper & revocation status display</li>
              </ul>
              <Link to="/verify" className="btn-secondary eco-btn">Verify Credential</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Developer Academic Credit Banner */}
      <section className="academic-credit-section">
        <div className="section-container">
          <div className="credit-box">
            <div className="credit-content">
              <div className="credit-badge">Engineering Project Demonstration</div>
              <h3>Emertech Certify — Academic Implementation</h3>
              <p>
                Customized, re-engineered and maintained by <strong>Saqib Ahmad Bhat</strong>, 
                Department of Computer Science and Engineering, <strong>Government College of Engineering, Tirunelveli</strong>.
                Developed to showcase tamper-proof document verification architectures connecting Node.js microservices, 
                Hardhat Ethereum smart contracts, and lightweight machine learning OCR pipelines.
              </p>
              <div className="credit-links">
                <Link to="/settings" className="btn-secondary btn-sm">Inspect Smart Contract & System Status</Link>
                <Link to="/verify" className="btn-primary btn-sm">Try Verification Portal</Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

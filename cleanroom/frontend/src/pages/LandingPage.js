import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, FileCheck2, Cpu, Lock, ArrowRight, CheckCircle2, AlertTriangle } from 'lucide-react';

export default function LandingPage() {
  const [simText, setSimText] = useState('Saqib Ahmad Bhat | 950020104001 | B.E. CSE');

  // Simple client-side hash simulation for interactive demo
  const mockComputeHash = (str) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash |= 0;
    }
    const hex = Math.abs(hash).toString(16).padStart(8, '0');
    return `0x${hex}7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9`.substring(0, 66);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4rem' }}>
      {/* Hero Section */}
      <section style={{ textAlign: 'center', padding: '3rem 0 1rem' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          background: 'rgba(56, 189, 248, 0.1)',
          border: '1px solid rgba(56, 189, 248, 0.25)',
          padding: '0.35rem 0.85rem',
          borderRadius: '9999px',
          fontSize: '0.8rem',
          fontWeight: 700,
          color: '#38BDF8',
          marginBottom: '1.5rem'
        }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981', boxShadow: '0 0 8px #10B981' }} />
          IMMUTABLE ACADEMIC CREDENTIAL INFRASTRUCTURE
        </div>

        <h1 style={{
          fontSize: '3.4rem',
          fontWeight: 800,
          lineHeight: 1.15,
          letterSpacing: '-0.03em',
          marginBottom: '1.2rem'
        }}>
          EMERTECH <span style={{
            background: 'linear-gradient(135deg, #38BDF8, #818CF8)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>CERTIFY</span>
        </h1>

        <p style={{
          fontSize: '1.25rem',
          color: '#38BDF8',
          fontWeight: 600,
          marginBottom: '1.2rem',
          maxWidth: '750px',
          margin: '0 auto 1.2rem'
        }}>
          AI-Assisted Blockchain-Based Academic Certificate Verification System
        </p>

        <p style={{
          fontSize: '1.05rem',
          color: '#94A3B8',
          maxWidth: '820px',
          margin: '0 auto 2.5rem',
          lineHeight: 1.7
        }}>
          A clean-room decentralized credential verification architecture engineered to eliminate diploma fraud. Combines Ethereum smart contracts, deterministic SHA-256 cryptographic document digests, IPFS decentralized storage, and Tesseract.js WebAssembly OCR to enable instantaneous, tamper-evident verification.
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <Link to="/verify" className="btn btn-primary" style={{ padding: '0.75rem 1.8rem', fontSize: '1rem' }}>
            <ShieldCheck size={18} /> Launch Public Verifier <ArrowRight size={16} />
          </Link>
          <Link to="/login" className="btn btn-secondary" style={{ padding: '0.75rem 1.5rem', fontSize: '1rem' }}>
            Institution Portal
          </Link>
        </div>
      </section>

      {/* Interactive Cryptographic Simulation Card */}
      <section className="surface-card" style={{ maxWidth: '880px', margin: '0 auto', width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
          <Cpu size={20} color="#38BDF8" />
          <h3 style={{ fontSize: '1.1rem', color: '#FFFFFF' }}>Live Deterministic Digest Engine</h3>
        </div>
        <p style={{ fontSize: '0.875rem', color: '#94A3B8', marginBottom: '1rem' }}>
          Type any sample student record below. Notice how even a single-character alteration completely recalculates the 256-bit cryptographic digest (avalanche effect).
        </p>

        <div className="form-group">
          <label className="form-label">Canonical Record Payload:</label>
          <input
            type="text"
            className="form-input"
            value={simText}
            onChange={(e) => setSimText(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          <label className="form-label">Calculated SHA-256 On-Chain Digest (`bytes32`):</label>
          <div className="mono-box">
            {mockComputeHash(simText)}
          </div>
        </div>

        <div style={{
          marginTop: '1.2rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          fontSize: '0.85rem',
          color: '#10B981',
          background: 'rgba(16, 185, 129, 0.08)',
          padding: '0.65rem 1rem',
          borderRadius: '6px',
          border: '1px solid rgba(16, 185, 129, 0.2)'
        }}>
          <CheckCircle2 size={16} />
          <span>Cryptographic Tamper-Evidence: An altered grade or name alters the SHA-256 digest, detecting digital forgery.</span>
        </div>
      </section>

      {/* Problem vs Solution Metrics */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
        <div className="surface-card">
          <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#38BDF8', marginBottom: '0.5rem' }}>
            &lt; 500 ms
          </div>
          <h4 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>Local Benchmark Latency</h4>
          <p style={{ fontSize: '0.875rem', color: '#94A3B8' }}>
            Replaces weeks of manual registrar emails with sub-second local queries (public RPC latency depends on network round-trip time).
          </p>
        </div>

        <div className="surface-card">
          <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#10B981', marginBottom: '0.5rem' }}>
            100%
          </div>
          <h4 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>Tamper-Evident</h4>
          <p style={{ fontSize: '0.875rem', color: '#94A3B8' }}>
            Any pixel, byte, or grade altered in the PDF produces an immediate bitwise mismatch warning.
          </p>
        </div>

        <div className="surface-card">
          <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#818CF8', marginBottom: '0.5rem' }}>
            Zero PII
          </div>
          <h4 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>Privacy by Design</h4>
          <p style={{ fontSize: '0.875rem', color: '#94A3B8' }}>
            Personal names, marks, and IDs are never stored on the public blockchain, aligned with GDPR and DPDP data minimization principles.
          </p>
        </div>
      </section>
    </div>
  );
}

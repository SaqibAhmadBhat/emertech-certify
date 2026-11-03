import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useSearchParams } from 'react-router-dom';
import VerificationBadge from '../components/VerificationBadge';
import { ShieldCheck, Upload, Hash, QrCode, ScanLine, AlertCircle, CheckCircle } from 'lucide-react';

export default function PublicVerifyPage() {
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('file');

  // Input states
  const [hashInput, setHashInput] = useState('');
  const [qrInput, setQrInput] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);

  // Status & Diagnostics
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  // Check URL parameters (e.g. /verify?hash=0x...)
  useEffect(() => {
    const urlHash = searchParams.get('hash');
    if (urlHash) {
      setHashInput(urlHash);
      setActiveTab('hash');
      executeHashVerification(urlHash);
    }
  }, [searchParams]);

  const executeHashVerification = async (hashToVerify) => {
    setLoading(true);
    setErrorMsg('');
    setResult(null);

    try {
      const res = await axios.post('/api/v2/verify/hash', { hash: hashToVerify });
      setResult(res.data);
    } catch (err) {
      if (err.response && err.response.data) {
        setResult(err.response.data);
      } else {
        setErrorMsg('Failed to query verification service. Ensure backend is running.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFileVerification = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      setErrorMsg('Please select a certificate PDF file.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('certificateFile', selectedFile);

      const res = await axios.post('/api/v2/verify/file', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setResult(res.data);
    } catch (err) {
      if (err.response && err.response.data) {
        setResult(err.response.data);
      } else {
        setErrorMsg('File verification failed.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleQrVerification = async (e) => {
    e.preventDefault();
    if (!qrInput) {
      setErrorMsg('Please enter or paste QR code verification payload.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setResult(null);

    try {
      const res = await axios.post('/api/v2/verify/qr', { qrPayload: qrInput });
      setResult(res.data);
    } catch (err) {
      if (err.response && err.response.data) {
        setResult(err.response.data);
      } else {
        setErrorMsg('QR verification failed.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOcrVerification = async (e) => {
    e.preventDefault();
    if (!selectedImage) {
      setErrorMsg('Please select a scanned certificate image file (PNG, JPG).');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('imageFile', selectedImage);

      const res = await axios.post('/api/v2/verify/ocr', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setResult(res.data);
    } catch (err) {
      if (err.response && err.response.data) {
        setResult(err.response.data);
      } else {
        setErrorMsg('OCR image processing failed.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        <h2 style={{ fontSize: '2.4rem', fontWeight: 800, marginBottom: '0.6rem' }}>
          Multi-Modal Verification Hub
        </h2>
        <p style={{ color: '#94A3B8', fontSize: '1.05rem' }}>
          Instantly verify the cryptographic integrity and Ethereum blockchain status of any academic degree.
        </p>
      </div>

      {/* Tabs Navigation */}
      <div className="tabs-nav" style={{ justifyContent: 'center' }}>
        <button
          className={`tab-item ${activeTab === 'file' ? 'active' : ''}`}
          onClick={() => { setActiveTab('file'); setResult(null); setErrorMsg(''); }}
        >
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
            <Upload size={16} /> PDF File Upload
          </span>
        </button>

        <button
          className={`tab-item ${activeTab === 'hash' ? 'active' : ''}`}
          onClick={() => { setActiveTab('hash'); setResult(null); setErrorMsg(''); }}
        >
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
            <Hash size={16} /> Blockchain Hash
          </span>
        </button>

        <button
          className={`tab-item ${activeTab === 'qr' ? 'active' : ''}`}
          onClick={() => { setActiveTab('qr'); setResult(null); setErrorMsg(''); }}
        >
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
            <QrCode size={16} /> QR Code Payload
          </span>
        </button>

        <button
          className={`tab-item ${activeTab === 'ocr' ? 'active' : ''}`}
          onClick={() => { setActiveTab('ocr'); setResult(null); setErrorMsg(''); }}
        >
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
            <ScanLine size={16} /> Scanned Image OCR
          </span>
        </button>
      </div>

      {/* Tab 1: File Upload */}
      {activeTab === 'file' && (
        <form onSubmit={handleFileVerification} className="surface-card">
          <div className="form-group">
            <label className="form-label">Upload Academic Certificate PDF:</label>
            <input
              type="file"
              accept=".pdf"
              className="form-input"
              onChange={(e) => setSelectedFile(e.target.files[0])}
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%' }}>
            {loading ? 'Computing SHA-256 & Verifying...' : 'Verify PDF Document'}
          </button>
        </form>
      )}

      {/* Tab 2: Hash Input */}
      {activeTab === 'hash' && (
        <form onSubmit={(e) => { e.preventDefault(); executeHashVerification(hashInput); }} className="surface-card">
          <div className="form-group">
            <label className="form-label">64-Character SHA-256 Hex Hash:</label>
            <input
              type="text"
              className="form-input"
              placeholder="0x7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069"
              value={hashInput}
              onChange={(e) => setHashInput(e.target.value)}
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%' }}>
            {loading ? 'Querying Blockchain Registry...' : 'Search Blockchain State'}
          </button>
        </form>
      )}

      {/* Tab 3: QR Code */}
      {activeTab === 'qr' && (
        <form onSubmit={handleQrVerification} className="surface-card">
          <div className="form-group">
            <label className="form-label">Paste Verification URL or Scanned QR String:</label>
            <input
              type="text"
              className="form-input"
              placeholder="http://localhost:3000/verify?hash=0x..."
              value={qrInput}
              onChange={(e) => setQrInput(e.target.value)}
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%' }}>
            {loading ? 'Resolving Payload...' : 'Verify QR Payload'}
          </button>
        </form>
      )}

      {/* Tab 4: OCR Scan */}
      {activeTab === 'ocr' && (
        <form onSubmit={handleOcrVerification} className="surface-card">
          <div className="form-group">
            <label className="form-label">Upload Scanned Certificate Image (PNG/JPG):</label>
            <input
              type="file"
              accept="image/*"
              className="form-input"
              onChange={(e) => setSelectedImage(e.target.files[0])}
            />
          </div>
          <p style={{ fontSize: '0.8rem', color: '#94A3B8', marginBottom: '1rem' }}>
            AI OCR utilizes Tesseract.js WebAssembly to extract text from physical documents for administrative review.
          </p>
          <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%' }}>
            {loading ? 'Running Neural OCR Engine...' : 'Scan & Extract Text'}
          </button>
        </form>
      )}

      {/* Error Message */}
      {errorMsg && (
        <div style={{
          marginTop: '1.5rem',
          background: 'rgba(244, 63, 94, 0.1)',
          border: '1px solid rgba(244, 63, 94, 0.3)',
          padding: '1rem',
          borderRadius: '8px',
          color: '#F43F5E',
          display: 'flex',
          alignItems: 'center',
          gap: '0.6rem'
        }}>
          <AlertCircle size={18} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Results Diagnostic Card */}
      {result && (
        <div className="surface-card" style={{ marginTop: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1.2rem', color: '#FFFFFF' }}>Verification Diagnostic</h3>
            <VerificationBadge status={result.status} />
          </div>

          {result.status === 'TAMPER_DETECTED' && (
            <div style={{
              background: 'rgba(244, 63, 94, 0.15)',
              border: '1px solid #F43F5E',
              padding: '1rem',
              borderRadius: '8px',
              color: '#F43F5E',
              marginBottom: '1.5rem'
            }}>
              <strong>TAMPERING DETECTED:</strong> The document binary content does not match the recorded on-chain cryptographic fingerprint. Altering even 1 character in the PDF changes the SHA-256 checksum.
            </div>
          )}

          {result.status === 'REVOKED' && (
            <div style={{
              background: 'rgba(245, 158, 11, 0.15)',
              border: '1px solid #F59E0B',
              padding: '1rem',
              borderRadius: '8px',
              color: '#F59E0B',
              marginBottom: '1.5rem'
            }}>
              <strong>CERTIFICATE REVOKED:</strong> This credential was officially revoked by the issuing authority.
              {result.verificationData?.revocationReason && (
                <div>Reason: <em>"{result.verificationData.revocationReason}"</em></div>
              )}
            </div>
          )}

          {result.verificationData && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
              <div>
                <span className="form-label">Graduate:</span>
                <p style={{ fontWeight: 600 }}>{result.verificationData.studentName}</p>
              </div>
              <div>
                <span className="form-label">Program:</span>
                <p style={{ fontWeight: 600 }}>{result.verificationData.degreeTitle} ({result.verificationData.majorProgram})</p>
              </div>
              <div>
                <span className="form-label">Institution:</span>
                <p style={{ fontWeight: 600 }}>{result.verificationData.institutionName}</p>
              </div>
              <div>
                <span className="form-label">Graduation Date:</span>
                <p style={{ fontWeight: 600 }}>{result.verificationData.graduationDate}</p>
              </div>
            </div>
          )}

          {/* Cryptographic Digest Info */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div>
              <span className="form-label">Cryptographic SHA-256 Digest:</span>
              <div className="mono-box">
                {result.computedHash || result.verificationData?.certHash || result.queryHash}
              </div>
            </div>

            {(result.onChainIssuer || result.verificationData?.onChainIssuer || result.verificationData?.issuerWallet) && (
              <div>
                <span className="form-label">Verified On-Chain Issuer Wallet:</span>
                <div className="mono-box" style={{ color: '#10B981', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>{result.onChainIssuer || result.verificationData?.onChainIssuer || result.verificationData?.issuerWallet}</span>
                  <span style={{ fontSize: '0.75rem', background: 'rgba(16, 185, 129, 0.2)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                    {result.onChainVerified ? 'ON-CHAIN CONSENSUS' : 'DATABASE RECORD'}
                  </span>
                </div>
              </div>
            )}

            {result.verificationNote && (
              <div style={{ fontSize: '0.85rem', color: '#94A3B8', fontStyle: 'italic', marginTop: '0.25rem' }}>
                ℹ️ {result.verificationNote}
              </div>
            )}

            {result.expectedHash && (
              <div>
                <span className="form-label">Expected On-Chain Digest:</span>
                <div className="mono-box" style={{ color: '#F43F5E' }}>
                  {result.expectedHash}
                </div>
              </div>
            )}
          </div>

          {/* OCR Specific Results */}
          {result.ocrEngine && (
            <div style={{ marginTop: '1.5rem', borderTop: '1px solid #1E293B', paddingTop: '1.5rem' }}>
              <h4 style={{ fontSize: '1rem', color: '#818CF8', marginBottom: '0.6rem' }}>
                AI OCR Entity Extraction ({result.ocrEngine})
              </h4>
              <p style={{ fontSize: '0.85rem', color: '#94A3B8', marginBottom: '1rem' }}>
                {result.disclaimer}
              </p>
              <pre style={{
                background: '#070A11',
                padding: '1rem',
                borderRadius: '6px',
                fontFamily: 'monospace',
                fontSize: '0.8rem',
                color: '#CBD5E1',
                whiteSpace: 'pre-wrap'
              }}>
                {result.extractedText}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

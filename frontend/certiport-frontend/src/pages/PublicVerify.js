import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  ShieldCheck, 
  Search, 
  Upload, 
  QrCode, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Hash, 
  Download, 
  Cpu, 
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import { api } from '../api/apiClient';

export default function PublicVerify() {
  const [searchParams] = useSearchParams();
  const [mode, setMode] = useState('id'); // 'id', 'pdf', 'qr'

  // Form states
  const [certId, setCertId] = useState('');
  const [pdfFile, setPdfFile] = useState(null);
  const [expectedIdForPdf, setExpectedIdForPdf] = useState('');
  const [qrFile, setQrFile] = useState(null);
  const [qrPayload, setQrPayload] = useState('');

  // Results & Loading
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  // Auto-verify if ?id= parameter exists in URL
  const verifyById = useCallback(async (idToVerify) => {
    if (!idToVerify || !idToVerify.trim()) return;

    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const res = await api.get(`/public/verify/${encodeURIComponent(idToVerify.trim())}`);
      setResult(res);
    } catch (err) {
      if (err.data) {
        setResult(err.data);
      } else {
        setError(err.message || 'Verification request failed');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const idFromUrl = searchParams.get('id');
    if (idFromUrl) {
      setCertId(idFromUrl);
      setMode('id');
      verifyById(idFromUrl);
    }
  }, [searchParams, verifyById]);

  // Handle ID submit
  const handleIdSubmit = (e) => {
    e.preventDefault();
    verifyById(certId);
  };

  // Handle PDF upload verify
  const handlePdfSubmit = async (e) => {
    e.preventDefault();
    if (!pdfFile) {
      setError('Please select a PDF certificate file to verify.');
      return;
    }

    setLoading(true);
    setResult(null);
    setError(null);

    const formData = new FormData();
    formData.append('certificate', pdfFile);
    if (expectedIdForPdf) {
      formData.append('blockchainId', expectedIdForPdf.trim());
    }

    try {
      const res = await api.upload('/public/verify/pdf', formData);
      setResult(res);
    } catch (err) {
      if (err.data) {
        setResult(err.data);
      } else {
        setError(err.message || 'PDF verification failed');
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle QR verify
  const handleQrSubmit = async (e) => {
    e.preventDefault();
    if (!qrFile && !qrPayload) {
      setError('Please upload a QR code image or paste the QR payload string.');
      return;
    }

    setLoading(true);
    setResult(null);
    setError(null);

    try {
      let res;
      if (qrFile) {
        const formData = new FormData();
        formData.append('qrImage', qrFile);
        res = await api.upload('/public/verify/qr', formData);
      } else {
        res = await api.post('/public/verify/qr', { qrData: qrPayload.trim() });
      }
      setResult(res);
    } catch (err) {
      if (err.data) {
        setResult(err.data);
      } else {
        setError(err.message || 'QR verification failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="verify-page-root">
      <div className="verify-container">
        {/* Header */}
        <div className="verify-header">
          <div className="verify-badge">
            <ShieldCheck size={16} /> Official Public Registry
          </div>
          <h1 className="verify-title">Verify Academic Certificate</h1>
          <p className="verify-subtitle">
            Verify academic credentials in seconds. Choose from Certificate ID lookup,
            binary PDF SHA-256 cryptographic checking, or QR code scanning.
          </p>
        </div>

        {/* Verification Modality Tabs */}
        <div className="verify-tabs">
          <button
            className={`verify-tab-btn ${mode === 'id' ? 'active' : ''}`}
            onClick={() => { setMode('id'); setResult(null); setError(null); }}
          >
            <Search size={18} />
            <span>Verify by Certificate ID</span>
          </button>
          <button
            className={`verify-tab-btn ${mode === 'pdf' ? 'active' : ''}`}
            onClick={() => { setMode('pdf'); setResult(null); setError(null); }}
          >
            <Upload size={18} />
            <span>Verify by PDF Upload (SHA-256)</span>
          </button>
          <button
            className={`verify-tab-btn ${mode === 'qr' ? 'active' : ''}`}
            onClick={() => { setMode('qr'); setResult(null); setError(null); }}
          >
            <QrCode size={18} />
            <span>Verify by QR Code</span>
          </button>
        </div>

        {error && (
          <div className="alert-box alert-danger" style={{ maxWidth: '640px', margin: '0 auto 24px auto' }}>
            <AlertTriangle size={18} />
            <span>{error}</span>
          </div>
        )}

        {/* Mode A: ID Verification */}
        {mode === 'id' && (
          <div className="card verify-card">
            <form onSubmit={handleIdSubmit}>
              <div className="form-group">
                <label className="form-label">Blockchain Certificate Identifier</label>
                <div className="input-with-icon">
                  <Hash size={18} className="input-icon" />
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. UN01-CERT-ABC123-20261103"
                    value={certId}
                    onChange={(e) => setCertId(e.target.value)}
                    required
                  />
                </div>
              </div>
              <button
                type="submit"
                className="btn-primary"
                disabled={loading}
                style={{ width: '100%', justifyContent: 'center', marginTop: '16px' }}
              >
                {loading ? 'Querying Blockchain Registry...' : 'Verify Certificate Record'} <ArrowRight size={16} />
              </button>
            </form>
          </div>
        )}

        {/* Mode B: PDF Verification */}
        {mode === 'pdf' && (
          <div className="card verify-card">
            <form onSubmit={handlePdfSubmit}>
              <div className="file-drop-area">
                <Upload size={36} className="upload-icon" />
                <p>Upload the original certificate PDF document</p>
                <span className="sub-text">The system calculates its SHA-256 digest and verifies on-chain</span>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => setPdfFile(e.target.files[0])}
                  className="file-input-hidden"
                  id="pdfFileInput"
                />
                <label htmlFor="pdfFileInput" className="btn-secondary btn-sm" style={{ cursor: 'pointer', marginTop: '10px' }}>
                  Select PDF File
                </label>
                {pdfFile && <span className="selected-filename">{pdfFile.name} ({(pdfFile.size / 1024).toFixed(1)} KB)</span>}
              </div>

              <div className="form-group" style={{ marginTop: '16px' }}>
                <label className="form-label">Optional: Expected Certificate ID (to test tamper detection)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. UN01-CERT-..."
                  value={expectedIdForPdf}
                  onChange={(e) => setExpectedIdForPdf(e.target.value)}
                />
              </div>

              <button
                type="submit"
                className="btn-primary"
                disabled={!pdfFile || loading}
                style={{ width: '100%', justifyContent: 'center', marginTop: '16px' }}
              >
                {loading ? 'Computing SHA-256 & Verifying...' : 'Verify PDF Integrity'} <ArrowRight size={16} />
              </button>
            </form>
          </div>
        )}

        {/* Mode C: QR Code Verification */}
        {mode === 'qr' && (
          <div className="card verify-card">
            <form onSubmit={handleQrSubmit}>
              <div className="file-drop-area">
                <QrCode size={36} className="upload-icon" />
                <p>Upload an image containing the Certificate QR Code (.png, .jpg, .webp)</p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setQrFile(e.target.files[0])}
                  className="file-input-hidden"
                  id="qrFileInput"
                />
                <label htmlFor="qrFileInput" className="btn-secondary btn-sm" style={{ cursor: 'pointer', marginTop: '10px' }}>
                  Select QR Image
                </label>
                {qrFile && <span className="selected-filename">{qrFile.name}</span>}
              </div>

              <div className="form-group" style={{ marginTop: '16px' }}>
                <label className="form-label">Or paste Scanned QR Payload Text</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Paste URL or ID from QR code scanner"
                  value={qrPayload}
                  onChange={(e) => setQrPayload(e.target.value)}
                />
              </div>

              <button
                type="submit"
                className="btn-primary"
                disabled={(!qrFile && !qrPayload) || loading}
                style={{ width: '100%', justifyContent: 'center', marginTop: '16px' }}
              >
                {loading ? 'Decoding QR Code...' : 'Decode & Verify'} <ArrowRight size={16} />
              </button>
            </form>
          </div>
        )}

        {/* Verification Result Card */}
        {result && (
          <div className="verify-result-wrapper">
            {/* Status 1: AUTHENTIC */}
            {result.status === 'AUTHENTIC' && (
              <div className="result-card result-authentic">
                <div className="result-status-banner banner-authentic">
                  <CheckCircle2 size={32} />
                  <div>
                    <h2>CERTIFICATE IS AUTHENTIC & VALID</h2>
                    <p>{result.msg}</p>
                  </div>
                </div>

                <div className="result-body">
                  <div className="result-grid">
                    <div className="result-item">
                      <span className="result-label">Student Name:</span>
                      <strong className="result-value">{result.certificate?.studentName}</strong>
                    </div>

                    <div className="result-item">
                      <span className="result-label">Issuing Authority:</span>
                      <strong className="result-value">{result.certificate?.universityName}</strong>
                    </div>

                    <div className="result-item">
                      <span className="result-label">Course / Degree:</span>
                      <strong className="result-value">{result.certificate?.course || result.certificate?.program}</strong>
                    </div>

                    <div className="result-item">
                      <span className="result-label">Date of Issue:</span>
                      <strong className="result-value">
                        {result.certificate?.dateOfIssue ? new Date(result.certificate.dateOfIssue).toLocaleDateString() : 'Recorded'}
                      </strong>
                    </div>

                    <div className="result-item">
                      <span className="result-label">Blockchain Identifier:</span>
                      <span className="mono-text">{result.certificate?.blockchainId}</span>
                    </div>

                    <div className="result-item">
                      <span className="result-label">SHA-256 Digest (bytes32):</span>
                      <span className="mono-text" style={{ fontSize: '11px' }}>
                        {result.computedHash || result.certificate?.documentHash}
                      </span>
                    </div>
                  </div>

                  <div className="blockchain-proof-box">
                    <div className="proof-title">
                      <Cpu size={16} /> Smart Contract Integrity Confirmation
                    </div>
                    <p>
                      This certificate's cryptographic hash has been verified against the smart contract registry. 
                      Any alteration to even a single character in the document produces an immediate hash mismatch.
                    </p>
                  </div>

                  <div className="result-actions">
                    <a
                      href={`/api/public/certificate/${result.certificate?.blockchainId}/download`}
                      className="btn-primary"
                      target="_blank"
                      rel="noreferrer"
                    >
                      <Download size={16} /> Download Verified Original PDF
                    </a>
                  </div>
                </div>
              </div>
            )}

            {/* Status 2: TAMPERED / MODIFIED */}
            {result.status === 'TAMPERED' && (
              <div className="result-card result-tampered">
                <div className="result-status-banner banner-tampered">
                  <XCircle size={32} />
                  <div>
                    <h2>TAMPERING DETECTED: DOCUMENT MODIFIED</h2>
                    <p>{result.msg}</p>
                  </div>
                </div>

                <div className="result-body">
                  <div className="tamper-explanation">
                    <ShieldAlert size={24} className="tamper-icon" />
                    <div>
                      <strong>Cryptographic Hash Mismatch:</strong>
                      <p>
                        The uploaded document claims to represent Certificate ID <strong>{result.certificateId}</strong>.
                        However, the SHA-256 cryptographic digest of the file uploaded does NOT match the immutable record registered on the blockchain.
                      </p>
                    </div>
                  </div>

                  <div className="hash-comparison-box">
                    <div>
                      <span className="result-label">Expected Blockchain Hash:</span>
                      <div className="mono-text expected-hash">{result.expectedHash}</div>
                    </div>
                    <div style={{ marginTop: '10px' }}>
                      <span className="result-label">Uploaded Document Hash:</span>
                      <div className="mono-text computed-hash">{result.computedHash}</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Status 3: REVOKED */}
            {result.status === 'REVOKED' && (
              <div className="result-card result-revoked">
                <div className="result-status-banner banner-revoked">
                  <AlertTriangle size={32} />
                  <div>
                    <h2>CERTIFICATE HAS BEEN REVOKED</h2>
                    <p>{result.msg}</p>
                  </div>
                </div>

                <div className="result-body">
                  <div className="revocation-details-box">
                    <div className="result-item">
                      <span className="result-label">Official Revocation Reason:</span>
                      <strong className="result-value text-danger">
                        {result.revocationReason || 'Administrative revocation by issuing authority'}
                      </strong>
                    </div>

                    <div className="result-item">
                      <span className="result-label">Revoked Document ID:</span>
                      <span className="mono-text">{result.certificate?.blockchainId}</span>
                    </div>

                    <div className="result-item">
                      <span className="result-label">Original Student:</span>
                      <strong>{result.certificate?.studentName}</strong>
                    </div>

                    <div className="result-item">
                      <span className="result-label">Issuing Authority:</span>
                      <strong>{result.certificate?.universityName}</strong>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Status 4: NOT_FOUND */}
            {result.status === 'NOT_FOUND' && (
              <div className="result-card result-notfound">
                <div className="result-status-banner banner-notfound">
                  <XCircle size={32} />
                  <div>
                    <h2>CERTIFICATE RECORD NOT FOUND</h2>
                    <p>{result.msg}</p>
                  </div>
                </div>
                <div className="result-body">
                  <p style={{ color: 'var(--navy-600)', fontSize: '14px', lineHeight: 1.6 }}>
                    No record matching this identifier or document hash was discovered in the Emertech Certify registry.
                    Please double-check the Certificate ID or verify that you uploaded the exact original document.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

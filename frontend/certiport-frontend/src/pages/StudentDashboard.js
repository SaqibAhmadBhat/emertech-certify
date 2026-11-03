import React, { useState, useEffect } from 'react';
import { 
  GraduationCap, 
  Download, 
  ExternalLink, 
  Copy, 
  Check, 
  Building2, 
  ShieldCheck, 
  Award, 
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { api } from '../api/apiClient';

export default function StudentDashboard() {
  const [profile, setProfile] = useState(null);
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [selectedCert, setSelectedCert] = useState(null);

  const fetchStudentData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [profRes, certsRes] = await Promise.all([
        api.get('/student/profile'),
        api.get('/student/certificates')
      ]);

      if (profRes.data) setProfile(profRes.data);
      if (certsRes.data) setCertificates(certsRes.data);
    } catch (err) {
      setError(err.message || 'Failed to load student profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudentData();
  }, []);

  const handleCopyId = (id) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  return (
    <div className="dashboard-page-root">
      <div className="dashboard-container">
        {/* Header */}
        <div className="dashboard-header-bar">
          <div>
            <h1 className="dashboard-page-title">Student Credential Dashboard</h1>
            <p className="dashboard-page-sub">
              View your tamper-evident academic certificates, download official PDFs, and copy blockchain verification IDs
            </p>
          </div>
          <button onClick={fetchStudentData} className="btn-secondary" title="Refresh">
            <RefreshCw size={16} className={loading ? 'spin' : ''} /> Refresh
          </button>
        </div>

        {error && (
          <div className="alert-box alert-danger">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {/* Student Academic Profile Card */}
        {profile && (
          <div className="student-profile-card">
            <div className="student-profile-header">
              <div className="student-avatar-box">
                <GraduationCap size={32} />
              </div>
              <div className="student-identity">
                <h2>{profile.studentDetails?.fullName || profile.email}</h2>
                <div className="student-meta-row">
                  <span className="meta-item">
                    <Building2 size={14} /> {profile.studentDetails?.universityName}
                  </span>
                  <span className="dot-sep">•</span>
                  <span className="meta-item">
                    Register No: <strong>{profile.studentDetails?.enrollmentNumber}</strong>
                  </span>
                  <span className="dot-sep">•</span>
                  <span className="meta-item">
                    Program: <strong>{profile.studentDetails?.program?.toUpperCase()}</strong>
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Certificates Grid */}
        <div className="certificates-section">
          <div className="section-header-row">
            <h3>My Issued Certificates ({certificates.length})</h3>
            <span className="badge badge-primary">Secured by Solidity Smart Contract</span>
          </div>

          {certificates.length === 0 ? (
            <div className="card empty-state">
              <Award size={48} className="empty-icon" />
              <h4>No Certificates Issued Yet</h4>
              <p>
                When your institution issues an academic certificate, transcript, or marks card,
                it will appear here automatically with its blockchain record.
              </p>
            </div>
          ) : (
            <div className="certificates-grid">
              {certificates.map((cert) => (
                <div key={cert._id} className="student-cert-card">
                  <div className="cert-card-top">
                    <span className="badge badge-neutral">{cert.certificateType?.toUpperCase()}</span>
                    <span className={`badge badge-${cert.status === 'issued' ? 'authentic' : 'revoked'}`}>
                      {cert.status === 'issued' ? 'Authentic' : 'Revoked'}
                    </span>
                  </div>

                  <h4 className="cert-card-title">{cert.course || cert.program || 'Academic Certificate'}</h4>
                  <p className="cert-card-uni">{cert.universityName}</p>

                  <div className="cert-meta-list">
                    <div className="meta-line">
                      <span className="meta-lbl">Date of Issue:</span>
                      <span className="meta-val">{new Date(cert.dateOfIssue || cert.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="meta-line">
                      <span className="meta-lbl">Blockchain ID:</span>
                      <div className="id-copy-row">
                        <span className="mono-text id-truncate" title={cert.blockchainId}>{cert.blockchainId}</span>
                        <button
                          onClick={() => handleCopyId(cert.blockchainId)}
                          className="copy-btn"
                          title="Copy Blockchain ID"
                        >
                          {copiedId === cert.blockchainId ? <Check size={14} className="text-success" /> : <Copy size={14} />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {cert.status === 'revoked' && (
                    <div className="cert-revoked-warning">
                      <strong>Revoked:</strong> {cert.revocationReason || 'Administrative update'}
                    </div>
                  )}

                  <div className="cert-card-actions">
                    <button
                      onClick={() => setSelectedCert(cert)}
                      className="btn-secondary btn-sm"
                    >
                      View Details
                    </button>
                    <a
                      href={`/api/public/certificate/${cert.blockchainId}/download`}
                      className="btn-primary btn-sm"
                      target="_blank"
                      rel="noreferrer"
                    >
                      <Download size={14} /> Download PDF
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Certificate Details Modal */}
        {selectedCert && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ShieldCheck size={22} color="var(--purple-700)" />
                  Certificate Details
                </h3>
                <button onClick={() => setSelectedCert(null)} className="alert-close">×</button>
              </div>

              <div className="cert-modal-body">
                <div className="detail-item">
                  <span className="detail-lbl">Certificate ID:</span>
                  <span className="mono-text">{selectedCert.blockchainId}</span>
                </div>

                <div className="detail-item">
                  <span className="detail-lbl">Issuing Authority:</span>
                  <strong>{selectedCert.universityName}</strong>
                </div>

                <div className="detail-item">
                  <span className="detail-lbl">Student Name:</span>
                  <strong>{selectedCert.studentName}</strong>
                </div>

                <div className="detail-item">
                  <span className="detail-lbl">Register / Roll Number:</span>
                  <strong>{selectedCert.registerNo || selectedCert.enrollmentNumber}</strong>
                </div>

                <div className="detail-item">
                  <span className="detail-lbl">Course / Degree:</span>
                  <strong>{selectedCert.course || selectedCert.program}</strong>
                </div>

                <div className="detail-item">
                  <span className="detail-lbl">Cryptographic SHA-256 Digest:</span>
                  <span className="mono-text" style={{ fontSize: '11px' }}>{selectedCert.documentHash}</span>
                </div>

                <div className="detail-item">
                  <span className="detail-lbl">Status:</span>
                  <span className={`badge badge-${selectedCert.status === 'issued' ? 'authentic' : 'revoked'}`}>
                    {selectedCert.status?.toUpperCase()}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <a
                  href={`/verify?id=${encodeURIComponent(selectedCert.blockchainId)}`}
                  className="btn-secondary btn-sm"
                  target="_blank"
                  rel="noreferrer"
                >
                  <ExternalLink size={14} /> Open Public Verifier
                </a>
                <button onClick={() => setSelectedCert(null)} className="btn-primary btn-sm">
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

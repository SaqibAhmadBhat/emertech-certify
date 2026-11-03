import React, { useState, useEffect } from 'react';
import axios from 'axios';
import VerificationBadge from '../components/VerificationBadge';
import { PlusCircle, FileText, Upload, RefreshCw, AlertTriangle, CheckCircle2, Download } from 'lucide-react';

export default function InstitutionDashboard({ user }) {
  const [activeTab, setActiveTab] = useState('issue');
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ text: '', type: '' });

  // Issuance form state
  const [formData, setFormData] = useState({
    studentName: 'Saqib Ahmad Bhat',
    studentIdentifier: '950020104001',
    degreeTitle: 'Bachelor of Engineering',
    majorProgram: 'Computer Science and Engineering',
    graduationDate: '2026-05-15',
    gradeOrDistinction: 'First Class with Distinction'
  });

  // Revocation state
  const [revokeHash, setRevokeHash] = useState('');
  const [revokeReason, setRevokeReason] = useState('');
  const [showRevokeModal, setShowRevokeModal] = useState(false);

  useEffect(() => {
    fetchCertificates();
  }, []);

  const fetchCertificates = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('/api/v2/institutions/certificates', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCertificates(res.data.certificates || []);
    } catch (err) {
      console.error('Failed to load certificates:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleIssue = async (e) => {
    e.preventDefault();
    setMsg({ text: '', type: '' });
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const res = await axios.post('/api/v2/institutions/issue', formData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setMsg({
        text: `Certificate issued! ID: ${res.data.certificate.certificateId} | Hash: ${res.data.certificate.certHash}`,
        type: 'success'
      });
      fetchCertificates();
    } catch (err) {
      setMsg({
        text: err.response?.data?.message || 'Issuance failed.',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRevoke = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        '/api/v2/institutions/revoke',
        { certHash: revokeHash, reason: revokeReason },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setShowRevokeModal(false);
      setRevokeHash('');
      setRevokeReason('');
      setMsg({ text: 'Certificate successfully revoked on-chain.', type: 'success' });
      fetchCertificates();
    } catch (err) {
      setMsg({ text: err.response?.data?.message || 'Revocation failed.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h2 style={{ fontSize: '2rem', fontWeight: 800 }}>Academic Institution Portal</h2>
          <p style={{ color: '#94A3B8' }}>
            Issuing Authority: <strong>{user?.institutionCode || 'GCE'}</strong> &bull; Department of Computer Science &amp; Engineering
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            className={`btn ${activeTab === 'issue' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('issue')}
          >
            <PlusCircle size={16} /> Issue Certificate
          </button>
          <button
            className={`btn ${activeTab === 'registry' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('registry')}
          >
            <FileText size={16} /> Certificate Registry ({certificates.length})
          </button>
        </div>
      </div>

      {msg.text && (
        <div style={{
          marginBottom: '1.5rem',
          padding: '1rem',
          borderRadius: '8px',
          background: msg.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(244, 63, 94, 0.1)',
          border: `1px solid ${msg.type === 'success' ? '#10B981' : '#F43F5E'}`,
          color: msg.type === 'success' ? '#10B981' : '#F43F5E'
        }}>
          {msg.text}
        </div>
      )}

      {/* Tab: Issue Form */}
      {activeTab === 'issue' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '2rem' }}>
          <form onSubmit={handleIssue} className="surface-card">
            <h3 style={{ fontSize: '1.2rem', marginBottom: '1.5rem' }}>Issue Single Academic Degree</h3>

            <div className="form-group">
              <label className="form-label">Graduate Full Name:</label>
              <input
                type="text"
                className="form-input"
                required
                value={formData.studentName}
                onChange={(e) => setFormData({ ...formData, studentName: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Student Registration Identifier:</label>
              <input
                type="text"
                className="form-input"
                required
                value={formData.studentIdentifier}
                onChange={(e) => setFormData({ ...formData, studentIdentifier: e.target.value })}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Degree Title:</label>
                <input
                  type="text"
                  className="form-input"
                  required
                  value={formData.degreeTitle}
                  onChange={(e) => setFormData({ ...formData, degreeTitle: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Major / Branch:</label>
                <input
                  type="text"
                  className="form-input"
                  required
                  value={formData.majorProgram}
                  onChange={(e) => setFormData({ ...formData, majorProgram: e.target.value })}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Graduation Date:</label>
                <input
                  type="date"
                  className="form-input"
                  required
                  value={formData.graduationDate}
                  onChange={(e) => setFormData({ ...formData, graduationDate: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Classification / Honors:</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.gradeOrDistinction}
                  onChange={(e) => setFormData({ ...formData, gradeOrDistinction: e.target.value })}
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', marginTop: '1rem' }}>
              {loading ? 'Synthesizing PDF & Minting on Blockchain...' : 'Sign & Issue Degree'}
            </button>
          </form>

          {/* Dynamic Vector Layout Preview Card */}
          <div className="surface-card">
            <h4 style={{ fontSize: '1rem', color: '#38BDF8', marginBottom: '1rem' }}>Dynamic Certificate Canvas Preview</h4>
            <div style={{
              background: '#070A11',
              border: '2px solid #D97706',
              padding: '1.5rem',
              borderRadius: '8px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.8rem'
            }}>
              <div style={{ fontSize: '0.75rem', color: '#D97706', letterSpacing: '0.05em' }}>
                GOVERNMENT COLLEGE OF ENGINEERING, TIRUNELVELI
              </div>
              <div style={{ fontSize: '0.65rem', color: '#94A3B8' }}>
                DEPARTMENT OF COMPUTER SCIENCE AND ENGINEERING
              </div>
              <div style={{ borderBottom: '1px solid #1E293B', margin: '0.2rem 0' }} />
              <div style={{ fontSize: '0.9rem', color: '#FFFFFF', fontWeight: 'bold' }}>
                {formData.degreeTitle}
              </div>
              <div style={{ fontSize: '0.8rem', color: '#94A3B8' }}>
                Conferred upon:
              </div>
              <div style={{ fontSize: '1.2rem', color: '#38BDF8', fontWeight: 800 }}>
                {formData.studentName.toUpperCase()}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#CBD5E1' }}>
                ID: {formData.studentIdentifier} &bull; {formData.majorProgram}
              </div>
              <div style={{ fontSize: '0.7rem', color: '#10B981', fontWeight: 600 }}>
                {formData.gradeOrDistinction}
              </div>
              <div style={{
                marginTop: '0.5rem',
                padding: '0.5rem',
                background: '#111827',
                borderRadius: '4px',
                fontSize: '0.65rem',
                color: '#64748B',
                fontFamily: 'monospace'
              }}>
                [QR CODE VERIFICATION STAMP EMBEDDED]
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Certificate Registry Table */}
      {activeTab === 'registry' && (
        <div className="surface-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.2rem' }}>Issued Credentials Ledger</h3>
            <button onClick={fetchCertificates} className="btn btn-secondary btn-sm">
              <RefreshCw size={14} /> Refresh
            </button>
          </div>

          <div className="table-responsive">
            <table className="clean-table">
              <thead>
                <tr>
                  <th>Certificate ID</th>
                  <th>Graduate</th>
                  <th>Program</th>
                  <th>Issued Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {certificates.map((cert) => (
                  <tr key={cert._id || cert.certificateId}>
                    <td style={{ fontFamily: 'monospace', color: '#38BDF8' }}>{cert.certificateId}</td>
                    <td>{cert.studentName}</td>
                    <td>{cert.degreeTitle}</td>
                    <td>{new Date(cert.issuedAt).toLocaleDateString()}</td>
                    <td>
                      <VerificationBadge status={cert.isRevoked ? 'REVOKED' : 'AUTHENTIC'} />
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <a
                          href={`/api/v2/certificates/${cert.certificateId}/pdf`}
                          target="_blank"
                          rel="noreferrer"
                          className="btn btn-secondary btn-sm"
                        >
                          <Download size={12} /> PDF
                        </a>
                        {!cert.isRevoked && (
                          <button
                            onClick={() => {
                              setRevokeHash(cert.certHash);
                              setShowRevokeModal(true);
                            }}
                            className="btn btn-danger btn-sm"
                          >
                            Revoke
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Revocation Modal */}
      {showRevokeModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div className="surface-card" style={{ maxWidth: '500px', width: '90%' }}>
            <h3 style={{ color: '#F43F5E', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertTriangle size={20} /> Revoke Certificate On-Chain
            </h3>
            <p style={{ fontSize: '0.875rem', color: '#94A3B8', marginBottom: '1rem' }}>
              This will update the Ethereum smart contract state (`isRevoked = true`) and disable public verification.
            </p>

            <form onSubmit={handleRevoke}>
              <div className="form-group">
                <label className="form-label">Revocation Justification:</label>
                <textarea
                  className="form-textarea"
                  required
                  rows="3"
                  placeholder="e.g. Administrative syllabus update, disciplinary action, or erratum"
                  value={revokeReason}
                  onChange={(e) => setRevokeReason(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowRevokeModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-danger" disabled={loading}>
                  {loading ? 'Submitting to Ethereum...' : 'Confirm Revocation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

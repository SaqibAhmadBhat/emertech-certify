import React, { useState, useEffect } from 'react';
import axios from 'axios';
import VerificationBadge from '../components/VerificationBadge';
import { Download, ExternalLink, Copy, Check, GraduationCap } from 'lucide-react';

export default function StudentDashboard({ user: initialUser }) {
  const [currentUser, setCurrentUser] = useState(initialUser);
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState('');

  // Identity Claim State
  const [claimToken, setClaimToken] = useState('');
  const [claimId, setClaimId] = useState('');
  const [claiming, setClaiming] = useState(false);
  const [claimError, setClaimError] = useState('');
  const [claimSuccess, setClaimSuccess] = useState('');

  useEffect(() => {
    if (currentUser?.studentIdentifier && currentUser?.institutionCode) {
      fetchStudentCertificates();
    }
  }, [currentUser]);

  const fetchStudentCertificates = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('/api/v2/certificates/student/my-certificates', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCertificates(res.data.certificates || []);
    } catch (err) {
      console.error('Failed to load student certificates:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClaimIdentity = async (e) => {
    e.preventDefault();
    setClaiming(true);
    setClaimError('');
    setClaimSuccess('');

    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(
        '/api/v2/auth/claim-identity',
        {
          enrollmentToken: claimToken.trim(),
          studentIdentifier: claimId.trim()
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const { token: newToken, user: updatedUser } = res.data;
      localStorage.setItem('token', newToken);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setCurrentUser(updatedUser);
      setClaimSuccess('Academic identity successfully verified and linked!');
      setClaimToken('');
      setClaimId('');
    } catch (err) {
      setClaimError(err.response?.data?.message || 'Identity claim failed. Please verify your token and roll number.');
    } finally {
      setClaiming(false);
    }
  };

  const copyVerifyUrl = (certHash, certId) => {
    const url = `${window.location.origin}/verify?hash=${certHash}`;
    navigator.clipboard.writeText(url);
    setCopiedId(certId);
    setTimeout(() => setCopiedId(''), 2500);
  };

  const isVerified = Boolean(currentUser?.studentIdentifier && currentUser?.institutionCode);

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      {/* Student Profile Card */}
      <div className="surface-card" style={{ marginBottom: '2.5rem', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
        <div style={{
          width: 64,
          height: 64,
          borderRadius: '50%',
          background: isVerified ? 'rgba(56, 189, 248, 0.15)' : 'rgba(251, 191, 36, 0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: isVerified ? '#38BDF8' : '#FBBF24'
        }}>
          <GraduationCap size={32} />
        </div>

        <div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800 }}>{currentUser?.fullName || 'Student Portal'}</h2>
          <p style={{ color: '#94A3B8', fontSize: '0.9rem' }}>
            Status: <strong style={{ color: isVerified ? '#10B981' : '#FBBF24' }}>{isVerified ? 'VERIFIED ENROLLMENT' : 'UNASSOCIATED ACCOUNT'}</strong>
            {isVerified && (
              <> &bull; Identifier: <strong>{currentUser.studentIdentifier}</strong> &bull; Institution: <strong>{currentUser.institutionCode}</strong></>
            )}
          </p>
        </div>
      </div>

      {/* Unverified Identity Claim Box */}
      {!isVerified && (
        <div className="surface-card" style={{ marginBottom: '2.5rem', border: '1px solid rgba(251, 191, 36, 0.3)' }}>
          <h3 style={{ fontSize: '1.25rem', color: '#FBBF24', marginBottom: '0.5rem' }}>
            Verify Your Institutional Enrollment
          </h3>
          <p style={{ color: '#94A3B8', fontSize: '0.875rem', marginBottom: '1.25rem' }}>
            Enter your institution-issued enrollment verification token and your official student ID/roll number to claim your academic profile and access your anchored credentials.
          </p>

          {claimError && (
            <div style={{
              background: 'rgba(244, 63, 94, 0.1)',
              border: '1px solid rgba(244, 63, 94, 0.3)',
              padding: '0.75rem',
              borderRadius: '6px',
              color: '#F43F5E',
              fontSize: '0.85rem',
              marginBottom: '1rem'
            }}>
              {claimError}
            </div>
          )}

          {claimSuccess && (
            <div style={{
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              padding: '0.75rem',
              borderRadius: '6px',
              color: '#10B981',
              fontSize: '0.85rem',
              marginBottom: '1rem'
            }}>
              {claimSuccess}
            </div>
          )}

          <form onSubmit={handleClaimIdentity} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '1rem', alignItems: 'end' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Student ID / Roll No:</label>
              <input
                type="text"
                className="form-input"
                required
                placeholder="e.g. 950020104001"
                value={claimId}
                onChange={(e) => setClaimId(e.target.value)}
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Enrollment Token:</label>
              <input
                type="text"
                className="form-input"
                required
                placeholder="ENR-..."
                value={claimToken}
                onChange={(e) => setClaimToken(e.target.value)}
              />
            </div>
            <button type="submit" className="btn btn-primary" disabled={claiming} style={{ height: '42px' }}>
              {claiming ? 'Verifying...' : 'Claim Identity'}
            </button>
          </form>
        </div>
      )}

      {/* Official Credentials Grid */}
      <h3 style={{ fontSize: '1.3rem', marginBottom: '1.5rem' }}>My Verified Academic Degrees</h3>

      {isVerified && certificates.length === 0 && !loading && (
        <div className="surface-card" style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
          <p style={{ color: '#94A3B8' }}>No official degrees have been anchored yet for this student identifier.</p>
        </div>
      )}

      {!isVerified && (
        <div className="surface-card" style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
          <p style={{ color: '#94A3B8' }}>Please verify your institutional enrollment above to view your academic certificates.</p>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {certificates.map((cert) => (
          <div key={cert.certificateId} className="surface-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <h4 style={{ fontSize: '1.25rem', color: '#FFFFFF' }}>{cert.degreeTitle}</h4>
                <p style={{ color: '#38BDF8', fontWeight: 600 }}>{cert.majorProgram}</p>
                <p style={{ color: '#94A3B8', fontSize: '0.85rem' }}>{cert.institutionName} &bull; Conferred {cert.graduationDate}</p>
              </div>

              <VerificationBadge status={cert.isRevoked ? 'REVOKED' : 'AUTHENTIC'} />
            </div>

            <div style={{
              background: '#070A11',
              padding: '0.75rem 1rem',
              borderRadius: '6px',
              fontFamily: 'monospace',
              fontSize: '0.8rem',
              color: '#94A3B8',
              marginBottom: '1.5rem',
              wordBreak: 'break-all'
            }}>
              SHA-256 Digest: <span style={{ color: '#38BDF8' }}>{cert.certHash}</span>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <a
                href={`/api/v2/certificates/${cert.certificateId}/pdf`}
                target="_blank"
                rel="noreferrer"
                className="btn btn-primary"
              >
                <Download size={16} /> Download Official PDF
              </a>

              <button
                onClick={() => copyVerifyUrl(cert.certHash, cert.certificateId)}
                className="btn btn-secondary"
              >
                {copiedId === cert.certificateId ? (
                  <>
                    <Check size={16} color="#10B981" /> Link Copied!
                  </>
                ) : (
                  <>
                    <Copy size={16} /> Share Public Verification Link
                  </>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

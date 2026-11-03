import React, { useState, useEffect } from 'react';
import axios from 'axios';
import VerificationBadge from '../components/VerificationBadge';
import { Download, ExternalLink, Copy, Check, GraduationCap } from 'lucide-react';

export default function StudentDashboard({ user }) {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState('');

  useEffect(() => {
    fetchStudentCertificates();
  }, []);

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

  const copyVerifyUrl = (certHash, certId) => {
    const url = `${window.location.origin}/verify?hash=${certHash}`;
    navigator.clipboard.writeText(url);
    setCopiedId(certId);
    setTimeout(() => setCopiedId(''), 2500);
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      {/* Student Profile Card */}
      <div className="surface-card" style={{ marginBottom: '2.5rem', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
        <div style={{
          width: 64,
          height: 64,
          borderRadius: '50%',
          background: 'rgba(56, 189, 248, 0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#38BDF8'
        }}>
          <GraduationCap size={32} />
        </div>

        <div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800 }}>{user?.fullName || 'Saqib Ahmad Bhat'}</h2>
          <p style={{ color: '#94A3B8', fontSize: '0.9rem' }}>
            Registration Identifier: <strong>{user?.studentIdentifier || '950020104001'}</strong> &bull; Institution: <strong>{user?.institutionCode || 'GCE'}</strong>
          </p>
        </div>
      </div>

      {/* Official Credentials Grid */}
      <h3 style={{ fontSize: '1.3rem', marginBottom: '1.5rem' }}>My Verified Academic Degrees</h3>

      {certificates.length === 0 && !loading && (
        <div className="surface-card" style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
          <p style={{ color: '#94A3B8' }}>No official degrees have been anchored yet for this student identifier.</p>
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

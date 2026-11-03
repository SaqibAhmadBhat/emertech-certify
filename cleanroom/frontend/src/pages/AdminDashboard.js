import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Building2, Shield, Activity, CheckCircle, XCircle } from 'lucide-react';

export default function AdminDashboard() {
  const [telemetry, setTelemetry] = useState(null);
  const [institutions, setInstitutions] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const [telemRes, instRes] = await Promise.all([
        axios.get('/api/v2/admin/telemetry', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get('/api/v2/admin/institutions', { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setTelemetry(telemRes.data.telemetry);
      setAuditLogs(telemRes.data.recentAuditLogs || []);
      setInstitutions(instRes.data.institutions || []);
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (instId, status) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(
        `/api/v2/admin/institutions/${instId}/status`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchAdminData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update institution status.');
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '2.5rem' }}>
        <h2 style={{ fontSize: '2.2rem', fontWeight: 800 }}>Root Authority Admin Console</h2>
        <p style={{ color: '#94A3B8' }}>
          System Telemetry, Institution Accreditation, and Smart Contract Access Control
        </p>
      </div>

      {/* Telemetry Metrics Grid */}
      {telemetry && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
          <div className="surface-card">
            <span className="form-label">Total Certificates Issued</span>
            <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#38BDF8', marginTop: '0.25rem' }}>
              {telemetry.totalCertificates}
            </div>
          </div>

          <div className="surface-card">
            <span className="form-label">Active Credentials</span>
            <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#10B981', marginTop: '0.25rem' }}>
              {telemetry.activeCertificates}
            </div>
          </div>

          <div className="surface-card">
            <span className="form-label">Revoked Credentials</span>
            <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#F43F5E', marginTop: '0.25rem' }}>
              {telemetry.revokedCertificates}
            </div>
          </div>

          <div className="surface-card">
            <span className="form-label">Accredited Universities</span>
            <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#818CF8', marginTop: '0.25rem' }}>
              {telemetry.authorizedInstitutions} / {telemetry.totalInstitutions}
            </div>
          </div>
        </div>
      )}

      {/* Institutions Management */}
      <div className="surface-card" style={{ marginBottom: '2.5rem' }}>
        <h3 style={{ fontSize: '1.25rem', marginBottom: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Building2 size={20} color="#38BDF8" /> Institutional Accreditation Queue
        </h3>

        <div className="table-responsive">
          <table className="clean-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Institution Name</th>
                <th>Official Domain</th>
                <th>Wallet Address</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {institutions.map((inst) => (
                <tr key={inst._id}>
                  <td style={{ fontWeight: 'bold', color: '#38BDF8' }}>{inst.institutionCode}</td>
                  <td>{inst.name}</td>
                  <td>{inst.officialDomain}</td>
                  <td style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: '#94A3B8' }}>
                    {inst.walletAddress}
                  </td>
                  <td>
                    <span className={`status-pill ${inst.status.toLowerCase()}`}>
                      <span className="dot" />
                      {inst.status}
                    </span>
                  </td>
                  <td>
                    {inst.status === 'PENDING' ? (
                      <button
                        onClick={() => updateStatus(inst._id, 'AUTHORIZED')}
                        className="btn btn-primary btn-sm"
                      >
                        <CheckCircle size={14} /> Authorize
                      </button>
                    ) : inst.status === 'AUTHORIZED' ? (
                      <button
                        onClick={() => updateStatus(inst._id, 'SUSPENDED')}
                        className="btn btn-danger btn-sm"
                      >
                        <XCircle size={14} /> Suspend
                      </button>
                    ) : (
                      <button
                        onClick={() => updateStatus(inst._id, 'AUTHORIZED')}
                        className="btn btn-secondary btn-sm"
                      >
                        Re-Authorize
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Audit Log Telemetry */}
      <div className="surface-card">
        <h3 style={{ fontSize: '1.25rem', marginBottom: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Activity size={20} color="#10B981" /> Cryptographic Telemetry Stream
        </h3>

        <div className="table-responsive">
          <table className="clean-table">
            <thead>
              <tr>
                <th>Event Type</th>
                <th>Actor</th>
                <th>Client IP</th>
                <th>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {auditLogs.map((log) => (
                <tr key={log._id}>
                  <td>
                    <span style={{
                      fontWeight: 700,
                      color: log.eventType === 'TAMPER_DETECTED' ? '#F43F5E' : log.eventType === 'REVOCATION' ? '#F59E0B' : '#10B981'
                    }}>
                      {log.eventType}
                    </span>
                  </td>
                  <td>{log.actorEmail || 'Anonymous Verifier'}</td>
                  <td style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{log.clientIp || '127.0.0.1'}</td>
                  <td style={{ fontSize: '0.8rem', color: '#94A3B8' }}>{new Date(log.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

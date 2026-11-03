import React, { useState, useEffect, useCallback } from 'react';
import { 
  Building2, 
  GraduationCap, 
  FileCheck2, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Trash2, 
  Sparkles, 
  RefreshCw, 
  Upload, 
  ShieldAlert 
} from 'lucide-react';
import { api } from '../api/apiClient';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('pending'); // 'pending', 'universities', 'certificates', 'ocr'
  const [stats, setStats] = useState({
    totalUniversities: 0,
    totalStudents: 0,
    totalCertificates: 0,
    totalRevoked: 0,
    pendingRequests: 0
  });

  const [pendingRequests, setPendingRequests] = useState([]);
  const [universities, setUniversities] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState(null);
  const [error, setError] = useState(null);

  // Reject modal state
  const [rejectModalReq, setRejectModalReq] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // AI OCR test state
  const [ocrFile, setOcrFile] = useState(null);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrResult, setOcrResult] = useState(null);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsRes, pendingRes, uniRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/pending-requests'),
        api.get('/admin/universities')
      ]);

      if (statsRes.stats) setStats(statsRes.stats);
      if (pendingRes.requests) setPendingRequests(pendingRes.requests);
      if (uniRes.universities) setUniversities(uniRes.universities);

      // Fetch global certificates
      try {
        const certsRes = await api.get('/university/certificates');
        if (certsRes.certificates) setCertificates(certsRes.certificates);
      } catch (e) {
        // May be empty initially
      }
    } catch (err) {
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Handle Approve
  const handleApprove = async (requestId) => {
    try {
      const res = await api.put(`/admin/approve/${requestId}`);
      setMsg(res.msg || 'Institution approved successfully');
      fetchDashboardData();
    } catch (err) {
      setError(err.message || 'Failed to approve institution');
    }
  };

  // Open Reject Modal
  const openRejectModal = (request) => {
    setRejectModalReq(request);
    setRejectionReason('');
  };

  // Confirm Reject
  const handleConfirmReject = async () => {
    if (!rejectModalReq) return;
    try {
      await api.put(`/admin/reject/${rejectModalReq._id}`, { reason: rejectionReason });
      setMsg(`Application for ${rejectModalReq.universityDetails.universityName} rejected.`);
      setRejectModalReq(null);
      fetchDashboardData();
    } catch (err) {
      setError(err.message || 'Failed to reject request');
    }
  };

  // Handle Remove University
  const handleRemoveUniversity = async (universityId, name) => {
    if (!window.confirm(`Are you sure you want to remove "${name}" from the system?`)) return;
    try {
      await api.delete(`/admin/university/${universityId}`);
      setMsg(`Institution "${name}" removed successfully.`);
      fetchDashboardData();
    } catch (err) {
      setError(err.message || 'Failed to remove institution');
    }
  };

  // Run AI OCR test
  const handleOcrTest = async (e) => {
    e.preventDefault();
    if (!ocrFile) return;

    setOcrLoading(true);
    setOcrResult(null);

    const formData = new FormData();
    formData.append('document', ocrFile);

    try {
      const res = await api.upload('/ai/extract-ocr', formData);
      setOcrResult(res);
    } catch (err) {
      setError(err.message || 'OCR processing failed');
    } finally {
      setOcrLoading(false);
    }
  };

  return (
    <div className="dashboard-page-root">
      <div className="dashboard-container">
        {/* Header */}
        <div className="dashboard-header-bar">
          <div>
            <h1 className="dashboard-page-title">Administrator Governance Console</h1>
            <p className="dashboard-page-sub">
              Platform administration, institutional approvals, global audit records, and AI tools
            </p>
          </div>
          <button onClick={fetchDashboardData} className="btn-secondary" title="Refresh Data">
            <RefreshCw size={16} className={loading ? 'spin' : ''} /> Refresh
          </button>
        </div>

        {/* Feedback Alerts */}
        {msg && (
          <div className="alert-box alert-success">
            <CheckCircle size={18} />
            <span>{msg}</span>
            <button onClick={() => setMsg(null)} className="alert-close">×</button>
          </div>
        )}
        {error && (
          <div className="alert-box alert-danger">
            <AlertTriangle size={18} />
            <span>{error}</span>
            <button onClick={() => setError(null)} className="alert-close">×</button>
          </div>
        )}

        {/* KPI Stats Cards */}
        <div className="stats-kpi-grid">
          <div className="kpi-card">
            <div className="kpi-icon-box bg-blue">
              <Building2 size={22} />
            </div>
            <div className="kpi-details">
              <span className="kpi-value">{stats.totalUniversities}</span>
              <span className="kpi-label">Approved Institutions</span>
            </div>
          </div>

          <div className="kpi-card">
            <div className="kpi-icon-box bg-purple">
              <GraduationCap size={22} />
            </div>
            <div className="kpi-details">
              <span className="kpi-value">{stats.totalStudents}</span>
              <span className="kpi-label">Registered Students</span>
            </div>
          </div>

          <div className="kpi-card">
            <div className="kpi-icon-box bg-green">
              <FileCheck2 size={22} />
            </div>
            <div className="kpi-details">
              <span className="kpi-value">{stats.totalCertificates}</span>
              <span className="kpi-label">Authentic Certificates</span>
            </div>
          </div>

          <div className="kpi-card">
            <div className="kpi-icon-box bg-amber">
              <Clock size={22} />
            </div>
            <div className="kpi-details">
              <span className="kpi-value">{stats.pendingRequests}</span>
              <span className="kpi-label">Pending Approvals</span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="dashboard-tabs-bar">
          <button
            className={`dash-tab-btn ${activeTab === 'pending' ? 'active' : ''}`}
            onClick={() => setActiveTab('pending')}
          >
            Pending Requests ({pendingRequests.length})
          </button>
          <button
            className={`dash-tab-btn ${activeTab === 'universities' ? 'active' : ''}`}
            onClick={() => setActiveTab('universities')}
          >
            Approved Institutions ({universities.length})
          </button>
          <button
            className={`dash-tab-btn ${activeTab === 'certificates' ? 'active' : ''}`}
            onClick={() => setActiveTab('certificates')}
          >
            Certificates Audit ({certificates.length})
          </button>
          <button
            className={`dash-tab-btn ${activeTab === 'ocr' ? 'active' : ''}`}
            onClick={() => setActiveTab('ocr')}
          >
            <Sparkles size={16} /> AI OCR Lab
          </button>
        </div>

        {/* Tab 1: Pending Approvals */}
        {activeTab === 'pending' && (
          <div className="tab-pane">
            <div className="card">
              <h3 className="card-title">Institutional Onboarding Requests</h3>
              <p className="card-subtitle">
                Review institution registrations before granting on-chain certificate issuance privileges.
              </p>

              {pendingRequests.length === 0 ? (
                <div className="empty-state">
                  <CheckCircle size={40} className="empty-icon text-success" />
                  <h4>All Requests Reviewed</h4>
                  <p>There are currently no pending institution onboarding applications.</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Institution Name</th>
                        <th>Contact Person</th>
                        <th>Accreditation</th>
                        <th>Location</th>
                        <th>Submission Date</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingRequests.map((req) => (
                        <tr key={req._id}>
                          <td>
                            <strong>{req.universityDetails.universityName}</strong>
                            <div className="sub-text">{req.email}</div>
                          </td>
                          <td>
                            {req.universityDetails.contactPersonName}
                            <div className="sub-text">{req.universityDetails.contactNumber}</div>
                          </td>
                          <td>
                            <span className="badge badge-neutral">{req.universityDetails.accreditationId}</span>
                          </td>
                          <td>{req.universityDetails.city}, {req.universityDetails.state}</td>
                          <td>{new Date(req.createdAt).toLocaleDateString()}</td>
                          <td>
                            <div className="action-buttons">
                              <button
                                onClick={() => handleApprove(req._id)}
                                className="btn-primary btn-sm"
                              >
                                <CheckCircle size={14} /> Approve
                              </button>
                              <button
                                onClick={() => openRejectModal(req)}
                                className="btn-danger btn-sm"
                              >
                                <XCircle size={14} /> Reject
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Approved Universities */}
        {activeTab === 'universities' && (
          <div className="tab-pane">
            <div className="card">
              <h3 className="card-title">Registered Educational Institutions</h3>
              <p className="card-subtitle">
                Institutions authorized to author templates and mint tamper-evident blockchain certificates.
              </p>

              {universities.length === 0 ? (
                <div className="empty-state">
                  <Building2 size={40} className="empty-icon" />
                  <h4>No Approved Institutions Yet</h4>
                  <p>Approve pending requests to activate institutional profiles.</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Assigned ID</th>
                        <th>Institution Name</th>
                        <th>Accreditation ID</th>
                        <th>Official Contact</th>
                        <th>Certificates Issued</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {universities.map((uni) => (
                        <tr key={uni._id}>
                          <td>
                            <span className="mono-text">{uni.universityDetails?.universityId?.toUpperCase()}</span>
                          </td>
                          <td>
                            <strong>{uni.universityDetails?.universityName}</strong>
                            <div className="sub-text">{uni.email}</div>
                          </td>
                          <td>{uni.universityDetails?.accreditationId}</td>
                          <td>
                            {uni.universityDetails?.contactPersonName}
                            <div className="sub-text">{uni.universityDetails?.phone}</div>
                          </td>
                          <td>
                            <span className="badge badge-primary">{uni.certificateCount || 0} issued</span>
                          </td>
                          <td>
                            <button
                              onClick={() => handleRemoveUniversity(uni._id, uni.universityDetails?.universityName)}
                              className="btn-danger btn-sm"
                              title="Remove Institution"
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 3: Certificates Audit */}
        {activeTab === 'certificates' && (
          <div className="tab-pane">
            <div className="card">
              <h3 className="card-title">Global Academic Certificate Registry</h3>
              <p className="card-subtitle">
                Immutable records registered across institutions on the smart contract.
              </p>

              {certificates.length === 0 ? (
                <div className="empty-state">
                  <FileCheck2 size={40} className="empty-icon" />
                  <h4>No Certificates Issued Yet</h4>
                  <p>Issued certificates will appear here in the system-wide audit table.</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Blockchain ID</th>
                        <th>Student Name</th>
                        <th>Institution</th>
                        <th>Type / Course</th>
                        <th>Status</th>
                        <th>SHA-256 Digest</th>
                      </tr>
                    </thead>
                    <tbody>
                      {certificates.map((cert) => (
                        <tr key={cert._id}>
                          <td>
                            <span className="mono-text">{cert.blockchainId}</span>
                          </td>
                          <td>
                            <strong>{cert.studentName}</strong>
                            <div className="sub-text">{cert.studentEmail}</div>
                          </td>
                          <td>{cert.universityName}</td>
                          <td>
                            <div>{cert.certificateType}</div>
                            <div className="sub-text">{cert.course}</div>
                          </td>
                          <td>
                            <span className={`badge badge-${cert.status === 'issued' ? 'authentic' : 'revoked'}`}>
                              {cert.status?.toUpperCase()}
                            </span>
                          </td>
                          <td>
                            <span className="mono-text" title={cert.documentHash}>
                              {cert.documentHash?.substring(0, 16)}...
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 4: AI OCR Lab */}
        {activeTab === 'ocr' && (
          <div className="tab-pane">
            <div className="card">
              <div className="badge badge-primary" style={{ marginBottom: '12px' }}>
                <Sparkles size={14} /> AI-Assisted Document Extraction
              </div>
              <h3 className="card-title">Local OCR Information Extraction Lab</h3>
              <p className="card-subtitle">
                Test the free, locally runnable OCR engine (Tesseract.js & PDF parser).
                Upload any sample academic certificate to automatically extract student names,
                registration numbers, degrees, and dates.
              </p>

              <form onSubmit={handleOcrTest} className="ocr-test-form">
                <div className="file-drop-area">
                  <Upload size={32} className="upload-icon" />
                  <p>Select a certificate PDF or image file (.pdf, .png, .jpg, .webp)</p>
                  <input
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg,.webp"
                    onChange={(e) => setOcrFile(e.target.files[0])}
                    className="file-input-hidden"
                    id="ocrFileInput"
                  />
                  <label htmlFor="ocrFileInput" className="btn-secondary btn-sm" style={{ cursor: 'pointer' }}>
                    Browse Files
                  </label>
                  {ocrFile && <span className="selected-filename">{ocrFile.name} ({(ocrFile.size / 1024).toFixed(1)} KB)</span>}
                </div>

                <button
                  type="submit"
                  className="btn-primary"
                  disabled={!ocrFile || ocrLoading}
                  style={{ marginTop: '16px' }}
                >
                  {ocrLoading ? 'Executing Local Neural OCR...' : 'Extract Certificate Details'} <Sparkles size={16} />
                </button>
              </form>

              {/* OCR Results Display */}
              {ocrResult && (
                <div className="ocr-results-box">
                  <div className="ocr-result-header">
                    <h4>Extraction Result</h4>
                    <span className="badge badge-neutral">Engine: {ocrResult.extractionMethod}</span>
                  </div>

                  <div className="ocr-fields-grid">
                    <div className="ocr-field-item">
                      <span className="ocr-field-label">Student Name:</span>
                      <strong className="ocr-field-value">{ocrResult.fields?.studentName || 'Not detected'}</strong>
                    </div>

                    <div className="ocr-field-item">
                      <span className="ocr-field-label">Institution:</span>
                      <strong className="ocr-field-value">{ocrResult.fields?.institutionName || 'Not detected'}</strong>
                    </div>

                    <div className="ocr-field-item">
                      <span className="ocr-field-label">Register / Roll No:</span>
                      <strong className="ocr-field-value">{ocrResult.fields?.registerNo || 'Not detected'}</strong>
                    </div>

                    <div className="ocr-field-item">
                      <span className="ocr-field-label">Course / Degree:</span>
                      <strong className="ocr-field-value">{ocrResult.fields?.course || 'Not detected'}</strong>
                    </div>

                    <div className="ocr-field-item">
                      <span className="ocr-field-label">Issue Date:</span>
                      <strong className="ocr-field-value">{ocrResult.fields?.issueDate || 'Not detected'}</strong>
                    </div>

                    <div className="ocr-field-item">
                      <span className="ocr-field-label">Semester:</span>
                      <strong className="ocr-field-value">{ocrResult.fields?.semester || 'Not detected'}</strong>
                    </div>
                  </div>

                  <div className="ocr-disclaimer">
                    <ShieldAlert size={16} />
                    <span>{ocrResult.disclaimer}</span>
                  </div>

                  <details className="ocr-raw-text">
                    <summary>View Raw Extracted Text</summary>
                    <pre>{ocrResult.rawText}</pre>
                  </details>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Rejection Modal */}
        {rejectModalReq && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h3>Reject Institution Application</h3>
              <p style={{ margin: '8px 0 16px 0', color: 'var(--navy-600)', fontSize: '14px' }}>
                Please specify the reason for rejecting <strong>{rejectModalReq.universityDetails.universityName}</strong>.
              </p>

              <div className="form-group">
                <label className="form-label">Rejection Reason</label>
                <textarea
                  className="form-input"
                  rows="3"
                  placeholder="e.g. Accreditation documents could not be verified."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setRejectModalReq(null)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn-danger"
                  onClick={handleConfirmReject}
                >
                  Confirm Rejection
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

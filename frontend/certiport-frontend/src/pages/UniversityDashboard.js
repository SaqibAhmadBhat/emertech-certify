import React, { useState, useEffect, useCallback } from 'react';
import { 
  Award, 
  FileText, 
  Plus, 
  Trash2, 
  Search, 
  CheckCircle, 
  AlertTriangle, 
  Eye, 
  Download, 
  Ban, 
  Sparkles, 
  Building2, 
  ExternalLink,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';
import { api } from '../api/apiClient';

export default function UniversityDashboard() {
  const [activeTab, setActiveTab] = useState('issue'); // 'issue', 'issued', 'templates', 'profile'
  const [templates, setTemplates] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [profile, setProfile] = useState(null);

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);
  const [error, setError] = useState(null);

  // Issuance Form State
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [studentEmail, setStudentEmail] = useState('');
  const [studentName, setStudentName] = useState('');
  const [registerNo, setRegisterNo] = useState('');
  const [course, setCourse] = useState('B.E. Computer Science and Engineering');
  const [program, setProgram] = useState('Undergraduate');
  const [semester, setSemester] = useState('VIII');
  const [examDate, setExamDate] = useState('May 2026');
  const [yearOfGraduation, setYearOfGraduation] = useState('2026');
  
  // Marks card dynamic subject rows
  const [subjects, setSubjects] = useState([
    { name: 'Blockchain Technology & Smart Contracts', maxMarks: '100', obtainedMarks: '95', grade: 'O' },
    { name: 'Artificial Intelligence & Machine Learning', maxMarks: '100', obtainedMarks: '92', grade: 'O' },
    { name: 'Distributed Systems & Cloud Computing', maxMarks: '100', obtainedMarks: '88', grade: 'A+' },
    { name: 'Network Security & Cryptography', maxMarks: '100', obtainedMarks: '90', grade: 'O' }
  ]);

  // AI OCR state
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrSuccess, setOcrSuccess] = useState(false);

  // Preview Modal
  const [previewHtml, setPreviewHtml] = useState(null);
  const [issuedSuccessCert, setIssuedSuccessCert] = useState(null);

  // Revoke state
  const [revokingCert, setRevokingCert] = useState(null);
  const [revokeReason, setRevokeReason] = useState('');

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');

  // Load Templates & Profile
  const loadInitialData = useCallback(async () => {
    setLoading(true);
    try {
      const [tplRes, profRes, certsRes] = await Promise.all([
        api.get('/university/templates'),
        api.get('/university/profile'),
        api.get('/university/certificates')
      ]);

      if (tplRes.templates) {
        setTemplates(tplRes.templates);
        if (tplRes.templates.length > 0) {
          setSelectedTemplateId(tplRes.templates[0]._id);
        }
      }
      if (profRes.university) setProfile(profRes.university);
      if (certsRes.certificates) setCertificates(certsRes.certificates);
    } catch (err) {
      setError(err.message || 'Failed to load initial data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Dynamic Subject Add / Remove
  const handleAddSubject = () => {
    setSubjects([...subjects, { name: '', maxMarks: '100', obtainedMarks: '', grade: '' }]);
  };

  const handleRemoveSubject = (idx) => {
    setSubjects(subjects.filter((_, i) => i !== idx));
  };

  const handleSubjectChange = (idx, field, val) => {
    const updated = [...subjects];
    updated[idx][field] = val;
    setSubjects(updated);
  };

  // AI OCR Autofill
  const handleAiOcrAutofill = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setOcrLoading(true);
    setOcrSuccess(false);
    setError(null);

    const formData = new FormData();
    formData.append('document', file);

    try {
      const res = await api.upload('/ai/extract-ocr', formData);
      if (res.fields) {
        if (res.fields.studentName) setStudentName(res.fields.studentName);
        if (res.fields.registerNo) setRegisterNo(res.fields.registerNo);
        if (res.fields.course) setCourse(res.fields.course);
        if (res.fields.semester) setSemester(res.fields.semester);
        if (res.fields.issueDate) setExamDate(res.fields.issueDate);
        setOcrSuccess(true);
        setMsg('Information extracted via local OCR! Please review and confirm fields before issuing.');
      }
    } catch (err) {
      setError('AI OCR extraction failed: ' + err.message);
    } finally {
      setOcrLoading(false);
    }
  };

  // Live HTML Preview
  const handlePreview = async () => {
    if (!selectedTemplateId) {
      setError('Please select a template');
      return;
    }
    setError(null);
    try {
      const payload = {
        templateId: selectedTemplateId,
        certificateData: {
          studentName,
          registerNo,
          course,
          program,
          semester,
          examDate,
          yearOfGraduation,
          subjects
        }
      };
      const res = await api.post('/university/certificate/preview', payload);
      setPreviewHtml(res);
    } catch (err) {
      setError(err.message || 'Preview generation failed');
    }
  };

  // Issue Certificate
  const handleIssueCertificate = async (e) => {
    e.preventDefault();
    if (!selectedTemplateId || !studentEmail || !studentName) {
      setError('Please fill in required fields (Template, Email, Student Name)');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const payload = {
        templateId: selectedTemplateId,
        studentEmail,
        certificateData: {
          studentName,
          registerNo,
          course,
          program,
          semester,
          examDate,
          yearOfGraduation,
          subjects
        }
      };

      const res = await api.post('/university/certificate/issue', payload);
      setIssuedSuccessCert(res.certificate);
      setMsg(res.msg || 'Certificate issued successfully!');

      // Refresh certificates list
      const certsRes = await api.get('/university/certificates');
      if (certsRes.certificates) setCertificates(certsRes.certificates);
    } catch (err) {
      setError(err.message || 'Failed to issue certificate');
    } finally {
      setLoading(false);
    }
  };

  // Confirm Revocation
  const handleConfirmRevoke = async () => {
    if (!revokingCert) return;
    try {
      await api.delete(`/university/certificate/${revokingCert._id}`, {
        body: JSON.stringify({ reason: revokeReason || 'Administrative revocation' })
      });
      setMsg(`Certificate ${revokingCert.blockchainId} has been revoked.`);
      setRevokingCert(null);
      
      const certsRes = await api.get('/university/certificates');
      if (certsRes.certificates) setCertificates(certsRes.certificates);
    } catch (err) {
      setError(err.message || 'Failed to revoke certificate');
    }
  };

  // Filtered Certificates
  const filteredCertificates = certificates.filter(c => {
    const q = searchTerm.toLowerCase();
    return (
      (c.blockchainId && c.blockchainId.toLowerCase().includes(q)) ||
      (c.studentName && c.studentName.toLowerCase().includes(q)) ||
      (c.studentEmail && c.studentEmail.toLowerCase().includes(q)) ||
      (c.registerNo && c.registerNo.toLowerCase().includes(q))
    );
  });

  return (
    <div className="dashboard-page-root">
      <div className="dashboard-container">
        {/* Header */}
        <div className="dashboard-header-bar">
          <div>
            <h1 className="dashboard-page-title">
              {profile?.universityDetails?.universityName || 'Institution Administration Portal'}
            </h1>
            <p className="dashboard-page-sub">
              Issue tamper-proof certificates, manage student records, and maintain the on-chain registry
            </p>
          </div>
          <button onClick={loadInitialData} className="btn-secondary" title="Refresh">
            <RefreshCw size={16} className={loading ? 'spin' : ''} /> Refresh
          </button>
        </div>

        {/* Alerts */}
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

        {/* Tabs */}
        <div className="dashboard-tabs-bar">
          <button
            className={`dash-tab-btn ${activeTab === 'issue' ? 'active' : ''}`}
            onClick={() => setActiveTab('issue')}
          >
            <Plus size={16} /> Issue New Certificate
          </button>
          <button
            className={`dash-tab-btn ${activeTab === 'issued' ? 'active' : ''}`}
            onClick={() => setActiveTab('issued')}
          >
            <FileText size={16} /> Issued Certificates ({certificates.length})
          </button>
          <button
            className={`dash-tab-btn ${activeTab === 'templates' ? 'active' : ''}`}
            onClick={() => setActiveTab('templates')}
          >
            <Award size={16} /> Certificate Templates ({templates.length})
          </button>
          <button
            className={`dash-tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            <Building2 size={16} /> Institution Profile
          </button>
        </div>

        {/* TAB 1: ISSUE CERTIFICATE */}
        {activeTab === 'issue' && (
          <div className="tab-pane">
            <div className="card">
              <div className="card-header-flex">
                <div>
                  <h3 className="card-title">Issue Official Academic Certificate</h3>
                  <p className="card-subtitle">
                    Enter student academic records. The system renders the document, computes a SHA-256 digest, and registers it on-chain.
                  </p>
                </div>

                {/* AI OCR Autofill Button */}
                <div className="ai-ocr-trigger-box">
                  <input
                    type="file"
                    id="ocrAutofillInput"
                    accept=".pdf,.png,.jpg,.jpeg,.webp"
                    onChange={handleAiOcrAutofill}
                    style={{ display: 'none' }}
                  />
                  <label htmlFor="ocrAutofillInput" className="btn-primary btn-sm ai-btn" style={{ cursor: 'pointer' }}>
                    <Sparkles size={16} />
                    {ocrLoading ? 'Reading with OCR...' : 'Auto-Fill with AI OCR'}
                  </label>
                  {ocrSuccess && <span className="ocr-pill">Auto-filled via OCR</span>}
                </div>
              </div>

              <form onSubmit={handleIssueCertificate} className="issuance-form">
                {/* Template Selection */}
                <div className="form-group" style={{ marginBottom: '16px' }}>
                  <label className="form-label">Select Certificate Template *</label>
                  <select
                    className="form-input"
                    value={selectedTemplateId}
                    onChange={(e) => setSelectedTemplateId(e.target.value)}
                    required
                  >
                    {templates.map((tpl) => (
                      <option key={tpl._id} value={tpl._id}>
                        {tpl.templateName} ({tpl.certificateType})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Student Credentials */}
                <div className="form-section-title">Student Information</div>
                <div className="form-grid-3">
                  <div className="form-group">
                    <label className="form-label">Student Name *</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Saqib Ahmad Bhat"
                      value={studentName}
                      onChange={(e) => setStudentName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Student Email Address *</label>
                    <input
                      type="email"
                      className="form-input"
                      placeholder="student@example.com"
                      value={studentEmail}
                      onChange={(e) => setStudentEmail(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Register / Roll Number *</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. 950020104001"
                      value={registerNo}
                      onChange={(e) => setRegisterNo(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* Course Details */}
                <div className="form-section-title">Academic & Examination Details</div>
                <div className="form-grid-4">
                  <div className="form-group">
                    <label className="form-label">Course / Branch</label>
                    <input
                      type="text"
                      className="form-input"
                      value={course}
                      onChange={(e) => setCourse(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Program Level</label>
                    <input
                      type="text"
                      className="form-input"
                      value={program}
                      onChange={(e) => setProgram(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Semester / Term</label>
                    <input
                      type="text"
                      className="form-input"
                      value={semester}
                      onChange={(e) => setSemester(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Year of Graduation</label>
                    <input
                      type="number"
                      className="form-input"
                      value={yearOfGraduation}
                      onChange={(e) => setYearOfGraduation(e.target.value)}
                    />
                  </div>
                </div>

                {/* Dynamic Subjects Table (for marks cards) */}
                <div className="form-section-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Examination Subjects & Grades</span>
                  <button type="button" onClick={handleAddSubject} className="btn-secondary btn-sm">
                    <Plus size={14} /> Add Subject Row
                  </button>
                </div>

                <div className="table-responsive" style={{ marginBottom: '24px' }}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Subject Title</th>
                        <th style={{ width: '130px' }}>Max Marks</th>
                        <th style={{ width: '130px' }}>Obtained</th>
                        <th style={{ width: '100px' }}>Grade</th>
                        <th style={{ width: '50px' }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {subjects.map((sub, i) => (
                        <tr key={i}>
                          <td>
                            <input
                              type="text"
                              className="form-input"
                              placeholder="e.g. Smart Contracts"
                              value={sub.name}
                              onChange={(e) => handleSubjectChange(i, 'name', e.target.value)}
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              className="form-input"
                              value={sub.maxMarks}
                              onChange={(e) => handleSubjectChange(i, 'maxMarks', e.target.value)}
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              className="form-input"
                              value={sub.obtainedMarks}
                              onChange={(e) => handleSubjectChange(i, 'obtainedMarks', e.target.value)}
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              className="form-input"
                              placeholder="O / A+"
                              value={sub.grade}
                              onChange={(e) => handleSubjectChange(i, 'grade', e.target.value)}
                            />
                          </td>
                          <td>
                            {subjects.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveSubject(i)}
                                className="btn-danger btn-sm"
                                title="Remove row"
                              >
                                <Trash2 size={12} />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Actions */}
                <div className="form-actions-bar">
                  <button
                    type="button"
                    onClick={handlePreview}
                    className="btn-secondary"
                  >
                    <Eye size={16} /> Preview HTML Layout
                  </button>

                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={loading}
                  >
                    <ShieldCheck size={16} />
                    {loading ? 'Minting on Blockchain...' : 'Issue & Register Certificate'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* TAB 2: ISSUED CERTIFICATES */}
        {activeTab === 'issued' && (
          <div className="tab-pane">
            <div className="card">
              <div className="card-header-flex">
                <div>
                  <h3 className="card-title">Issued Certificate Registry</h3>
                  <p className="card-subtitle">
                    Complete institutional ledger of issued academic certificates, document hashes, and verification links.
                  </p>
                </div>

                <div className="search-filter-box">
                  <Search size={16} className="search-icon" />
                  <input
                    type="text"
                    className="form-input search-input"
                    placeholder="Search by ID, student, or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              {filteredCertificates.length === 0 ? (
                <div className="empty-state">
                  <FileText size={40} className="empty-icon" />
                  <h4>No Certificates Match Filter</h4>
                  <p>Issue certificates using Tab 1 to populate this registry.</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Blockchain ID</th>
                        <th>Student Details</th>
                        <th>Type / Course</th>
                        <th>Issued Date</th>
                        <th>SHA-256 Digest</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredCertificates.map((cert) => (
                        <tr key={cert._id}>
                          <td>
                            <span className="mono-text">{cert.blockchainId}</span>
                          </td>
                          <td>
                            <strong>{cert.studentName}</strong>
                            <div className="sub-text">{cert.studentEmail}</div>
                            <div className="sub-text">Reg: {cert.registerNo}</div>
                          </td>
                          <td>
                            <div>{cert.certificateType}</div>
                            <div className="sub-text">{cert.course}</div>
                          </td>
                          <td>{new Date(cert.dateOfIssue || cert.createdAt).toLocaleDateString()}</td>
                          <td>
                            <span className="mono-text" title={cert.documentHash}>
                              {cert.documentHash?.substring(0, 14)}...
                            </span>
                          </td>
                          <td>
                            <span className={`badge badge-${cert.status === 'issued' ? 'authentic' : 'revoked'}`}>
                              {cert.status?.toUpperCase()}
                            </span>
                          </td>
                          <td>
                            <div className="action-buttons">
                              <a
                                href={`/api/public/certificate/${cert.blockchainId}/download`}
                                className="btn-secondary btn-sm"
                                title="Download PDF"
                                target="_blank"
                                rel="noreferrer"
                              >
                                <Download size={14} />
                              </a>
                              <a
                                href={`/verify?id=${encodeURIComponent(cert.blockchainId)}`}
                                className="btn-secondary btn-sm"
                                title="Open in Public Verifier"
                                target="_blank"
                                rel="noreferrer"
                              >
                                <ExternalLink size={14} />
                              </a>
                              {cert.status === 'issued' && (
                                <button
                                  onClick={() => { setRevokingCert(cert); setRevokeReason(''); }}
                                  className="btn-danger btn-sm"
                                  title="Revoke Certificate"
                                >
                                  <Ban size={14} />
                                </button>
                              )}
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

        {/* TAB 3: CERTIFICATE TEMPLATES */}
        {activeTab === 'templates' && (
          <div className="tab-pane">
            <div className="card">
              <h3 className="card-title">Pre-Provisioned Academic Templates</h3>
              <p className="card-subtitle">
                Academic EJS certificate layouts rendered with dynamic student fields and embedded verification QR codes.
              </p>

              <div className="templates-grid">
                {templates.map((tpl) => (
                  <div key={tpl._id} className="template-card">
                    <div className="template-icon-box">
                      <Award size={24} />
                    </div>
                    <h4>{tpl.templateName}</h4>
                    <span className="badge badge-primary">{tpl.certificateType}</span>
                    <p className="template-path">{tpl.templatePath}</p>
                    <button 
                      onClick={() => { setSelectedTemplateId(tpl._id); setActiveTab('issue'); }}
                      className="btn-secondary btn-sm"
                    >
                      Use Template
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: PROFILE */}
        {activeTab === 'profile' && (
          <div className="tab-pane">
            <div className="card">
              <h3 className="card-title">Institution Profile & Accreditation</h3>
              <p className="card-subtitle">
                Registered institutional credentials verified on the Emertech Certify platform.
              </p>

              {profile && (
                <div className="profile-details-grid">
                  <div className="profile-field">
                    <span className="profile-label">Institution Name:</span>
                    <strong className="profile-val">{profile.universityDetails?.universityName}</strong>
                  </div>
                  <div className="profile-field">
                    <span className="profile-label">University ID:</span>
                    <span className="mono-text">{profile.universityDetails?.universityId?.toUpperCase()}</span>
                  </div>
                  <div className="profile-field">
                    <span className="profile-label">Accreditation ID:</span>
                    <strong className="profile-val">{profile.universityDetails?.registrationNumber}</strong>
                  </div>
                  <div className="profile-field">
                    <span className="profile-label">Contact Person:</span>
                    <strong className="profile-val">{profile.universityDetails?.contactPersonName}</strong>
                  </div>
                  <div className="profile-field">
                    <span className="profile-label">Official Email:</span>
                    <strong className="profile-val">{profile.email}</strong>
                  </div>
                  <div className="profile-field">
                    <span className="profile-label">Phone:</span>
                    <strong className="profile-val">{profile.universityDetails?.phone}</strong>
                  </div>
                  <div className="profile-field">
                    <span className="profile-label">Campus Address:</span>
                    <strong className="profile-val">{profile.universityDetails?.address}, {profile.universityDetails?.city}, {profile.universityDetails?.state}</strong>
                  </div>
                  <div className="profile-field">
                    <span className="profile-label">Status:</span>
                    <span className="badge badge-authentic">Verified & Approved</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* HTML Preview Modal */}
        {previewHtml && (
          <div className="modal-overlay">
            <div className="modal-content modal-large">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3>Certificate Layout Preview</h3>
                <button onClick={() => setPreviewHtml(null)} className="alert-close">×</button>
              </div>
              <div 
                className="preview-iframe-wrapper"
                dangerouslySetInnerHTML={{ __html: previewHtml }}
              />
              <div style={{ textAlign: 'right', marginTop: '16px' }}>
                <button onClick={() => setPreviewHtml(null)} className="btn-secondary">
                  Close Preview
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Success Modal after Issuance */}
        {issuedSuccessCert && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div style={{ textAlign: 'center', marginBottom: '18px' }}>
                <div className="success-badge-icon">
                  <ShieldCheck size={36} />
                </div>
                <h3>Academic Certificate Registered!</h3>
                <p style={{ color: 'var(--navy-600)', fontSize: '14px' }}>
                  The certificate has been generated and its cryptographic digest is registered in the system.
                </p>
              </div>

              <div className="success-details-card">
                <div>
                  <span className="success-prop-label">Blockchain Certificate ID:</span>
                  <div className="mono-text" style={{ fontSize: '13px', marginTop: '2px' }}>
                    {issuedSuccessCert.blockchainId}
                  </div>
                </div>

                <div style={{ marginTop: '12px' }}>
                  <span className="success-prop-label">SHA-256 Digest (bytes32):</span>
                  <div className="mono-text" style={{ fontSize: '11px', marginTop: '2px' }}>
                    {issuedSuccessCert.documentHash}
                  </div>
                </div>

                <div style={{ marginTop: '12px' }}>
                  <span className="success-prop-label">Storage Architecture:</span>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--navy-800)' }}>
                    {issuedSuccessCert.storageType?.toUpperCase()} Storage Fallback Active
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginTop: '24px' }}>
                <a
                  href={`/api/public/certificate/${issuedSuccessCert.blockchainId}/download`}
                  className="btn-primary"
                  target="_blank"
                  rel="noreferrer"
                >
                  <Download size={16} /> Download Official PDF
                </a>
                <button
                  type="button"
                  onClick={() => setIssuedSuccessCert(null)}
                  className="btn-secondary"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Revoke Modal */}
        {revokingCert && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h3>Revoke Academic Certificate</h3>
              <p style={{ margin: '8px 0 16px 0', color: 'var(--navy-600)', fontSize: '14px' }}>
                Are you sure you want to revoke Certificate <strong>{revokingCert.blockchainId}</strong> for <strong>{revokingCert.studentName}</strong>?
                This action is permanently recorded on the blockchain registry.
              </p>

              <div className="form-group">
                <label className="form-label">Official Revocation Reason</label>
                <textarea
                  className="form-input"
                  rows="3"
                  placeholder="e.g. Administrative correction or transcript update required"
                  value={revokeReason}
                  onChange={(e) => setRevokeReason(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setRevokingCert(null)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn-danger"
                  onClick={handleConfirmRevoke}
                >
                  Confirm Revocation
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  ShieldCheck, 
  Building2, 
  GraduationCap, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight,
  Eye,
  EyeOff
} from 'lucide-react';
import { api } from '../api/apiClient';

export default function Register() {
  const navigate = useNavigate();
  const [role, setRole] = useState('student'); // 'student' or 'university'
  const [approvedUniversities, setApprovedUniversities] = useState([]);

  // Common Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Student Fields
  const [fullName, setFullName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [program, setProgram] = useState('ug');
  const [enrollmentNumber, setEnrollmentNumber] = useState('');
  const [universityName, setUniversityName] = useState('');
  const [yearOfGraduation, setYearOfGraduation] = useState('2026');

  // University Fields
  const [universityNameField, setUniversityNameField] = useState('');
  const [contactPersonName, setContactPersonName] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [officialAddress, setOfficialAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [accreditationId, setAccreditationId] = useState('');
  const [coursesOffered, setCoursesOffered] = useState('');
  const [reasonForRegistration, setReasonForRegistration] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [isPendingApproval, setIsPendingApproval] = useState(false);

  useEffect(() => {
    // Fetch approved universities for student registration dropdown
    api.get('/public/approved-universities')
      .then(res => {
        if (res.universities && res.universities.length > 0) {
          setApprovedUniversities(res.universities);
          setUniversityName(res.universities[0].name);
        }
      })
      .catch(err => {
        console.warn('Failed to load universities list:', err);
      });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        email,
        password,
        role
      };

      if (role === 'student') {
        Object.assign(payload, {
          fullName,
          dateOfBirth,
          program,
          enrollmentNumber,
          universityName: universityName || 'Government College of Engineering, Tirunelveli',
          yearOfAdmission: 2022,
          yearOfGraduation
        });
      } else {
        Object.assign(payload, {
          universityNameField,
          contactPersonName,
          contactNumber,
          officialAddress,
          city,
          state,
          country: 'India',
          accreditationId,
          coursesOffered,
          reasonForRegistration
        });
      }

      const res = await api.post('/auth/register', payload);

      if (role === 'student') {
        setSuccessMsg('Student registration successful! Redirecting to login...');
        setTimeout(() => navigate('/login'), 2000);
      } else {
        setIsPendingApproval(true);
        setSuccessMsg(res.msg || 'Institution application submitted for administrative review.');
      }
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-root">
      <div className="auth-card register-card">
        <div className="auth-header">
          <div className="auth-brand-icon">
            <ShieldCheck size={28} />
          </div>
          <h2 className="auth-title">Create an Account</h2>
          <p className="auth-subtitle">Register to issue or access tamper-evident academic certificates</p>
        </div>

        {/* Role Tabs */}
        <div className="role-selector-tabs">
          <button
            type="button"
            className={`role-tab-btn ${role === 'student' ? 'active' : ''}`}
            onClick={() => { setRole('student'); setError(null); }}
          >
            <GraduationCap size={18} />
            <span>Student / Graduate</span>
          </button>
          <button
            type="button"
            className={`role-tab-btn ${role === 'university' ? 'active' : ''}`}
            onClick={() => { setRole('university'); setError(null); }}
          >
            <Building2 size={18} />
            <span>University / College</span>
          </button>
        </div>

        {error && (
          <div className="auth-error-alert">
            <AlertCircle size={18} className="error-icon" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="auth-success-alert">
            <CheckCircle2 size={18} className="success-icon" />
            <div>
              <strong>Success!</strong>
              <p>{successMsg}</p>
              {isPendingApproval && (
                <p className="pending-note">
                  Institutional registrations require verification by the system administrator to maintain trust. You will be able to log in once your application is approved.
                </p>
              )}
            </div>
          </div>
        )}

        {!isPendingApproval && (
          <form onSubmit={handleSubmit} className="auth-form">
            {/* Account Credentials */}
            <div className="form-section-title">1. Account Credentials</div>
            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label">Email Address *</label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Password *</label>
                <div className="input-with-icon">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="form-input"
                    placeholder="Min 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="btn-toggle-password"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Confirm Password *</label>
                <div className="input-with-icon">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    className="form-input"
                    placeholder="Repeat password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="btn-toggle-password"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            </div>

            {/* Student Role Form */}
            {role === 'student' && (
              <>
                <div className="form-section-title">2. Academic Information</div>
                <div className="form-grid-2">
                  <div className="form-group">
                    <label className="form-label">Full Name *</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Saqib Ahmad Bhat"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Date of Birth *</label>
                    <input
                      type="date"
                      className="form-input"
                      value={dateOfBirth}
                      onChange={(e) => setDateOfBirth(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Register / Roll Number *</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. 950020104001"
                      value={enrollmentNumber}
                      onChange={(e) => setEnrollmentNumber(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Institution / University *</label>
                    {approvedUniversities.length > 0 ? (
                      <select
                        className="form-input"
                        value={universityName}
                        onChange={(e) => setUniversityName(e.target.value)}
                        required
                      >
                        {approvedUniversities.map((u, i) => (
                          <option key={i} value={u.name}>{u.name}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Government College of Engineering, Tirunelveli"
                        value={universityName}
                        onChange={(e) => setUniversityName(e.target.value)}
                        required
                      />
                    )}
                  </div>

                  <div className="form-group">
                    <label className="form-label">Program Level</label>
                    <select
                      className="form-input"
                      value={program}
                      onChange={(e) => setProgram(e.target.value)}
                    >
                      <option value="ug">Undergraduate (UG)</option>
                      <option value="pg">Postgraduate (PG)</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Graduation Year</label>
                    <input
                      type="number"
                      className="form-input"
                      value={yearOfGraduation}
                      onChange={(e) => setYearOfGraduation(e.target.value)}
                    />
                  </div>
                </div>
              </>
            )}

            {/* University Role Form */}
            {role === 'university' && (
              <>
                <div className="form-section-title">2. Institution Accreditation & Profile</div>
                <div className="form-grid-2">
                  <div className="form-group">
                    <label className="form-label">Institution Name *</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Government College of Engineering, Tirunelveli"
                      value={universityNameField}
                      onChange={(e) => setUniversityNameField(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Accreditation / Registration ID *</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. NAAC-A-AUTONOMOUS-2026"
                      value={accreditationId}
                      onChange={(e) => setAccreditationId(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Official Contact Person *</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Dr. Registrar / Principal"
                      value={contactPersonName}
                      onChange={(e) => setContactPersonName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Contact Phone *</label>
                    <input
                      type="tel"
                      className="form-input"
                      placeholder="+91-462-2552450"
                      value={contactNumber}
                      onChange={(e) => setContactNumber(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Official Address *</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Campus Address"
                      value={officialAddress}
                      onChange={(e) => setOfficialAddress(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">City *</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Tirunelveli"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">State *</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Tamil Nadu"
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Courses Offered (comma-separated) *</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="B.E. CSE, B.E. ECE, B.E. Mechanical, M.E. CSE"
                      value={coursesOffered}
                      onChange={(e) => setCoursesOffered(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="form-group" style={{ marginTop: '12px' }}>
                  <label className="form-label">Reason for Applying</label>
                  <textarea
                    className="form-input"
                    rows="2"
                    placeholder="Explain institutional credentialing and verification requirements..."
                    value={reasonForRegistration}
                    onChange={(e) => setReasonForRegistration(e.target.value)}
                  />
                </div>
              </>
            )}

            <button
              type="submit"
              className="btn-primary auth-submit-btn"
              disabled={loading}
              style={{ marginTop: '20px' }}
            >
              {loading ? 'Submitting Application...' : (role === 'student' ? 'Register Student' : 'Submit Institution Application')} <ArrowRight size={16} />
            </button>
          </form>
        )}

        <div className="auth-footer-prompt">
          <span>Already registered? </span>
          <Link to="/login" className="auth-link">Sign In to your account</Link>
        </div>
      </div>
    </div>
  );
}

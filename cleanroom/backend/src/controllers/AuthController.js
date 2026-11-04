const jwt = require('jsonwebtoken');
const config = require('../config/env');
const User = require('../models/User');
const StudentEnrollment = require('../models/StudentEnrollment');
const AuditLog = require('../models/AuditLog');

class AuthController {
  /**
   * Public Registration Endpoint:
   * RESTRICTED TO LEAST-PRIVILEGE STUDENT ACCOUNTS ONLY.
   * Any client attempting to supply administrative roles or self-assert institutional identity is strictly rejected.
   */
  static async register(req, res, next) {
    try {
      const { fullName, email, password, role, studentIdentifier, institutionCode } = req.body;

      if (!fullName || !email || !password) {
        return res.status(400).json({ success: false, message: 'Full name, email, and password are required.' });
      }

      // 1. Critical Privilege Escalation Guard
      if (role && (role.toUpperCase() === 'SUPER_ADMIN' || role.toUpperCase() === 'INSTITUTION_ADMIN')) {
        return res.status(403).json({
          success: false,
          message: 'Privilege escalation rejected: Public registration is restricted to STUDENT accounts only. Administrative accounts must be provisioned through authorized governance channels.'
        });
      }

      // 2. Identity Self-Assertion Guard:
      // Direct self-assertion of studentIdentifier or institutionCode is forbidden.
      // Students must register with personal credentials and claim their institutional identity
      // via an institution-issued cryptographic enrollment token.
      if (studentIdentifier !== undefined || institutionCode !== undefined) {
        return res.status(400).json({
          success: false,
          message: 'Direct self-assertion of student identifier or institution code is not permitted during public registration. Register your account first, then claim your verified identity using an institution-issued enrollment token.'
        });
      }

      // 3. Email & Password Validation
      const cleanEmail = email.toLowerCase().trim();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(cleanEmail)) {
        return res.status(400).json({ success: false, message: 'Please provide a valid email address.' });
      }

      if (password.length < 8) {
        return res.status(400).json({ success: false, message: 'Password must be at least 8 characters long.' });
      }

      const existing = await User.findOne({ email: cleanEmail });
      if (existing) {
        return res.status(409).json({ success: false, message: 'A user account with this email already exists.' });
      }

      // 4. Enforce Least-Privilege Student Role with Unverified Identity
      const passwordHash = await User.hashPassword(password);
      const user = await User.create({
        fullName: fullName.trim(),
        email: cleanEmail,
        passwordHash,
        role: 'STUDENT',
        studentIdentifier: null,
        institutionCode: null,
        walletAddress: '',
        isActive: true
      });

      const token = jwt.sign(
        { id: user._id, email: user.email, role: user.role, institutionCode: null, studentIdentifier: null },
        config.jwtSecret,
        { expiresIn: config.jwtExpiresIn }
      );

      res.status(201).json({
        success: true,
        message: 'Student account registered successfully. Please claim your institutional identity using your institution-issued enrollment token.',
        token,
        user: {
          id: user._id,
          fullName: user.fullName,
          email: user.email,
          role: user.role,
          studentIdentifier: null,
          institutionCode: null
        }
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Student Identity Claiming Endpoint:
   * Cryptographically verifies student enrollment against institution-issued tokens
   * before associating studentIdentifier and institutionCode to the student's User account.
   */
  static async claimStudentIdentity(req, res, next) {
    try {
      if (req.user.role !== 'STUDENT') {
        return res.status(403).json({ success: false, message: 'Only student accounts may claim student enrollments.' });
      }

      const { enrollmentToken, studentIdentifier } = req.body;
      if (!enrollmentToken || !studentIdentifier) {
        return res.status(400).json({
          success: false,
          message: 'Both enrollmentToken and studentIdentifier are required to claim academic identity.'
        });
      }

      const cleanToken = enrollmentToken.trim();
      const cleanId = studentIdentifier.toUpperCase().trim();
      const tokenHash = StudentEnrollment.hashToken(cleanToken);

      const enrollment = await StudentEnrollment.findOne({
        enrollmentTokenHash: tokenHash,
        studentIdentifier: cleanId
      });

      if (!enrollment) {
        return res.status(404).json({
          success: false,
          message: 'Enrollment verification failed: No matching enrollment record found for the provided token and student identifier.'
        });
      }

      if (enrollment.isClaimed) {
        return res.status(409).json({
          success: false,
          message: 'This enrollment record has already been claimed and bound to an account.'
        });
      }

      // Require the authenticated student's email to match the email recorded by the institution
      const authUserEmail = (req.user.email || '').toLowerCase().trim();
      const studentEmailOnRecord = (enrollment.studentEmail || '').toLowerCase().trim();
      if (authUserEmail !== studentEmailOnRecord) {
        return res.status(403).json({
          success: false,
          message: `Identity claim rejected: Authenticated account email '${authUserEmail}' does not match the official student email on record ('${studentEmailOnRecord}') for this enrollment.`
        });
      }

      // Check if user is already bound to a different studentIdentifier
      const user = await User.findById(req.user._id);
      if (!user) {
        return res.status(404).json({ success: false, message: 'User record not found.' });
      }

      if (user.studentIdentifier && user.studentIdentifier !== cleanId) {
        return res.status(409).json({
          success: false,
          message: `User is already associated with student identifier: ${user.studentIdentifier}. Identity re-binding is not permitted.`
        });
      }

      // Atomically link student identity via conditional update to prevent race conditions
      const claimedEnrollment = await StudentEnrollment.findOneAndUpdate(
        { _id: enrollment._id, isClaimed: false },
        {
          $set: {
            isClaimed: true,
            claimedByUserId: user._id,
            claimedAt: new Date()
          }
        },
        { new: true }
      );

      if (!claimedEnrollment) {
        return res.status(409).json({
          success: false,
          message: 'Concurrent claim conflict: This enrollment record has already been claimed by another request.'
        });
      }

      user.studentIdentifier = claimedEnrollment.studentIdentifier;
      user.institutionCode = claimedEnrollment.institutionCode;
      await user.save();

      await AuditLog.create({
        eventType: 'STUDENT_IDENTITY_CLAIMED',
        actorId: user._id,
        actorEmail: user.email,
        actorRole: user.role,
        institutionCode: claimedEnrollment.institutionCode,
        clientIp: req.ip,
        diagnosticDetails: {
          studentIdentifier: claimedEnrollment.studentIdentifier,
          institutionCode: claimedEnrollment.institutionCode,
          enrollmentId: claimedEnrollment._id
        }
      });

      // Issue refreshed JWT with verified claims
      const token = jwt.sign(
        {
          id: user._id,
          email: user.email,
          role: user.role,
          institutionCode: user.institutionCode,
          studentIdentifier: user.studentIdentifier
        },
        config.jwtSecret,
        { expiresIn: config.jwtExpiresIn }
      );

      res.status(200).json({
        success: true,
        message: 'Student identity verified and successfully bound to account.',
        token,
        user: {
          id: user._id,
          fullName: user.fullName,
          email: user.email,
          role: user.role,
          institutionCode: user.institutionCode,
          studentIdentifier: user.studentIdentifier
        }
      });
    } catch (err) {
      next(err);
    }
  }

  static async login(req, res, next) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ success: false, message: 'Email and password are required.' });
      }

      const user = await User.findOne({ email: email.toLowerCase().trim() });
      if (!user) {
        return res.status(401).json({ success: false, message: 'Invalid credentials.' });
      }

      if (!user.isActive) {
        return res.status(403).json({ success: false, message: 'Account has been deactivated. Please contact governance administration.' });
      }

      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return res.status(401).json({ success: false, message: 'Invalid credentials.' });
      }

      const token = jwt.sign(
        { id: user._id, email: user.email, role: user.role, institutionCode: user.institutionCode },
        config.jwtSecret,
        { expiresIn: config.jwtExpiresIn }
      );

      await AuditLog.create({
        eventType: 'LOGIN',
        actorId: user._id,
        actorEmail: user.email,
        actorRole: user.role,
        clientIp: req.ip,
        diagnosticDetails: { userAgent: req.headers['user-agent'] }
      });

      res.status(200).json({
        success: true,
        message: 'Login authorized.',
        token,
        user: {
          id: user._id,
          fullName: user.fullName,
          email: user.email,
          role: user.role,
          institutionCode: user.institutionCode,
          studentIdentifier: user.studentIdentifier
        }
      });
    } catch (err) {
      next(err);
    }
  }

  static async getMe(req, res, next) {
    try {
      res.status(200).json({
        success: true,
        user: {
          id: req.user._id,
          fullName: req.user.fullName,
          email: req.user.email,
          role: req.user.role,
          institutionCode: req.user.institutionCode,
          studentIdentifier: req.user.studentIdentifier,
          walletAddress: req.user.walletAddress
        }
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = AuthController;

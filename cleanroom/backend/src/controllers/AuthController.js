const jwt = require('jsonwebtoken');
const config = require('../config/env');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');

class AuthController {
  /**
   * Public Registration Endpoint:
   * RESTRICTED TO LEAST-PRIVILEGE STUDENT ACCOUNTS ONLY.
   * Any client attempting to supply SUPER_ADMIN or INSTITUTION_ADMIN is strictly rejected.
   */
  static async register(req, res, next) {
    try {
      const { fullName, email, password, role, studentIdentifier } = req.body;

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

      // 2. Email & Password Validation
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

      // 3. Enforce Least-Privilege Student Role
      const passwordHash = await User.hashPassword(password);
      const user = await User.create({
        fullName: fullName.trim(),
        email: cleanEmail,
        passwordHash,
        role: 'STUDENT',
        studentIdentifier: studentIdentifier ? studentIdentifier.trim() : '',
        institutionCode: '',
        walletAddress: '',
        isActive: true
      });

      const token = jwt.sign(
        { id: user._id, email: user.email, role: user.role, institutionCode: '' },
        config.jwtSecret,
        { expiresIn: config.jwtExpiresIn }
      );

      res.status(201).json({
        success: true,
        message: 'Student account registered successfully.',
        token,
        user: {
          id: user._id,
          fullName: user.fullName,
          email: user.email,
          role: user.role,
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

const jwt = require('jsonwebtoken');
const config = require('../config/env');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');

class AuthController {
  static async register(req, res, next) {
    try {
      const { fullName, email, password, role, institutionCode, studentIdentifier, walletAddress } = req.body;

      if (!fullName || !email || !password) {
        return res.status(400).json({ success: false, message: 'Full name, email, and password are required.' });
      }

      const existing = await User.findOne({ email: email.toLowerCase().trim() });
      if (existing) {
        return res.status(409).json({ success: false, message: 'User with this email already exists.' });
      }

      const passwordHash = await User.hashPassword(password);
      const user = await User.create({
        fullName,
        email: email.toLowerCase().trim(),
        passwordHash,
        role: role || 'STUDENT',
        institutionCode: institutionCode || '',
        studentIdentifier: studentIdentifier || '',
        walletAddress: walletAddress || ''
      });

      const token = jwt.sign(
        { id: user._id, email: user.email, role: user.role, institutionCode: user.institutionCode },
        config.jwtSecret,
        { expiresIn: config.jwtExpiresIn }
      );

      res.status(201).json({
        success: true,
        message: 'Registration successful.',
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

  static async getMe(req, res) {
    res.status(200).json({
      success: true,
      user: req.user
    });
  }
}

module.exports = AuthController;

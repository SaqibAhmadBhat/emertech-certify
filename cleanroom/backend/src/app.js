const express = require('express');
const cors = require('cors');
const errorHandler = require('./middleware/errorHandler');

const authRoutes = require('./routes/authRoutes');
const institutionRoutes = require('./routes/institutionRoutes');
const certificateRoutes = require('./routes/certificateRoutes');
const verifyRoutes = require('./routes/verifyRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();

// Security Headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('Permissions-Policy', 'geolocation=(), camera=(), microphone=()');
  next();
});

// Production-aware CORS configuration
const corsOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map(s => s.trim())
  : '*';

app.use(cors({
  origin: corsOrigins,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Lightweight in-memory rate limiter for public endpoints (bypassed in test environment)
const rateLimitMap = new Map();
function rateLimiter(maxPerWindow = 60, windowMs = 60000) {
  return (req, res, next) => {
    if (process.env.NODE_ENV === 'test') return next();
    const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
    const now = Date.now();
    const userRecords = rateLimitMap.get(ip) || [];
    const recent = userRecords.filter(t => now - t < windowMs);
    if (recent.length >= maxPerWindow) {
      return res.status(429).json({ success: false, message: 'Too many requests. Please slow down and try again shortly.' });
    }
    recent.push(now);
    rateLimitMap.set(ip, recent);
    next();
  };
}

// Public API Health Check Endpoint
app.get('/api/v2/health', (req, res) => {
  const mongoose = require('mongoose');
  const dbState = mongoose.connection.readyState;
  const dbStatus = dbState === 1 ? 'CONNECTED' : (dbState === 2 ? 'CONNECTING' : 'DISCONNECTED');

  res.status(200).json({
    status: 'ONLINE',
    system: 'Emertech Certify Clean-Room Backend',
    version: '2.0.0',
    developer: 'Saqib Ahmad Bhat',
    institution: 'Government College of Engineering, Tirunelveli',
    database: dbStatus,
    environment: process.env.NODE_ENV || 'production',
    timestamp: new Date().toISOString()
  });
});

// Container / Cluster Readiness Endpoint
app.get('/api/v2/health/ready', (req, res) => {
  const mongoose = require('mongoose');
  const isReady = mongoose.connection.readyState === 1;
  if (isReady) {
    return res.status(200).json({ ready: true, status: 'READY' });
  }
  return res.status(503).json({ ready: false, status: 'NOT_READY' });
});

// REST API v2 Routes with Rate Limiting on sensitive paths
app.use('/api/v2/auth', rateLimiter(30, 60000), authRoutes);
app.use('/api/v2/institutions', institutionRoutes);
app.use('/api/v2/certificates', certificateRoutes);
app.use('/api/v2/verify', rateLimiter(120, 60000), verifyRoutes);
app.use('/api/v2/admin', adminRoutes);

// 404 Route Handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.originalUrl}` });
});

// Centralized Error Handler
app.use(errorHandler);

module.exports = app;

const express = require('express');
const cors = require('cors');
const errorHandler = require('./middleware/errorHandler');

const authRoutes = require('./routes/authRoutes');
const institutionRoutes = require('./routes/institutionRoutes');
const certificateRoutes = require('./routes/certificateRoutes');
const verifyRoutes = require('./routes/verifyRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();

// Middlewares
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  next();
});

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health Check
app.get('/api/v2/health', (req, res) => {
  res.status(200).json({
    status: 'ONLINE',
    system: 'Emertech Certify Clean-Room Backend',
    version: '2.0.0',
    developer: 'Saqib Ahmad Bhat',
    institution: 'Government College of Engineering, Tirunelveli',
    timestamp: new Date().toISOString()
  });
});

// REST API v2 Routes
app.use('/api/v2/auth', authRoutes);
app.use('/api/v2/institutions', institutionRoutes);
app.use('/api/v2/certificates', certificateRoutes);
app.use('/api/v2/verify', verifyRoutes);
app.use('/api/v2/admin', adminRoutes);

// 404 Route Handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.originalUrl}` });
});

// Centralized Error Handler
app.use(errorHandler);

module.exports = app;

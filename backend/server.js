require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const connectDB = require('./config/db');

const authRoutes = require('./routes/auth');
const universityRoutes = require('./routes/university');
const studentRoutes = require('./routes/student');
const publicRoutes = require('./routes/public');
const adminRoutes = require('./routes/admin');
const aiRoutes = require('./routes/ai');

const app = express();

const allowedOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    callback(null, true); // Permissive for local academic demonstration
  },
  credentials: true
}));

app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

const PORT = process.env.PORT || 5001;

// Create necessary filesystem directories
const dirs = [
  path.join(__dirname, 'uploads'),
  path.join(__dirname, 'uploads/temp'),
  path.join(__dirname, 'uploads/certificates'),
  path.join(__dirname, 'templates')
];

dirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/university', universityRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/ai', aiRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    project: 'Emertech Certify',
    developer: 'Saqib Ahmad Bhat',
    institution: 'Government College of Engineering, Tirunelveli',
    timestamp: new Date().toISOString()
  });
});

// Static files for certificates
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('API Error:', err.message);
  res.status(500).json({ 
    success: false, 
    msg: 'Server error processing request', 
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    success: false, 
    msg: `Endpoint not found: ${req.method} ${req.originalUrl}` 
  });
});

// Initialize database and start server
async function startServer() {
  try {
    await connectDB(process.env.MONGO_URI);
    
    return new Promise((resolve) => {
      const server = app.listen(PORT, () => {
        console.log('=================================================');
        console.log(`🎓 Emertech Certify Backend running on port ${PORT}`);
        console.log(`👨‍💻 Developer: Saqib Ahmad Bhat`);
        console.log(`🏛️ Institution: Government College of Engineering, Tirunelveli`);
        console.log(`🚀 Verification Engine & AI OCR Module Online`);
        console.log('=================================================');
        resolve(server);
      });
    });
  } catch (err) {
    console.error('Fatal initialization error:', err.message);
    process.exit(1);
  }
}

if (require.main === module) {
  startServer();
}

module.exports = app;
module.exports.startServer = startServer;

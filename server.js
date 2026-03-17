require('dotenv').config();
const express  = require('express');
const cors     = require('cors');
const path     = require('path');
const fs       = require('fs');
const connectDB = require('./config/db');
const { initBlockchain } = require('./blockchain/blockchainService');

const app = express();

connectDB();
initBlockchain();  // non-blocking — falls back to mock if not configured

if (!fs.existsSync('uploads')) fs.mkdirSync('uploads');

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth',    require('./routes/authRoutes'));
app.use('/api/issues',  require('./routes/issueRoutes'));
app.use('/api/admin',   require('./routes/adminRoutes'));

app.get('/api/health', (req, res) => res.json({ status: 'OK', timestamp: new Date().toISOString() }));

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ success: false, message: err.message || 'Internal Server Error' });
});

app.use('*', (req, res) => res.status(404).json({ success: false, message: 'Route not found' }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 CivicConnect API running on http://localhost:${PORT}`));

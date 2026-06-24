const express = require('express');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Database connection pool helper
let pool;
try {
  pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });
  console.log(`Connected to MySQL database: ${process.env.DB_NAME}`);
} catch (error) {
  console.error('Database connection failed:', error);
}

// Middleware to authenticate JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: 'Authentication token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ success: false, message: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Route: Auth Login
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Username and password are required' });
  }

  try {
    // 1. Fetch user from database
    const [users] = await pool.query('SELECT * FROM users WHERE username = ? LIMIT 1', [username]);
    if (users.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid username or password' });
    }

    const user = users[0];

    // 2. Verify status and approval
    if (user.status !== 'active') {
      return res.status(403).json({ success: false, message: 'Your account status is: ' + user.status });
    }
    if (user.is_approved !== 1) {
      return res.status(403).json({ success: false, message: 'Your account is not approved by admin yet' });
    }

    // 3. Compare passwords
    const passwordMatch = bcrypt.compareSync(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ success: false, message: 'Invalid username or password' });
    }

    // 4. Fetch employee details
    let employee = null;
    if (user.karyawan_id) {
      const [employees] = await pool.query('SELECT * FROM karyawans WHERE id = ? LIMIT 1', [user.karyawan_id]);
      if (employees.length > 0) {
        employee = employees[0];
      }
    }

    if (!employee) {
      return res.status(404).json({ success: false, message: 'No associated employee record found for this user' });
    }

    // 5. Generate JWT Token
    const token = jwt.sign(
      {
        userId: user.id,
        username: user.username,
        karyawanId: employee.id,
        nik: employee.nik,
        nama: employee.nama_lengkap
      },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role
      },
      employee: {
        id: employee.id,
        nik: employee.nik,
        nama_panggilan: employee.nama_panggilan,
        nama_lengkap: employee.nama_lengkap,
        divisi: employee.divisi,
        pekerjaan: employee.pekerjaan,
        email: employee.email,
        cabang: employee.cabang
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Server error during login' });
  }
});

// Route: Get Profile
app.get('/api/user/profile', authenticateToken, async (req, res) => {
  try {
    const [employees] = await pool.query('SELECT * FROM karyawans WHERE id = ? LIMIT 1', [req.user.karyawanId]);
    if (employees.length === 0) {
      return res.status(404).json({ success: false, message: 'Profile details not found' });
    }

    res.json({
      success: true,
      employee: employees[0]
    });
  } catch (error) {
    console.error('Fetch profile error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching profile' });
  }
});

// Route: Record Attendance Check-In / Check-Out
app.post('/api/attendance/check', authenticateToken, async (req, res) => {
  const { type, latitude, longitude, keterangan } = req.body;

  if (!type || !['Check-In', 'Check-Out'].includes(type)) {
    return res.status(400).json({ success: false, message: 'Invalid attendance type. Must be Check-In or Check-Out' });
  }

  try {
    const timeNow = new Date();
    // Format to Asia/Jakarta time (Laravel db timezone matches local Jakarta timezone)
    // Format YYYY-MM-DD HH:mm:ss
    const offset = 7 * 60; // Jakarta is UTC+7
    const localTime = new Date(timeNow.getTime() + (offset + timeNow.getTimezoneOffset()) * 60 * 1000);
    
    const year = localTime.getFullYear();
    const month = String(localTime.getMonth() + 1).padStart(2, '0');
    const day = String(localTime.getDate()).padStart(2, '0');
    const hours = String(localTime.getHours()).padStart(2, '0');
    const minutes = String(localTime.getMinutes()).padStart(2, '0');
    const seconds = String(localTime.getSeconds()).padStart(2, '0');
    
    const formattedDateTime = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;

    const locationText = `Mobile App (Lat: ${latitude || '-'}, Long: ${longitude || '-'})`;
    const finalKeterangan = keterangan ? `${locationText} - ${keterangan}` : locationText;

    // Insert to database absensis
    const [result] = await pool.query(
      'INSERT INTO absensis (karyawan_id, nik, waktu, tipe, mesin_id, keterangan, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [
        req.user.karyawanId,
        req.user.nik,
        formattedDateTime,
        type,
        null, // mesin_id is null for mobile attendance
        finalKeterangan,
        formattedDateTime,
        formattedDateTime
      ]
    );

    res.status(201).json({
      success: true,
      message: `${type} recorded successfully`,
      data: {
        id: result.insertId,
        waktu: formattedDateTime,
        tipe: type,
        keterangan: finalKeterangan
      }
    });

  } catch (error) {
    console.error('Attendance save error:', error);
    res.status(500).json({ success: false, message: 'Server error saving attendance record' });
  }
});

// Route: Get Attendance History
app.get('/api/attendance/history', authenticateToken, async (req, res) => {
  try {
    // Get last 30 logs for this employee
    const [logs] = await pool.query(
      'SELECT id, waktu, tipe, keterangan FROM absensis WHERE karyawan_id = ? ORDER BY waktu DESC LIMIT 30',
      [req.user.karyawanId]
    );

    res.json({
      success: true,
      logs
    });
  } catch (error) {
    console.error('Fetch history error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching history logs' });
  }
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Express API Server running at http://localhost:${PORT}`);
});

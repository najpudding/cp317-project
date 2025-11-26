
import express from 'express';
import cors from 'cors';
import bcrypt from 'bcrypt';
import { createServer } from 'node:http';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import dotenv from 'dotenv';
import pool from './db.js';
import { createUser, createUsersTable } from './database/users.js';

dotenv.config();


const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(cors({ origin: true, credentials: true }));
const server = createServer(app);
app.use(express.json());
// Serve the frontend directory statically
app.use('/frontend', express.static(join(__dirname, '..', 'frontend')));



// Example health check route for DB
app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', db: 'connected' });
  } catch (err) {
    res.status(500).json({ status: 'error', db: 'disconnected', error: err.message });
  }
});

// Home route
app.get('/', (req, res) => {
  res.sendFile(join(__dirname, '..', 'frontend', 'index.html'));
});


// Signup endpoint
app.post('/api/signup', async (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  try {
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    // Create user
    const user = await createUser({ username, email, passwordHash });
    res.status(201).json({ user });
  } catch (err) {
    if (err.code === '23505') { // Unique violation
      res.status(409).json({ error: 'Username or email already exists' });
    } else {
      res.status(500).json({ error: err.message });
    }
  }
});


// Login endpoint
import { getUserByEmail } from './database/users.js';
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Missing email or password' });
  }
  try {
    const user = await getUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    // For demo: no session, just success
    res.json({ success: true, user: { id: user.id, username: user.username, email: user.email } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// Ensure users table exists before starting server
createUsersTable()
  .then(() => {
    const PORT = 4000;
    server.listen(PORT, () => {
      console.log(`server running at http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to create users table:', err);
    process.exit(1);
  });
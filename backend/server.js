
import express from 'express';
import { createServer } from 'node:http';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import dotenv from 'dotenv';
import pool from './db.js';

dotenv.config();

const app = express();
const server = createServer(app);
app.use(express.json());
app.use(express.static('public'));

const __dirname = dirname(fileURLToPath(import.meta.url));

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
  res.sendFile(join(__dirname, 'index.html'));
});

// Future: import and use organized route files for each table
// e.g. import userRoutes from './users.js';
// app.use('/api/users', userRoutes);

server.listen(3000, () => {
  console.log('server running at http://localhost:3000');
});
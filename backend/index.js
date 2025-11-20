import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import pkg from 'pg';
const { Pool } = pkg;
dotenv.config();
import express from 'express';
import cors from 'cors';
import { createUser } from './database/user.js';

const pool = new Pool({
	user: process.env.PGUSER,
	host: process.env.PGHOST,
	database: process.env.PGDATABASE,
	password: process.env.PGPASSWORD,
	port: process.env.PGPORT,
	ssl: { rejectUnauthorized: false }
});

const app = express();
app.use(express.json());
app.use(cors());

app.post('/api/users/login', async (req, res) => {
	const { email, password } = req.body;
	try {
		const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
		if (result.rows.length === 0) {
			return res.status(400).json({ error: 'Invalid email or password' });
		}
		const user = result.rows[0];
		const match = await bcrypt.compare(password, user.password_hash);
		if (!match) {
			return res.status(400).json({ error: 'Invalid email or password' });
		}
		res.status(200).json({ message: 'Login successful', user: { id: user.id, username: user.username, email: user.email, created_at: user.created_at } });
	} catch (err) {
		res.status(500).json({ error: 'Server error' });
	}
});

app.post('/api/users/register', async (req, res) => {
	const { username, email, password } = req.body;
	try {
		const saltRounds = 10;
		const passwordHash = await bcrypt.hash(password, saltRounds);
		const createdAt = new Date();
		const result = await pool.query(
			'INSERT INTO users (username, email, password_hash, created_at) VALUES ($1, $2, $3, $4) RETURNING *',
			[username, email, passwordHash, createdAt]
		);
		res.status(201).json({ message: 'User registered successfully', user: result.rows[0] });
	} catch (err) {
		res.status(400).json({ error: err.message });
	}
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
	console.log(`Backend running: http://localhost:${PORT}`);
});

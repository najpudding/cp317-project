// Step 1: Address verification function using OpenStreetMap Nominatim
import fetch from 'node-fetch';

async function verifyAddressWaterloo(address) {
	const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address + ', Ontario, Canada')}`;
	const response = await fetch(url, {
		headers: {
			'User-Agent': 'HawkPark/1.0 (hawkpark@example.com)'
		}
	});
	const contentType = response.headers.get('content-type');
	if (!response.ok || !contentType || !contentType.includes('application/json')) {
		const text = await response.text();
		console.error('Nominatim API error:', response.status, text.slice(0, 200));
		return false;
	}
	const data = await response.json();
	if (!data.length) return false;
	// Check if address is in Waterloo Region (Waterloo, Kitchener, Cambridge)
	const valid = data.some(item => {
		const city = (item.address && (item.address.city || item.address.town || item.address.village || item.display_name)) || '';
		return (/waterloo|kitchener|cambridge/i.test(city) && /ontario/i.test(item.display_name));
	});
	return valid;
}
// Address verification removed. Listings logic will be handled here.
// ...existing code...

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
pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client', err);
});


const app = express();
app.use(express.json());
app.use(cors());
// Log every incoming request
app.use((req, res, next) => {
	console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
	next();
});
// Create a new listing (no address verification)
import { addListing } from './database/listings.js';

app.post('/api/listings', async (req, res) => {
	console.log('Received /api/listings POST:', req.body);
	const { user_email, address, parking_number, vehicle_size, indoor_outdoor, availability_from, availability_to, days, price } = req.body;
	if (!user_email || !address || !vehicle_size || !indoor_outdoor || !availability_from || !availability_to || !price || !days || !Array.isArray(days) || days.length === 0) {
		return res.status(400).json({ error: 'Missing required fields.' });
	}
	try {
		const insertedListing = await addListing({
			user_email,
			address,
			parking_number,
			vehicle_size,
			indoor_outdoor,
			availability_from,
			availability_to,
			days,
			price
		});
		console.log('Listing added:', insertedListing);
		res.status(201).json({ message: 'Listing created.', listing: insertedListing });
	} catch (err) {
		console.error('Error adding listing:', err);
		res.status(500).json({ error: 'Failed to add listing.' });
	}
});

// Get all listings
app.get('/api/listings', async (req, res) => {
	try {
		const result = await pool.query('SELECT * FROM listings ORDER BY id DESC');
		res.status(200).json(result.rows);
	} catch (err) {
		console.error('Error fetching listings:', err);
		res.status(500).json({ error: 'Failed to fetch listings.' });
	}
});

// Update user info endpoint
app.put('/api/users/edit-username', async (req, res) => {
	console.log('Received /api/users/edit-username PUT:', req.body);
	const { username, email } = req.body;
	try {
		// Check if username is taken by another user
		const usernameCheck = await pool.query('SELECT id FROM users WHERE username = $1 AND email != $2', [username, email]);
		if (usernameCheck.rows.length > 0) {
			console.log('Username already taken:', username);
			return res.status(400).json({ error: 'Username is already taken' });
		}
		// Update username where email matches
		const result = await pool.query(
			'UPDATE users SET username = $1 WHERE email = $2 RETURNING id, username, email, created_at',
			[username, email]
		);
		if (result.rows.length === 0) {
			console.log('User not found for email:', email);
			return res.status(404).json({ error: 'User not found' });
		}
		console.log('Username updated for:', email);
		res.status(200).json({ message: 'Username updated', user: result.rows[0] });
	} catch (err) {
		console.error('Error in /api/users/edit-username:', err);
		res.status(500).json({ error: 'Server error' });
	}
});

app.post('/api/users/login', async (req, res) => {
	console.log('Received /api/users/login POST:', req.body);
	const { email, password } = req.body;
	try {
		const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
		if (result.rows.length === 0) {
			console.log('Login failed: email not found:', email);
			return res.status(400).json({ error: 'Invalid email or password' });
		}
		const user = result.rows[0];
		const match = await bcrypt.compare(password, user.password_hash);
		if (!match) {
			console.log('Login failed: password mismatch for email:', email);
			return res.status(400).json({ error: 'Invalid email or password' });
		}
		console.log('Login successful for:', email);
		res.status(200).json({ message: 'Login successful', user: { id: user.id, username: user.username, email: user.email, created_at: user.created_at } });
	} catch (err) {
		console.error('Error in /api/users/login:', err);
		res.status(500).json({ error: 'Server error' });
	}
});

app.post('/api/users/register', async (req, res) => {
	console.log('Received /api/users/register POST:', req.body);
	const { username, email, password } = req.body;
	try {
		const saltRounds = 10;
		const passwordHash = await bcrypt.hash(password, saltRounds);
		const createdAt = new Date();
		const result = await pool.query(
			'INSERT INTO users (username, email, password_hash, created_at) VALUES ($1, $2, $3, $4) RETURNING *',
			[username, email, passwordHash, createdAt]
		);
		console.log('User registered successfully:', email);
		res.status(201).json({ message: 'User registered successfully', user: result.rows[0] });
	} catch (err) {
		console.error('Error in /api/users/register:', err);
		res.status(400).json({ error: err.message });
	}
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
	console.log(`Backend running: http://localhost:${PORT}`);
});

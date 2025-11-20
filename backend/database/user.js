// User database helper for PostgreSQL
import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({
	user: process.env.PGUSER,
	host: process.env.PGHOST,
	database: process.env.PGDATABASE,
	password: process.env.PGPASSWORD,
	port: process.env.PGPORT,
	ssl: { rejectUnauthorized: false }
});

export async function createUser({ username, email, password_hash }) {
	const createdAt = new Date();
	const result = await pool.query(
		'INSERT INTO users (username, email, password_hash, created_at) VALUES ($1, $2, $3, $4) RETURNING *',
		[username, email, password_hash, createdAt]
	);
	return result.rows[0];
}

// This file is not needed for PostgreSQL. Remove Mongoose code.

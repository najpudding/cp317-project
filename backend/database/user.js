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

export async function getUserById(userId){
    const result = await pool.query(
        'SELECT id, username, email, created_at FROM users WHERE id = $1',
        [userId]
    );
    return result.rows[0] || null;
}

//returns updated user
export async function updateUser(userId, updates){
    const { username, email } = updates;

    const updatesArray = [];
    const values = [];
    let paramCount = 1;

    if (username !== undefined){
        updatesArray.push(`username = $${paramCount}`);
        values.push(username);
        paramCount++;
    }

    if (email !== undefined){
        updatesArray.push(`email = $${paramCount}`);
        values.push(email);
        paramCount++;
    }

    if (updatesArray.length === 0){
        return null;
    }
    values.push(userId);

    const query = `UPDATE users SET ${updatesArray.join(', ')} WHERE id = $${paramCount} RETURNING id, username, email, created_at`;
    const result = await pool.query(query, values);

    return result.rows[0] || null;
}
// This file is not needed for PostgreSQL. Remove Mongoose code.

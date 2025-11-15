import pool from '../db.js';

// User table SQL (for reference)
// CREATE TABLE users (
//   id SERIAL PRIMARY KEY,
//   username VARCHAR(50) UNIQUE NOT NULL,
//   email VARCHAR(100) UNIQUE NOT NULL,
//   password_hash VARCHAR(255) NOT NULL,
//   created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
// );

// Create a new user
export async function createUser({ username, email, passwordHash }) {
  const result = await pool.query(
    'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING *',
    [username, email, passwordHash]
  );
  return result.rows[0];
}

// Get user by ID
export async function getUserById(id) {
  const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
  return result.rows[0];
}

// Get user by username
export async function getUserByUsername(username) {
  const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
  return result.rows[0];
}

// Get user by email
export async function getUserByEmail(email) {
  const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
  return result.rows[0];
}

// List all users
export async function listUsers() {
  const result = await pool.query('SELECT * FROM users');
  return result.rows;
}

// Delete user
export async function deleteUser(id) {
  await pool.query('DELETE FROM users WHERE id = $1', [id]);
  return true;
}

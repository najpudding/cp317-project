import pool from '../db.js';
// Get user by email
export async function getUserByEmail(email) {
  const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
  return result.rows[0];
}


// Helper: Create users table if it doesn't exist
export async function createUsersTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username VARCHAR(50) UNIQUE NOT NULL,
      email VARCHAR(100) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

// Create a new user
export async function createUser({ username, email, passwordHash }) {
  const result = await pool.query(
    'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING *',
    [username, email, passwordHash]
  );
  return result.rows[0];
}

// Get user by ID
export async function getUserById(userId) {
  const result = await pool.query(
    'SELECT id, username, email, created_at FROM users WHERE id = $1',
    [userId]
  );
  return result.rows[0] || null;
}

// Update user information
export async function updateUser(userId, updates) {
  const { username, email } = updates;

  const updatesArray = [];
  const values = [];
  let paramCount = 1;

  if (username !== undefined) {
    updatesArray.push(`username = $${paramCount}`);
    values.push(username);
    paramCount++;
  }

  if (email !== undefined) {
    updatesArray.push(`email = $${paramCount}`);
    values.push(email);
    paramCount++;
  }

  if (updatesArray.length === 0) {
    return null;
  }
  values.push(userId);

  const query = `UPDATE users SET ${updatesArray.join(', ')} WHERE id = $${paramCount} RETURNING id, username, email, created_at`;
  const result = await pool.query(query, values);

  return result.rows[0] || null;
}

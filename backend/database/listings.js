// listings.js
// Database model for user listings


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

export async function createListingsTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS listings (
      id SERIAL PRIMARY KEY,
      user_email VARCHAR(255) NOT NULL,
      address VARCHAR(255) NOT NULL,
      parking_number VARCHAR(50),
      vehicle_size VARCHAR(20) NOT NULL,
      indoor_outdoor VARCHAR(20) NOT NULL,
      availability_from VARCHAR(20) NOT NULL,
      availability_to VARCHAR(20) NOT NULL,
      days VARCHAR(100) NOT NULL,
      price NUMERIC(6,2) NOT NULL
    );
  `);
}

createListingsTable();

export async function addListing(listing) {
  const {
    user_email,
    address,
    parking_number,
    vehicle_size,
    indoor_outdoor,
    availability_from,
    availability_to,
    days,
    price
  } = listing;
  const result = await pool.query(
    `INSERT INTO listings (user_email, address, parking_number, vehicle_size, indoor_outdoor, availability_from, availability_to, days, price)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
    [user_email, address, parking_number, vehicle_size, indoor_outdoor, availability_from, availability_to, Array.isArray(days) ? days.join(',') : days, price]
  );
  if (!result.rows[0].days) {
    console.error('Days field missing in inserted row:', result.rows[0]);
  }
  return result.rows[0];
}

export async function deleteListing(id, user_email) {
  const result = await pool.query(
    'DELETE FROM listings WHERE id = $1 AND user_email = $2 RETURNING *',
    [id, user_email]
  );
  return result.rows[0];
}



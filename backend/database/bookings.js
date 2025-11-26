// bookings.js
// Database model for bookings

import pool from '../db.js';

export async function createBookingsTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS bookings (
      id SERIAL PRIMARY KEY,
      listing_id INTEGER NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
      renter_email VARCHAR(255) NOT NULL,
      owner_email VARCHAR(255) NOT NULL,
      booking_date DATE NOT NULL,
      start_time VARCHAR(20) NOT NULL,
      end_time VARCHAR(20) NOT NULL,
      total_price NUMERIC(6,2) NOT NULL,
      status VARCHAR(20) DEFAULT 'confirmed',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

createBookingsTable();

export async function createBooking(booking) {
  const {
    listing_id,
    renter_email,
    owner_email,
    booking_date,
    start_time,
    end_time,
    total_price
  } = booking;
  
  const result = await pool.query(
    `INSERT INTO bookings (listing_id, renter_email, owner_email, booking_date, start_time, end_time, total_price)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [listing_id, renter_email, owner_email, booking_date, start_time, end_time, total_price]
  );
  return result.rows[0];
}

export async function getBookingsByRenterEmail(renterEmail) {
  const result = await pool.query(
    `SELECT b.*, l.address, l.parking_number, l.vehicle_size, l.indoor_outdoor
     FROM bookings b
     JOIN listings l ON b.listing_id = l.id
     WHERE b.renter_email = $1
     ORDER BY b.created_at DESC`,
    [renterEmail]
  );
  return result.rows;
}

export async function getBookingsByOwnerEmail(ownerEmail) {
  const result = await pool.query(
    `SELECT b.*, l.address, l.parking_number, l.vehicle_size, l.indoor_outdoor
     FROM bookings b
     JOIN listings l ON b.listing_id = l.id
     WHERE b.owner_email = $1
     ORDER BY b.created_at DESC`,
    [ownerEmail]
  );
  return result.rows;
}

export async function deleteBooking(bookingId, userEmail) {
  const result = await pool.query(
    'DELETE FROM bookings WHERE id = $1 AND renter_email = $2 RETURNING *',
    [bookingId, userEmail]
  );
  return result.rows[0];
}

export async function updateBookingStatus(bookingId, status) {
  const result = await pool.query(
    'UPDATE bookings SET status = $1 WHERE id = $2 RETURNING *',
    [status, bookingId]
  );
  return result.rows[0];
}

// listings.js
// Database model for user listings

import pool from '../db.js';

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

//updates only if user email matches
export async function updateListing(listingId, userEmail, updates){
    const {
        address,
        parking_number,
        vehicle_size,
        indoor_outdoor,
        availability_from,
        availability_to,
        days,
        price
    } =  updates;

    const updatesArray = [];
    const values = [];
    let paramCount = 1;

    if (address !== undefined){
        updatesArray.push(`address = $${paramCount}`);
        values.push(address);
        paramCount++;
    }

    if (parking_number !== undefined){
        updatesArray.push(`parking_number = $${paramCount}`);
        values.push(parking_number);
        paramCount++;
    }

    if (vehicle_size !== undefined){
        updatesArray.push(`vehicle_size = $${paramCount}`);
        values.push(vehicle_size);
        paramCount++;
    }

    if (indoor_outdoor !== undefined){
        updatesArray.push(`indoor_outdoor = $${paramCount}`);
        values.push(indoor_outdoor);
        paramCount++;
    }

    if (availability_from !== undefined){
        updatesArray.push(`availability_from = $${paramCount}`);
        values.push(availability_from);
        paramCount++;
    }

    if (availability_to !== undefined){
        updatesArray.push(`availability_to = $${paramCount}`);
        values.push(availability_to);
        paramCount++;
    }

    if (days !== undefined){
        const daysValue = Array.isArray(days) ? days.join(',') : days;
        updatesArray.push(`days = $${paramCount}`);
        values.push(daysValue);
        paramCount++;
    }

    if (price !== undefined){
        updatesArray.push(`price = $${paramCount}`);
        values.push(price);
        paramCount++;
    }

    if (updatesArray.length === 0){
        return null;
    }

    values.push(listingId);
    values.push(userEmail);

    const query = `UPDATE listings SET ${updatesArray.join(', ')} WHERE id = $${paramCount} AND user_email = $${paramCount + 1} RETURNING *`;
    const result = await pool.query(query, values);
    return result.rows[0] || null;
}

export async function getListingsByUserEmail(userEmail) {
    const result = await pool.query(
        'SELECT * FROM listings WHERE user_email = $1 ORDER BY id DESC',
        [userEmail] 
    );
    return result.rows;
}

export async function getAllListings() {
    const result = await pool.query('SELECT * FROM listings ORDER BY id DESC');
    return result.rows;
}

export async function getListingsByAddress(address) {
    const result = await pool.query(
        'SELECT * FROM listings WHERE address = $1 ORDER BY id DESC',
        [address]
    );
    return result.rows;
}




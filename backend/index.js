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

// Geocode address using OpenStreetMap Nominatim
// added 5 second timeout to prevent hanging requests
async function getCoordinatesForAddress(address) {
	const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address + ', Ontario, Canada')}`;
	
	const controller = new AbortController();
	const timeoutId = setTimeout(() => controller.abort(), 5000);
	
	try {
		const response = await fetch(url, {
			headers: {
				'User-Agent': 'HawkPark/1.0 (hawkpark@example.com)'
			},
			signal: controller.signal
		});
		
		clearTimeout(timeoutId);
		
		if (!response.ok) {
			console.warn(`Geocoding API returned status ${response.status} for address: ${address}`);
			return null;
		}
		
		const data = await response.json();
		if (data && data.length > 0) {
			return {
				lat: parseFloat(data[0].lat),
				lon: parseFloat(data[0].lon)
			};
		}
	} catch (err) {
		clearTimeout(timeoutId);
		if (err.name === 'AbortError' || err.code === 'ETIMEDOUT') {
			console.warn(`Geocoding timeout for address: ${address} - continuing without coordinates`);
		} else {
			console.warn(`Geocoding error for address ${address}:`, err.message || err.code || err);
		}
	}
	return null;
}

// ...existing code...

import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import pool from './db.js';
import { createUser, getUserById, updateUser, getUserByEmail } from './database/users.js';
import { addListing, deleteListing, updateListing, getListingsByUserEmail, getAllListings, getListingsByAddress } from './database/listings.js';
import { createBooking, getBookingsByRenterEmail, getBookingsByOwnerEmail, deleteBooking, updateBookingStatus } from './database/bookings.js';

dotenv.config();

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

//Authentication middleware
//validates that a user_id is provided and exists in the database
async function authenticateUser(req, res, next){
    try {
        const user_id = req.body.user_id || req.query.user_id || req.headers['x-user-id'];

        if(!user_id) {
            return res.status(401).json({ error: 'Authentication required. Missing user id.'});
        }

        const userIdNum = parseInt(user_id, 10);
        if (isNaN(userIdNum)) {
            return res.status(400).json({ error: 'Invalid user id format. Must be a number'});
        }

        //verify user exists in database
        const result = await pool.query('SELECT id, username, email, created_at FROM users WHERE id = $1', [userIdNum]);
        if (result.rows.length === 0){
            return res.status(401).json({ error: 'Authentication failed. User not found.'});
        }
        req.user = result.rows[0];
        next();
    } catch (err){
        console.error('Authentication middleware error:', err);
        res.status(500).json({ error: 'Authentication error'});
    }
}

// Create a new listing (no address verification)

// Delete a listing by id (only by owner)
app.delete('/api/listings/:id', async (req, res) => {
	const id = parseInt(req.params.id, 10);
	const user_email = req.body.user_email;
	if (!id || !user_email) {
		return res.status(400).json({ error: 'Missing listing id or user email.' });
	}
	try {
		const deleted = await deleteListing(id, user_email);
		if (!deleted) {
			return res.status(404).json({ error: 'Listing not found or not owned by user.' });
		}
		res.status(200).json({ message: 'Listing deleted.', listing: deleted });
	} catch (err) {
        console.error('Error deleting listing:', err);
		res.status(500).json({ error: 'Failed to delete listing.' });
	}
});

//updated with authentication
app.post('/api/listings', authenticateUser, async (req, res) => {
	console.log('Received /api/listings POST:', req.body);
	const { address, parking_number, vehicle_size, indoor_outdoor, availability_from, availability_to, days, price } = req.body;
	if (!address || !vehicle_size || !indoor_outdoor || !availability_from || !availability_to || !price || !days || !Array.isArray(days) || days.length === 0) {
		return res.status(400).json({ error: 'Missing required fields.' });
	}
	try {
        const user_email = req.user.email;
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
		const listings = await getAllListings();
		const listingsWithCoords = await Promise.all(listings.map(async l => {
			const coords = await getCoordinatesForAddress(l.address);
			return { ...l, coordinates: coords };
		}));
		res.status(200).json(listingsWithCoords);
	} catch (err) {
		console.error('Error fetching listings:', err);
		res.status(500).json({ error: 'Failed to fetch listings.' });
	}
});

// Get listings by address
app.get('/api/listings/address', async (req, res) => {
	const address = req.query.address;
	if (!address) {
		return res.status(400).json({ error: 'Missing address parameter.' });
	}
	try {
		const listings = await getListingsByAddress(address);
		const listingsWithCoords = await Promise.all(listings.map(async l => {
			const coords = await getCoordinatesForAddress(l.address);
			return { ...l, coordinates: coords };
		}));
		res.status(200).json(listingsWithCoords);
	} catch (err) {
		console.error('Error fetching listings by address:', err);
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

// NEW: change password, hashed + salted with bcrypt
app.put('/api/users/change-password', async (req, res) => {
	console.log('Received /api/users/change-password PUT:', req.body.email);

	const { email, currentPassword, newPassword } = req.body;

	if (!email || !currentPassword || !newPassword) {
		return res.status(400).json({ error: 'Missing fields' });
	}

	try {
		// 1. Find the user by email
		const user = await getUserByEmail(email);
		if (!user) {
			console.log('Change password: user not found', email);
			return res.status(404).json({ error: 'User not found' });
		}

		// 2. Check current password
		const match = await bcrypt.compare(currentPassword, user.password_hash);
		if (!match) {
			console.log('Change password: wrong current password for', email);
			return res.status(400).json({ error: 'Current password is incorrect' });
		}

		// 3. Hash + salt new password
		const saltRounds = 10;
		const newHash = await bcrypt.hash(newPassword, saltRounds);

		// 4. Update DB
		await pool.query(
			'UPDATE users SET password_hash = $1 WHERE id = $2',
			[newHash, user.id]
		);

		console.log('Password updated for', email);
		res.status(200).json({ message: 'Password updated successfully' });
	} catch (err) {
		console.error('Error in /api/users/change-password:', err);
		res.status(500).json({ error: 'Server error' });
	}
});

app.post('/api/users/login', async (req, res) => {
	console.log('Received /api/users/login POST:', req.body);
	const { email, password } = req.body;
	try {
		const user = await getUserByEmail(email);
		if (!user) {
			console.log('Login failed: email not found:', email);
			return res.status(400).json({ error: 'Invalid email or password' });
		}
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
		const user = await createUser({ username, email, passwordHash });
		console.log('User registered successfully:', email);
		res.status(201).json({ message: 'User registered successfully', user });
	} catch (err) {
		console.error('Error in /api/users/register:', err);
		res.status(400).json({ error: err.message });
	}
});


//PROFILE API ENDPOINTS (with authentication)
app.get('/api/users/:id', authenticateUser, async (req, res) => {
    try{
        const requestedUserId = parseInt(req.params.id, 10);

        if (isNaN(requestedUserId)){
            return res.status(400).json({ error: 'Invalid user ID format' });
        }

        if (req.user.id !== requestedUserId){
            return res.status(403).json({ error: 'Forbidden: You can only view your own profile' });
        }

        const user = await getUserById(requestedUserId);
        if (!user) {
            return res.status(404).json({ error: 'User not found'});
        }
        res.status(200).json({ user });

    } catch (err) {
        console.error(' Error fetching user profile:', err);
        res.status(500).json({ error: 'Failed to fetch user profile' });
    }
});

//update user profile
app.put('/api/users/:id', authenticateUser, async (req, res) => {
    try { 
        const requestedUserId = parseInt(req.params.id, 10);

        if (isNaN(requestedUserId)){
            return res.status(400).json({ error: 'Invalid user ID format' });
        }

        if (req.user.id !== requestedUserId){
            return res.status(403).json({ error: 'Forbidden: You can only view your own profile' });
        }
        const { username, email } = req.body;

        if (username === undefined && email === undefined){
            return res.status(400).json({ error: 'At least one field (username or email) must be provided' });
        }

        if (username !== undefined && username !== req.user.username) {
            const usernameCheck = await pool.query(
                'SELECT id FROM users WHERE username = $1 AND id != $2',
                [username, requestedUserId]
            );
            if (usernameCheck.rows.length > 0){
                return res.status(400).json({ error: 'Username is already taken' });
            }
        }

        if (email !== undefined && email !== req.user.email) {
            const emailCheck = await pool.query(
                'SELECT id FROM users WHERE email = $1 AND id != $2',
                [email, requestedUserId]
            );
            if (emailCheck.rows.length > 0){
                return res.status(400).json({ error: 'email already exists' });
            }
        }
        const updatedUser = await updateUser(requestedUserId, { username, email });
        if(!updatedUser){
            return res.status(404).json({ error: 'User not found' });
        }
        res.status(200).json({ message: 'Profile updated successfully', user: updatedUser });
    } catch (err){
        console.error('Error updating user profile:', err);
        res.status(500).json({ error: 'Failed to update profile'} );
    }
});


app.get('/api/users/:id/listings', authenticateUser, async (req, res) => {
    try { 
        const requestedUserId = parseInt(req.params.id, 10);

        if (isNaN(requestedUserId)){
            return res.status(400).json({ error: 'Invalid user ID format' });
        }

        if (req.user.id !== requestedUserId){
            return res.status(403).json({ error: 'Forbidden: You can only view your own listings' });
        }
        const userEmail = req.user.email;
        const listings = await getListingsByUserEmail(userEmail);
        
        const listingsWithCoords = await Promise.all(
            listings.map(async (listing) => {
                const coords = await getCoordinatesForAddress(listing.address);
                return { ...listing, coordinates: coords };
            })
        );
        res.status(200).json({ listings: listingsWithCoords });
    } catch (err) {
        console.error('Error fetching user listings:', err);
        res.status(500).json({ error: 'Failed to fetch listings'});
    }
});

app.put('/api/listings/:id', authenticateUser, async (req, res) => {
	try {
		const listingId = parseInt(req.params.id, 10);
		
		if (isNaN(listingId)) {
			return res.status(400).json({ error: 'Invalid listing ID format' });
		}
		const updates = req.body;
		const allowedFields = ['address', 'parking_number', 'vehicle_size', 'indoor_outdoor', 'availability_from', 'availability_to', 'days', 'price'];
		const hasValidField = allowedFields.some(field => updates[field] !== undefined);
		
		if (!hasValidField) {
			return res.status(400).json({ error: 'At least one field must be provided for update' });
		}
	
		const userEmail = req.user.email;
		const updatedListing = await updateListing(listingId, userEmail, updates);
		
		if (!updatedListing) {
			return res.status(404).json({ error: 'Listing not found or you do not have permission to update it' });
		}
		const coords = await getCoordinatesForAddress(updatedListing.address);
		
		res.status(200).json({ 
			message: 'Listing updated successfully', 
			listing: { ...updatedListing, coordinates: coords } 
		});
	} catch (err) {
		console.error('Error updating listing:', err);
		res.status(500).json({ error: 'Failed to update listing' });
	}
});

// BOOKINGS ENDPOINTS

// Create a new booking
app.post('/api/bookings', authenticateUser, async (req, res) => {
	console.log('Received /api/bookings POST:', req.body);
	console.log('Authenticated user:', req.user);
	
	const { listing_id, owner_email, booking_date, start_time, end_time, total_price } = req.body;
	
	if (!listing_id || !owner_email || !booking_date || !start_time || !end_time || !total_price) {
		console.log('Missing required fields:', { listing_id, owner_email, booking_date, start_time, end_time, total_price });
		return res.status(400).json({ error: 'Missing required fields.' });
	}
	
	try {
		const renter_email = req.user.email;
		// Check for existing booking for this listing and date
		const existing = await pool.query(
			'SELECT * FROM bookings WHERE listing_id = $1 AND booking_date = $2',
			[listing_id, booking_date]
		);
		if (existing.rows.length > 0) {
			return res.status(409).json({ error: 'This spot is already booked for that day.' });
		}
		console.log('Creating booking with data:', {
			listing_id,
			renter_email,
			owner_email,
			booking_date,
			start_time,
			end_time,
			total_price
		});
		const booking = await createBooking({
			listing_id,
			renter_email,
			owner_email,
			booking_date,
			start_time,
			end_time,
			total_price
		});
		console.log('Booking created successfully:', booking);
		res.status(201).json({ message: 'Booking created successfully', booking });
	} catch (err) {
		console.error('Error creating booking:', err);
		console.error('Error stack:', err.stack);
		res.status(500).json({ error: 'Failed to create booking', details: err.message });
	}
});

// Get bookings for current user (as renter)
app.get('/api/bookings/renter', authenticateUser, async (req, res) => {
	try {
		const bookings = await getBookingsByRenterEmail(req.user.email);
		res.status(200).json({ bookings });
	} catch (err) {
		console.error('Error fetching renter bookings:', err);
		res.status(500).json({ error: 'Failed to fetch bookings' });
	}
});

// Get bookings for current user (as owner)
app.get('/api/bookings/owner', authenticateUser, async (req, res) => {
	try {
		const bookings = await getBookingsByOwnerEmail(req.user.email);
		res.status(200).json({ bookings });
	} catch (err) {
		console.error('Error fetching owner bookings:', err);
		res.status(500).json({ error: 'Failed to fetch bookings' });
	}
});

// Delete a booking
app.delete('/api/bookings/:id', authenticateUser, async (req, res) => {
	const bookingId = parseInt(req.params.id, 10);
	
	if (isNaN(bookingId)) {
		return res.status(400).json({ error: 'Invalid booking ID' });
	}
	
	try {
		const deleted = await deleteBooking(bookingId, req.user.email);
		if (!deleted) {
			return res.status(404).json({ error: 'Booking not found or you do not have permission to delete it' });
		}
		res.status(200).json({ message: 'Booking deleted successfully', booking: deleted });
	} catch (err) {
		console.error('Error deleting booking:', err);
		res.status(500).json({ error: 'Failed to delete booking' });
	}
});


const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
	console.log(`Backend running: http://localhost:${PORT}`);
});

import React, { useEffect, useState } from 'react';
import { useUser } from '../hook/UserContext.jsx';
import Navbar from '../components/Navbar';
import MapView from '../components/MapView';
import BookingForm from '../components/bookings/BookingForm.jsx';

export default function Home() {
	const { user } = useUser();
	const [allListings, setAllListings] = useState([]);
	const [filteredListings, setFilteredListings] = useState([]);
	const [loading, setLoading] = useState(true);

	const [filterAddress, setFilterAddress] = useState('');
	const [filterType, setFilterType] = useState('');
	const [filterVehicleSize, setFilterVehicleSize] = useState('');
	const [filterMinPrice, setFilterMinPrice] = useState('');
	const [filterMaxPrice, setFilterMaxPrice] = useState('');

	// Booking modal state
	const [showBookingModal, setShowBookingModal] = useState(false);
	const [selectedListing, setSelectedListing] = useState(null);

	useEffect(() => {
		fetchAllListings();
	}, [user]);

	useEffect(() => {
		let filtered = allListings;

		if (filterAddress) {
			const addressLower = filterAddress.toLowerCase();
			filtered = filtered.filter(l => l.address.toLowerCase().includes(addressLower));
		}
		if (filterType) {
			filtered = filtered.filter(l => l.indoor_outdoor === filterType);
		}
		if (filterVehicleSize) {
			filtered = filtered.filter(l => l.vehicle_size === filterVehicleSize);
		}
		if (filterMinPrice) {
			filtered = filtered.filter(l => l.price >= parseFloat(filterMinPrice));
		}
		if (filterMaxPrice) {
			filtered = filtered.filter(l => l.price <= parseFloat(filterMaxPrice));
		}

		setFilteredListings(filtered);
	}, [filterAddress, filterType, filterVehicleSize, filterMinPrice, filterMaxPrice, allListings]);

	async function fetchAllListings() {
		setLoading(true);
		try {
			const res = await fetch('http://localhost:3001/api/listings');
			const data = await res.json();
			if (Array.isArray(data)) {
				const filtered = data.filter(l => !user || l.user_email !== user.email);
				setAllListings(filtered);
				setFilteredListings(filtered);
			}
		} catch (err) {
			setAllListings([]);
			setFilteredListings([]);
		}
		setLoading(false);
	}

	function resetFilters() {
		setFilterAddress('');
		setFilterType('');
		setFilterVehicleSize('');
		setFilterMinPrice('');
		setFilterMaxPrice('');
		setFilteredListings(allListings);
	}

	function openBookingModal(listing) {
		if (!user) {
			alert('Please log in to book a parking spot');
			return;
		}
		setSelectedListing(listing);
		setShowBookingModal(true);
	}

	function closeBookingModal() {
		setShowBookingModal(false);
		setSelectedListing(null);
	}

	function handleBookingSubmit(booking) {
		console.log('Booking created:', booking);
		// Optionally refresh listings or show success message
	}

	return (
		<>
			<Navbar />
			<div className="flex flex-col items-center min-h-screen pt-12 px-4 md:px-12 gap-4">
				<div className="bg-red-500 rounded-xl shadow-lg p-5 w-full max-w-7xl flex flex-row gap-3 border-2 border-black items-center">
					<input
						type="text"
						placeholder="Filter by address"
						className="flex-1 min-w-[150px] px-3 py-2.5 rounded-lg border-2 border-black font-semibold text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-white transition"
						value={filterAddress}
						onChange={e => setFilterAddress(e.target.value)}
					/>
					<select
						className="px-3 py-2.5 rounded-lg border-2 border-black font-semibold text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-white transition cursor-pointer"
						value={filterType}
						onChange={e => setFilterType(e.target.value)}
					>
						<option value="">All Types</option>
						<option value="Indoor">Indoor</option>
						<option value="Outdoor">Outdoor</option>
					</select>
					<select
						className="px-3 py-2.5 rounded-lg border-2 border-black font-semibold text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-white transition cursor-pointer"
						value={filterVehicleSize}
						onChange={e => setFilterVehicleSize(e.target.value)}
					>
						<option value="">All Sizes</option>
						<option value="Small">Small</option>
						<option value="Medium">Medium</option>
						<option value="Large">Large</option>
					</select>
					<input
						type="number"
						placeholder="Min $"
						className="w-24 px-3 py-2.5 rounded-lg border-2 border-black font-semibold text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-white transition"
						value={filterMinPrice}
						onChange={e => setFilterMinPrice(e.target.value)}
					/>
					<input
						type="number"
						placeholder="Max $"
						className="w-24 px-3 py-2.5 rounded-lg border-2 border-black font-semibold text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-white transition"
						value={filterMaxPrice}
						onChange={e => setFilterMaxPrice(e.target.value)}
					/>
					<button 
						className="px-5 py-2.5 rounded-lg bg-white text-red-600 font-bold border-2 border-black hover:bg-gray-100 transition shadow-md whitespace-nowrap" 
						onClick={resetFilters}
					>
						Reset
					</button>
				</div>

				<div className="flex flex-row items-start justify-center w-full gap-8">
					<div className="w-full max-w-2xl" style={{ height: '62vh' }}>
						<MapView
							listings={filteredListings.length > 0 ? filteredListings : allListings}
							style={{ height: '100%' }}
							onMarkerClick={(address) => setFilterAddress(address)}
							onMapClick={resetFilters}
						/>
					</div>

					<div
					  className="w-full max-w-xl flex flex-col gap-4"
					  style={{
						height: 'calc(62vh - 11px)',
						overflowY: 'auto',
						scrollbarWidth: 'none',
						msOverflowStyle: 'none',
						background: 'linear-gradient(to bottom, #b91c1c 0%, #fff 100%)',
						borderRadius: '1rem',
						padding: '1rem',
						border: '2px solid black'
					  }}
					>
					  <style>{`
						.w-full.max-w-xl::-webkit-scrollbar {
						  display: none;
						}
					  `}</style>
						{loading ? (
							<div className="bg-white rounded-xl shadow p-4 border-2 border-black">Loading listings...</div>
						) : filteredListings.length === 0 ? (
							<div className="bg-white rounded-xl shadow p-4 border-2 border-black">No listings available.</div>
						) : (
							filteredListings.map((listing, idx) => (
								<div key={listing.id || idx} className="bg-white rounded-xl shadow p-3 border-2 border-black flex flex-col gap-2" style={{ width: 'auto' }}>
									<div className="flex flex-row items-center justify-between w-full">
										<span className="font-bold text-2xl text-red-600">{listing.address}</span>
										<span className="text-2xl text-green-700 font-bold ml-4">${listing.price}/hr</span>
									</div>
									<div className="text-sm text-gray-800 font-semibold">{listing.description}</div>
									<div className="text-xs text-gray-700">Available: <span className="font-bold">{listing.availability_from}</span> - <span className="font-bold">{listing.availability_to}</span></div>
									<div className="text-xs text-gray-700">Days: <span className="font-bold">{
									  (() => {
										const dayOrder = [
										  'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
										];
										const daysArr = typeof listing.days === 'string' ? listing.days.split(',').map(d => d.trim()) : [];
										const sorted = daysArr.sort((a, b) => dayOrder.indexOf(a) - dayOrder.indexOf(b));
										return sorted.join(',');
									  })()
									}</span></div>
									<div className="text-xs text-gray-700">Type: <span className="font-bold">{listing.indoor_outdoor}</span>, Vehicle Size: <span className="font-bold">{listing.vehicle_size}</span></div>
									<button
										className={`mt-2 px-4 py-2 rounded-lg text-white font-bold border-2 border-black transition shadow-md ${user ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-400 cursor-not-allowed'}`}
										aria-disabled={!user}
										onClick={() => openBookingModal(listing)}
										title={user ? 'Book this listing' : 'Please log in to book'}
									>
										{user ? 'Book Now' : 'Log in to Book'}
									</button>
								</div>
							))
						)}
					</div>
				</div>

				{/* Booking Modal */}
				{showBookingModal && selectedListing && (
					<BookingForm
						listing={selectedListing}
						user={user}
						onSubmit={handleBookingSubmit}
						onClose={closeBookingModal}
					/>
				)}
			</div>
		</>
	);
}
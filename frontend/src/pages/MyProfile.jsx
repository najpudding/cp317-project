import React, { useState, useEffect } from 'react';
import ListingsForm from '../components/listings/ListingsForm.jsx';
import { useUser } from '../hook/UserContext.jsx';
import { useNavigate } from 'react-router-dom';

export default function MyProfile() {
	const { user, setUser } = useUser();
	const navigate = useNavigate();

	const [editUsername, setEditUsername] = useState(user?.username || '');
	const [editStatus, setEditStatus] = useState('');
	const [loading, setLoading] = useState(false);
	const [editing, setEditing] = useState(false);
	const [showListingForm, setShowListingForm] = useState(false);
	const [listings, setListings] = useState([]);
	const [listingsLoading, setListingsLoading] = useState(true);
	const [bookings, setBookings] = useState([]);
	const [ownerBookings, setOwnerBookings] = useState([]);
	const [currentPassword, setCurrentPassword] = useState('');
	const [newPassword, setNewPassword] = useState('');
	const [confirmPassword, setConfirmPassword] = useState('');
	const [pwError, setPwError] = useState('');
	const [pwMessage, setPwMessage] = useState('');

	useEffect(() => {
		window.scrollTo(0, 0);
		async function fetchListings() {
			if (!user?.email) return;
			setListingsLoading(true);
			try {
				const res = await fetch('http://localhost:3001/api/listings');
				const data = await res.json();
				if (Array.isArray(data)) {
					setListings(data.filter(l => l.user_email === user.email));
				}
			} catch (err) {
				setListings([]);
			}
			setListingsLoading(false);
		}
		
		async function fetchBookings() {
			if (!user?.id) return;
			try {
				const res = await fetch('http://localhost:3001/api/bookings/renter', {
					headers: {
						'x-user-id': user.id
					}
				});
				const data = await res.json();
				if (data.bookings) {
					setBookings(data.bookings);
				}
			} catch (err) {
				console.error('Error fetching bookings:', err);
				setBookings([]);
			}
		}
		
		async function fetchOwnerBookings() {
			if (!user?.id) return;
			try {
				const res = await fetch('http://localhost:3001/api/bookings/owner', {
					headers: {
						'x-user-id': user.id
					}
				});
				const data = await res.json();
				if (data.bookings) {
					setOwnerBookings(data.bookings);
				}
			} catch (err) {
				console.error('Error fetching owner bookings:', err);
				setOwnerBookings([]);
			}
		}
		
		fetchListings();
		fetchBookings();
		fetchOwnerBookings();
	}, [user]);

	const handleLogout = () => {
		setUser(null);
		navigate('/auth');
	};

	const handleSave = async () => {
		setLoading(true);
		setEditStatus('');
		try {
			const res = await fetch('http://localhost:3001/api/users/edit-username', {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ username: editUsername, email: user.email })
			});
			const data = await res.json();
			if (res.ok) {
				setUser({ ...user, username: data.user.username });
				setEditStatus('Username updated!');
			} else {
				setEditStatus(data.error || 'Error updating username');
			}
		} catch (error) {
			setEditStatus('Server error. Please try again.');
		} finally {
			setLoading(false);
			setEditing(false);
		}
	};

	const handleChangePassword = async () => {
		setPwError('');
		setPwMessage('');

		if (!user?.email) {
			setPwError('You must be logged in to change your password.');
			return;
		}

		if (newPassword !== confirmPassword) {
			setPwError('New passwords do not match.');
			return;
		}

		try {
			const res = await fetch('http://localhost:3001/api/users/change-password', {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					email: user.email,
					currentPassword,
					newPassword,
				}),
			});

			const data = await res.json();

			if (!res.ok) {
				setPwError(data.error || 'Failed to change password.');
			} else {
				setPwMessage('Password updated successfully.');
				setCurrentPassword('');
				setNewPassword('');
				setConfirmPassword('');
			}
		} catch (err) {
			console.error(err);
			setPwError('Network/server error. Please try again.');
		}
	};

	if (!user) {
		return (
			<div className="min-h-screen bg-gray-100 flex items-center justify-center">
				<div className="bg-white rounded-3xl shadow-2xl p-12 w-full max-w-4xl border-2 border-black">
					<h1 className="text-3xl font-bold text-center text-red-500 mb-4">My Profile</h1>
					<p className="text-center text-lg text-gray-700 mb-6">
						You need to be logged in to view your profile.
					</p>
					<div className="flex justify-center">
						<button
							className="px-6 py-2 rounded-lg bg-red-500 text-white font-semibold border-2 border-black shadow hover:bg-red-600 transition cursor-pointer"
							onClick={() => navigate('/auth')}
						>
							Go to Login
						</button>
					</div>
				</div>
			</div>
		);
	}

	return (
		<>
			<div className="min-h-screen flex items-center justify-center py-12">
				<div className="max-w-6xl mx-auto flex flex-col gap-8 w-full px-4">
					{/* Top Layer: Profile Info */}
					<div className="bg-white rounded-3xl shadow-2xl p-12 w-full border-2 border-black">
						<h2 className="text-4xl font-bold text-red-500 mb-6 text-center">My Profile</h2>
						<div className="flex flex-row gap-8 justify-center">
							<section className="flex flex-col items-start w-full max-w-2xl">
								{user && (
									<form className="flex flex-col items-start gap-6 w-full p-0" onSubmit={e => { e.preventDefault(); handleSave(); }}>
										<div className="w-full flex flex-col gap-1 mb-4">
											<label className="text-base font-semibold text-gray-700 mb-1">Username</label>
											<div className="flex items-center gap-2">
												{!editing ? (
													<>
														<span className="text-lg text-gray-800 font-semibold">{user.username}</span>
														<button
															type="button"
															className="px-3 py-1 rounded bg-gray-200 text-black font-medium border-2 border-black hover:bg-gray-300 transition text-sm cursor-pointer"
															onClick={() => { setEditing(true); setEditUsername(user.username); }}
														>
															Edit
														</button>
													</>
												) : (
													<>
														<input
															type="text"
															className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-red-100 transition text-lg bg-white shadow-sm"
															value={editUsername}
															onChange={e => setEditUsername(e.target.value)}
															required
														/>
														<button
															type="button"
															className="px-3 py-1 rounded bg-red-500 text-white font-medium border-2 border-black hover:bg-red-600 transition text-sm cursor-pointer"
															disabled={loading}
															onClick={handleSave}
														>
															{loading ? 'Saving...' : 'Save'}
														</button>
														<button
															type="button"
															className="px-3 py-1 rounded bg-gray-200 text-black font-medium border-2 border-black hover:bg-gray-300 transition text-sm font-medium ml-2 cursor-pointer"
															onClick={() => { setEditing(false); setEditUsername(user.username); }}
														>
															Cancel
														</button>
													</>
												)}
											</div>
										</div>

										{/* Change Password Section */}
										<div className="w-full flex flex-col gap-1 mb-4 mt-4 border-t pt-4">
											<label className="text-base font-semibold text-gray-700 mb-2">Change Password</label>

											<div className="flex flex-col gap-3 w-full max-w-md">
												<div className="flex flex-col">
													<label className="text-sm font-medium text-gray-700 mb-1">Current password</label>
													<input
														type="password"
														className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
														value={currentPassword}
														onChange={(e) => setCurrentPassword(e.target.value)}
														required
													/>
												</div>

												<div className="flex flex-col">
													<label className="text-sm font-medium text-gray-700 mb-1">New password</label>
													<input
														type="password"
														className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
														value={newPassword}
														onChange={(e) => setNewPassword(e.target.value)}
														required
													/>
												</div>

												<div className="flex flex-col">
													<label className="text-sm font-medium text-gray-700 mb-1">Confirm new password</label>
													<input
														type="password"
														className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
														value={confirmPassword}
														onChange={(e) => setConfirmPassword(e.target.value)}
														required
													/>
												</div>

												<button
													type="button"
													onClick={handleChangePassword}
													className="px-4 py-2 rounded-lg bg-red-500 text-white font-semibold text-sm hover:bg-red-600 transition border-2 border-black"
												>
													Update password
												</button>

												{pwError && (
													<p className="text-sm text-red-600 mt-1">
														{pwError}
													</p>
												)}
												{pwMessage && (
													<p className="text-sm text-green-600 mt-1">
														{pwMessage}
													</p>
												)}
											</div>
										</div>

										<div className="w-full flex flex-col gap-1 mb-4">
											<label className="text-base font-semibold text-gray-700 mb-1">Email</label>
											<span className="text-lg text-gray-800 font-semibold">{user.email}</span>
										</div>
										<div className="flex gap-3 w-full mt-2">
											<div className="flex gap-3 justify-center w-full">
												<button
													className="px-6 py-2 rounded-lg bg-gray-200 text-black font-semibold border-2 border-black hover:bg-gray-300 transition cursor-pointer"
													onClick={handleLogout}
												>
													Logout
												</button>
											</div>
										</div>
										{editStatus && <p className="text-red-500 mt-2 font-medium">{editStatus}</p>}
									</form>
								)}
							</section>
						</div>
					</div>

					{/* Middle Layer: Bookings */}
					<div className="bg-white rounded-3xl shadow-2xl p-12 w-full border-2 border-black">
						<h2 className="text-3xl font-bold text-red-500 mb-6 text-center">Bookings</h2>
						<div className="flex flex-col lg:flex-row gap-8">
							{/* My Bookings (as renter) */}
							<section className="flex-1 flex flex-col items-center">
								<h3 className="text-2xl font-semibold text-black mb-4">My Bookings</h3>
								{bookings.length === 0 ? (
									<p className="text-lg text-gray-700">No bookings yet.</p>
								) : (
									<div className="flex flex-col gap-3 w-full">
										{bookings.map((booking, idx) => (
											<div key={booking.id} className="bg-white border border-gray-300 rounded-xl p-4 shadow-sm">
												<div className="flex justify-between items-start mb-2">
													<div>
														<p className="font-bold text-lg text-red-600">{booking.address}</p>
														<p className="text-sm text-gray-600">Parking #{booking.parking_number}</p>
													</div>
													<span className="text-green-700 font-bold text-lg">${booking.total_price}</span>
												</div>
												<div className="text-sm text-gray-700">
													<p><span className="font-semibold">Date:</span> {new Date(booking.booking_date).toLocaleDateString()}</p>
													<p><span className="font-semibold">Time:</span> {booking.start_time} - {booking.end_time}</p>
													<p><span className="font-semibold">Type:</span> {booking.indoor_outdoor}, {booking.vehicle_size}</p>
												</div>
												<button 
													className="mt-2 px-3 py-1.5 bg-red-500 text-white text-sm rounded-lg border-2 border-black hover:bg-red-600 transition"
													onClick={async () => {
														if (window.confirm('Cancel this booking?')) {
															try {
																const res = await fetch(`http://localhost:3001/api/bookings/${booking.id}`, {
																	method: 'DELETE',
																	headers: {
																		'x-user-id': user.id
																	}
																});
																if (res.ok) {
																	setBookings(bookings.filter(b => b.id !== booking.id));
																} else {
																	alert('Failed to cancel booking');
																}
															} catch (err) {
																console.error('Error canceling booking:', err);
																alert('Error canceling booking');
															}
														}
													}}
												>
													Cancel Booking
												</button>
											</div>
										))}
									</div>
								)}
							</section>
							
							{/* Bookings on My Listings (as owner) */}
							<section className="flex-1 flex flex-col items-center">
								<h3 className="text-2xl font-semibold text-black mb-4">Bookings on My Listings</h3>
								{ownerBookings.length === 0 ? (
									<p className="text-lg text-gray-700">No bookings on your listings yet.</p>
								) : (
									<div className="flex flex-col gap-3 w-full">
										{ownerBookings.map((booking, idx) => (
											<div key={booking.id} className="bg-white border border-gray-300 rounded-xl p-4 shadow-sm">
												<div className="flex justify-between items-start mb-2">
													<div>
														<p className="font-bold text-lg text-red-600">{booking.address}</p>
														<p className="text-sm text-gray-600">Parking #{booking.parking_number}</p>
														<p className="text-sm text-gray-600">Renter: {booking.renter_email}</p>
													</div>
													<span className="text-green-700 font-bold text-lg">${booking.total_price}</span>
												</div>
												<div className="text-sm text-gray-700">
													<p><span className="font-semibold">Date:</span> {new Date(booking.booking_date).toLocaleDateString()}</p>
													<p><span className="font-semibold">Time:</span> {booking.start_time} - {booking.end_time}</p>
													<p><span className="font-semibold">Type:</span> {booking.indoor_outdoor}, {booking.vehicle_size}</p>
												</div>
											</div>
										))}
									</div>
								)}
							</section>
						</div>
					</div>

					{/* Bottom Layer: Listings */}
					<div className="bg-white rounded-3xl shadow-2xl p-12 w-full border-2 border-black mb-12">
						<h2 className="text-3xl font-bold text-red-500 mb-6 text-center">My Listings</h2>
						<section className="flex flex-col items-center">
							<div className="w-full max-w-4xl">
								{listingsLoading ? (
									<p className="mb-4 text-lg text-gray-700 text-center">Loading listings...</p>
								) : Array.isArray(listings) && listings.length === 0 ? (
									<p className="mb-4 text-lg text-gray-700 text-center">You have no listings.</p>
								) : null}
								<button
									className="mb-4 px-4 py-2 rounded-lg bg-red-500 text-white font-semibold border-2 border-black hover:bg-red-600 transition cursor-pointer"
									onClick={() => {
										if (listings.length >= 3) {
											alert('You can only create up to 3 listings.');
										} else {
											setShowListingForm(true);
										}
									}}
								>
									Add Listing
								</button>
								<div className="flex flex-col gap-4 w-full">
											{listings.map((listing, idx) => {
												const isBooked = ownerBookings.some(b => b.listing_id === listing.id);
												return (
												<div key={idx} className="bg-white border border-gray-300 rounded-xl p-4 shadow-sm flex flex-row items-center gap-2 text-xs text-black justify-between">
													<div className="flex flex-row items-center gap-2">
														<span className="text-black">#{idx + 1}</span>
														<span className="font-bold mx-1">{listing.title}</span>
														<span className="mx-1">{listing.address}</span>
														<span className="mx-1">{listing.description}</span>
														<span className="mx-1 text-green-700 font-bold">${listing.price}/hr</span>
														{/* BOOKED indicator removed */}
													</div>
											<div className="flex flex-row gap-2 ml-auto">
												<button className="px-2 py-1 bg-red-500 text-white rounded-lg border-2 border-black hover:bg-red-600 transition cursor-pointer" style={{ fontSize: '0.75rem' }} onClick={async () => {
													if (window.confirm('Are you sure you want to delete this listing?')) {
														try {
															const res = await fetch(`http://localhost:3001/api/listings/${listing.id}`, {
																method: 'DELETE',
																headers: {
																	'Content-Type': 'application/json',
																},
																body: JSON.stringify({ user_email: user.email })
															});
															if (res.ok) {
																const updatedListings = listings.filter((_, i) => i !== idx);
																setListings(updatedListings);
															} else {
																alert('Error deleting listing.');
															}
														} catch (err) {
															alert('Server error while deleting listing.');
														}
													}
												}}>
													Delete
												</button>
											</div>
										</div>
										);
									})}
								</div>
								{showListingForm && (
									<ListingsForm
										onSubmit={async listing => {
											if (listings.length < 3) {
												// After adding, refetch listings from backend
												try {
													const res = await fetch('http://localhost:3001/api/listings');
													const data = await res.json();
													if (Array.isArray(data)) {
														setListings(data.filter(l => l.user_email === user.email));
													}
												} catch (err) {
													setListings([]);
												}
											} else {
												alert('You can only have up to 3 listings.');
											}
										}}
										onClose={() => setShowListingForm(false)}
									/>
								)}
							</div>
						</section>
					</div>
				</div>
			</div>
		</>
	);
}
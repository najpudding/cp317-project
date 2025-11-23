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

	useEffect(() => {
		async function fetchListings() {
			if (!user?.email) return;
			try {
				const res = await fetch('http://localhost:3001/api/listings');
				const data = await res.json();
				if (Array.isArray(data)) {
					// Only show listings for the logged-in user
					setListings(data.filter(l => l.user_email === user.email));
				}
			} catch (err) {
				setListings([]);
			}
		}
		fetchListings();
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
		 } catch (err) {
			 setEditStatus('Server error');
		 }
		 setLoading(false);
	 };

	 return (
		 <>
			 <div className="flex flex-col items-center justify-center min-h-screen">
				 <div className="bg-white rounded-3xl shadow-2xl p-12 w-full max-w-4xl flex flex-row gap-8 border-2 border-black mb-12">
					 {/* Left: User Info */}
					 <div className="flex flex-col justify-start items-center w-1/2 gap-4">
						   <h2 className="text-4xl font-bold text-red-500 mb-2 text-center">My Profile</h2>
						   <section className="p-8 flex flex-col items-center w-full">
							 {user && (
								 <form className="flex flex-col items-start gap-6 w-full p-0" onSubmit={e => {e.preventDefault(); handleSave();}}>
									 <div className="w-full flex flex-col gap-1 mb-4">
										 <label className="text-base font-semibold text-gray-700 mb-1">Username</label>
										 <div className="flex items-center gap-2">
											 {!editing ? (
												 <>
													 <span className="text-lg text-gray-800 font-semibold">{user.username}</span>
													 <button
														 type="button"
														 className="px-3 py-1 rounded bg-gray-200 text-gray-700 border-2 border-black hover:bg-gray-300 transition text-sm font-medium cursor-pointer"
														 onClick={() => { setEditing(true); setEditUsername(user.username); }}
													 >
														 Edit
													 </button>
												 </>
											 ) : (
												 <>
													 <input
														 type="text"
														 className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-red-400 focus:ring-2 focus:ring-red-100 transition text-lg bg-white shadow-sm"
														 value={editUsername}
														 onChange={e => setEditUsername(e.target.value)}
														 required
													 />
													 <button
														 type="button"
														 className="px-3 py-1 rounded bg-green-500 text-white border-2 border-black hover:bg-green-600 transition text-sm font-medium ml-2 cursor-pointer"
														 onClick={async () => { await handleSave(); setEditing(false); }}
														 disabled={loading}
													 >
														 {loading ? 'Saving...' : 'Save'}
													 </button>
													 <button
														 type="button"
														 className="px-3 py-1 rounded bg-gray-200 text-gray-700 border-2 border-black hover:bg-gray-300 transition text-sm font-medium ml-2 cursor-pointer"
														 onClick={() => { setEditing(false); setEditUsername(user.username); }}
													 >
														 Cancel
													 </button>
												 </>
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
												 className="px-6 py-2 rounded-lg bg-gray-200 text-gray-700 font-semibold border-2 border-black hover:bg-gray-300 transition cursor-pointer"
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
					 <div className="flex flex-col w-1/2 gap-0 border-l-2 border-gray-300 pl-8">
						 <section className="p-8 flex flex-col items-center">
							 <h3 className="text-2xl font-semibold text-black mb-4">Bookings</h3>
							 <p className="text-lg text-gray-700">No bookings yet.</p>
						 </section>
						 <hr className="w-full border-t-2 border-gray-300 my-2" />
						 <section className="p-8 flex flex-col items-center">
							 <h3 className="text-2xl font-semibold text-black mb-2">Listings</h3>
							 {listings.length === 0 && <p className="mb-4 text-lg text-gray-700">No listings yet.</p>}
							 <button
								 className="mb-2 px-2 py-1 bg-red-500 text-white rounded border-2 border-black hover:bg-red-600 transition disabled:opacity-50 cursor-pointer text-xs font-semibold"
								 onClick={() => setShowListingForm(true)}
								 disabled={listings.length >= 3}
							 >
								 Add Listing
							 </button>
							 <div className="flex flex-col gap-4 w-full">
								 {listings.map((listing, idx) => (
									 <div key={idx} className="bg-white border border-black rounded-lg px-4 py-1 shadow flex flex-row items-center gap-2 text-xs text-black justify-between">
										 <div className="flex flex-row items-center gap-2">
											 <span className="text-black">#{idx + 1}</span>
											 <span className="font-bold mx-1">{listing.title}</span>
											 <span className="mx-1">{listing.address}</span>
											 <span className="mx-1">{listing.description}</span>
											 <span className="mx-1 text-green-700 font-bold">${listing.price}/hr</span>
										 </div>
										 <div className="flex flex-row gap-2 ml-auto">
											 <button className="px-2 py-1 bg-red-500 text-white rounded border border-black hover:bg-red-600 transition cursor-pointer" style={{fontSize: '0.75rem'}} onClick={async () => {
												 if (window.confirm('Are you sure you want to delete this listing?')) {
													 try {
														 const res = await fetch(`http://localhost:3001/api/listings/${listing.id}`, {
															 method: 'DELETE',
															 headers: { 'Content-Type': 'application/json' },
															 body: JSON.stringify({ user_email: user.email })
														 });
														 if (res.ok) {
															 // Re-fetch listings from backend
															 const refreshed = await fetch('http://localhost:3001/api/listings');
															 const data = await refreshed.json();
															 setListings(data.filter(l => l.user_email === user.email));
														 } else {
															 alert('Failed to delete listing.');
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
								 ))}
							 </div>
								 {showListingForm && (
									 <ListingsForm
										 onSubmit={async listing => {
											 if (listings.length < 3) {
												 // After adding, refetch listings from backend
												 setShowListingForm(false);
												 await new Promise(r => setTimeout(r, 500));
												 // Re-fetch listings
												 const res = await fetch('http://localhost:3001/api/listings');
												 const data = await res.json();
												 if (Array.isArray(data)) {
													 setListings(data.filter(l => l.user_email === user.email));
												 }
											 }
										 }}
										 onClose={() => setShowListingForm(false)}
									 />
								 )}
						 </section>
					 </div>
				 </div>
			 </div>
		 </>
	 );
}

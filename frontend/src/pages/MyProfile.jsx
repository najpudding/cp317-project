import React from 'react';
import { useUser } from '../hook/UserContext.jsx';
import { useNavigate } from 'react-router-dom';

export default function MyProfile() {
	 const { user, setUser } = useUser();
	 const navigate = useNavigate();

	 const [editUsername, setEditUsername] = React.useState(user?.username || '');
	 const [editStatus, setEditStatus] = React.useState('');
	 const [loading, setLoading] = React.useState(false);
	 const [editing, setEditing] = React.useState(false);

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
														 className="px-3 py-1 rounded bg-gray-200 text-gray-700 border border-gray-300 hover:bg-gray-300 transition text-sm font-medium"
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
														 className="px-3 py-1 rounded bg-green-500 text-white border border-green-600 hover:bg-green-600 transition text-sm font-medium ml-2"
														 onClick={async () => { await handleSave(); setEditing(false); }}
														 disabled={loading}
													 >
														 {loading ? 'Saving...' : 'Save'}
													 </button>
													 <button
														 type="button"
														 className="px-3 py-1 rounded bg-gray-200 text-gray-700 border border-gray-300 hover:bg-gray-300 transition text-sm font-medium ml-2"
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
												 className="px-6 py-2 rounded-lg bg-gray-200 text-gray-700 font-semibold border-2 border-gray-300 hover:bg-gray-300 transition"
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
					 {/* Right: Bookings and Listings stacked, separated by lines, with vertical line to left */}
					 <div className="flex flex-col w-1/2 gap-0 border-l-2 border-gray-300 pl-8">
						 <section className="p-8 flex flex-col items-center">
							 <h3 className="text-2xl font-semibold text-black mb-4">Bookings</h3>
							 <p className="text-lg text-gray-700">No bookings yet.</p>
						 </section>
						 <hr className="w-full border-t-2 border-gray-300 my-2" />
						 <section className="p-8 flex flex-col items-center">
							 <h3 className="text-2xl font-semibold text-black mb-4">Listings</h3>
							 <p className="text-lg text-gray-700">No listings yet.</p>
						 </section>
					 </div>
				 </div>
			 </div>
		 </>
	 );
}

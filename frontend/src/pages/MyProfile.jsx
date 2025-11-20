import React from 'react';
import { useUser } from '../hook/UserContext.jsx';
import { useNavigate } from 'react-router-dom';

export default function MyProfile() {
	const { user, setUser } = useUser();
	const navigate = useNavigate();

	const handleLogout = () => {
		setUser(null);
		navigate('/auth');
	};

	return (
		<>
			<div className="flex flex-col items-center justify-center min-h-screen pt-12">
				<div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">
					<h2 className="text-3xl font-bold text-red-500 mb-4 text-center">My Profile</h2>
					{user && (
						<div className="mb-4 text-center">
							<p className="text-lg text-gray-700">Username: <span className="font-semibold">{user.username}</span></p>
							<p className="text-lg text-gray-700">Email: <span className="font-semibold">{user.email}</span></p>
						</div>
					)}
					<button
						className="mt-4 px-6 py-2 rounded-lg bg-red-500 text-white font-semibold border-2 border-black hover:bg-red-600 transition"
						onClick={handleLogout}
					>
						Logout
					</button>
					<p className="text-lg text-gray-700 text-center mt-6">Welcome to your profile page!</p>
				</div>
			</div>
		</>
	);
}

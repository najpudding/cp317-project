import React, { useEffect, useState } from 'react';
import { useUser } from '../hook/UserContext.jsx';
import Navbar from '../components/Navbar';
import MapView from '../components/MapView';

export default function Home() {
	const { user } = useUser();
	const [listings, setListings] = useState([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		async function fetchListings() {
			setLoading(true);
			try {
				const res = await fetch('http://localhost:3001/api/listings');
				const data = await res.json();
				if (Array.isArray(data)) {
					// Filter out user's own listings
					setListings(data.filter(l => !user || l.user_email !== user.email));
				}
			} catch (err) {
				setListings([]);
			}
			setLoading(false);
		}
		fetchListings();
	}, [user]);

	return (
		<>
			<Navbar />
			<div className="flex flex-row items-start justify-center min-h-screen pt-12 gap-8 px-4 md:px-12 overflow-hidden">
				<div className="w-full max-w-2xl">
					<MapView />
				</div>
				{/* Listings stack to the right of the map */}
				<div className="w-full max-w-xl flex flex-col gap-4">
					{loading ? (
						<div className="bg-white rounded-xl shadow p-4 border-2 border-black">Loading listings...</div>
					) : listings.length === 0 ? (
						<div className="bg-white rounded-xl shadow p-4 border-2 border-black">No listings available.</div>
					) : (
						listings.map((listing, idx) => (
							<div key={listing.id || idx} className="bg-white rounded-xl shadow p-3 border-2 border-black flex flex-col gap-2" style={{ width: 'auto' }}>
								<div className="flex flex-row items-center justify-between w-full">
									<span className="font-bold text-2xl text-red-600">{listing.address}</span>
									<span className="text-2xl text-green-700 font-bold ml-4">${listing.price}/hr</span>
								</div>
								<div className="text-lg text-gray-800 font-semibold">{listing.description}</div>
								<div className="text-base text-gray-700">Available: <span className="font-bold">{listing.availability_from}</span> - <span className="font-bold">{listing.availability_to}</span></div>
								<div className="text-base text-gray-700">Days: <span className="font-bold">{listing.days}</span></div>
								<div className="text-base text-gray-700">Type: <span className="font-bold">{listing.indoor_outdoor}</span>, Vehicle Size: <span className="font-bold">{listing.vehicle_size}</span></div>
							</div>
						))
					)}
				</div>
			</div>
		</>
	);
}

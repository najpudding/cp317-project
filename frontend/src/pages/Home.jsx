import React from 'react';
import Navbar from '../components/Navbar';
import MapView from '../components/MapView';

export default function Home() {
	return (
		<>
			<Navbar />
			<div className="flex flex-row items-start justify-center min-h-screen pt-12 gap-8 px-4 md:px-12 overflow-hidden">
				<div className="w-full max-w-2xl">
					<MapView />
				</div>
				{/* Listings stack to the right of the map */}
				<div className="w-full max-w-xl flex flex-col gap-4">
					<div className="bg-white rounded-xl shadow p-4 border-2 border-black">Listing 1</div>
					<div className="bg-white rounded-xl shadow p-4 border-2 border-black">Listing 2</div>
					<div className="bg-white rounded-xl shadow p-4 border-2 border-black">Listing 3</div>
				</div>
			</div>
		</>
	);
}

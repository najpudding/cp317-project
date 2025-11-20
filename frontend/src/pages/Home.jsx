import React from 'react';
import Navbar from '../components/Navbar';

export default function Home() {
	return (
		<>
			<Navbar />
			<div className="flex flex-row items-start justify-center min-h-screen pt-12 gap-8 px-4 md:px-12 overflow-hidden">
				<div className="w-full max-w-2xl h-[400px] bg-gray-200 rounded-2xl shadow-lg flex items-center justify-center border-2 border-black">
					{/* Map container placeholder */}
					<span className="text-2xl text-gray-500">Map Container</span>
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

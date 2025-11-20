import React from 'react';
import { Link } from 'react-router-dom';
import { useUser } from '../hook/UserContext.jsx';

export default function Navbar() {
  const { user } = useUser();
  return (
    <nav className="w-full bg-red-500 border-b-2 border-black shadow flex items-center justify-between px-12 py-3 mb-4 text-lg">
      <div className="flex items-center">
        <Link to="/">
          <span className="text-4xl font-bold text-white cursor-pointer">HawkPark</span>
        </Link>
      </div>
      <div className="flex gap-4 items-center px-2 py-1">
        <Link to="/">
          <button className="px-6 py-2 rounded-lg text-white font-semibold text-base transition bg-transparent hover:bg-transparent border-2 border-black cursor-pointer">Map</button>
        </Link>
        {user ? (
          <Link to="/myprofile">
            <button className="px-6 py-2 rounded-lg text-white font-semibold text-base transition flex flex-col items-end bg-transparent hover:bg-transparent border-2 border-black cursor-pointer">
              <span>{user.username}</span>
            </button>
          </Link>
        ) : (
          <span className="px-6 py-3 rounded-lg text-red-600 font-semibold transition">Not logged in</span>
        )}
      </div>
    </nav>
  );
}

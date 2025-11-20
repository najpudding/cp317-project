import React, { useState } from 'react';
import { useUser } from '../../hook/UserContext.jsx';

export default function Login({ onToggle, onAuthSuccess }) {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const { setUser } = useUser();

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch('http://localhost:3001/api/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email, password: form.password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');
      setUser(data.user);
      if (onAuthSuccess) onAuthSuccess();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="w-full">
      <h2 className="text-2xl font-bold mb-6 text-red-600 text-center">Login</h2>
      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        <input name="email" type="email" placeholder="Email" value={form.email} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-300" />
        <input name="password" type="password" placeholder="Password" value={form.password} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-300" />
        <button type="submit" className="w-full bg-red-500 text-white py-2 rounded-lg font-semibold hover:bg-red-600 transition">Login</button>
      </form>
      {error && <div className="mt-2 text-sm text-red-500 text-center">{error}</div>}
      <div className="mt-4 text-sm text-gray-600 text-center">
        Don't have an account?{' '}
        <span
          className="text-red-500 hover:underline cursor-pointer"
          style={{ cursor: 'pointer' }}
          onClick={onToggle}
        >
          Sign Up
        </span>
      </div>
    </div>
  );
}


import React, { useState } from 'react';

export default function ListingsForm({ onSubmit, onClose }) {
  const [form, setForm] = useState({
    address: '',
    parkingNumber: '',
    vehicleSize: '',
    indoorOutdoor: '',
    availabilityFrom: '',
    availabilityTo: '',
    days: [],
    price: '',
  });
  const [error, setError] = useState('');
  const [verifyMsg, setVerifyMsg] = useState('');

  const handleChange = e => {
    const { name, value, type, checked } = e.target;
    if (name === 'days') {
      setForm({
        ...form,
        days: checked
          ? [...form.days, value]
          : form.days.filter(day => day !== value)
      });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setVerifyMsg('');
    if (!form.address || !form.vehicleSize || !form.indoorOutdoor || !form.availabilityFrom || !form.availabilityTo || form.price === '' || form.days.length === 0) {
      setError('Please fill in all mandatory fields and select at least one day');
      return;
    }
    setError('');
    try {
      // Always format address as 'street, city, Ontario, Canada' for Nominatim
      let formattedAddress = form.address.trim();
      // Try to extract city from user input, default to Waterloo if missing
      let cityMatch = formattedAddress.match(/\b(waterloo|kitchener|cambridge)\b/i);
      let city = cityMatch ? cityMatch[1] : 'Waterloo';
      // Remove any city/province/country from input
      formattedAddress = formattedAddress.replace(/\b(waterloo|kitchener|cambridge)\b.*$/i, '').replace(/,?\s*ontario.*$/i, '').replace(/,?\s*canada.*$/i, '').trim();
      formattedAddress = `${formattedAddress}, ${city}, Ontario, Canada`;
      setVerifyMsg('Verifying address...');
      const nominatimUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(formattedAddress)}`;
      const response = await fetch(nominatimUrl, {
        headers: {
          'User-Agent': 'HawkPark/1.0 (hawkpark@example.com)'
        }
      });
      const contentType = response.headers.get('content-type');
      if (!response.ok || !contentType || !contentType.includes('application/json')) {
        setVerifyMsg('Address verification failed: Nominatim API error or rate limit.');
        return;
      }
      const data = await response.json();
      if (!data.length) {
        setVerifyMsg('Address not found. Please enter a valid address in Waterloo Region.');
        return;
      }
      // Check if address is in Waterloo Region (Waterloo, Kitchener, Cambridge)
      const valid = data.some(item => {
        const addr = item.address || {};
        const cityField = addr.city || addr.town || addr.village || '';
        const countyField = addr.county || '';
        const stateField = addr.state || '';
        const displayName = item.display_name || '';
        return (/waterloo|kitchener|cambridge/i.test(cityField) || /waterloo|kitchener|cambridge/i.test(countyField) || /waterloo|kitchener|cambridge/i.test(displayName)) && /ontario/i.test(stateField + displayName);
      });
      if (!valid) {
        setVerifyMsg('Address not found in Waterloo Region.');
        return;
      }
      // Get logged-in user from localStorage
      let userEmail = '';
      const userObj = window.localStorage.getItem('user');
      try {
        userEmail = JSON.parse(userObj).email || '';
      } catch {}
      // If address is valid, POST to backend
      // Remove province/country from address before saving
      let addressToSave = form.address.trim();
      addressToSave = addressToSave.replace(/,?\s*ontario.*$/i, '').replace(/,?\s*canada.*$/i, '').trim();
      const res = await fetch('http://localhost:3001/api/listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_email: userEmail,
          address: addressToSave,
          parking_number: form.parkingNumber,
          vehicle_size: form.vehicleSize,
          indoor_outdoor: form.indoorOutdoor,
          availability_from: form.availabilityFrom,
          availability_to: form.availabilityTo,
          days: form.days,
          price: form.price
        })
      });
      const postData = await res.json();
      if (res.ok) {
        setVerifyMsg('Listing added!');
        onSubmit(form);
        onClose();
      } else {
        setVerifyMsg(postData.error || 'Failed to add listing.');
      }
    } catch (err) {
      setVerifyMsg('Failed to add listing.');
    }
  };

  // Generate 30 min interval options for availability (e.g., 8:00, 8:30, ... 23:30)
  const generateTimeOptions = () => {
    const options = [];
    for (let hour = 0; hour < 24; hour++) {
      let h = hour % 12 === 0 ? 12 : hour % 12;
      const m = '00';
      const period = hour < 12 ? 'AM' : 'PM';
      options.push(`${h}:${m} ${period}`);
    }
    return options;
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-transparent z-50">
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md relative border-2 border-black">
        <button className="absolute top-2 right-2 text-gray-500 hover:text-red-500 text-xl rounded cursor-pointer bg-white" onClick={onClose}>&times;</button>
        {/* No header as requested */}
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          {/* Row 1: Address & Parking Number */}
          <div className="flex gap-4">
            <div className="w-1/2 flex flex-col">
              <label className="font-semibold text-gray-700">Address *</label>
              <input name="address" type="text" placeholder="Address *" value={form.address} onChange={handleChange} className="w-full px-4 py-2 border-2 border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-red-300 cursor-pointer" />
            </div>
            <div className="w-1/2 flex flex-col">
              <label className="font-semibold text-gray-700">Parking Number</label>
              <input name="parkingNumber" type="text" placeholder="Parking Number" value={form.parkingNumber} onChange={handleChange} className="w-full px-4 py-2 border-2 border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-red-300 cursor-pointer" />
            </div>
          </div>

          {/* Row 2: Vehicle Size & Indoor/Outdoor */}
          <div className="flex gap-4">
            <div className="w-1/2 flex flex-col">
              <label className="font-semibold text-gray-700">Vehicle Size *</label>
              <select name="vehicleSize" value={form.vehicleSize} onChange={handleChange} className="w-full px-4 py-2 border-2 border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-red-300 cursor-pointer">
                <option value="" className="bg-gray-200 dropdown-option">Vehicle Size *</option>
                <option value="Small" className="bg-gray-200 dropdown-option">Small</option>
                <option value="Medium" className="bg-gray-200 dropdown-option">Medium</option>
                <option value="Large" className="bg-gray-200 dropdown-option">Large</option>
                <option value="Any" className="bg-gray-200 dropdown-option">Any</option>
              </select>
            </div>
            <div className="w-1/2 flex flex-col">
              <label className="font-semibold text-gray-700">Indoor/Outdoor *</label>
              <select name="indoorOutdoor" value={form.indoorOutdoor} onChange={handleChange} className="w-full px-4 py-2 border-2 border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-red-300 cursor-pointer">
                <option value="" className="bg-gray-200 dropdown-option">Indoor/Outdoor *</option>
                <option value="Indoor" className="bg-gray-200 dropdown-option">Indoor</option>
                <option value="Outdoor" className="bg-gray-200 dropdown-option">Outdoor</option>
              </select>
            </div>
          </div>

          {/* Row 3: Availability From & To */}
          <div className="flex gap-4">
            <div className="w-1/2 flex flex-col">
              <label className="font-semibold text-gray-700">Availability From *</label>
              <select name="availabilityFrom" value={form.availabilityFrom} onChange={handleChange} className="w-full px-4 py-2 border-2 border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-red-300 cursor-pointer">
                <option value="" className="bg-gray-200 dropdown-option">From *</option>
                {generateTimeOptions().map(time => (
                  <option key={time} value={time} className="bg-gray-200 dropdown-option">{time}</option>
                ))}
              </select>
            </div>
            <div className="w-1/2 flex flex-col">
              <label className="font-semibold text-gray-700">Availability To *</label>
              <select name="availabilityTo" value={form.availabilityTo} onChange={handleChange} className="w-full px-4 py-2 border-2 border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-red-300 cursor-pointer">
                <option value="" className="bg-gray-200 dropdown-option">To *</option>
                {generateTimeOptions().map(time => (
                  <option key={time} value={time} className="bg-gray-200 dropdown-option">{time}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 4: Days of Week & Price */}
          <div className="flex gap-4">
            <div className="w-1/2 flex flex-col">
              <label className="font-semibold text-gray-700">Days Available *</label>
              <div className="grid grid-cols-2 gap-2">
                {['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'].map(day => (
                  <label key={day} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      name="days"
                      value={day}
                      checked={form.days.includes(day)}
                      onChange={handleChange}
                      className="accent-red-500"
                    />
                    {day}
                  </label>
                ))}
              </div>
            </div>
            <div className="w-1/2 flex flex-col">
              <label className="font-semibold text-gray-700">Price/hr *</label>
              <div className="relative w-full">
                <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-black">$</span>
                <input
                  name="price"
                  type="number"
                  min="0"
                  max="20"
                  step="0.01"
                  placeholder="Price/hr * (max $20)"
                  value={form.price}
                  onChange={e => {
                    let val = e.target.value;
                    if (parseFloat(val) > 20) val = '20';
                    setForm({ ...form, price: val });
                  }}
                  className="pl-8 px-4 py-2 border-2 border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-red-300 cursor-pointer w-full"
                />
              </div>
            </div>
          </div>

          <button type="submit" className="w-full bg-red-500 text-white py-2 rounded-lg font-semibold hover:bg-red-600 transition border-2 border-black cursor-pointer">Add Listing</button>
        </form>
        {error && <div className="mt-2 text-sm text-red-500 text-center">{error}</div>}
        {verifyMsg && <div className={`mt-2 text-sm text-center ${verifyMsg.includes('verified') ? 'text-green-600' : 'text-red-500'}`}>{verifyMsg}</div>}
      </div>
    </div>
  );
}

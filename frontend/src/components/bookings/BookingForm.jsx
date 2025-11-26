import React, { useState } from 'react';

export default function BookingForm({ listing, onSubmit, onClose, user }) {
  const [form, setForm] = useState({
    bookingDate: '',
    startTime: '',
    endTime: '',
  });
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [totalPrice, setTotalPrice] = useState(0);

  const handleChange = e => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    
    // Calculate price when times change
    if (name === 'startTime' || name === 'endTime') {
      calculatePrice({ ...form, [name]: value });
    }
  };

  const calculatePrice = (formData) => {
    if (!formData.startTime || !formData.endTime) return;
    
    const start = new Date(`2000-01-01T${formData.startTime}`);
    const end = new Date(`2000-01-01T${formData.endTime}`);
    const hours = (end - start) / (1000 * 60 * 60);
    
    if (hours > 0) {
      const price = (hours * parseFloat(listing.price)).toFixed(2);
      setTotalPrice(price);
    } else {
      setTotalPrice(0);
    }
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setMessage('');

    // Validation
    const missingFields = [];
    if (!form.bookingDate) missingFields.push('Date');
    if (!form.startTime) missingFields.push('Start Time');
    if (!form.endTime) missingFields.push('End Time');

    if (missingFields.length > 0) {
      setError(`Please fill in: ${missingFields.join(', ')}`);
      return;
    }

    // Check if selected date is valid
    if (isDateDisabled(form.bookingDate)) {
      setError('This parking spot is not available on the selected day');
      return;
    }

    // Validate times
    const start = new Date(`2000-01-01T${form.startTime}`);
    const end = new Date(`2000-01-01T${form.endTime}`);
    const hours = (end - start) / (1000 * 60 * 60);

    if (hours <= 0) {
      setError('End time must be after start time');
      return;
    }

    const calculatedPrice = (hours * parseFloat(listing.price)).toFixed(2);

    try {
      setMessage('Creating booking...');
      
      console.log('Booking request data:', {
        listing_id: listing.id,
        owner_email: listing.user_email,
        booking_date: form.bookingDate,
        start_time: form.startTime,
        end_time: form.endTime,
        total_price: calculatedPrice,
        user_id: user.id
      });
      
      const res = await fetch('http://localhost:3001/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id.toString()
        },
        body: JSON.stringify({
          listing_id: listing.id,
          owner_email: listing.user_email,
          booking_date: form.bookingDate,
          start_time: form.startTime,
          end_time: form.endTime,
          total_price: calculatedPrice
        })
      });

      const data = await res.json();
      console.log('Booking response:', data);

      if (res.ok) {
        setMessage(`Booking confirmed! Total: $${calculatedPrice}`);
        setTimeout(() => {
          onSubmit(data.booking);
          onClose();
        }, 1500);
      } else {
        console.error('Booking failed:', data);
        setError(data.error || 'Failed to create booking');
      }
    } catch (err) {
      console.error('Booking error:', err);
      setError('Error creating booking');
    }
  };

  // Generate time options in 1-hour intervals based on listing availability
  const generateTimeOptions = (isEndTime = false) => {
    const options = [];
    
    // Parse the listing's availability times
    const availFrom = listing.availability_from; // e.g., "8:00 AM"
    const availTo = listing.availability_to;     // e.g., "5:00 PM"
    
    // Convert to 24-hour format
    const parseTime = (timeStr) => {
      const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
      if (!match) return null;
      let hour = parseInt(match[1]);
      const minute = parseInt(match[2]);
      const period = match[3].toUpperCase();
      
      if (period === 'PM' && hour !== 12) hour += 12;
      if (period === 'AM' && hour === 12) hour = 0;
      
      return { hour, minute };
    };
    
    const startTime = parseTime(availFrom);
    const endTime = parseTime(availTo);
    
    if (!startTime || !endTime) {
      // Fallback to full day if parsing fails
      for (let hour = 0; hour < 24; hour++) {
        const h24 = hour.toString().padStart(2, '0');
        const h12 = hour % 12 === 0 ? 12 : hour % 12;
        const period = hour < 12 ? 'AM' : 'PM';
        options.push({
          value: `${h24}:00`,
          label: `${h12}:00 ${period}`
        });
      }
      return options;
    }
    
    let minHour = startTime.hour;
    let maxHour = endTime.hour;
    
    // For START time dropdown: exclude the end hour (can't start at the end time)
    // If end time is selected, start time can only go up to (end time - 1)
    if (!isEndTime) {
      if (form.endTime) {
        const selectedEndHour = parseInt(form.endTime.split(':')[0]);
        maxHour = Math.min(selectedEndHour - 1, endTime.hour);
      } else {
        // Without selected end time, start time can go up to (listing end - 1)
        maxHour = endTime.hour - 1;
      }
    }
    
    // For END time dropdown: exclude the start hour (can't end at the start time)
    // If start time is selected, end time must be at least (start time + 1)
    if (isEndTime) {
      if (form.startTime) {
        const selectedStartHour = parseInt(form.startTime.split(':')[0]);
        minHour = Math.max(selectedStartHour + 1, startTime.hour);
      } else {
        // Without selected start time, end time starts from (listing start + 1)
        minHour = startTime.hour + 1;
      }
    }
    
    // Generate hourly options within the calculated range
    for (let currentHour = minHour; currentHour <= maxHour; currentHour++) {
      const h24 = currentHour.toString().padStart(2, '0');
      const h12 = currentHour % 12 === 0 ? 12 : currentHour % 12;
      const period = currentHour < 12 ? 'AM' : 'PM';
      
      options.push({
        value: `${h24}:00`,
        label: `${h12}:00 ${period}`
      });
    }
    
    return options;
  };

  // Check if a date is valid for booking based on listing days
  const isDateDisabled = (dateString) => {
    if (!dateString) return false;
    
    const date = new Date(dateString + 'T00:00:00');
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayName = dayNames[date.getDay()];
    
    // Parse listing days (comma-separated string)
    const availableDays = typeof listing.days === 'string' 
      ? listing.days.split(',').map(d => d.trim()) 
      : listing.days || [];
    
    return !availableDays.includes(dayName);
  };

  const handleDateChange = (e) => {
    const selectedDate = e.target.value;
    setForm({ ...form, bookingDate: selectedDate });
    
    // Clear error when date changes
    if (error && error.includes('available on the selected day')) {
      setError('');
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-transparent z-50">
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md relative border-2 border-black" onClick={(e) => e.stopPropagation()}>
        <button 
          className="absolute top-2 right-2 text-gray-500 hover:text-red-500 text-xl rounded cursor-pointer bg-white" 
          onClick={onClose}
        >
          &times;
        </button>

        <h2 className="text-2xl font-bold text-red-600 mb-4">Book Parking Spot</h2>
        
        <div className="mb-4 p-3 bg-gray-100 rounded-lg border border-gray-300">
          <p className="font-bold text-lg">{listing.address}</p>
          <p className="text-sm text-gray-600">
            {listing.parking_number && `Spot #${listing.parking_number} • `}
            {listing.indoor_outdoor} • {listing.vehicle_size}
          </p>
          <p className="text-green-700 font-bold text-lg">${listing.price}/hr</p>
        </div>

        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          {/* Booking Date */}
          <div className="flex flex-col">
            <label className="font-semibold text-gray-700 mb-1">Date *</label>
            <input
              name="bookingDate"
              type="date"
              value={form.bookingDate}
              onChange={handleDateChange}
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-4 py-2 border-2 border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-red-300 cursor-pointer"
            />
            {form.bookingDate && isDateDisabled(form.bookingDate) && (
              <p className="text-xs text-red-500 mt-1">This spot is not available on this day</p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Available: {(() => {
                const dayOrder = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                const daysArr = typeof listing.days === 'string' 
                  ? listing.days.split(',').map(d => d.trim()) 
                  : listing.days || [];
                const sortedDays = daysArr.sort((a, b) => dayOrder.indexOf(a) - dayOrder.indexOf(b));
                return sortedDays.join(', ');
              })()}
            </p>
          </div>

          {/* Time Selection Row */}
          <div className="flex gap-4">
            <div className="w-1/2 flex flex-col">
              <label className="font-semibold text-gray-700 mb-1">Start Time *</label>
              <select
                name="startTime"
                value={form.startTime}
                onChange={handleChange}
                className="w-full px-4 py-2 border-2 border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-red-300 cursor-pointer"
              >
                <option value="" className="bg-gray-200 dropdown-option">Start Time *</option>
                {generateTimeOptions(false).map(time => (
                  <option key={time.value} value={time.value} className="bg-gray-200 dropdown-option">
                    {time.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="w-1/2 flex flex-col">
              <label className="font-semibold text-gray-700 mb-1">End Time *</label>
              <select
                name="endTime"
                value={form.endTime}
                onChange={handleChange}
                className="w-full px-4 py-2 border-2 border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-red-300 cursor-pointer"
              >
                <option value="" className="bg-gray-200 dropdown-option">End Time *</option>
                {generateTimeOptions(true).map(time => (
                  <option key={time.value} value={time.value} className="bg-gray-200 dropdown-option">
                    {time.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Total Price Display */}
          {totalPrice > 0 && (
            <div className="bg-green-50 border-2 border-green-500 rounded-lg p-3 text-center">
              <p className="text-sm text-gray-600">Total Price</p>
              <p className="text-2xl font-bold text-green-700">${totalPrice}</p>
            </div>
          )}

          <button 
            type="submit" 
            className="w-full bg-red-500 text-white py-2 rounded-lg font-semibold hover:bg-red-600 transition border-2 border-black cursor-pointer"
          >
            Confirm Booking
          </button>
        </form>

        {error && <div className="mt-2 text-sm text-red-500 text-center font-semibold">{error}</div>}
        {message && (
          <div className={`mt-2 text-sm text-center font-semibold ${message.includes('confirmed') ? 'text-green-600' : 'text-blue-600'}`}>
            {message}
          </div>
        )}
      </div>
    </div>
  );
}

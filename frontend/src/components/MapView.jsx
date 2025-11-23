import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import React, { useEffect, useState } from 'react';

async function fetchCoordinates(address) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address + ', Ontario, Canada')}`;
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'HawkPark/1.0 (hawkpark@example.com)'
      }
    });
    const data = await response.json();
    if (data && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lon: parseFloat(data[0].lon)
      };
    }
  } catch (err) {
    console.error('Geocoding error:', err);
  }
  return null;
}

export default function MapView({ listings = [], onMarkerClick, onMapClick }) {
  const [listingCoords, setListingCoords] = useState([]);

  useEffect(() => {
    let isMounted = true;
    async function geocodeListings() {
      const coordsPromises = listings.map(async (listing) => {
        if (listing.coordinates && listing.coordinates.lat && listing.coordinates.lon) {
          return { ...listing, coordinates: listing.coordinates };
        } else {
          const coords = await fetchCoordinates(listing.address);
          return coords ? { ...listing, coordinates: coords } : null;
        }
      });
      const results = await Promise.all(coordsPromises);
      if (isMounted) {
        setListingCoords(results.filter(l => l && l.coordinates));
      }
    }
    geocodeListings();
    return () => { isMounted = false; };
  }, [listings]);

  // Handler for map clicks (background)
  function handleMapClick(e) {
    if (onMapClick) onMapClick();
  }

  return (
    <div style={{ width: '100%', height: '400px', border: '2px solid #000', borderRadius: '1rem', overflow: 'hidden', position: 'relative' }}>
      <style>{`.leaflet-control-attribution { display: none !important; }`}</style>
      <MapContainer center={[43.4643, -80.5204]} zoom={13} style={{ height: '100%', width: '100%' }} onClick={handleMapClick}>
        <TileLayer
          attribution=''
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {listingCoords.map((listing, idx) => (
          listing.coordinates && listing.coordinates.lat && listing.coordinates.lon ? (
            <Marker
              key={listing.id || idx}
              position={[listing.coordinates.lat, listing.coordinates.lon]}
              icon={L.icon({
                iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
                shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
                iconSize: [25, 41],
                iconAnchor: [12, 41],
                popupAnchor: [1, -34],
                shadowSize: [41, 41]
              })}
              eventHandlers={{
                click: () => {
                  if (onMarkerClick) onMarkerClick(listing.address);
                }
              }}
            >
              <Popup>
                <div>
                  <strong>{listing.address}</strong><br />
                  Price: ${listing.price}/hr<br />
                  {listing.description}
                </div>
              </Popup>
            </Marker>
          ) : null
        ))}
      </MapContainer>
    </div>
  );
}
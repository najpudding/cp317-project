import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

export default function MapView() {
  return (
    <div style={{ width: '100%', height: '400px', border: '2px solid #000', borderRadius: '1rem', overflow: 'hidden' }}>
      <MapContainer center={[43.4643, -80.5204]} zoom={13} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={[43.4643, -80.5204]}>
          <Popup>
            HawkPark Home
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}
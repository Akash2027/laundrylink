import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import toast from 'react-hot-toast';

// Fix marker icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const LocationMarker = ({ setLocation, setAddress }) => {
  const [position, setPosition] = useState(null);
  
  useMapEvents({
    click(e) {
      setPosition(e.latlng);
      setLocation({ lat: e.latlng.lat, lng: e.latlng.lng });
      
      // Reverse geocoding to get address
      fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${e.latlng.lat}&lon=${e.latlng.lng}`)
        .then(res => res.json())
        .then(data => {
          if (data.display_name) {
            setAddress(data.display_name);
            toast.success('Address selected!');
          }
        })
        .catch(() => toast.error('Could not get address'));
    },
  });
  
  return position === null ? null : <Marker position={position} />;
};

const LocationPicker = ({ onLocationSelect, initialLat, initialLng }) => {
  const [location, setLocation] = useState({ 
    lat: initialLat || 20.5937, 
    lng: initialLng || 78.9629 
  });
  const [address, setAddress] = useState('');

  useEffect(() => {
    if (location.lat && location.lng) {
      onLocationSelect({ location, address });
    }
  }, [location, address]);

  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setLocation({ lat, lng });
          
          fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`)
            .then(res => res.json())
            .then(data => {
              if (data.display_name) {
                setAddress(data.display_name);
                toast.success('Your location detected!');
              }
            });
        },
        (error) => {
          toast.error('Unable to get your location');
        }
      );
    } else {
      toast.error('Geolocation not supported');
    }
  };

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={getUserLocation}
        className="px-4 py-2 rounded-lg bg-blue-50 text-blue-600 text-sm font-medium hover:bg-blue-100 transition"
      >
        📍 Use My Current Location
      </button>
      
      <div className="h-64 rounded-xl overflow-hidden border border-gray-200">
        <MapContainer
          center={[location.lat, location.lng]}
          zoom={13}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          />
          <LocationMarker setLocation={setLocation} setAddress={setAddress} />
        </MapContainer>
      </div>
      
      <p className="text-xs text-gray-400">Click on map to select your location</p>
      
      {address && (
        <div className="p-3 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">{address}</p>
        </div>
      )}
    </div>
  );
};

export default LocationPicker;
import { useState } from "react";
import axios from "axios";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Circle,
} from "react-leaflet";
import L from 'leaflet';
import MapClickHandler from "./MapClickHandler";

// Fix marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

const LocationPickerMap = ({ onLocationSelect }) => {
  const [location, setLocation] = useState(null);
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);

  const getCurrentLocation = () => {
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        setLocation({ lat, lng });

        try {
          const response = await axios.get(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
          );
          const fullAddress = response.data.display_name;
          setAddress(fullAddress);
          
          onLocationSelect({
            lat: lat,
            lng: lng,
            address: fullAddress
          });
        } catch (error) {
          onLocationSelect({
            lat: lat,
            lng: lng,
            address: `${lat}, ${lng}`
          });
        }
        setLoading(false);
      },
      (error) => {
        alert(error.message);
        setLoading(false);
      }
    );
  };

  const handleMapClick = async (lat, lng) => {
    setLocation({ lat, lng });

    try {
      const response = await axios.get(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
      );
      const fullAddress = response.data.display_name;
      setAddress(fullAddress);
      
      onLocationSelect({
        lat: lat,
        lng: lng,
        address: fullAddress
      });
    } catch (error) {
      onLocationSelect({
        lat: lat,
        lng: lng,
        address: `${lat}, ${lng}`
      });
    }
  };

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={getCurrentLocation}
        disabled={loading}
        className="w-full px-4 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition"
      >
        {loading ? "📍 Getting Location..." : "📍 Use My Current Location"}
      </button>

      {location && (
        <>
          <div className="p-3 bg-gray-50 rounded-lg text-sm">
            <p className="font-medium text-gray-700">Your Location:</p>
            <p className="text-gray-500 text-xs break-words">{address || `${location.lat}, ${location.lng}`}</p>
          </div>

          <div className="h-80 rounded-xl overflow-hidden border border-gray-200">
            <MapContainer
              center={[location.lat, location.lng]}
              zoom={15}
              style={{ height: "100%", width: "100%" }}
            >
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <MapClickHandler onMapClick={handleMapClick} />
              <Marker position={[location.lat, location.lng]}>
                <Popup>Your Location 📍</Popup>
              </Marker>
            </MapContainer>
          </div>
        </>
      )}
    </div>
  );
};

export default LocationPickerMap;
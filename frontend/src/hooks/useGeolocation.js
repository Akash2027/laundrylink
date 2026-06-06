import { useState } from 'react';

const useGeolocation = () => {
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState({
    lat: null,
    lng: null,
    error: null
  });

  const getLocation = () => {
    setLoading(true);
    
    if (!navigator.geolocation) {
      setLocation({
        lat: null,
        lng: null,
        error: 'Geolocation not supported'
      });
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          error: null
        });
        setLoading(false);
      },
      (error) => {
        setLocation({
          lat: null,
          lng: null,
          error: error.message
        });
        setLoading(false);
      }
    );
  };

  return { location, loading, getLocation };
};

export default useGeolocation;
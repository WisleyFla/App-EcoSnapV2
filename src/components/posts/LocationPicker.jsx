// src/components/posts/LocationPicker.jsx
import React from 'react';

const LocationPicker = ({ onLocationChange, autoGetLocation = false }) => {
  // Implementação básica - você pode expandir conforme necessário
  const handleLocationSelect = () => {
    if (navigator.geolocation && autoGetLocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            address: "Localização atual",
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          };
          onLocationChange(location);
        },
        (error) => {
          console.error("Erro ao obter localização:", error);
        }
      );
    }
  };

  return (
    <div className="location-picker">
      <button 
        type="button" 
        onClick={handleLocationSelect}
        className="location-button"
      >
        Obter Localização Atual
      </button>
    </div>
  );
};

export default LocationPicker;
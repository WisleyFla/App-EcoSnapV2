// src/components/posts/LocationPicker.jsx
import React from 'react';
import { useLocation } from '../../hooks/useLocation';
import './LocationPicker.css';

const LocationPicker = ({ onLocationChange, autoGetLocation = true }) => {
  const { location, loading, error, getLocation, clearLocation, resetError } = useLocation();

  // Notificar componente pai quando localização mudar
  React.useEffect(() => {
    onLocationChange?.(location);
  }, [location, onLocationChange]);

  // Obter localização automaticamente se solicitado
  React.useEffect(() => {
    if (autoGetLocation && !location && !loading && !error) {
      getLocation().catch(() => {
        // Erro já está sendo tratado pelo hook
      });
    }
  }, [autoGetLocation]);

  const handleGetLocation = async () => {
    try {
      await getLocation();
    } catch (err) {
      // Erro já está sendo tratado pelo hook
    }
  };

  const handleClearLocation = () => {
    clearLocation();
  };

  const handleRetry = () => {
    resetError();
    handleGetLocation();
  };

  return (
    <div className="location-picker">
      <div className="location-header">
        <span className="location-icon">📍</span>
        <span className="location-label">Localização</span>
      </div>

      {loading && (
        <div className="location-status location-loading">
          <div className="loading-spinner"></div>
          <span>Obtendo sua localização...</span>
        </div>
      )}

      {error && (
        <div className="location-status location-error">
          <span className="error-icon">❌</span>
          <div className="error-content">
            <span className="error-message">{error}</span>
            <button 
              type="button" 
              onClick={handleRetry}
              className="retry-button"
            >
              Tentar novamente
            </button>
          </div>
        </div>
      )}

      {location && (
        <div className="location-status location-success">
          <span className="success-icon">✅</span>
          <div className="location-content">
            <span className="location-address">{location.address}</span>
            <button 
              type="button" 
              onClick={handleClearLocation}
              className="remove-button"
            >
              Remover
            </button>
          </div>
        </div>
      )}

      {!loading && !location && !error && (
        <button 
          type="button" 
          onClick={handleGetLocation}
          className="get-location-button"
        >
          <span className="button-icon">📍</span>
          Obter localização atual
        </button>
      )}
    </div>
  );
};

export default LocationPicker;
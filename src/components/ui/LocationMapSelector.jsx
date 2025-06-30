import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Navigation, X, Check } from 'lucide-react';
import toast from 'react-hot-toast';

const LocationMapSelector = ({ isOpen, onClose, onLocationSelect, initialLocation }) => {
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [currentLocationMarker, setCurrentLocationMarker] = useState(null);
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingCurrentLocation, setLoadingCurrentLocation] = useState(false);

  // Inicializar mapa quando modal abre
  useEffect(() => {
    if (isOpen && mapRef.current && !map) {
      initializeMap();
    }
  }, [isOpen]);

  // Limpar mapa quando modal fecha
  useEffect(() => {
    if (!isOpen && map) {
      map.remove();
      setMap(null);
      setSelectedLocation(null);
      setSelectedMarker(null);
      setCurrentLocationMarker(null);
    }
  }, [isOpen, map]);

  const initializeMap = async () => {
    try {
      setLoading(true);

      // Verificar se Leaflet está disponível, senão carregar
      if (typeof window.L === 'undefined') {
        await loadLeaflet();
      }

      // Coordenadas padrão (Brasília)
      const defaultLat = initialLocation?.latitude || -15.7939;
      const defaultLng = initialLocation?.longitude || -47.8828;

      // Criar mapa
      const newMap = window.L.map(mapRef.current, {
        center: [defaultLat, defaultLng],
        zoom: 13,
        zoomControl: true,
        attributionControl: true
      });

      // Adicionar tiles do OpenStreetMap
      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
      }).addTo(newMap);

      // Evento de clique no mapa
      newMap.on('click', handleMapClick);

      setMap(newMap);
      
      // Se há localização inicial, mostrar no mapa
      if (initialLocation) {
        const marker = window.L.marker([initialLocation.latitude, initialLocation.longitude])
          .addTo(newMap)
          .bindPopup('Localização atual');
        setCurrentLocationMarker(marker);
      }

    } catch (error) {
      console.error('Erro ao inicializar mapa:', error);
      toast.error('Erro ao carregar mapa');
    } finally {
      setLoading(false);
    }
  };

  const loadLeaflet = () => {
    return new Promise((resolve, reject) => {
      // Carregar CSS do Leaflet
      if (!document.querySelector('link[href*="leaflet.css"]')) {
        const cssLink = document.createElement('link');
        cssLink.rel = 'stylesheet';
        cssLink.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(cssLink);
      }

      // Carregar JS do Leaflet
      if (!document.querySelector('script[src*="leaflet.js"]')) {
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      } else {
        resolve();
      }
    });
  };

  const handleMapClick = async (e) => {
    const { lat, lng } = e.latlng;
    
    try {
      // Remover marcador anterior
      if (selectedMarker) {
        map.removeLayer(selectedMarker);
      }

      // Adicionar novo marcador
      const marker = window.L.marker([lat, lng])
        .addTo(map)
        .bindPopup(`📍 Local selecionado`);

      setSelectedMarker(marker);

      // Obter nome do local
      const locationName = await getLocationName(lat, lng);
      
      setSelectedLocation({
        latitude: lat,
        longitude: lng,
        name: locationName,
        address: `${lat.toFixed(6)}, ${lng.toFixed(6)}`
      });

      // Atualizar popup do marcador
      marker.bindPopup(`📍 ${locationName}`).openPopup();

    } catch (error) {
      console.error('Erro ao selecionar localização:', error);
    }
  };

  const getCurrentLocation = async () => {
    if (!navigator.geolocation) {
      toast.error('Geolocalização não suportada');
      return;
    }

    setLoadingCurrentLocation(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        // Centralizar mapa na localização atual
        map.setView([latitude, longitude], 16);
        
        // Remover marcador anterior da localização atual
        if (currentLocationMarker) {
          map.removeLayer(currentLocationMarker);
        }

        // Adicionar marcador da localização atual
        const marker = window.L.marker([latitude, longitude], {
          icon: window.L.divIcon({
            className: 'current-location-marker',
            html: '<div style="background: #4285f4; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3);"></div>',
            iconSize: [20, 20],
            iconAnchor: [10, 10]
          })
        }).addTo(map);

        setCurrentLocationMarker(marker);

        // NOVO: Automaticamente selecionar esta localização
        try {
          const locationName = await getLocationName(latitude, longitude);
          
          // Remover marcador de seleção anterior se existir
          if (selectedMarker) {
            map.removeLayer(selectedMarker);
          }

          // Criar marcador de seleção no mesmo local
          const selectionMarker = window.L.marker([latitude, longitude])
            .addTo(map)
            .bindPopup(`📍 ${locationName} (Sua localização)`);

          setSelectedMarker(selectionMarker);
          
          // Definir como local selecionado
          setSelectedLocation({
            latitude,
            longitude,
            name: locationName,
            address: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
          });

          marker.bindPopup(`📱 Sua localização atual: ${locationName}`);
          toast.success('Localização atual selecionada!');
        } catch (error) {
          console.error('Erro ao obter nome da localização:', error);
          toast.error('Erro ao obter detalhes da localização');
        }

        setLoadingCurrentLocation(false);
      },
      (error) => {
        setLoadingCurrentLocation(false);
        toast.error('Erro ao obter localização atual');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const getLocationName = async (lat, lng) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1&accept-language=pt-BR`
      );
      
      if (response.ok) {
        const data = await response.json();
        const address = data.address || {};
        
        return address.village || 
               address.town || 
               address.suburb || 
               address.neighbourhood || 
               address.city || 
               'Local selecionado';
      }
    } catch (error) {
      console.error('Erro ao obter nome do local:', error);
    }
    
    return 'Local selecionado';
  };

  const handleConfirm = () => {
    if (selectedLocation) {
      onLocationSelect(selectedLocation);
      onClose();
    } else {
      toast.error('Selecione um local no mapa primeiro');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="location-modal-overlay">
      <div className="location-modal">
        {/* Header */}
        <div className="location-modal-header">
          <h3>Selecionar Localização</h3>
          <button onClick={onClose} className="close-btn">
            <X size={20} />
          </button>
        </div>

        {/* Controles */}
        <div className="location-controls">
          <div className="controls-left">
            <button 
              onClick={getCurrentLocation} 
              disabled={loadingCurrentLocation}
              className="current-location-btn"
            >
              {loadingCurrentLocation ? (
                <div className="spinner" />
              ) : (
                <Navigation size={16} />
              )}
              {loadingCurrentLocation ? 'Obtendo...' : 'Usar Minha Localização'}
            </button>
            
            {/* Botão Confirmar aparece ao lado quando há localização selecionada */}
            {selectedLocation && (
              <button 
                onClick={handleConfirm} 
                className="confirm-btn-inline"
              >
                <Check size={16} />
                Confirmar Este Local
              </button>
            )}
          </div>
          
          <div className="location-info">
            {selectedLocation ? (
              <div className="selected-info">
                <MapPin size={16} />
                <span>{selectedLocation.name}</span>
              </div>
            ) : (
              <span>Clique no mapa para selecionar um local</span>
            )}
          </div>
        </div>

        {/* Mapa */}
        <div className="map-container">
          {loading && (
            <div className="map-loading">
              <div className="spinner" />
              <span>Carregando mapa...</span>
            </div>
          )}
          <div ref={mapRef} className="map" />
        </div>

        {/* Footer */}
        <div className="location-modal-footer">
          <button onClick={onClose} className="cancel-btn">
            Cancelar
          </button>
          <button 
            onClick={handleConfirm} 
            disabled={!selectedLocation}
            className="confirm-btn"
          >
            <Check size={16} />
            Confirmar Local
          </button>
        </div>
      </div>

      <style jsx>{`
        .location-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2000;
          padding: 20px;
        }

        .location-modal {
          background: #2F4F4F;
          border-radius: 12px;
          width: 100%;
          max-width: 400px;
          max-height: 80vh;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .location-modal-header {
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 20px;
          border-bottom: 1px solid #eee;
        }

        .location-modal-header h3 {
          margin: 0;
          font-size: 18px;
          color: #fff;
        }

        .close-btn {
          background: none;
          border: none;
          cursor: pointer;
          color: #666;
          padding: 4px;
          border-radius: 4px;
        }

        .close-btn:hover {
          background: #f5f5f5;
        }

        .location-controls {
          padding: 16px 20px;
          display: flex;
          justify-content: center;
          align-items: center;
          background: #2F4F4F;
          border-bottom: 1px solid #2F4F4F;
          gap: 16px;
        }

        .controls-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .current-location-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #4285f4;
          color: white;
          border: 2px solid black;
          padding: 8px 10px;
          border-radius: 5px;
          cursor: pointer;
          font-size: 14px;
          transition: background 0.2s;
          white-space: nowrap;
        }

        .current-location-btn:hover:not(:disabled) {
          background: #3367d6;
        }

        .current-location-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .confirm-btn-inline {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #4CAF50;
          color: white;
          border: 2px solid black;
          padding: 5px 10px;
          border-radius: 5px;
          cursor: pointer;
          font-size: 14px;
          transition: all 0.2s;
          animation: slideInFromRight 0.3s ease-out;
          white-space: nowrap;
        }

        .confirm-btn-inline:hover {
          background: #45a049;
          transform: translateY(-1px);
          box-shadow: 0 2px 8px rgba(76, 175, 80, 0.3);
        }

        @keyframes slideInFromRight {
          from {
            opacity: 0;
            transform: translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .location-info {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #666;
          font-size: 14px;
          flex: 1;
          min-width: 0;
        }

        .selected-info {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #4CAF50;
          font-weight: 500;
        }

        .map-container {
          flex: 1;
          position: relative;
          min-height: 400px;
        }

        .map {
          width: 100%;
          height: 100%;
          min-height: 400px;
        }

        .map-loading {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: white;
          z-index: 1000;
          gap: 12px;
        }

        .location-modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          padding: 20px;
          border-top: 1px solid #eee;
        }

        .cancel-btn {
          background: none;
          border: 1px solid #ddd;
          padding: 10px 20px;
          border-radius: 6px;
          cursor: pointer;
          color: #666;
        }

        .cancel-btn:hover {
          background: #f5f5f5;
        }

        .confirm-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #4CAF50;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 6px;
          cursor: pointer;
          transition: background 0.2s;
        }

        .confirm-btn:hover:not(:disabled) {
          background: #45a049;
        }

        .confirm-btn:disabled {
          background: #ccc;
          cursor: not-allowed;
        }

        .spinner {
          width: 16px;
          height: 16px;
          border: 2px solid transparent;
          border-top: 2px solid currentColor;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @media (max-width: 768px) {
          .location-modal-overlay {
            padding: 10px;
          }
          
          .location-controls {
            flex-direction: column;
            gap: 12px;
            align-items: stretch;
          }
          
          .controls-left {
            justify-content: center;
            flex-wrap: wrap;
          }
          
          .location-info {
            justify-content: center;
            text-align: center;
          }
        }
      `}</style>
    </div>
  );
};

export default LocationMapSelector;
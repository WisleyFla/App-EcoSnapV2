import React, { useState, useEffect, useRef } from 'react';
import { Icons } from './Icons';
import toast from 'react-hot-toast';

const LocationMapSelector = ({ isOpen, onClose, onLocationSelect, isDarkMode }) => {
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [currentMarker, setCurrentMarker] = useState(null);

  // Inicializar mapa quando modal abre
  useEffect(() => {
    if (isOpen && mapRef.current && !map) {
      initializeMap();
    }
  }, [isOpen]);

  // Obter localização atual quando modal abre
  useEffect(() => {
    if (isOpen && map && !selectedLocation) {
      getCurrentLocationOnOpen();
    }
  }, [isOpen, map]);

  // Limpar mapa quando modal fecha
  useEffect(() => {
    if (!isOpen && map) {
      map.remove();
      setMap(null);
      setSelectedLocation(null);
      setCurrentMarker(null);
    }
  }, [isOpen, map]);

  const initializeMap = async () => {
    try {
      setLoading(true);

      // Carregar Leaflet se não estiver disponível
      if (typeof window.L === 'undefined') {
        await loadLeaflet();
      }

      // Coordenadas padrão (Brasília)
      const defaultLat = -15.7939;
      const defaultLng = -47.8828;

      // Criar mapa
      const newMap = window.L.map(mapRef.current, {
        center: [defaultLat, defaultLng],
        zoom: 13,
        zoomControl: true,
        attributionControl: true
      });

      // Adicionar camada de mapa
      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
      }).addTo(newMap);

      // Adicionar evento de clique no mapa
      newMap.on('click', handleMapClick);

      setMap(newMap);
    } catch (error) {
      console.error('Erro ao inicializar mapa:', error);
      toast.error('Erro ao carregar mapa');
    } finally {
      setLoading(false);
    }
  };

  const loadLeaflet = () => {
    return new Promise((resolve, reject) => {
      // Carregar CSS
      if (!document.querySelector('link[href*="leaflet.css"]')) {
        const cssLink = document.createElement('link');
        cssLink.rel = 'stylesheet';
        cssLink.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(cssLink);
      }

      // Carregar JS
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

  const getCurrentLocationOnOpen = () => {
    if (!navigator.geolocation) {
      // Se não tem GPS, usar localização padrão (Brasília)
      const defaultLocation = {
        latitude: -15.7939,
        longitude: -47.8828,
        name: 'Brasília, DF',
        address: 'Brasília, DF'
      };
      setSelectedLocation(defaultLocation);
      addMarkerToMap(defaultLocation.latitude, defaultLocation.longitude, defaultLocation.name);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        try {
          const locationName = await getLocationName(latitude, longitude);
          const locationData = {
            latitude,
            longitude,
            name: locationName,
            address: locationName
          };
          
          setSelectedLocation(locationData);
          
          // Centralizar mapa na localização
          map.setView([latitude, longitude], 16);
          
          // Adicionar marcador
          addMarkerToMap(latitude, longitude, locationName);
          
        } catch (error) {
          console.error('Erro ao obter localização:', error);
          // Usar localização padrão em caso de erro
          const defaultLocation = {
            latitude: -15.7939,
            longitude: -47.8828,
            name: 'Brasília, DF',
            address: 'Brasília, DF'
          };
          setSelectedLocation(defaultLocation);
          addMarkerToMap(defaultLocation.latitude, defaultLocation.longitude, defaultLocation.name);
        }
      },
      (error) => {
        console.error('Erro de geolocalização:', error);
        // Usar localização padrão se GPS falhar
        const defaultLocation = {
          latitude: -15.7939,
          longitude: -47.8828,
          name: 'Brasília, DF',
          address: 'Brasília, DF'
        };
        setSelectedLocation(defaultLocation);
        addMarkerToMap(defaultLocation.latitude, defaultLocation.longitude, defaultLocation.name);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000
      }
    );
  };

  const handleMapClick = async (e) => {
    const { lat, lng } = e.latlng;
    
    try {
      // Obter nome do novo local
      const locationName = await getLocationName(lat, lng);
      
      const newLocation = {
        latitude: lat,
        longitude: lng,
        name: locationName,
        address: locationName
      };
      
      setSelectedLocation(newLocation);
      
      // Mover marcador para nova posição
      addMarkerToMap(lat, lng, locationName);
      
    } catch (error) {
      console.error('Erro ao selecionar nova localização:', error);
    }
  };

  const addMarkerToMap = (lat, lng, name) => {
    // Remover marcador anterior se existir
    if (currentMarker) {
      map.removeLayer(currentMarker);
    }

    // Criar novo marcador
    const marker = window.L.marker([lat, lng], {
      draggable: true // Permitir arrastar o marcador
    }).addTo(map);

    // Popup com nome do local
    marker.bindPopup(`📍 ${name}`).openPopup();

    // Evento quando arrastar o marcador
    marker.on('dragend', async (e) => {
      const position = e.target.getLatLng();
      try {
        const newLocationName = await getLocationName(position.lat, position.lng);
        const draggedLocation = {
          latitude: position.lat,
          longitude: position.lng,
          name: newLocationName,
          address: newLocationName
        };
        
        setSelectedLocation(draggedLocation);
        marker.bindPopup(`📍 ${newLocationName}`).openPopup();
      } catch (error) {
        console.error('Erro ao obter nome da nova posição:', error);
      }
    });

    setCurrentMarker(marker);
  };

  const handleConfirm = () => {
    if (selectedLocation) {
      onLocationSelect(selectedLocation);
      onClose();
      toast.success(`Localização confirmada: ${selectedLocation.name}`, {
        icon: '✅'
      });
    } else {
      toast.error('Nenhuma localização selecionada');
    }
  };

  const getLocationName = async (lat, lng) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=16&addressdetails=1&accept-language=pt-BR`
      );
      
      if (response.ok) {
        const data = await response.json();
        const address = data.address || {};
        
        // Priorizar nomes mais específicos
        return address.village || 
               address.town || 
               address.suburb || 
               address.neighbourhood || 
               address.city || 
               address.municipality ||
               'Localização atual';
      }
    } catch (error) {
      console.error('Erro ao obter nome do local:', error);
    }
    
    return 'Localização atual';
  };

  const handleCancel = () => {
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="location-modal-overlay">
      <div className="location-modal">
        {/* Header */}
        <div className="location-header">
          <Icons.Location size={20} style={{ color: '#90EE90', marginRight: '8px' }} />
          <h3>Selecionar Localização</h3>
        </div>

        {/* Mapa */}
        <div className="map-container">
          {loading && (
            <div className="map-loading">
              <div className="loading-spinner"></div>
              <span>Carregando mapa...</span>
            </div>
          )}
          <div ref={mapRef} className="map" />
          
          {/* Instrução para o usuário */}
          {!loading && (
            <div className="map-instruction">
              <Icons.Location size={16} />
              <span>Clique no mapa ou arraste o pin para mudar a localização</span>
            </div>
          )}
        </div>

        {/* Botões */}
        <div className="bottom-buttons">
          <button 
            onClick={handleCancel}
            className="cancel-button"
          >
            <Icons.Close size={18} />
            Cancelar
          </button>
          
          <button 
            onClick={handleConfirm}
            disabled={!selectedLocation}
            className="confirm-button"
          >
            <Icons.Check size={18} />
            Confirmar Local
          </button>
        </div>
      </div>

      <style jsx>{`
        /* Modal Overlay */
        .location-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.75);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2000;
          padding: 20px;
          backdrop-filter: blur(4px);
        }

        /* Modal Container */
        .location-modal {
          background: ${isDarkMode ? '#1a1a1a' : '#2F4F4F'};
          border-radius: 16px;
          width: 100%;
          max-width: 420px;
          max-height: 85vh;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        /* Header */
        .location-header {
          background: ${isDarkMode ? '#1a1a1a' : '#2F4F4F'};
          padding: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .location-header h3 {
          margin: 0;
          color: #ffffff;
          font-size: 18px;
          font-weight: 600;
        }

        /* Map Container */
        .map-container {
          flex: 1;
          position: relative;
          min-height: 350px;
          background: #f0f0f0;
        }

        .map {
          width: 100%;
          height: 100%;
          min-height: 350px;
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
          background: #ffffff;
          z-index: 1000;
          gap: 16px;
          color: #666;
        }

        .map-instruction {
          position: absolute;
          top: 10px;
          left: 50%;
          transform: translateX(-50%);
          background: ${isDarkMode ? '#1a1a1a' : '#2F4F4F'};;
          color: white;
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 12px;
          display: flex;
          align-items: center;
          gap: 6px;
          z-index: 1000;
          backdrop-filter: blur(4px);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        /* Bottom Buttons */
        .bottom-buttons {
          display: flex;
          gap: 12px;
          padding: 20px;
          background: ${isDarkMode ? '#1a1a1a' : '#2F4F4F'};;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }

        /* Cancel Button */
        .cancel-button {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          flex: 1;
          background: #dc3545;
          color: white;
          border: none;
          padding: 14px 20px;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 4px 12px rgba(220, 53, 69, 0.2);
        }

        .cancel-button:hover:not(:disabled) {
          background: #c82333;
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(220, 53, 69, 0.3);
        }

        .cancel-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        /* Location Button - agora é Confirm Button */
        .confirm-button {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          flex: 1;
          background: #28a745;
          color: white;
          border: none;
          padding: 14px 20px;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 4px 12px rgba(40, 167, 69, 0.2);
        }

        .confirm-button:hover:not(:disabled) {
          background: #218838;
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(40, 167, 69, 0.3);
        }

        .confirm-button:disabled {
          background: #6c757d;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }

        /* Loading Spinners */
        .loading-spinner,
        .button-spinner {
          width: 20px;
          height: 20px;
          border: 2px solid transparent;
          border-top: 2px solid currentColor;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        .button-spinner {
          width: 16px;
          height: 16px;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        /* Mobile Responsive */
        @media (max-width: 768px) {
          .location-modal-overlay {
            padding: 10px;
          }

          .location-modal {
            max-width: 100%;
            max-height: 90vh;
          }

          .bottom-buttons {
            flex-direction: column;
            gap: 12px;
          }

          .map-container {
            min-height: 300px;
          }

          .map {
            min-height: 300px;
          }
        }

        /* Small Mobile */
        @media (max-width: 480px) {
          .location-header {
            padding: 16px;
          }

          .location-header h3 {
            font-size: 16px;
          }

          .bottom-buttons {
            padding: 16px;
          }

          .cancel-button,
          .location-button {
            padding: 12px 16px;
            font-size: 13px;
          }
        }
      `}</style>
    </div>
  );
};

export default LocationMapSelector;
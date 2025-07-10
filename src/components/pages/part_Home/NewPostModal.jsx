import { useState } from 'react';
import toast from 'react-hot-toast';
import { Map, X, Plus } from 'lucide-react';
import MediaUpload from '../../ui/MediaUpload';
import LocationMapSelector from '../../ui/LocationMapSelector'; // Assuming this is the correct import path

export function NewPostModal({
  isOpen,
  onClose,
  onCreatePost,
  isDarkMode,
  initialLocation,
  onLocationSelect, // This prop seems to be duplicated, might want to clean up
  onGetQuickLocation,
  locationLoading
}) {
  const [newPostData, setNewPostData] = useState({
    content: '',
    tags: ''
  });
  const [currentLocation, setCurrentLocation] = useState(initialLocation);
  const [postMedia, setPostMedia] = useState([]);
  const [isCreatingPost, setIsCreatingPost] = useState(false);
  const [showMapSelector, setShowMapSelector] = useState(false);
  
  // Assuming these functions are defined or passed in as props
  const handleNewPost = () => { /* Logic to open modal */ };
  const closeModal = () => onClose();
  const createPost = () => handleSubmit();
  const getQuickLocation = () => onGetQuickLocation();


  const handleMediaUpdate = (mediaList) => {
    setPostMedia(Array.isArray(mediaList) ? mediaList : []);
  };

  const handleOpenMapSelector = () => {
    setShowMapSelector(true);
  };

  const handleLocationSelect = (location) => {
    setCurrentLocation({
      name: location.name,
      fullAddress: `${location.name} (${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)})`,
      coordinates: {
        latitude: location.latitude,
        longitude: location.longitude
      },
      source: 'Mapa'
    });
    toast.success(`Local selecionado: ${location.name}`);
    setShowMapSelector(false);
  };

  const handleSubmit = async () => {
    if (!newPostData.content.trim()) {
      toast.error('O conteúdo do post não pode estar vazio!');
      return;
    }

    try {
      setIsCreatingPost(true);

      const tags = newPostData.tags
        ? newPostData.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
        : [];

      await onCreatePost({
        content: newPostData.content.trim(),
        tags,
        location: currentLocation,
        media_urls: postMedia
      });

      // Reset form
      setNewPostData({ content: '', tags: '' });
      setCurrentLocation(null);
      setPostMedia([]);
      onClose();
    } catch (error) {
      toast.error(`Erro ao criar post: ${error.message}`);
    } finally {
      setIsCreatingPost(false);
    }
  };

  if (!isOpen) return null;

  return (
    <> {/* FIX: Add opening fragment tag */}
      <div className="modal-overlay" onClick={closeModal}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="modal-body">
            <div className="form-group">
              <label htmlFor="observacao">O que você observou hoje?</label>
              <textarea
                id="observacao"
                value={newPostData.content}
                onChange={(e) => setNewPostData({ ...newPostData, content: e.target.value })}
                placeholder="Descreva sua observação..."
                rows={3}
                autoFocus
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: '12px',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                  background: 'rgba(255, 255, 255, 0.1)',
                  color: '#FFFFFF',
                  resize: 'none',
                  fontFamily: 'inherit',
                  outline: 'none'
                }}
              />
            </div>

            {/* Botão de escolher mídia */}
            <div className="form-group">
              <label>Mídia</label>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                <MediaUpload onMediaUpdate={handleMediaUpdate} maxFiles={4} compact={true} />
                {postMedia.length > 0 && (
                  <span style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.7)' }}>
                    {postMedia.length} arquivo{postMedia.length > 1 ? 's' : ''} selecionado{postMedia.length > 1 ? 's' : ''}
                  </span>
                )}
              </div>
            </div>

            {/* Localização com dois botões */}
            <div className="form-group">
              <label>Localização</label>
              {currentLocation ? (
                <div className="location-selected">
                  <div style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    borderRadius: '12px',
                    padding: '12px 16px',
                    marginBottom: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <span style={{ color: '#90EE90' }}>📍</span>
                    <span style={{ color: '#FFFFFF', fontSize: '14px' }}>
                      {typeof currentLocation.name === 'string' ? currentLocation.name : 'Localização selecionada'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={handleOpenMapSelector}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        background: '#4CAF50',
                        color: 'white',
                        border: 'none',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: '500',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      🗺️ Alterar Local
                    </button>
                    <button
                      type="button"
                      onClick={getQuickLocation}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        background: '#2196F3',
                        color: 'white',
                        border: 'none',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: '500',
                        cursor: locationLoading ? 'not-allowed' : 'pointer',
                        opacity: locationLoading ? 0.6 : 1,
                        transition: 'all 0.2s ease'
                      }}
                    >
                      {locationLoading ? '🔄 Obtendo...' : '📍 GPS Atual'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="location-buttons" style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: '12px',
                  padding: '12px 16px',
                  display: 'flex',
                  gap: '8px',
                  flexWrap: 'wrap'
                }}>
                  <button
                    type="button"
                    onClick={handleOpenMapSelector}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      background: '#4CAF50',
                      color: 'white',
                      border: 'none',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      flex: '1',
                      minWidth: '140px'
                    }}
                  >
                    🗺️ Selecionar no Mapa
                  </button>
                  <button
                    type="button"
                    onClick={getQuickLocation}
                    disabled={locationLoading}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      background: '#2196F3',
                      color: 'white',
                      border: 'none',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: locationLoading ? 'not-allowed' : 'pointer',
                      opacity: locationLoading ? 0.6 : 1,
                      transition: 'all 0.2s ease',
                      flex: '1',
                      minWidth: '100px'
                    }}
                  >
                    {locationLoading ? '🔄 Obtendo...' : '📍 GPS Atual'}
                  </button>
                </div>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="tags">Tags</label>
              <input
                type="text"
                id="tags"
                value={newPostData.tags}
                onChange={(e) => setNewPostData({ ...newPostData, tags: e.target.value })}
                placeholder="Ex: natureza, aves, manhã, trilha"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: '12px',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                  background: 'rgba(255, 255, 255, 0.1)',
                  color: '#FFFFFF',
                  fontFamily: 'inherit',
                  outline: 'none'
                }}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button
              onClick={closeModal}
              disabled={isCreatingPost}
              className="cancel-btn"
            >
              Cancelar
            </button>
            <button
              onClick={createPost}
              disabled={isCreatingPost || !newPostData.content.trim()}
              className="publish-btn"
            >
              {isCreatingPost ? 'Publicando...' : 'Publicar'}
            </button>
          </div>
        </div>
      </div>

      {/* Seletor de Localização com Mapa */}
      <LocationMapSelector
        isOpen={showMapSelector}
        onClose={() => setShowMapSelector(false)}
        onLocationSelect={handleLocationSelect}
        initialLocation={currentLocation?.coordinates}
        isDarkMode={isDarkMode}
      />

      <style jsx>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .modal-content {
          background: ${isDarkMode ? '#1a1a1a' : '#2F4F4F'};
          border-radius: 30px;
          padding: 0;
          width: 90%;
          max-width: 400px;
          max-height: 80vh;
          overflow-y: auto;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px;
          border-bottom: 1px solid #eee;
        }

        .modal-body {
          padding: 16px 20px;
        }

        .modal-footer {
          display: flex;
          justify-content: space-evenly;
          gap: 10px;
          padding: 20px;
          border-top: 1px solid #eee;
        }

        .close-btn {
          background: none;
          border: none;
          cursor: pointer;
          color: #666;
          padding: 8px;
          border-radius: 6px;
          transition: all 0.2s ease;
        }

        .close-btn:hover {
          background: #f5f5f5;
          color: #333;
        }

        .form-group {
          margin-bottom: 3px;
        }

        .form-group label {
          display: block;
          margin-bottom: 2px;
          font-weight: 600;
          color: #ffffff;
          font-size: 16px;
        }

        .species-tags {
          margin: 8px 0;
          padding: 8px;
          background: #f0f8f0;
          border-radius: 6px;
          font-size: 14px;
          color: #2d5a32;
        }

        .cancel-btn {
          background: #ffffff;
          border: 2px solid #e0e0e0;
          color: #666666;
          padding: 12px 24px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          transition: all 0.2s ease;
          min-width: 100px;
        }

        .cancel-btn:hover:not(:disabled) {
          background: #f8f9fa;
          border-color: #d0d0d0;
          color: #333333;
          transform: translateY(-1px);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .cancel-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }

        .publish-btn {
          background: #275736;
          color: white;
          border: #90EE90 2px solid;
          padding: 12px 24px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 600;
          transition: all 0.2s ease;
          min-width: 120px;
          box-shadow: 0 2px 4px rgba(76, 175, 80, 0.3);
        }

        .publish-btn:hover:not(:disabled) {
          background: linear-gradient(135deg, #45a049, #3e8e41);
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(76, 175, 80, 0.4);
        }

        .publish-btn:disabled {
          background: #cccccc;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }
          
        .refresh-btn:hover {
          background: rgba(74, 222, 128, 0.1) !important;
          border-radius: 4px;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg);}
      `}</style>
    </> // FIX: Add closing fragment tag
  );
}
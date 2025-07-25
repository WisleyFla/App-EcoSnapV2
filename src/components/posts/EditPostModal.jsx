// src/components/posts/EditPostModal.jsx
import React, { useState, useEffect } from 'react';
import { X, MapPin, Navigation, Camera, Trash2, Plus } from 'lucide-react';
import LocationPicker from './LocationPicker';
import MediaUpload from '../ui/MediaUpload';
import { postsService } from '../../services/postsService';
import './EditPostModal.css';

const EditPostModal = ({ post, isOpen, onClose, onSave }) => {
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
  const [location, setLocation] = useState(null);
  const [existingMedia, setExistingMedia] = useState([]);
  const [newMediaFiles, setNewMediaFiles] = useState([]);
  const [mediaToDelete, setMediaToDelete] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [showMediaUpload, setShowMediaUpload] = useState(false);

  useEffect(() => {
    if (post && isOpen) {
      setContent(post.content || '');
      setTags(post.tags ? post.tags.join(', ') : '');

      // Localização compatível com NewPostModal
      if (post.location) {
        setLocation({
          name: post.location,
          fullAddress: post.location,
          coordinates: {
            latitude: post.latitude,
            longitude: post.longitude
          }
        });
      } else {
        setLocation(null);
      }

      setExistingMedia(post.media || []);
      setNewMediaFiles([]);
      setMediaToDelete([]);
      setShowMediaUpload(false);
    }
  }, [post, isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setContent('');
      setTags('');
      setLocation(null);
      setExistingMedia([]);
      setNewMediaFiles([]);
      setMediaToDelete([]);
      setShowMediaUpload(false);
      setShowLocationPicker(false);
    }
  }, [isOpen]);

  if (!isOpen || !post) return null;

  const handleLocationChange = (newLocation) => {
    setLocation({
      name: newLocation.name,
      fullAddress: newLocation.fullAddress || newLocation.name,
      coordinates: {
        latitude: newLocation.latitude,
        longitude: newLocation.longitude
      }
    });
    setShowLocationPicker(false);
  };

  const handleMapSelection = () => setShowLocationPicker(true);

  const handleGPSLocation = async () => {
    if (!navigator.geolocation) {
      alert('Geolocalização não é suportada neste navegador');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setLocation({
          name: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
          fullAddress: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
          coordinates: { latitude, longitude }
        });
      },
      (error) => {
        console.error('Erro ao obter localização:', error);
        alert('Erro ao obter localização atual');
      }
    );
  };

  const handleDeleteExistingMedia = (mediaId) => {
    setMediaToDelete(prev => [...prev, mediaId]);
    setExistingMedia(prev => prev.filter(media => media.id !== mediaId));
  };

  const handleNewMediaFiles = (files) => {
    setNewMediaFiles(files);
    setShowMediaUpload(false);
  };

  const handleRemoveNewMedia = (index) => {
    setNewMediaFiles(prev => prev.filter((_, i) => i !== index));
  };

  const parseTagsAndSpecies = (text) => {
    return text.split(',').map(item => item.trim()).filter(item => item.length > 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    setIsSubmitting(true);

    try {
      const updateData = {
        content: content.trim(),
        tags: parseTagsAndSpecies(tags),
        ...(location && {
          location: location.fullAddress || location.name,
          latitude: location.coordinates?.latitude,
          longitude: location.coordinates?.longitude
        }),
        mediaToDelete,
        newMediaFiles
      };

      const updatedPost = await postsService.updatePost(post.id, updateData);
      onSave?.(updatedPost);
      onClose();
    } catch (error) {
      console.error('Erro ao atualizar post:', error);
      alert('Erro ao atualizar post: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalMediaCount = existingMedia.length + newMediaFiles.length;
  const canAddMoreMedia = totalMediaCount < 4;

  return (
    <>
      <div className="edit-modal-overlay" onClick={onClose}>
        <div className="edit-modal-container" onClick={(e) => e.stopPropagation()}>
          <div className="edit-modal-header">
            <h2 className="edit-modal-title">Editar Observação</h2>
            <button className="edit-close-btn" onClick={onClose}><X size={20} /></button>
          </div>

          <form onSubmit={handleSubmit} className="edit-modal-form">
            <div className="edit-form-group">
              <label className="edit-form-label">O que você observou?</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Compartilhe sua descoberta na natureza..."
                rows={4}
                required
                maxLength={500}
                className="edit-content-textarea"
              />
              <div className="edit-character-count">{content.length}/500</div>
            </div>

            <div className="edit-form-group">
              <label className="edit-form-label">Mídia ({totalMediaCount}/4)</label>
              {existingMedia.length > 0 && (
                <div className="edit-existing-media">
                  <h4 className="edit-media-section-title">Mídia atual</h4>
                  <div className="edit-media-grid">
                    {existingMedia.map(media => (
                      <div key={media.id} className="edit-media-item">
                        {media.type === 'image' ? (
                          <img src={media.url} alt="Mídia" className="edit-media-preview" />
                        ) : (
                          <video src={media.url} className="edit-media-preview" controls />
                        )}
                        <button type="button" onClick={() => handleDeleteExistingMedia(media.id)} className="edit-media-delete-btn"><Trash2 size={16} /></button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {newMediaFiles.length > 0 && (
                <div className="edit-new-media">
                  <h4 className="edit-media-section-title">Nova mídia</h4>
                  <div className="edit-media-grid">
                    {newMediaFiles.map((file, index) => (
                      <div key={index} className="edit-media-item">
                        {file.type.startsWith('image/') ? (
                          <img src={URL.createObjectURL(file)} alt="Nova mídia" className="edit-media-preview" />
                        ) : (
                          <video src={URL.createObjectURL(file)} className="edit-media-preview" controls />
                        )}
                        <button type="button" onClick={() => handleRemoveNewMedia(index)} className="edit-media-delete-btn"><Trash2 size={16} /></button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="edit-media-actions">
                {canAddMoreMedia && (
                  <button type="button" onClick={() => setShowMediaUpload(true)} className="edit-media-btn">
                    <Plus size={20} /> {totalMediaCount === 0 ? 'Adicionar Mídia' : 'Adicionar Mais'}
                  </button>
                )}
                {totalMediaCount > 0 && (
                  <button type="button" onClick={() => setShowMediaUpload(true)} className="edit-media-btn secondary" disabled={!canAddMoreMedia}>
                    <Camera size={20} /> Substituir Mídia
                  </button>
                )}
              </div>
            </div>

            <div className="edit-form-group">
              <label className="edit-form-label">Localização</label>
              {location ? (
                <div className="edit-location-selected">
                  <div className="edit-location-info">
                    <MapPin size={16} />
                    <span>{location.fullAddress || location.name || `${location.coordinates?.latitude}, ${location.coordinates?.longitude}`}</span>
                  </div>
                  <button type="button" onClick={() => setLocation(null)} className="edit-location-remove"><X size={16} /></button>
                </div>
              ) : (
                <div className="edit-location-buttons">
                  <button type="button" onClick={handleMapSelection} className="edit-location-btn map"><MapPin size={18} /> Selecionar no Mapa</button>
                  <button type="button" onClick={handleGPSLocation} className="edit-location-btn gps"><Navigation size={18} /> GPS Atual</button>
                </div>
              )}
            </div>

            <div className="edit-form-group">
              <label className="edit-form-label">Tags</label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="Ex: natureza, aves, manhã, trilha"
                className="edit-tags-input"
              />
            </div>

            <div className="edit-modal-footer">
              <button type="button" onClick={onClose} className="edit-cancel-btn" disabled={isSubmitting}>Cancelar</button>
              <button type="submit" className="edit-submit-btn" disabled={isSubmitting || !content.trim()}>{isSubmitting ? 'Salvando...' : 'Salvar Alterações'}</button>
            </div>
          </form>
        </div>
      </div>

      {showLocationPicker && (
        <LocationPicker onLocationChange={handleLocationChange} onClose={() => setShowLocationPicker(false)} isModal={true} />
      )}

      {showMediaUpload && (
        <div className="edit-modal-overlay" onClick={() => setShowMediaUpload(false)}>
          <div className="edit-modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="edit-modal-header">
              <h2 className="edit-modal-title">{newMediaFiles.length > 0 ? 'Substituir Mídia' : 'Adicionar Mídia'}</h2>
              <button className="edit-close-btn" onClick={() => setShowMediaUpload(false)}><X size={20} /></button>
            </div>
            <div className="edit-modal-form">
              <MediaUpload onFilesChange={handleNewMediaFiles} maxFiles={4 - existingMedia.length} initialFiles={newMediaFiles} />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default EditPostModal;

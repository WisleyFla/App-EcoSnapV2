// src/components/pages/part_Home/NewPostModal.jsx
import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { supabase } from '../../../lib/supabase';
import { telegramService } from '../../../services/telegramService';
import { X, Edit3, MapPin } from 'lucide-react';
import MediaUpload from '../../ui/MediaUpload';
import LocationMapSelector from '../../ui/LocationMapSelector';
import './NewPostModal.css';

export function NewPostModal({
  isOpen,
  onClose,
  onCreatePost,
  initialLocation,
  onGetQuickLocation,
  locationLoading
}) {
  // Estados do Formulário
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
  const [filesToUpload, setFilesToUpload] = useState([]);

  // Estados de UI e Localização
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(initialLocation);
  const [showMapSelector, setShowMapSelector] = useState(false);

  // Sincroniza o estado interno com a prop que vem do pai (Home)
  useEffect(() => {
    setCurrentLocation(initialLocation);
  }, [initialLocation]);

  // Limpa todos os estados quando o modal é fechado
  useEffect(() => {
    if (!isOpen) {
      setContent('');
      setTags('');
      setFilesToUpload([]);
      setCurrentLocation(null);
      setIsSubmitting(false);
    }
  }, [isOpen]);

  // Função principal para criar o post
  const handleSubmit = async () => {
    if (!content.trim()) {
      toast.error('O conteúdo do post não pode estar vazio!');
      return;
    }
    
    setIsSubmitting(true);
    const toastId = toast.loading('Criando post...');

    try {
      // 1. Criar o post no banco apenas com texto/metadados para obter um ID
      const tagsArray = tags ? tags.split(',').map(tag => tag.trim()).filter(Boolean) : [];
      const { data: { user } } = await supabase.auth.getUser();

      const { data: newPost, error: postError } = await supabase
        .from('posts')
        .insert({
          user_id: user.id,
          content: content.trim(),
          tags: tagsArray,
          location: currentLocation,
          media_urls: [],
        })
        .select()
        .single();
      
      if (postError) throw postError;

      // 2. Se houver arquivos, fazer o upload deles usando o ID do post
      let finalMediaUrls = [];
      if (filesToUpload.length > 0) {
        toast.loading('Enviando mídias...', { id: toastId });
        
        const uploadPromises = filesToUpload.map(file => {
          // Verifica se é vídeo e passa a informação para o serviço
          const isVideo = file.type.startsWith('video/');
          return telegramService.uploadMedia(
            file, 
            newPost.id, 
            content.trim(),
            isVideo
          );
        });
        
        const uploadResults = await Promise.all(uploadPromises);
        const successfulUploads = uploadResults.filter(r => r.success);
        
        if (successfulUploads.length < filesToUpload.length) {
          toast.error("Algumas mídias falharam ao enviar.");
        }
        finalMediaUrls = successfulUploads.map(r => r.download_url);
        
        // 3. Atualiza o post no banco com as URLs das mídias
        if (finalMediaUrls.length > 0) {
          const { error: updateError } = await supabase
            .from('posts')
            .update({ media_urls: finalMediaUrls })
            .eq('id', newPost.id);
          if (updateError) throw updateError;
        }
      }
      
      toast.dismiss(toastId);
      toast.success('Post criado com sucesso!');
      onCreatePost();
      onClose();

    } catch (error) {
      toast.dismiss(toastId);
      toast.error(`Erro ao criar post: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLocationSelect = (location) => {
    const locationName = location.name || 'Localização selecionada';
    setCurrentLocation({
      name: locationName,
      fullAddress: locationName, // <-- ADICIONADO: Garante a consistência dos dados
      source: 'MapSelector',    // <-- BÔNUS: Adiciona a origem do dado
      coordinates: { latitude: location.latitude, longitude: location.longitude },
    });
    setShowMapSelector(false);
  };

  const handleRemoveLocation = () => {
    setCurrentLocation(null);
    toast('Localização removida.');
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h3 className="modal-title">Nova Observação</h3>
            <button className="close-btn" onClick={onClose} aria-label="Fechar modal"><X size={20} /></button>
          </div>

          <div className="modal-body">
            <div className="form-group">
              <label htmlFor="observacao">O que você observou hoje?</label>
              <textarea
                id="observacao"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Compartilhe sua descoberta na natureza..."
                rows={4}
                autoFocus
              />
            </div>
            
            <div className="form-group">
              <label>Mídia</label>
              <MediaUpload onFilesChange={setFilesToUpload} maxFiles={4} />
            </div>

            <div className="form-group">
              <label>Localização</label>
              {currentLocation ? (
                <div className="location-selected">
                  <div className="location-display">
                    <span>📍</span>
                    <span>{currentLocation.name}</span>
                  </div>
                  <div className="location-change-actions">
                    <button type="button" onClick={() => setShowMapSelector(true)} className="location-action-btn change">
                      <Edit3 size={14} /> Alterar
                    </button>
                    <button type="button" onClick={handleRemoveLocation} className="location-action-btn remove">
                      <X size={14} /> Remover
                    </button>
                  </div>
                </div>
              ) : (
                <div className="location-buttons-container">
                  <button type="button" onClick={() => setShowMapSelector(true)} className="location-btn map">
                    <MapPin size={16} /> Selecionar no Mapa
                  </button>
                  <button type="button" onClick={onGetQuickLocation} disabled={locationLoading} className="location-btn gps">
                    {locationLoading ? 'Buscando...' : <><MapPin size={16} /> GPS Atual</>}
                  </button>
                </div>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="tags">Tags</label>
              <input
                type="text"
                id="tags"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="Ex: natureza, aves, manhã, trilha"
              />
            </div>
          </div>

          <div className="modal-footer">
            <button onClick={onClose} disabled={isSubmitting} className="cancel-btn">
              Cancelar
            </button>
            <button onClick={handleSubmit} disabled={isSubmitting || !content.trim()} className="publish-btn">
              {isSubmitting ? 'Publicando...' : 'Publicar'}
            </button>
          </div>
        </div>
      </div>

      <LocationMapSelector
        isOpen={showMapSelector}
        onClose={() => setShowMapSelector(false)}
        onLocationSelect={handleLocationSelect}
        initialLocation={currentLocation?.coordinates}
      />
    </>
  );
}
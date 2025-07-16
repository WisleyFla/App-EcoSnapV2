import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { postsService } from '../../../services/postsService';

// Componentes de UI e Ícones
import { X, Edit3, MapPin } from 'lucide-react';
import MediaUpload from '../../ui/MediaUpload';
import LocationMapSelector from '../../ui/LocationMapSelector';
import './NewPostModal.css';

// O 'communityId' é opcional. Se ele for passado, o post será associado a uma comunidade.
export function NewPostModal({
  isOpen,
  onClose,
  onCreatePost, // Função para ser chamada após o post ser criado com sucesso
  communityId = null,
  initialLocation,
  onGetQuickLocation,
  locationLoading
}) {

  // =============================================
  // ESTADOS DO COMPONENTE (State)
  // =============================================
  
  // Estados para os dados do formulário
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
  const [filesToUpload, setFilesToUpload] = useState([]);
  const [currentLocation, setCurrentLocation] = useState(initialLocation);

  // Estados para controlar a UI
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showMapSelector, setShowMapSelector] = useState(false);

  // Efeito que sincroniza a localização, caso ela venha de um componente pai
  useEffect(() => {
    setCurrentLocation(initialLocation);
  }, [initialLocation]);

  // Efeito que limpa o formulário sempre que o modal é fechado
  useEffect(() => {
    if (!isOpen) {
      setContent('');
      setTags('');
      setFilesToUpload([]);
      setCurrentLocation(null);
      setIsSubmitting(false); // Garante que o estado de 'submit' seja resetado
    }
  }, [isOpen]);


  // =============================================
  // FUNÇÕES DE AÇÃO (Event Handlers)
  // =============================================

  // Função principal para criar o post. Agora ela é bem mais simples.
  const handleSubmit = async () => {
    if (!content.trim()) {
      toast.error('O conteúdo do post não pode estar vazio!');
      return;
    }
    
    setIsSubmitting(true);
    try {
      // 1. Agrupa todos os dados do formulário em um único objeto
      const postData = {
        content,
        tags,
        filesToUpload,
        location: currentLocation,
        communityId // Passa o ID da comunidade para o serviço (será null se não existir)
      };

      // 2. Chama a função centralizada no nosso serviço, que faz todo o trabalho pesado
      const newPost = await postsService.createPost(postData);
      
      // 3. Informa o componente pai que o post foi criado com sucesso
      onCreatePost(newPost);
      onClose(); // Fecha o modal

    } catch (error) {
      // O toast de erro já é mostrado pelo serviço, então só logamos no console aqui
      console.error("Falha ao submeter o post a partir do modal:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Funções para gerenciar a seleção de localização no mapa
  const handleLocationSelect = (location) => {
    const locationName = location.name || 'Localização selecionada';
    setCurrentLocation({
      name: locationName,
      fullAddress: locationName,
      source: 'MapSelector',
      coordinates: { latitude: location.latitude, longitude: location.longitude },
    });
    setShowMapSelector(false);
  };

  const handleRemoveLocation = () => {
    setCurrentLocation(null);
    toast('Localização removida.');
  };


  // Se o modal não estiver aberto, não renderiza nada
  if (!isOpen) {
    return null;
  }

  // =============================================
  // RENDERIZAÇÃO DO COMPONENTE (JSX)
  // =============================================

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
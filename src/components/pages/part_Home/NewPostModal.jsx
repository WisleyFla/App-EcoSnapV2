import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { postsService } from '../../../services/postsService'; // A única dependência de serviço agora
import { X, Edit3, MapPin } from 'lucide-react';
import MediaUpload from '../../ui/MediaUpload';
import LocationMapSelector from '../../ui/LocationMapSelector';
import './NewPostModal.css';

// Adicionamos 'communityId' como uma prop opcional
export function NewPostModal({
  isOpen,
  onClose,
  onCreatePost, // Renomeado para onSuccess para consistência
  communityId = null,
  initialLocation,
  onGetQuickLocation,
  locationLoading
}) {
  // Estados do Formulário
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
  const [filesToUpload, setFilesToUpload] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(initialLocation);
  const [showMapSelector, setShowMapSelector] = useState(false);

  useEffect(() => {
    setCurrentLocation(initialLocation);
  }, [initialLocation]);

  // Limpa o formulário quando o modal é fechado
  useEffect(() => {
    if (!isOpen) {
      setContent('');
      setTags('');
      setFilesToUpload([]);
      setCurrentLocation(null);
    }
  }, [isOpen]);

  // A função de submit agora é muito mais simples
  const handleSubmit = async () => {
    if (!content.trim()) {
      toast.error('O conteúdo do post não pode estar vazio!');
      return;
    }
    
    setIsSubmitting(true);
    try {
      const postData = {
        content,
        tags,
        filesToUpload,
        location: currentLocation,
        communityId // Passa o ID da comunidade para o serviço
      };

      const newPost = await postsService.createPost(postData);
      onCreatePost(newPost); // Retorna o novo post para a página pai
      onClose(); // Fecha o modal

    } catch (error) {
      // O toast de erro já é mostrado pelo serviço, mas podemos adicionar um aqui se quisermos
      console.error("Falha ao submeter o post do modal:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Funções de localização (sem alteração)
  const handleLocationSelect = (location) => {
    const locationName = location.name || 'Localização selecionada';
    setCurrentLocation({ name: locationName, coordinates: { latitude: location.latitude, longitude: location.longitude } });
    setShowMapSelector(false);
  };
  const handleRemoveLocation = () => { setCurrentLocation(null); toast('Localização removida.'); };

  if (!isOpen) return null;

  return (
    // O JSX do modal (toda a parte visual) continua exatamente o mesmo.
    // Nenhuma alteração é necessária aqui.
    <>
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          {/* ... todo o seu JSX do modal, que já está correto ... */}
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
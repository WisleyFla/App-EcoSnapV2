// src/components/ui/MediaUpload.jsx
import React, { useState, useRef, useEffect } from 'react';
import { Camera, X, Image, Video, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import './MediaUpload.css';

const MediaUpload = ({ onFilesChange, maxFiles = 4, compactButton = false }) => {
  const [previews, setPreviews] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef(null);

  const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
  const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'video/mp4', 'video/quicktime'];

  const handleFileSelect = (selectedFiles) => {
    const filesArray = Array.from(selectedFiles);
    
    // Validação de tipo e tamanho
    const validFiles = filesArray.filter(file => {
      const isValidType = validTypes.some(type => file.type.startsWith(type.split('/')[0]));
      const isValidSize = file.size <= MAX_FILE_SIZE;
      
      if (!isValidType) {
        toast.error(`Tipo de arquivo não suportado: ${file.name}`);
      }
      if (!isValidSize) {
        toast.error(`Arquivo muito grande: ${file.name} (máximo ${MAX_FILE_SIZE/1024/1024}MB)`);
      }
      
      return isValidType && isValidSize;
    });

    const totalFiles = previews.length + validFiles.length;

    if (totalFiles > maxFiles) {
      toast.error(`Você pode enviar no máximo ${maxFiles} arquivos.`);
      validFiles.splice(maxFiles - previews.length);
    }

    const newPreviews = validFiles.map(file => ({
      file: file,
      previewUrl: URL.createObjectURL(file),
      id: `${file.name}-${file.lastModified}-${Math.random()}`
    }));

    const updatedPreviews = [...previews, ...newPreviews];
    setPreviews(updatedPreviews);
    onFilesChange(updatedPreviews.map(p => p.file));
  };

  const handleInputChange = async (e) => {
    if (e.target.files) {
      setIsLoading(true);
      try {
        await handleFileSelect(e.target.files);
      } finally {
        setIsLoading(false);
        e.target.value = '';
      }
    }
  };

  const removeFile = (idToRemove) => {
    const updatedPreviews = previews.filter(p => p.id !== idToRemove);
    setPreviews(updatedPreviews);
    
    const itemToRemove = previews.find(p => p.id === idToRemove);
    if (itemToRemove) {
      URL.revokeObjectURL(itemToRemove.previewUrl);
    }
    
    onFilesChange(updatedPreviews.map(p => p.file));
  };

  useEffect(() => {
    return () => {
      previews.forEach(p => URL.revokeObjectURL(p.previewUrl));
    };
  }, [previews]);

  return (
    <div className="media-upload-container">
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,video/*"
        onChange={handleInputChange}
        style={{ display: 'none' }}
        disabled={isLoading}
      />

      {previews.length > 0 && (
        <div className="media-preview-grid">
          {previews.map((item) => (
            <div key={item.id} className="media-preview-item">
              <button 
                className="remove-media-btn" 
                onClick={() => removeFile(item.id)}
                aria-label={`Remover ${item.file.name}`}
              >
                <X size={14} />
              </button>
              {item.file.type.startsWith('image/') ? (
                <img 
                  src={item.previewUrl} 
                  alt={`Pré-visualização de ${item.file.name}`}
                  className="media-preview-image" 
                />
              ) : (
                <div className="video-preview-container">
                  <video src={item.previewUrl} className="media-preview-image" />
                  <div className="video-icon-overlay"><Video size={20} /></div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {previews.length < maxFiles && (
        <button
          type="button"
          className={`upload-btn ${previews.length > 0 ? 'add-more' : 'main-action'} ${isLoading ? 'loading' : ''}`}
          onClick={() => fileInputRef.current.click()}
          disabled={isLoading}
          aria-label={previews.length > 0 ? 'Adicionar mais mídias' : 'Selecionar mídias'}
        >
          {isLoading ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <>
              <Camera size={16} />
              {previews.length > 0 ? 'Adicionar mais' : 'Escolher Mídia'}
            </>
          )}
        </button>
      )}
    </div>
  );
};

export default MediaUpload;
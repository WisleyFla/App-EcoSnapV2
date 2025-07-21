// src/components/ui/MediaUpload.jsx
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, X, Image, Video, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import './MediaUpload.css';

const MediaUpload = ({ 
  onFilesChange, 
  maxFiles = 4, 
  compactButton = false,
  accept = 'image/*,video/*',
  mode = 'default' // 'default' | 'avatar' | 'post'
}) => {
  const [previews, setPreviews] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef(null);

  // Configurações por modo
  const MODE_CONFIG = {
    avatar: {
      maxFiles: 1,
      maxSize: 2 * 1024 * 1024, // 2MB
      accept: 'image/jpeg,image/png,image/webp',
      types: ['image/jpeg', 'image/png', 'image/webp']
    },
    post: {
      maxFiles: 4,
      maxSize: 50 * 1024 * 1024, // 50MB
      accept: 'image/*,video/mp4,video/webm',
      types: ['image/jpeg', 'image/png', 'image/gif', 'video/mp4', 'video/webm']
    },
    default: {
      maxFiles,
      maxSize: 50 * 1024 * 1024, // 50MB
      accept,
      types: ['image/jpeg', 'image/png', 'image/gif', 'video/mp4', 'video/webm']
    }
  };

  const config = MODE_CONFIG[mode] || MODE_CONFIG.default;

  const validateFile = useCallback((file) => {
    const isValidType = config.types.some(type => file.type.startsWith(type.split('/')[0]));
    const isValidSize = file.size <= config.maxSize;

    if (!isValidType) {
      toast.error(`Tipo de arquivo não suportado. Formatos permitidos: ${config.types.join(', ')}`);
      return false;
    }

    if (!isValidSize) {
      toast.error(`Arquivo muito grande. Máximo ${config.maxSize/1024/1024}MB`);
      return false;
    }

    return true;
  }, [config]);

  const handleFileSelect = useCallback((selectedFiles) => {
    const filesArray = Array.from(selectedFiles);
    const validFiles = filesArray.filter(validateFile);

    if (validFiles.length === 0) return;

    const availableSlots = config.maxFiles - previews.length;
    const filesToAdd = validFiles.slice(0, availableSlots);

    if (filesToAdd.length < validFiles.length) {
      toast.error(`Você pode enviar no máximo ${config.maxFiles} arquivos.`);
    }

    const newPreviews = filesToAdd.map(file => ({
      file,
      previewUrl: URL.createObjectURL(file),
      id: crypto.randomUUID()
    }));

    setPreviews(prev => {
      const updated = mode === 'avatar' ? newPreviews : [...prev, ...newPreviews];
      return updated.slice(0, config.maxFiles);
    });

    onFilesChange(filesToAdd);
  }, [config.maxFiles, mode, onFilesChange, previews.length, validateFile]);

  const handleInputChange = async (e) => {
    if (e.target.files?.length) {
      setIsLoading(true);
      try {
        await handleFileSelect(e.target.files);
      } finally {
        setIsLoading(false);
        e.target.value = '';
      }
    }
  };

  const removeFile = useCallback((idToRemove) => {
    setPreviews(prev => {
      const updated = prev.filter(p => p.id !== idToRemove);
      onFilesChange(updated.map(p => p.file));
      return updated;
    });

    const item = previews.find(p => p.id === idToRemove);
    if (item) URL.revokeObjectURL(item.previewUrl);
  }, [onFilesChange, previews]);

  useEffect(() => {
    return () => {
      previews.forEach(p => URL.revokeObjectURL(p.previewUrl));
    };
  }, [previews]);

  const renderPreview = (item) => {
    const isImage = item.file.type.startsWith('image/');
    
    return (
      <div key={item.id} className="media-preview-item">
        <button 
          className="remove-media-btn" 
          onClick={() => removeFile(item.id)}
          aria-label={`Remover ${item.file.name}`}
        >
          <X size={14} />
        </button>
        
        {isImage ? (
          <img 
            src={item.previewUrl} 
            alt={`Pré-visualização ${mode === 'avatar' ? 'do avatar' : 'de mídia'}`}
            className={`media-preview-image ${mode === 'avatar' ? 'avatar-preview' : ''}`}
          />
        ) : (
          <div className="video-preview-container">
            <video src={item.previewUrl} className="media-preview-image" />
            <div className="video-icon-overlay"><Video size={20} /></div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`media-upload-container ${mode}-mode`}>
      <input
        ref={fileInputRef}
        type="file"
        multiple={mode !== 'avatar'}
        accept={config.accept}
        onChange={handleInputChange}
        style={{ display: 'none' }}
        disabled={isLoading || previews.length >= config.maxFiles}
      />

      {previews.length > 0 && (
        <div className={`media-preview-grid ${mode}-grid`}>
          {previews.map(renderPreview)}
        </div>
      )}

      {previews.length < config.maxFiles && (
        <button
          type="button"
          className={`upload-btn 
            ${previews.length > 0 ? 'add-more' : 'main-action'} 
            ${isLoading ? 'loading' : ''}
            ${compactButton ? 'compact' : ''}`}
          onClick={() => fileInputRef.current.click()}
          disabled={isLoading}
          aria-label={previews.length > 0 ? 'Adicionar mais mídias' : 'Selecionar mídias'}
        >
          {isLoading ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <>
              {mode === 'avatar' ? (
                <Image size={16} />
              ) : (
                <Camera size={16} />
              )}
              {previews.length > 0 ? 'Adicionar mais' : (
                mode === 'avatar' ? 'Escolher Avatar' : 'Escolher Mídia'
              )}
            </>
          )}
        </button>
      )}
    </div>
  );
};

export default MediaUpload;
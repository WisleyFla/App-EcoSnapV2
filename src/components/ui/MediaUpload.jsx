// src/components/ui/MediaUpload.jsx
import React, { useState, useRef, useEffect } from 'react';
import { Camera, X, Image, Video } from 'lucide-react';
import toast from 'react-hot-toast';
import './MediaUpload.css'; // Importando o novo arquivo de estilo

const MediaUpload = ({ onFilesChange, maxFiles = 4, compactButton = false }) => {
  const [previews, setPreviews] = useState([]);
  const fileInputRef = useRef(null);

  const handleFileSelect = (selectedFiles) => {
    const filesArray = Array.from(selectedFiles);
    const totalFiles = previews.length + filesArray.length;

    if (totalFiles > maxFiles) {
      toast.error(`Você pode enviar no máximo ${maxFiles} arquivos.`);
      filesArray.splice(maxFiles - previews.length); // Limita ao máximo permitido
    }

    const newPreviews = filesArray.map(file => ({
      file: file,
      previewUrl: URL.createObjectURL(file),
      id: `${file.name}-${file.lastModified}-${Math.random()}`
    }));

    const updatedPreviews = [...previews, ...newPreviews];
    setPreviews(updatedPreviews);
    
    const allFiles = updatedPreviews.map(p => p.file);
    onFilesChange(allFiles);
  };

  const handleInputChange = (e) => {
    if (e.target.files) {
      handleFileSelect(e.target.files);
    }
    e.target.value = '';
  };

  const removeFile = (idToRemove) => {
    const updatedPreviews = previews.filter(p => p.id !== idToRemove);
    setPreviews(updatedPreviews);
    
    const itemToRemove = previews.find(p => p.id === idToRemove);
    if (itemToRemove) {
      URL.revokeObjectURL(itemToRemove.previewUrl);
    }
    
    const allFiles = updatedPreviews.map(p => p.file);
    onFilesChange(allFiles);
  };

  useEffect(() => {
    return () => {
      previews.forEach(p => URL.revokeObjectURL(p.previewUrl));
    };
  }, []); // Limpa todos os previews ao desmontar

  return (
    <div className="media-upload-container">
      {/* Input de arquivo, sempre escondido */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,video/*"
        onChange={handleInputChange}
        style={{ display: 'none' }}
      />

      {/* Exibe o grid de prévias se houver arquivos */}
      {previews.length > 0 && (
        <div className="media-preview-grid">
          {previews.map((item) => (
            <div key={item.id} className="media-preview-item">
              <button className="remove-media-btn" onClick={() => removeFile(item.id)}>
                <X size={14} />
              </button>
              {item.file.type.startsWith('image/') ? (
                <img src={item.previewUrl} alt={item.file.name} className="media-preview-image" />
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

      {/* Botão de Upload: grande se não houver mídias, ou pequeno se já houver */}
      {previews.length < maxFiles && (
        <button
          type="button"
          className={`upload-btn ${previews.length > 0 ? 'add-more' : 'main-action'}`}
          onClick={() => fileInputRef.current.click()}
        >
          <Camera size={16} />
          {previews.length > 0 ? 'Adicionar mais' : 'Escolher Mídia'}
        </button>
      )}
    </div>
  );
};

export default MediaUpload;
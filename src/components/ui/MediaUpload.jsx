import React, { useState, useRef } from 'react';
import { Upload, X, Image, Video, Camera, Film } from 'lucide-react';
import toast from 'react-hot-toast';

const MediaUpload = ({ onMediaUpdate, maxFiles = 4, compact = false }) => {
  const [uploadedMedia, setUploadedMedia] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  // Tipos aceitos
  const acceptedTypes = {
    image: ['image/jpeg', 'image/png', 'image/webp'],
    video: ['video/mp4', 'video/mov', 'video/avi']
  };

  const maxSizes = {
    image: 10 * 1024 * 1024, // 10MB
    video: 50 * 1024 * 1024  // 50MB
  };

  // Validar arquivo
  const validateFile = (file) => {
    const isImage = acceptedTypes.image.includes(file.type);
    const isVideo = acceptedTypes.video.includes(file.type);
    
    if (!isImage && !isVideo) {
      throw new Error(`Tipo não suportado: ${file.type}`);
    }

    const maxSize = isImage ? maxSizes.image : maxSizes.video;
    if (file.size > maxSize) {
      const maxSizeMB = Math.round(maxSize / (1024 * 1024));
      throw new Error(`Arquivo muito grande. Máximo: ${maxSizeMB}MB`);
    }

    return { isImage, isVideo };
  };

  // Criar preview
  const createPreview = (file, type) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        resolve({
          file,
          preview: e.target.result,
          type: type.isImage ? 'image' : 'video',
          name: file.name,
          size: file.size,
          id: Date.now() + Math.random()
        });
      };
      reader.readAsDataURL(file);
    });
  };

  // Upload para Telegram
  const uploadToTelegram = async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      // Aqui você usaria seu serviço do Telegram
      // Por enquanto vou simular
      const response = await fetch('/api/telegram/upload', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) throw new Error('Erro no upload');
      
      const data = await response.json();
      return data.url; // URL pública do Telegram
    } catch (error) {
      console.error('Erro no upload:', error);
      // Fallback: usar preview local por enquanto
      return URL.createObjectURL(file);
    }
  };

  // Processar arquivos
  const processFiles = async (files) => {
    if (uploadedMedia.length + files.length > maxFiles) {
      toast.error(`Máximo ${maxFiles} arquivos por post`);
      return;
    }

    setUploading(true);
    const newMedia = [];

    try {
      for (const file of files) {
        // Validar
        const type = validateFile(file);
        
        // Criar preview
        const mediaItem = await createPreview(file, type);
        
        // Upload para Telegram (com progresso)
        toast.loading(`Enviando ${file.name}...`, { 
          id: `upload-${mediaItem.id}` 
        });
        
        const publicUrl = await uploadToTelegram(file);
        mediaItem.url = publicUrl;
        
        toast.success(`${file.name} enviado!`, { 
          id: `upload-${mediaItem.id}` 
        });
        
        newMedia.push(mediaItem);
      }

      const allMedia = [...uploadedMedia, ...newMedia];
      setUploadedMedia(allMedia);
      onMediaUpdate(allMedia);

    } catch (error) {
      toast.error(error.message);
    } finally {
      setUploading(false);
    }
  };

  // Handlers de drag & drop
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      processFiles(files);
    }
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      processFiles(files);
    }
  };

  const removeMedia = (id) => {
    const filtered = uploadedMedia.filter(item => item.id !== id);
    setUploadedMedia(filtered);
    onMediaUpdate(filtered);
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="media-upload-container">
      {/* Modo Compacto - Apenas Botão */}
      {compact ? (
        <div className="compact-upload">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,video/*"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />
          
          <button 
            type="button" 
            className="compact-upload-btn"
            onClick={openFileDialog}
            disabled={uploading}
          >
            {uploading ? (
              <>
                <div className="spinner-small" />
                Enviando...
              </>
            ) : (
              <>
                <Camera size={16} />
                Escolher Mídia
              </>
            )}
          </button>

          {/* Preview Compacto */}
          {uploadedMedia.length > 0 && (
            <div className="compact-preview">
              {uploadedMedia.slice(0, 3).map((item, index) => (
                <div key={item.id} className="compact-preview-item">
                  {item.type === 'image' ? (
                    <img src={item.preview} alt="" className="compact-thumb" />
                  ) : (
                    <div className="compact-thumb video-thumb">
                      <Video size={12} />
                    </div>
                  )}
                  <button
                    className="compact-remove-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeMedia(item.id);
                    }}
                  >
                    <X size={10} />
                  </button>
                </div>
              ))}
              {uploadedMedia.length > 3 && (
                <div className="compact-more">+{uploadedMedia.length - 3}</div>
              )}
            </div>
          )}
        </div>
      ) : (
        /* Modo Normal - Área Completa */
        <>
          {/* Área de Upload */}
          <div
            className={`upload-area ${dragActive ? 'drag-active' : ''} ${uploading ? 'uploading' : ''}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={openFileDialog}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,video/*"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />
            
            <div className="upload-content">
              {uploading ? (
                <div className="upload-loading">
                  <div className="spinner" />
                  <span>Enviando...</span>
                </div>
              ) : (
                <>
                  <div className="upload-icon">
                    <Upload size={32} />
                  </div>
                  <div className="upload-text">
                    <p><strong>Clique ou arraste</strong> para adicionar mídia</p>
                    <p className="upload-subtitle">
                      Imagens até 10MB • Vídeos até 50MB • Máximo {maxFiles} arquivos
                    </p>
                  </div>
                  <div className="upload-buttons">
                    <button type="button" className="upload-btn">
                      <Camera size={16} />
                      Fotos
                    </button>
                    <button type="button" className="upload-btn">
                      <Film size={16} />
                      Vídeos
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Preview das Mídias */}
          {uploadedMedia.length > 0 && (
            <div className="media-preview-grid">
              {uploadedMedia.map((item) => (
                <div key={item.id} className="media-preview-item">
                  <button
                    className="remove-media-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeMedia(item.id);
                    }}
                  >
                    <X size={16} />
                  </button>
                  
                  {item.type === 'image' ? (
                    <img 
                      src={item.preview} 
                      alt={item.name}
                      className="media-preview"
                    />
                  ) : (
                    <div className="video-preview">
                      <video 
                        src={item.preview} 
                        className="media-preview"
                        muted
                      />
                      <div className="video-overlay">
                        <Video size={24} />
                      </div>
                    </div>
                  )}
                  
                  <div className="media-info">
                    <span className="media-name">{item.name}</span>
                    <span className="media-size">
                      {(item.size / (1024 * 1024)).toFixed(1)}MB
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      <style jsx>{`
        .media-upload-container {
          margin-bottom: 16px;
        }

        .upload-area {
          border: 2px dashed #ddd;
          border-radius: 12px;
          padding: 24px;
          text-align: center;
          cursor: pointer;
          transition: all 0.3s ease;
          background: #fafafa;
        }

        .upload-area:hover {
          border-color: #4CAF50;
          background: #f0f8f0;
        }

        .upload-area.drag-active {
          border-color: #4CAF50;
          background: #e8f5e8;
          transform: scale(1.02);
        }

        .upload-area.uploading {
          border-color: #2196F3;
          background: #e3f2fd;
          pointer-events: none;
        }

        .upload-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
        }

        .upload-icon {
          color: #666;
        }

        .upload-text p {
          margin: 0;
          color: #333;
        }

        .upload-subtitle {
          font-size: 12px;
          color: #666;
        }

        .upload-buttons {
          display: flex;
          gap: 8px;
          margin-top: 8px;
        }

        .upload-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          background: white;
          border: 1px solid #ddd;
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .upload-btn:hover {
          background: #f5f5f5;
          border-color: #4CAF50;
        }

        .upload-loading {
          display: flex;
          align-items: center;
          gap: 12px;
          color: #2196F3;
        }

        .spinner {
          width: 20px;
          height: 20px;
          border: 2px solid transparent;
          border-top: 2px solid currentColor;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        .media-preview-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
          gap: 12px;
          margin-top: 16px;
        }

        .media-preview-item {
          position: relative;
          background: white;
          border-radius: 8px;
          overflow: hidden;
          border: 1px solid #eee;
        }

        .remove-media-btn {
          position: absolute;
          top: 6px;
          right: 6px;
          background: rgba(0, 0, 0, 0.7);
          color: white;
          border: none;
          border-radius: 50%;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          z-index: 2;
          transition: background 0.2s ease;
        }

        .remove-media-btn:hover {
          background: rgba(244, 67, 54, 0.8);
        }

        .media-preview {
          width: 100%;
          height: 80px;
          object-fit: cover;
          display: block;
        }

        .video-preview {
          position: relative;
        }

        .video-overlay {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: rgba(0, 0, 0, 0.6);
          color: white;
          border-radius: 50%;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .media-info {
          padding: 8px;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .media-name {
          font-size: 11px;
          color: #333;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .media-size {
          font-size: 10px;
          color: #666;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        /* Modo Compacto */
        .compact-upload {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .compact-upload-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          background: #4CAF50;
          color: white;
          border: none;
          padding: 8px 12px;
          border-radius: 6px;
          font-size: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
          white-space: nowrap;
        }

        .compact-upload-btn:hover:not(:disabled) {
          background: #45a049;
        }

        .compact-upload-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .spinner-small {
          width: 12px;
          height: 12px;
          border: 1px solid transparent;
          border-top: 1px solid currentColor;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        .compact-preview {
          display: flex;
          gap: 6px;
          align-items: center;
        }

        .compact-preview-item {
          position: relative;
        }

        .compact-thumb {
          width: 32px;
          height: 32px;
          border-radius: 4px;
          object-fit: cover;
          border: 1px solid #ddd;
        }

        .video-thumb {
          background: #f0f0f0;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #666;
        }

        .compact-remove-btn {
          position: absolute;
          top: -4px;
          right: -4px;
          background: #ff4444;
          color: white;
          border: none;
          border-radius: 50%;
          width: 16px;
          height: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-size: 10px;
        }

        .compact-more {
          width: 32px;
          height: 32px;
          border-radius: 4px;
          background: #f0f0f0;
          border: 1px solid #ddd;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          color: #666;
          font-weight: bold;
        }

        @media (max-width: 768px) {
          .upload-area {
            padding: 16px;
          }
          
          .media-preview-grid {
            grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
          }
        }
      `}</style>
    </div>
  );
};

export default MediaUpload;
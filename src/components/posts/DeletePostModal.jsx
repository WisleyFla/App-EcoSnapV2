// src/components/posts/DeletePostModal.jsx
import React, { useEffect } from 'react';
import { Trash2, X, AlertTriangle } from 'lucide-react';
import './DeletePostModal.css';

const DeletePostModal = ({ 
  isOpen, 
  onConfirm, 
  onCancel, 
  isDeleting = false,
  postContent = '' 
}) => {
  // Fechar com ESC
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen && !isDeleting) {
        onCancel();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Impedir scroll do body
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, isDeleting, onCancel]);

  // Não renderizar se não estiver aberto
  if (!isOpen) return null;

  // Clique no overlay para fechar
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget && !isDeleting) {
      onCancel();
    }
  };

  // Confirmar delete
  const handleConfirm = () => {
    if (isDeleting) return;
    onConfirm();
  };

  // Truncar conteúdo do post para preview
  const truncateContent = (content, maxLength = 100) => {
    if (!content || content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  return (
    <div className="delete-modal-overlay" onClick={handleOverlayClick}>
      <div className="delete-modal-container">
        {/* Header do Modal */}
        <div className="delete-modal-header">
          <div className="header-content">
            <div className="warning-icon">
              <AlertTriangle size={24} />
            </div>
            <h3 className="modal-title">Deletar Post</h3>
          </div>
          
          <button 
            className="close-button"
            onClick={onCancel}
            disabled={isDeleting}
            aria-label="Fechar modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Corpo do Modal */}
        <div className="delete-modal-body">
          {/* Ícone de alerta principal */}
          <div className="alert-icon">
            <Trash2 size={48} />
          </div>

          {/* Mensagem principal */}
          <div className="message-content">
            <p className="main-message">
              Tem certeza que deseja deletar este post?
            </p>
            
            {/* Preview do conteúdo do post */}
            {postContent && (
              <div className="post-preview">
                <span className="preview-label">Post:</span>
                <div className="preview-content">
                  "{truncateContent(postContent)}"
                </div>
              </div>
            )}
            
            <p className="warning-message">
              <strong>Esta ação não pode ser desfeita.</strong>
            </p>
          </div>
        </div>

        {/* Footer com ações */}
        <div className="delete-modal-footer">
          <button 
            className="cancel-button"
            onClick={onCancel}
            disabled={isDeleting}
          >
            Cancelar
          </button>
          
          <button 
            className="delete-button"
            onClick={handleConfirm}
            disabled={isDeleting}
          >
            <div className="button-content">
              {isDeleting ? (
                <>
                  <div className="loading-spinner" />
                  <span>Deletando...</span>
                </>
              ) : (
                <>
                  <Trash2 size={16} />
                  <span>Deletar Post</span>
                </>
              )}
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeletePostModal;
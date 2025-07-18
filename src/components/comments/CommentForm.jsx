import React, { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';

const CommentForm = ({ 
  postId,
  parentId = null,
  onSubmit,
  onCommentSubmit,
  onCancel,
  placeholder = "Adicione um comentário...",
  autoFocus = false,
  isReply = false
}) => {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const textareaRef = useRef(null);

  const submitHandler = onCommentSubmit || onSubmit;

  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [autoFocus]);

  const handleTextareaChange = (e) => {
    const value = e.target.value;
    setContent(value);
    setError('');

    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
  };

  const validateComment = (content) => {
    const trimmed = content.trim();
    
    if (trimmed.length === 0) {
      return { valid: false, error: 'Comentário não pode estar vazio' };
    }

    if (trimmed.length > 1000) {
      return { valid: false, error: 'Comentário muito longo (máximo 1000 caracteres)' };
    }

    return { valid: true, content: trimmed };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const validation = validateComment(content);
    if (!validation.valid) {
      setError(validation.error);
      return;
    }

    if (!submitHandler) {
      setError('Função de envio não definida');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const newComment = {
        id: Date.now(),
        content: validation.content,
        post_id: postId,
        parent_id: parentId,
        user_id: 'current-user-id',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        likes_count: 0,
        replies_count: 0,
        user_has_liked: false,
        profiles: {
          id: 'current-user-id',
          username: 'usuario_exemplo',
          full_name: 'Usuário Exemplo',
          avatar_url: null
        }
      };

      await submitHandler(newComment);
      setContent('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
      
      if (isReply && onCancel) {
        onCancel();
      }
    } catch (err) {
      setError(err.message || 'Erro ao enviar comentário');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSubmit(e);
    }
    
    if (e.key === 'Escape' && isReply && onCancel) {
      onCancel();
    }
  };

  const remainingChars = 1000 - content.length;
  const isNearLimit = remainingChars < 100;
  const isOverLimit = remainingChars < 0;

  return (
    <form onSubmit={handleSubmit} className="comment-form">
      <div className="comment-input-wrapper">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={handleTextareaChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={`comment-textarea ${error ? 'error' : ''}`}
          disabled={isSubmitting}
          rows={1}
          maxLength={1000}
        />
        
        {content.length > 0 && (
          <div className={`char-counter ${isNearLimit ? 'warning' : ''} ${isOverLimit ? 'error' : ''}`}>
            {remainingChars}
          </div>
        )}
      </div>

      {error && (
        <div className="comment-error">
          <svg className="error-icon" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </div>
      )}

      <div className="comment-actions">
        <div className="comment-hint">
          <span>Ctrl+Enter para enviar</span>
        </div>
        
        <div className="comment-buttons">
          {isReply && onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="cancel-btn"
              disabled={isSubmitting}
            >
              Cancelar
            </button>
          )}
          
          <button
            type="submit"
            className="submit-btn"
            disabled={isSubmitting || !content.trim() || isOverLimit}
          >
            {isSubmitting ? (
              <>
                <svg className="loading-spinner" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                </svg>
                Enviando...
              </>
            ) : (
              <>
                <Send size={14} />
                {isReply ? 'Responder' : 'Enviar'}
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  );
};

export default CommentForm;
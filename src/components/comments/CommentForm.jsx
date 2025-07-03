// src/components/comments/CommentForm.jsx
import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Send } from 'lucide-react';

const CommentForm = ({ 
  postId, 
  parentId = null, 
  onCommentSubmit, 
  onCancel,
  placeholder = "Escreva um comentário...",
  autoFocus = false 
}) => {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const textareaRef = useRef(null);

  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [autoFocus]);

  // Auto-resize do textarea
  const handleTextareaChange = (e) => {
    const value = e.target.value;
    setContent(value);
    setError('');

    // Auto-resize
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
  };

  const validateComment = (content) => {
    if (!content || typeof content !== 'string') {
      return { valid: false, error: 'Conteúdo é obrigatório' };
    }

    const trimmed = content.trim();
    if (trimmed.length === 0) {
      return { valid: false, error: 'Comentário não pode estar vazio' };
    }

    if (trimmed.length > 1000) {
      return { valid: false, error: 'Comentário muito longo (máximo 1000 caracteres)' };
    }

    if (trimmed.length < 2) {
      return { valid: false, error: 'Comentário muito curto (mínimo 2 caracteres)' };
    }

    return { valid: true, content: trimmed };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validar conteúdo
    const validation = validateComment(content);
    if (!validation.valid) {
      setError(validation.error);
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('Erro de autenticação');
        return;
      }

      const { data, error } = await supabase
        .from('comments')
        .insert({
          post_id: postId,
          user_id: user.id,
          content: validation.content,
          parent_id: parentId
        })
        .select('*')
        .single();

      if (error) throw error;
      
      // Buscar perfil separadamente para evitar erro de foreign key
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url')
        .eq('id', user.id)
        .single();

      const commentWithProfile = {
        ...data,
        profiles: profile || {
          id: user.id,
          username: 'usuario',
          full_name: 'Usuário',
          avatar_url: null
        }
      };
      
      // Limpar formulário
      setContent('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }

      // Notificar componente pai
      onCommentSubmit?.(commentWithProfile);
      
      // Se é uma resposta, cancelar após enviar
      if (parentId) {
        onCancel?.();
      }
    } catch (err) {
      setError(err.message || 'Erro ao enviar comentário');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e) => {
    // Enviar com Ctrl+Enter
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSubmit(e);
    }
    
    // Cancelar com Escape (apenas para respostas)
    if (e.key === 'Escape' && parentId) {
      onCancel?.();
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
        
        {/* Contador de caracteres */}
        {content.length > 0 && (
          <div className={`char-counter ${isNearLimit ? 'warning' : ''} ${isOverLimit ? 'error' : ''}`}>
            {remainingChars}
          </div>
        )}
      </div>

      {/* Mensagem de erro */}
      {error && (
        <div className="comment-error">
          <svg className="error-icon" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </div>
      )}

      {/* Ações do formulário */}
      <div className="comment-actions">
        <div className="comment-hint">
          <span>Ctrl+Enter para enviar</span>
        </div>
        
        <div className="comment-buttons">
          {parentId && (
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
              <Send size={14} />
            )}
          </button>
        </div>
      </div>
    </form>
  );
};

export default CommentForm;
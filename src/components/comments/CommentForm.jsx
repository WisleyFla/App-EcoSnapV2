import React, { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';
import { supabase } from '../../lib/supabase';

const CommentForm = ({ 
  postId,
  parentId = null,
  onSubmit,
  onCommentSubmit,
  onCancel,
  placeholder = "Adicione um comentário...",
  autoFocus = false,
  isReply = false,
  disabled = false
}) => {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const textareaRef = useRef(null);

  // Prioriza onCommentSubmit sobre onSubmit para manter compatibilidade
  const submitHandler = onCommentSubmit || onSubmit;

  // Carrega o usuário atual
  useEffect(() => {
    const getCurrentUser = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) {
          console.error('Erro ao obter usuário:', error);
          setError('Erro ao carregar dados do usuário');
          return;
        }
        setCurrentUser(user);
      } catch (err) {
        console.error('Erro ao carregar usuário:', err);
        setError('Erro ao carregar dados do usuário');
      }
    };

    getCurrentUser();
  }, []);

  // Auto focus no textarea quando solicitado
  useEffect(() => {
    if (autoFocus && textareaRef.current && currentUser) {
      textareaRef.current.focus();
    }
  }, [autoFocus, currentUser]);

  // Manipula mudanças no textarea
  const handleTextareaChange = (e) => {
    const value = e.target.value;
    setContent(value);
    setError(''); // Limpa erro quando usuário começa a digitar

    // Auto-resize do textarea
    const textarea = e.target;
    textarea.style.height = 'auto';
    const newHeight = Math.min(Math.max(textarea.scrollHeight, 40), 120);
    textarea.style.height = newHeight + 'px';
  };

  // Valida o conteúdo do comentário
  const validateComment = (content) => {
    const trimmed = content.trim();
    
    if (trimmed.length === 0) {
      return { valid: false, error: 'Comentário não pode estar vazio' };
    }

    if (trimmed.length < 1) {
      return { valid: false, error: 'Comentário muito curto' };
    }

    if (trimmed.length > 1000) {
      return { valid: false, error: 'Comentário muito longo (máximo 1000 caracteres)' };
    }

    // Verifica se não é apenas espaços em branco ou caracteres especiais
    if (!/\S/.test(trimmed)) {
      return { valid: false, error: 'Comentário deve conter pelo menos um caractere válido' };
    }

    return { valid: true, content: trimmed };
  };

  // Manipula o envio do formulário
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Verifica se há handler definido
    if (!submitHandler) {
      setError('Função de envio não definida');
      return;
    }

    // Verifica se usuário está logado
    if (!currentUser) {
      setError('Você precisa estar logado para comentar');
      return;
    }

    // Verifica se postId está presente
    if (!postId) {
      setError('ID do post não encontrado');
      return;
    }

    // Valida o conteúdo
    const validation = validateComment(content);
    if (!validation.valid) {
      setError(validation.error);
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      // Cria objeto do comentário com dados reais do usuário
      const commentData = {
        content: validation.content,
        post_id: postId,
        parent_id: parentId,
        user_id: currentUser.id
      };

      // Chama a função de envio passada como prop
      await submitHandler(commentData);

      // Limpa o formulário após sucesso
      setContent('');
      
      // Reset da altura do textarea
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
      
      // Se é uma resposta, cancela o formulário após envio
      if (isReply && onCancel) {
        onCancel();
      }
    } catch (err) {
      console.error('Erro ao enviar comentário:', err);
      const errorMessage = err.message || 'Erro ao enviar comentário. Tente novamente.';
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Manipula teclas especiais
  const handleKeyDown = (e) => {
    // Ctrl/Cmd + Enter para enviar
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSubmit(e);
    }
    
    // Escape para cancelar (apenas em respostas)
    if (e.key === 'Escape' && isReply && onCancel) {
      e.preventDefault();
      onCancel();
    }
  };

  // Calcula caracteres restantes
  const remainingChars = 1000 - content.length;
  const isNearLimit = remainingChars < 100;
  const isOverLimit = remainingChars < 0;

  // Se não há usuário logado, mostra prompt de login
  if (!currentUser) {
    return (
      <div className="comment-form login-prompt">
        <div className="login-message">
          <p>Você precisa estar logado para {isReply ? 'responder' : 'comentar'}.</p>
          {isReply && onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="cancel-btn"
            >
              Cancelar
            </button>
          )}
        </div>
      </div>
    );
  }

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
          disabled={isSubmitting || disabled}
          rows={1}
          maxLength={1000}
          aria-label={isReply ? "Escrever resposta" : "Escrever comentário"}
        />
        
        {/* Contador de caracteres */}
        {content.length > 0 && (
          <div className={`char-counter ${isNearLimit ? 'warning' : ''} ${isOverLimit ? 'error' : ''}`}>
            <span>{remainingChars}</span>
          </div>
        )}
      </div>

      {/* Exibição de erro */}
      {error && (
        <div className="comment-error" role="alert">
          <svg className="error-icon" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path 
              fillRule="evenodd" 
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" 
              clipRule="evenodd" 
            />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {/* Ações do formulário */}
      <div className="comment-actions">
        <div className="comment-hint">
          <span>Ctrl+Enter para enviar</span>
          {isReply && <span> • Esc para cancelar</span>}
        </div>
        
        <div className="comment-buttons">
          {/* Botão cancelar (apenas para respostas) */}
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
          
          {/* Botão enviar */}
          <button
            type="submit"
            className="submit-btn"
            disabled={
              isSubmitting || 
              disabled || 
              !content.trim() || 
              isOverLimit ||
              !currentUser ||
              !postId
            }
            aria-label={isReply ? "Enviar resposta" : "Enviar comentário"}
          >
            {isSubmitting ? (
              <>
                <svg 
                  className="loading-spinner" 
                  viewBox="0 0 20 20" 
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path 
                    fillRule="evenodd" 
                    d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" 
                    clipRule="evenodd" 
                  />
                </svg>
                <span>Enviando...</span>
              </>
            ) : (
              <>
                <Send size={14} aria-hidden="true" />
                <span>{isReply ? 'Responder' : 'Enviar'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  );
};

export default CommentForm;
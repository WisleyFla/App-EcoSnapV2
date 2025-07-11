// src/components/posts/PostCard.jsx
import React, { useState } from 'react';
import { MessageCircle, Repeat2, Heart, Share2, Trash2, MoreHorizontal } from 'lucide-react';
import CommentSection from '../comments/CommentSection';
import { useTheme } from '../../context/ThemeContext';
import './PostCard.css';

const PostCard = ({ 
  post, 
  currentUser, 
  onLike, 
  onDelete, 
  onToggleComments, 
  showComments = false 
}) => {
  const { isDarkMode } = useTheme();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Estado local para a contagem de comentários, inicializado com o valor do post
  const [commentsCount, setCommentsCount] = useState(Number(post.comments_count) || 0);

  const isOwner = currentUser && post.user_id === currentUser.id;

  // Função para incrementar a contagem de comentários
  const handleCommentAdded = () => {
    setCommentsCount(prevCount => prevCount + 1);
  };

  // Função para decrementar a contagem de comentários
  const handleCommentRemoved = () => {
    setCommentsCount(prevCount => Math.max(0, prevCount - 1));
  };

  // Formatação de tempo relativo
  const formatTimeAgo = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) {
      return 'agora';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `há ${minutes}min`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `há ${hours}h`;
    } else if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400);
      return `há ${days}d`;
    } else {
      return date.toLocaleDateString('pt-BR', {
        day: 'numeric',
        month: 'short'
      });
    }
  };

  // Renderizar localização de forma segura
  const renderLocation = () => {
    if (!post.location) return 'Localização não informada';
    if (typeof post.location === 'string') return post.location;
    if (typeof post.location === 'object') {
      return post.location.address || post.location.place_name || post.location.name || 'Localização não informada';
    }
    return 'Localização não informada';
  };

  // Confirmar delete
  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
    setShowMenu(false);
  };

  // Executar delete
  const handleDeleteConfirm = async () => {
    if (isDeleting) return;
    
    setIsDeleting(true);
    try {
      await onDelete(post.id);
      setShowDeleteConfirm(false);
    } catch (error) {
      console.error('Erro ao deletar:', error);
      alert(`Erro ao deletar: ${error.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  // Cancelar delete
  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false);
  };

  // Gerar avatar com iniciais
  const getAvatarInitials = () => {
    const name = post.profiles?.full_name || post.profiles?.username || 'U';
    return name.charAt(0).toUpperCase();
  };

  // Processar tags
  const renderTags = () => {
    if (!post.tags || !Array.isArray(post.tags) || post.tags.length === 0) return null;
    
    return (
      <div className="post-tags">
        {post.tags.filter(tag => typeof tag === 'string').map((tag, index) => (
          <span key={index} className="tag">#{tag}</span>
        ))}
      </div>
    );
  };

  // Renderizar mídia
  const renderMedia = () => {
    if (!post.media_urls || !Array.isArray(post.media_urls) || post.media_urls.length === 0) {
      return null;
    }

    const validUrls = post.media_urls.filter(url => url && typeof url === 'string');
    if (validUrls.length === 0) return null;

    if (validUrls.length === 1) {
      return (
        <div className="post-media">
          <div className="single-media">
            <img 
              src={validUrls[0]} 
              alt="Post media"
              className="media-image"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          </div>
        </div>
      );
    }

    return (
      <div className="post-media">
        <div className={`media-grid grid-${Math.min(validUrls.length, 4)}`}>
          {validUrls.slice(0, 4).map((url, index) => (
            <div key={index} className="media-item">
              <img 
                src={url} 
                alt={`Media ${index + 1}`}
                className="media-image"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
              {index === 3 && validUrls.length > 4 && (
                <div className="media-overlay">
                  +{validUrls.length - 4}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <>
      <article className="post-card" data-theme={isDarkMode ? 'dark' : 'light'}>
        {/* Header do Post */}
        <header className="post-header">
          <div className="post-avatar">
            <div className="avatar-circle">
              {getAvatarInitials()}
            </div>
          </div>
          
          <div className="post-author-info">
            <div className="author-name">
              {post.profiles?.full_name || post.profiles?.username || 'Usuário'}
            </div>
            <div className="author-handle">
              @{post.profiles?.username || 'usuario'}
            </div>
          </div>
          
          <div className="post-metadata">
            <time className="post-time" dateTime={post.created_at}>
              {formatTimeAgo(post.created_at)}
            </time>
            
            {/* Menu de opções (só para o dono) */}
            {isOwner && (
              <div className="post-menu">
                <button 
                  className="menu-trigger"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMenu(!showMenu);
                  }}
                  aria-label="Opções do post"
                >
                  <MoreHorizontal size={18} />
                </button>
                
                {showMenu && (
                  <div 
                    className="menu-dropdown"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowDeleteConfirm(true);
                        setShowMenu(false);
                      }}
                      className="menu-item delete-item"
                    >
                      <Trash2 size={16} />
                      Deletar
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </header>

        {/* Conteúdo do Post */}
        <div className="post-body">
          <div className="post-content">
            {post.content}
          </div>
          
          {renderTags()}
          {renderMedia()}
          
          <div className="post-location">
            <svg className="location-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
            <span>{renderLocation()}</span>
          </div>
        </div>

        {/* Ações do Post */}
        <footer className="post-actions">
          <button 
            className={`action-button like-button ${post.user_has_liked ? 'liked' : ''}`}
            onClick={() => onLike(post.id)}
            aria-label={post.user_has_liked ? 'Descurtir' : 'Curtir'}
          >
            <Heart size={18} fill={post.user_has_liked ? 'currentColor' : 'none'} />
            <span>{Number(post.likes_count) || 0}</span>
          </button>
          
          <button 
            className="action-button comment-button"
            onClick={() => onToggleComments(post.id)}
            aria-label="Comentários"
          >
            <MessageCircle size={18} />
            {/* Usando o estado local para exibir a contagem atualizada */}
            <span>{commentsCount}</span>
          </button>
          
          <button 
            className="action-button share-button"
            onClick={() => alert('Compartilhamento em breve!')}
            aria-label="Compartilhar"
          >
            <Share2 size={18} />
          </button>
          
          <button 
            className="action-button repost-button"
            onClick={() => alert('Repost em breve!')}
            aria-label="Repostar"
          >
            <Repeat2 size={18} />
          </button>
        </footer>

        {/* Seção de Comentários */}
        {showComments && (
          <div className="post-comments">
            {/* Passando as funções de callback para o CommentSection */}
            <CommentSection 
              postId={post.id}
              onCommentAdded={handleCommentAdded}
              onCommentRemoved={handleCommentRemoved}
            />
          </div>
        )}
      </article>

      {/* Modal de Confirmação de Delete */}
      {showDeleteConfirm && (
        <div className="modal-overlay" onClick={handleDeleteCancel}>
          <div className="delete-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Deletar Post</h3>
            </div>
            
            <div className="modal-body">
              <div className="delete-icon">
                <Trash2 size={48} color="#ef4444" />
              </div>
              <p>Tem certeza que deseja deletar este post?</p>
              <span className="warning-text">Esta ação não pode ser desfeita.</span>
            </div>
            
            <div className="modal-footer">
              <button 
                onClick={handleDeleteCancel}
                className="button-secondary"
                disabled={isDeleting}
              >
                Cancelar
              </button>
              <button 
                onClick={handleDeleteConfirm}
                className="button-danger"
                disabled={isDeleting}
              >
                <Trash2 size={16} />
                {isDeleting ? 'Deletando...' : 'Deletar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Overlay para fechar menu */}
      {showMenu && (
        <div 
          className="menu-overlay" 
          onClick={() => setShowMenu(false)}
        />
      )}
    </>
  );
};

export default PostCard;
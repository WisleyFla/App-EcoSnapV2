// src/components/feed/PostCard.jsx
import React, { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import './PostCard.css';

const PostCard = ({ 
  post, 
  onLike, 
  onComment, 
  onProfileClick,
  showComments = false 
}) => {
  const [imageError, setImageError] = useState(false);
  const [showFullContent, setShowFullContent] = useState(false);

  const formatTimeAgo = (dateString) => {
    try {
      return formatDistanceToNow(new Date(dateString), {
        addSuffix: true,
        locale: ptBR
      });
    } catch {
      return 'há algum tempo';
    }
  };

  const truncateContent = (content, maxLength = 150) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  const renderTags = (tags) => {
    if (!tags || tags.length === 0) return null;
    
    return (
      <div className="post-tags">
        {tags.map((tag, index) => (
          <span key={index} className="post-tag">
            #{tag}
          </span>
        ))}
      </div>
    );
  };

  const renderLocation = (location) => {
    if (!location || !location.address) return null;
    
    return (
      <div className="post-location">
        <svg className="location-icon" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
        </svg>
        <span>{location.address}</span>
      </div>
    );
  };

  const renderMedia = (mediaUrls) => {
    if (!mediaUrls || mediaUrls.length === 0) return null;

    return (
      <div className="post-media">
        {mediaUrls.map((url, index) => {
          const isVideo = url.includes('.mp4') || url.includes('.webm') || url.includes('.mov');
          
          if (isVideo) {
            return (
              <video 
                key={index}
                className="post-video"
                controls
                preload="metadata"
              >
                <source src={url} type="video/mp4" />
                Seu navegador não suporta vídeos.
              </video>
            );
          }

          return (
            <img
              key={index}
              src={url}
              alt={`Mídia do post ${index + 1}`}
              className="post-image"
              onError={() => setImageError(true)}
              style={{ display: imageError ? 'none' : 'block' }}
            />
          );
        })}
      </div>
    );
  };

  return (
    <article className="post-card">
      {/* Header do Post */}
      <header className="post-header">
        <div 
          className="post-author"
          onClick={() => onProfileClick?.(post.profiles?.id)}
        >
          <img
            src={post.profiles?.avatar_url || '/default-avatar.png'}
            alt={post.profiles?.full_name || post.profiles?.username}
            className="author-avatar"
            onError={(e) => {
              e.target.src = '/default-avatar.png';
            }}
          />
          <div className="author-info">
            <h3 className="author-name">
              {post.profiles?.full_name || post.profiles?.username}
            </h3>
            <p className="post-time">
              {formatTimeAgo(post.created_at)}
            </p>
          </div>
        </div>
        
        <button className="post-menu-btn" aria-label="Menu do post">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
          </svg>
        </button>
      </header>

      {/* Localização */}
      {renderLocation(post.location)}

      {/* Conteúdo do Post */}
      <div className="post-content">
        <p className="post-text">
          {showFullContent ? post.content : truncateContent(post.content)}
          {post.content.length > 150 && (
            <button 
              className="show-more-btn"
              onClick={() => setShowFullContent(!showFullContent)}
            >
              {showFullContent ? ' Ver menos' : ' Ver mais'}
            </button>
          )}
        </p>
        
        {/* Tags */}
        {renderTags(post.tags)}
        
        {/* Mídia */}
        {renderMedia(post.media_urls)}
      </div>

      {/* Footer com ações */}
      <footer className="post-footer">
        <div className="post-actions">
          <button 
            className={`action-btn like-btn ${post.user_has_liked ? 'liked' : ''}`}
            onClick={() => onLike?.(post.id)}
          >
            <svg viewBox="0 0 24 24" fill={post.user_has_liked ? 'currentColor' : 'none'} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            <span>{post.likes_count || 0}</span>
          </button>

          <button 
            className="action-btn comment-btn"
            onClick={() => onComment?.(post.id)}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <span>{post.comments_count || 0}</span>
          </button>

          <button className="action-btn share-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
            </svg>
          </button>
        </div>

        {/* Stats detalhadas se tiver curtidas */}
        {(post.likes_count > 0 || post.comments_count > 0) && (
          <div className="post-stats">
            {post.likes_count > 0 && (
              <span className="stat-item">
                {post.likes_count} curtida{post.likes_count !== 1 ? 's' : ''}
              </span>
            )}
            {post.comments_count > 0 && (
              <span className="stat-item">
                {post.comments_count} comentário{post.comments_count !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        )}
      </footer>
    </article>
  );
};

export default PostCard;
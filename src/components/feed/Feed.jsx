// src/components/feed/Feed.jsx
import React, { useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRealTimeFeed } from '../../hooks/useRealTimeFeed';
import PostCard from './PostCard';
import Loading from '../ui/Loading';
import './Feed.css';

const Feed = ({ userId = null, searchFilters = null }) => {
  const navigate = useNavigate();
  const observerRef = useRef();
  const loadingRef = useRef();
  
  const {
    posts,
    loading,
    error,
    hasMore,
    loadMore,
    toggleLike,
    refresh
  } = useRealTimeFeed(20);

  // Configurar Intersection Observer para infinite scroll
  const lastPostElementRef = useCallback(node => {
    if (loading) return;
    if (observerRef.current) observerRef.current.disconnect();
    
    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        loadMore();
      }
    }, {
      threshold: 0.1,
      rootMargin: '100px'
    });
    
    if (node) observerRef.current.observe(node);
  }, [loading, hasMore, loadMore]);

  // Handlers
  const handleLike = (postId) => {
    toggleLike(postId);
  };

  const handleComment = (postId) => {
    // TODO: Implementar abertura de modal de comentários
    console.log('Abrir comentários para post:', postId);
  };

  const handleProfileClick = (profileId) => {
    if (profileId) {
      navigate(`/profile/${profileId}`);
    }
  };

  const handleRefresh = () => {
    refresh();
  };

  // Pull to refresh para mobile
  useEffect(() => {
    let startY = 0;
    let currentY = 0;
    let pulling = false;

    const handleTouchStart = (e) => {
      if (window.scrollY === 0) {
        startY = e.touches[0].clientY;
        pulling = true;
      }
    };

    const handleTouchMove = (e) => {
      if (!pulling) return;
      currentY = e.touches[0].clientY;
      const pullDistance = currentY - startY;
      
      if (pullDistance > 80 && window.scrollY === 0) {
        // Visual feedback para pull to refresh
        document.body.style.overscrollBehavior = 'none';
      }
    };

    const handleTouchEnd = () => {
      if (!pulling) return;
      const pullDistance = currentY - startY;
      
      if (pullDistance > 120 && window.scrollY === 0) {
        handleRefresh();
      }
      
      pulling = false;
      document.body.style.overscrollBehavior = 'auto';
    };

    window.addEventListener('touchstart', handleTouchStart);
    window.addEventListener('touchmove', handleTouchMove);
    window.addEventListener('touchend', handleTouchEnd);

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, []);

  if (error) {
    return (
      <div className="feed-error">
        <div className="error-content">
          <svg className="error-icon" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
          <h3>Ops! Algo deu errado</h3>
          <p>{error}</p>
          <button onClick={handleRefresh} className="retry-btn">
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="feed-container">
      {/* Header com refresh */}
      <div className="feed-header">
        <h2>Feed</h2>
        <button onClick={handleRefresh} className="refresh-btn" disabled={loading}>
          <svg 
            className={`refresh-icon ${loading ? 'spinning' : ''}`}
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>

      {/* Loading inicial */}
      {loading && posts.length === 0 && (
        <div className="feed-loading">
          <Loading />
          <p>Carregando posts...</p>
        </div>
      )}

      {/* Lista de posts */}
      <div className="feed-content">
        {posts.length === 0 && !loading ? (
          <div className="empty-feed">
            <svg className="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <h3>Nenhum post ainda</h3>
            <p>Seja o primeiro a compartilhar algo incrível!</p>
            <button 
              onClick={() => navigate('/create-post')}
              className="create-first-post-btn"
            >
              Criar primeiro post
            </button>
          </div>
        ) : (
          <>
            {posts.map((post, index) => {
              // Adicionar ref ao último post para infinite scroll
              const isLastPost = index === posts.length - 1;
              
              return (
                <div
                  key={post.id}
                  ref={isLastPost ? lastPostElementRef : null}
                >
                  <PostCard
                    post={post}
                    onLike={handleLike}
                    onComment={handleComment}
                    onProfileClick={handleProfileClick}
                  />
                </div>
              );
            })}
            
            {/* Loading para mais posts */}
            {loading && posts.length > 0 && (
              <div ref={loadingRef} className="load-more-loading">
                <Loading size="small" />
                <span>Carregando mais posts...</span>
              </div>
            )}
            
            {/* Fim dos posts */}
            {!hasMore && posts.length > 0 && (
              <div className="end-of-feed">
                <p>🎉 Você chegou ao fim!</p>
                <p>Que tal criar um novo post?</p>
                <button 
                  onClick={() => navigate('/create-post')}
                  className="create-post-btn"
                >
                  Criar Post
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Botão flutuante para criar post */}
      <button 
        className="floating-create-btn"
        onClick={() => navigate('/create-post')}
        aria-label="Criar novo post"
      >
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
        </svg>
      </button>
    </div>
  );
};

export default Feed;
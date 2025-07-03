// src/components/feed/SimpleFeed.jsx
import React, { useState } from 'react';
import { useSuperSimpleFeed } from '../../hooks/useSuperSimpleFeed';

const SimpleFeed = () => {
  const { posts, loading, error, toggleLike, refresh } = useSuperSimpleFeed();
  const [selectedPostId, setSelectedPostId] = useState(null);

  const formatTimeAgo = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'agora';
    if (diffInHours < 24) return `há ${diffInHours}h`;
    return `há ${Math.floor(diffInHours / 24)}d`;
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '200px',
        flexDirection: 'column',
        gap: '12px'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '4px solid #f3f3f3',
          borderTop: '4px solid #10b981',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
        <p>Carregando posts...</p>
        <style>
          {`@keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }`}
        </style>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        padding: '20px', 
        textAlign: 'center',
        backgroundColor: '#fee2e2',
        border: '1px solid #fecaca',
        borderRadius: '8px',
        margin: '20px'
      }}>
        <h3 style={{ color: '#dc2626', margin: '0 0 8px 0' }}>❌ Erro</h3>
        <p style={{ color: '#7f1d1d', margin: '0 0 16px 0' }}>{error}</p>
        <button 
          onClick={refresh}
          style={{
            backgroundColor: '#dc2626',
            color: 'white',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Tentar Novamente
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '20px',
        paddingBottom: '16px',
        borderBottom: '1px solid #e5e7eb'
      }}>
        <h2 style={{ margin: 0, color: '#1f2937' }}>Feed EcoSnap</h2>
        <button 
          onClick={refresh}
          style={{
            backgroundColor: '#10b981',
            color: 'white',
            border: 'none',
            padding: '8px 12px',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          🔄 Atualizar
        </button>
      </div>

      {/* Posts */}
      {posts.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '40px',
          backgroundColor: '#f9fafb',
          borderRadius: '8px',
          border: '1px solid #e5e7eb'
        }}>
          <h3 style={{ color: '#6b7280' }}>📝 Nenhum post ainda</h3>
          <p style={{ color: '#9ca3af' }}>Seja o primeiro a postar!</p>
        </div>
      ) : (
        posts.map((post) => (
          <div
            key={post.id}
            style={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '12px',
              padding: '16px',
              marginBottom: '16px',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
            }}
          >
            {/* Header do Post */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              marginBottom: '12px' 
            }}>
              <img
                src={post.profiles?.avatar_url || '/default-avatar.png'}
                alt={post.profiles?.full_name || 'Avatar'}
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  backgroundColor: '#f3f4f6',
                  marginRight: '12px'
                }}
                onError={(e) => {
                  e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMjAiIGZpbGw9IiNmM2Y0ZjYiLz4KPGNpcmNsZSBjeD0iMjAiIGN5PSIxNiIgcj0iNiIgZmlsbD0iIzZiNzI4MCIvPgo8cGF0aCBkPSJNOCAzMmMwLTYuNjI3IDUuMzczLTEyIDEyLTEyczEyIDUuMzczIDEyIDEyIiBmaWxsPSIjNmI3MjgwIi8+Cjwvc3ZnPgo=';
                }}
              />
              <div>
                <h4 style={{ 
                  margin: '0 0 2px 0', 
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#1f2937'
                }}>
                  {post.profiles?.full_name || post.profiles?.username || 'Usuário'}
                </h4>
                <p style={{ 
                  margin: 0, 
                  fontSize: '12px',
                  color: '#6b7280'
                }}>
                  {formatTimeAgo(post.created_at)}
                </p>
              </div>
            </div>

            {/* Conteúdo */}
            <div style={{ marginBottom: '12px' }}>
              <p style={{ 
                margin: 0, 
                lineHeight: '1.5',
                color: '#374151'
              }}>
                {post.content}
              </p>
              
              {/* Tags */}
              {post.tags && post.tags.length > 0 && (
                <div style={{ marginTop: '8px' }}>
                  {post.tags.map((tag, index) => (
                    <span
                      key={index}
                      style={{
                        display: 'inline-block',
                        backgroundColor: '#dbeafe',
                        color: '#1e40af',
                        padding: '2px 6px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        marginRight: '6px',
                        marginTop: '4px'
                      }}
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Ações */}
            <div style={{ 
              display: 'flex', 
              gap: '16px',
              paddingTop: '8px',
              borderTop: '1px solid #f3f4f6'
            }}>
              <button
                onClick={() => toggleLike(post.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'none',
                  border: 'none',
                  color: post.user_has_liked ? '#ef4444' : '#6b7280',
                  cursor: 'pointer',
                  fontSize: '14px',
                  padding: '4px',
                  transition: 'color 0.2s ease'
                }}
              >
                {post.user_has_liked ? '❤️' : '🤍'} {post.likes_count || 0}
              </button>

              <button
                onClick={() => alert('Sistema de comentários será implementado em breve!')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'none',
                  border: 'none',
                  color: '#6b7280',
                  cursor: 'pointer',
                  fontSize: '14px',
                  padding: '4px'
                }}
              >
                💬 {post.comments_count || 0}
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default SimpleFeed;
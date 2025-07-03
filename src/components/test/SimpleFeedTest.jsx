// src/components/test/SimpleFeedTest.jsx
import React from 'react';
import { useSimpleFeed } from '../../hooks/useSimpleFeed';

const SimpleFeedTest = () => {
  const { posts, loading, error, refresh } = useSimpleFeed();

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h2>🔄 Carregando posts...</h2>
        <p>Testando conexão com Supabase</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: 'red' }}>
        <h2>❌ Erro</h2>
        <p><strong>Erro:</strong> {error}</p>
        <button onClick={refresh} style={{ 
          padding: '10px 20px', 
          marginTop: '10px',
          backgroundColor: '#ef4444',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer'
        }}>
          Tentar Novamente
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h2>✅ Feed Teste - {posts.length} posts encontrados</h2>
      
      <button 
        onClick={refresh}
        style={{ 
          padding: '10px 20px', 
          marginBottom: '20px',
          backgroundColor: '#10b981',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer'
        }}
      >
        🔄 Atualizar
      </button>

      {posts.length === 0 ? (
        <div style={{ 
          padding: '40px', 
          textAlign: 'center', 
          backgroundColor: '#f9fafb',
          borderRadius: '8px',
          border: '1px solid #e5e7eb'
        }}>
          <h3>📝 Nenhum post ainda</h3>
          <p>A conexão com o banco está funcionando, mas não há posts.</p>
          <p><strong>Próximo passo:</strong> Criar um post de teste no SQL</p>
        </div>
      ) : (
        <div>
          {posts.map((post) => (
            <div 
              key={post.id} 
              style={{ 
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                padding: '16px',
                marginBottom: '16px',
                backgroundColor: 'white'
              }}
            >
              <div style={{ marginBottom: '8px' }}>
                <strong>ID:</strong> {post.id.substring(0, 8)}...
              </div>
              <div style={{ marginBottom: '8px' }}>
                <strong>Conteúdo:</strong> {post.content}
              </div>
              <div style={{ marginBottom: '8px' }}>
                <strong>Data:</strong> {new Date(post.created_at).toLocaleString('pt-BR')}
              </div>
              <div style={{ 
                display: 'flex', 
                gap: '16px', 
                fontSize: '14px',
                color: '#6b7280'
              }}>
                <span>❤️ {post.likes_count || 0}</span>
                <span>💬 {post.comments_count || 0}</span>
                <span>👁️ {post.visibility}</span>
              </div>
              {post.tags && post.tags.length > 0 && (
                <div style={{ marginTop: '8px' }}>
                  <strong>Tags:</strong> {post.tags.join(', ')}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SimpleFeedTest;
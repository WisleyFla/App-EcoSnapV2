// src/components/pages/Home.jsx

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Home.css';

import { Home as HomeIcon, Users, Book, User, Sun, MessageCircle, Repeat2, Heart, Share2, Search, Plus, X, Map, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useSuperSimpleFeed } from '../../hooks/useSuperSimpleFeed';
import LocationMapSelector from '../ui/LocationMapSelector';
import MediaUpload from '../ui/MediaUpload';
import CommentSection from '../comments/CommentSection';
import PostCard from '../posts/PostCard';

function Home() {
  const { isDarkMode, toggleTheme } = useTheme();
  const { user } = useAuth();

  const { 
    posts, 
    loading, 
    error, 
    toggleLike: handleLikeAction, 
    createPost: handleCreatePost,
    deletePost: handleDeletePost, 
    refresh: refreshFeed 
  } = useSuperSimpleFeed();

  // Estados para novo post
  const [isCreatingPost, setIsCreatingPost] = useState(false);
  const [newPostModal, setNewPostModal] = useState(false);
  const [newPostData, setNewPostData] = useState({
    content: '',
    tags: ''
  });
  const [currentLocation, setCurrentLocation] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [showMapSelector, setShowMapSelector] = useState(false);
  const [postMedia, setPostMedia] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  
  const [openCommentsPostId, setOpenCommentsPostId] = useState(null);

  const [recommendedUsers, setRecommendedUsers] = useState([
    { id: 1, name: 'Carlos', handle: '@carlos_pesq', isFollowing: false },
    { id: 2, name: 'Sofia', handle: '@sofia_guia', isFollowing: true },
    { id: 3, name: 'Lucas', handle: '@lucas_dev', isFollowing: false },
  ]);

  // Função para lidar com upload de mídia
  const handleMediaUpdate = (mediaList) => {
    console.log('📁 Media recebida:', mediaList);
    const cleanMediaList = Array.isArray(mediaList) ? mediaList : [];
    setPostMedia(cleanMediaList);
  };

  // Função para lidar com seleção de localização do mapa
  const handleLocationSelect = (location) => {
    setCurrentLocation({
      name: location.name,
      fullAddress: `${location.name} (${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)})`,
      coordinates: {
        latitude: location.latitude,
        longitude: location.longitude
      },
      source: 'Mapa'
    });
    toast.success(`Local selecionado: ${location.name}`);
  };

  // Função para abrir seletor de mapa
  const handleOpenMapSelector = () => {
    setShowMapSelector(true);
  };

  // Função simplificada para obter localização atual (opcional)
  const getQuickLocation = async () => {
    if (!navigator.geolocation) {
      toast.error('Geolocalização não suportada pelo seu navegador');
      return;
    }

    setLocationLoading(true);
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        
        try {
          // Obter nome básico
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=16&addressdetails=1&accept-language=pt-BR`
          );
          
          let locationName = 'Localização atual';
          if (response.ok) {
            const data = await response.json();
            const address = data.address || {};
            locationName = address.village || address.town || address.suburb || 
                          address.neighbourhood || address.city || 'Localização atual';
          }
          
          setCurrentLocation({
            name: locationName,
            fullAddress: `${locationName} (GPS)`,
            coordinates: { latitude, longitude },
            accuracy: `${Math.round(accuracy)}m`,
            source: 'GPS'
          });
          
          setLocationLoading(false);
          toast.success('Localização atual obtida!');
        } catch (error) {
          setLocationLoading(false);
          toast.error('Erro ao obter detalhes da localização');
        }
      },
      (error) => {
        setLocationLoading(false);
        toast.error('Erro ao obter localização atual');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Função para criar novo post
  const createPost = async () => {
    if (!newPostData.content.trim()) {
      toast.error('O conteúdo do post não pode estar vazio!');
      return;
    }

    if (!user?.id) {
      toast.error('Você precisa estar logado para postar!');
      return;
    }

    try {
      setIsCreatingPost(true);
      
      console.log('🚀 Iniciando criação do post...');
      
      // Processar tags (separar por vírgula e limpar)
      const tags = newPostData.tags
        ? newPostData.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
        : [];

      // Preparar dados do post
      const postData = {
        content: newPostData.content.trim(),
        tags: tags,
        location: currentLocation || null,
        media_urls: postMedia || []
      };

      console.log('📝 Dados do post preparados:', postData);

      // Criar o post usando o hook
      await handleCreatePost(postData);
      
      console.log('✅ Post criado com sucesso!');
      toast.success('Post criado com sucesso! 🎉');
      
      // Limpar formulário
      setNewPostData({ content: '', tags: '' });
      setCurrentLocation(null);
      setPostMedia([]);
      setNewPostModal(false);
      
    } catch (error) {
      console.error('❌ Erro ao criar post:', error);
      toast.error(`Erro ao criar post: ${error.message}`);
    } finally {
      setIsCreatingPost(false);
    }
  };

  // Função para deletar post usando o componente
  const handleDelete = async (postId) => {
    try {
      await handleDeletePost(postId);
      toast.success('Post deletado com sucesso! 🗑️');
    } catch (error) {
      console.error('❌ Erro ao deletar post:', error);
      toast.error(`Erro ao deletar post: ${error.message}`);
    }
  };

  // Função para alternar tema
  const handleToggleTheme = () => {
    toggleTheme();
    toast.success(`Tema ${isDarkMode ? 'claro' : 'escuro'} ativado!`);
  };

  // Função para curtir post
  const handleLike = async (postId) => {
    if (!user?.id) {
      toast.error('Você precisa estar logado para curtir!');
      return;
    }

    try {
      await handleLikeAction(postId);
    } catch (error) {
      console.error('Erro ao curtir post:', error);
      toast.error('Erro ao curtir post');
    }
  };

  // Função para atualizar feed
  const handleRefreshFeed = async () => {
    try {
      setRefreshing(true);
      await refreshFeed();
      toast.success('Feed atualizado!');
    } catch (error) {
      console.error('Erro ao atualizar feed:', error);
      toast.error('Erro ao atualizar feed');
    } finally {
      setRefreshing(false);
    }
  };

  // Função para ABRIR/FECHAR comentários
  const handleToggleComments = (postId) => {
    setOpenCommentsPostId(prevId => (prevId === postId ? null : postId));
  };

  const handleNewPost = async () => {
    if (!user?.id) {
      toast.error('Você precisa estar logado para postar!');
      return;
    }
    
    setNewPostModal(true);
  };

  const closeModal = () => {
    setNewPostModal(false);
    setNewPostData({
      content: '',
      tags: ''
    });
    setCurrentLocation(null);
    setPostMedia([]);
  };

  // Loading inicial
  if (loading) {
    return (
      <main className="main-content">
        <div className="search-bar">
          <Search className="search-icon-bar" />
          <input type="text" className="search-input" placeholder="Buscar no EcoSnap..." />
        </div>
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--secondary-text-color)' }}>
          Carregando posts...
        </div>
      </main>
    );
  }

  // Mostrar erro se houver
  if (error) {
    return (
      <main className="main-content">
        <div className="search-bar">
          <Search className="search-icon-bar" />
          <input type="text" className="search-input" placeholder="Buscar no EcoSnap..." />
        </div>
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--secondary-text-color)' }}>
          <h3>❌ Erro ao carregar posts</h3>
          <p>{error}</p>
          <button onClick={handleRefreshFeed} style={{ 
            background: '#10b981', 
            color: 'white', 
            border: 'none', 
            padding: '8px 16px', 
            borderRadius: '6px', 
            cursor: 'pointer' 
          }}>
            Tentar Novamente
          </button>
        </div>
      </main>
    );
  }

  return (
    <>
      <nav className="sidebar">
        <ul className="nav-menu">
          <li className="nav-item">
            <Link to="/" className="nav-link active">
              <HomeIcon className="nav-icon" />
              Início
            </Link>
          </li>
          <li className="nav-item">
            <Link to="/profile" className="nav-link">
              <User className="nav-icon" />
              Perfil
            </Link>
          </li>
          <li className="nav-item">
            <Link to="/diary" className="nav-link">
              <Book className="nav-icon" />
              Diário
            </Link>
          </li>
          <li className="nav-item">
            <Link to="/communities" className="nav-link">
              <Users className="nav-icon" />
              Comunidades
            </Link>
          </li>
          <li className="nav-item">
            <button className="nav-link" id="themeBtn" title="Alterar tema" onClick={handleToggleTheme}>
              <Sun className="nav-icon" />
              Tema
            </button>
          </li>
        </ul>
      </nav>

      <main className="main-content">
        <div className="search-bar">
          <Search className="search-icon-bar" />
          <input type="text" className="search-input" placeholder="Buscar no EcoSnap..." />
          <button 
            className="refresh-btn" 
            onClick={handleRefreshFeed}
            disabled={refreshing}
            title="Atualizar feed"
            style={{ 
              marginLeft: '10px', 
              padding: '8px', 
              background: 'none', 
              border: 'none', 
              cursor: 'pointer',
              opacity: refreshing ? 0.5 : 1
            }}
          >
            🔄
          </button>
        </div>

        {/* Mostrar mensagem se não houver posts */}
        {posts.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '60px 20px', 
            color: 'var(--secondary-text-color)' 
          }}>
            <h3>Nenhum post ainda! 🌱</h3>
            <p>Seja o primeiro a compartilhar algo interessante sobre a natureza!</p>
            <p style={{ marginTop: '10px', fontSize: '14px', opacity: 0.7 }}>
              Use o botão + no canto inferior direito para criar um post
            </p>
          </div>
        ) : (
          /* Lista de posts usando PostCard */
          posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              currentUser={user}
              onLike={handleLike}
              onDelete={handleDelete}
              onToggleComments={handleToggleComments}
              showComments={openCommentsPostId === post.id}
            />
          ))
        )}
      </main>

      {/* Modal para novo post */}
      {newPostModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-body">
              <div className="form-group">
                <label htmlFor="observacao">O que você observou hoje?</label>
                <textarea
                  id="observacao"
                  value={newPostData.content}
                  onChange={(e) => setNewPostData({...newPostData, content: e.target.value})}
                  placeholder="Descreva sua observação..."
                  rows={3}
                  autoFocus
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    borderRadius: '12px',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                    background: 'rgba(255, 255, 255, 0.1)',
                    color: '#FFFFFF',
                    resize: 'none',
                    fontFamily: 'inherit',
                    outline: 'none'
                  }}
                />
              </div>

              {/* Botão de escolher mídia */}
              <div className="form-group">
                <label>Mídia</label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <MediaUpload onMediaUpdate={handleMediaUpdate} maxFiles={4} compact={true} />
                  {postMedia.length > 0 && (
                    <span style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.7)' }}>
                      {postMedia.length} arquivo{postMedia.length > 1 ? 's' : ''} selecionado{postMedia.length > 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              </div>

              {/* Localização com dois botões */}
              <div className="form-group">
                <label>Localização</label>
                {currentLocation ? (
                  <div className="location-selected">
                    <div style={{
                      background: 'rgba(255, 255, 255, 0.1)',
                      border: '1px solid rgba(255, 255, 255, 0.3)',
                      borderRadius: '12px',
                      padding: '12px 16px',
                      marginBottom: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <span style={{ color: '#90EE90' }}>📍</span>
                      <span style={{ color: '#FFFFFF', fontSize: '14px' }}>
                        {typeof currentLocation.name === 'string' ? currentLocation.name : 'Localização selecionada'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        type="button"
                        onClick={handleOpenMapSelector}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          background: '#4CAF50',
                          color: 'white',
                          border: 'none',
                          padding: '8px 12px',
                          borderRadius: '8px',
                          fontSize: '12px',
                          fontWeight: '500',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        🗺️ Alterar Local
                      </button>
                      <button
                        type="button"
                        onClick={getQuickLocation}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          background: '#2196F3',
                          color: 'white',
                          border: 'none',
                          padding: '8px 12px',
                          borderRadius: '8px',
                          fontSize: '12px',
                          fontWeight: '500',
                          cursor: locationLoading ? 'not-allowed' : 'pointer',
                          opacity: locationLoading ? 0.6 : 1,
                          transition: 'all 0.2s ease'
                        }}
                      >
                        {locationLoading ? '🔄 Obtendo...' : '📍 GPS Atual'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="location-buttons" style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    borderRadius: '12px',
                    padding: '12px 16px',
                    display: 'flex',
                    gap: '8px',
                    flexWrap: 'wrap'
                  }}>
                    <button
                      type="button"
                      onClick={handleOpenMapSelector}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        background: '#4CAF50',
                        color: 'white',
                        border: 'none',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontWeight: '500',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        flex: '1',
                        minWidth: '140px'
                      }}
                    >
                      🗺️ Selecionar no Mapa
                    </button>
                    <button
                      type="button"
                      onClick={getQuickLocation}
                      disabled={locationLoading}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        background: '#2196F3',
                        color: 'white',
                        border: 'none',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontWeight: '500',
                        cursor: locationLoading ? 'not-allowed' : 'pointer',
                        opacity: locationLoading ? 0.6 : 1,
                        transition: 'all 0.2s ease',
                        flex: '1',
                        minWidth: '100px'
                      }}
                    >
                      {locationLoading ? '🔄 Obtendo...' : '📍 GPS Atual'}
                    </button>
                  </div>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="tags">Tags</label>
                <input
                  type="text"
                  id="tags"
                  value={newPostData.tags}
                  onChange={(e) => setNewPostData({...newPostData, tags: e.target.value})}
                  placeholder="Ex: natureza, aves, manhã, trilha"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    borderRadius: '12px',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                    background: 'rgba(255, 255, 255, 0.1)',
                    color: '#FFFFFF',
                    fontFamily: 'inherit',
                    outline: 'none'
                  }}
                />
              </div>
            </div>

            <div className="modal-footer">
              <button 
                onClick={closeModal} 
                disabled={isCreatingPost}
                className="cancel-btn"
              >
                Cancelar
              </button>
              <button 
                onClick={createPost} 
                disabled={isCreatingPost || !newPostData.content.trim()}
                className="publish-btn"
              >
                {isCreatingPost ? 'Publicando...' : 'Publicar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Seletor de Localização com Mapa */}
      <LocationMapSelector
        isOpen={showMapSelector}
        onClose={() => setShowMapSelector(false)}
        onLocationSelect={handleLocationSelect}
        initialLocation={currentLocation?.coordinates}
        isDarkMode={isDarkMode}
      />

      {/* Botão flutuante para novo post */}
      <div className="floating-buttons">
        <button className="post-btn" title="Nova postagem" onClick={handleNewPost}>
          <Plus size={24} />
        </button>
      </div>

      {/* CSS simplificado - só modal de criação */}
      <style jsx>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .modal-content {
          background: ${isDarkMode ? '#1a1a1a' : '#2F4F4F'};
          border-radius: 30px;
          padding: 0;
          width: 90%;
          max-width: 400px;
          max-height: 80vh;
          overflow-y: auto;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px;
          border-bottom: 1px solid #eee;
        }

        .modal-body {
          padding: 16px 20px;
        }

        .modal-footer {
          display: flex;
          justify-content: space-evenly;
          gap: 10px;
          padding: 20px;
          border-top: 1px solid #eee;
        }

        .close-btn {
          background: none;
          border: none;
          cursor: pointer;
          color: #666;
          padding: 8px;
          border-radius: 6px;
          transition: all 0.2s ease;
        }

        .close-btn:hover {
          background: #f5f5f5;
          color: #333;
        }

        .form-group {
          margin-bottom: 3px;
        }

        .form-group label {
          display: block;
          margin-bottom: 2px;
          font-weight: 600;
          color: #ffffff;
          font-size: 16px;
        }

        .species-tags {
          margin: 8px 0;
          padding: 8px;
          background: #f0f8f0;
          border-radius: 6px;
          font-size: 14px;
          color: #2d5a32;
        }

        .cancel-btn {
          background: #ffffff;
          border: 2px solid #e0e0e0;
          color: #666666;
          padding: 12px 24px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          transition: all 0.2s ease;
          min-width: 100px;
        }

        .cancel-btn:hover:not(:disabled) {
          background: #f8f9fa;
          border-color: #d0d0d0;
          color: #333333;
          transform: translateY(-1px);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .cancel-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }

        .publish-btn {
          background: #275736;
          color: white;
          border: #90EE90 2px solid;
          padding: 12px 24px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 600;
          transition: all 0.2s ease;
          min-width: 120px;
          box-shadow: 0 2px 4px rgba(76, 175, 80, 0.3);
        }

        .publish-btn:hover:not(:disabled) {
          background: linear-gradient(135deg, #45a049, #3e8e41);
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(76, 175, 80, 0.4);
        }

        .publish-btn:disabled {
          background: #cccccc;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }

        .post-btn {
          background-color: #ffffff;
          color: #275736;
          border: 2px solid #275736;
          width: 50px;
          height: 50px;
          border-radius: 50%;
          font-size: 24px;
          font-weight: bold;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .post-btn:hover {
          background-color: #f0f0f0;
          transform: scale(1.1);
        }

        .refresh-btn:hover {
          background: rgba(74, 222, 128, 0.1) !important;
          border-radius: 4px;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}

export default Home;
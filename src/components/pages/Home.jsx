import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Home.css';

import { Home as HomeIcon, Users, Book, User, Sun, MessageCircle, Repeat2, Heart, Share2, MapPin, Search, Plus, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { postsService } from '../../services/postsService';

function Home() {
  const { isDarkMode, toggleTheme } = useTheme();
  const { user } = useAuth();

  // Estados para posts
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Estados para novo post
  const [isCreatingPost, setIsCreatingPost] = useState(false);
  const [newPostModal, setNewPostModal] = useState(false);
  const [newPostData, setNewPostData] = useState({
    content: '',
    location: '',
    tags: '',
    species: '',
    weather: '',
    temperature: ''
  });

  const [recommendedUsers, setRecommendedUsers] = useState([
    { id: 1, name: 'Carlos', handle: '@carlos_pesq', isFollowing: false },
    { id: 2, name: 'Sofia', handle: '@sofia_guia', isFollowing: true },
    { id: 3, name: 'Lucas', handle: '@lucas_dev', isFollowing: false },
  ]);

  // Carregar posts quando componente monta
  useEffect(() => {
    loadPosts();
  }, []);

  // Função para carregar posts do Supabase
  const loadPosts = async () => {
    try {
      setLoading(true);
      const data = await postsService.getMainFeedPosts(20);
      setPosts(data);
    } catch (error) {
      console.error('Erro ao carregar posts:', error);
      toast.error('Erro ao carregar posts');
    } finally {
      setLoading(false);
    }
  };

  // Função para atualizar feed
  const refreshFeed = async () => {
    try {
      setRefreshing(true);
      const data = await postsService.getMainFeedPosts(20);
      setPosts(data);
      toast.success('Feed atualizado!');
    } catch (error) {
      console.error('Erro ao atualizar feed:', error);
      toast.error('Erro ao atualizar feed');
    } finally {
      setRefreshing(false);
    }
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

      // Processar tags e espécies
      const tags = newPostData.tags
        .split(',')
        .map(tag => tag.trim().replace('#', ''))
        .filter(Boolean);

      const species = newPostData.species
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);

      const postData = {
        content: newPostData.content,
        location: newPostData.location || null,
        tags: tags,
        species: species,
        weather: newPostData.weather || null,
        temperature: newPostData.temperature ? parseInt(newPostData.temperature) : null
      };

      const newPost = await postsService.createPost(postData, user.id);
      
      // Adicionar o novo post no topo da lista
      setPosts([newPost, ...posts]);
      
      // Limpar formulário
      setNewPostData({
        content: '',
        location: '',
        tags: '',
        species: '',
        weather: '',
        temperature: ''
      });
      
      setNewPostModal(false);
      toast.success('Post criado com sucesso!');
    } catch (error) {
      console.error('Erro ao criar post:', error);
      toast.error('Erro ao criar post. Tente novamente.');
    } finally {
      setIsCreatingPost(false);
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
      const result = await postsService.toggleLike(postId, user.id);
      
      // Atualizar estado local
      setPosts(prevPosts =>
        prevPosts.map(post =>
          post.id === postId
            ? { 
                ...post, 
                isLiked: result.liked,
                likes: result.liked ? post.likes + 1 : post.likes - 1
              }
            : post
        )
      );

      toast.success(result.liked ? 'Post curtido!' : 'Curtida removida!');
    } catch (error) {
      console.error('Erro ao curtir post:', error);
      toast.error('Erro ao curtir post');
    }
  };

  const handleFollow = (userId) => {
    setRecommendedUsers(prevUsers =>
      prevUsers.map(user =>
        user.id === userId
          ? { ...user, isFollowing: !user.isFollowing }
          : user
      )
    );
  };

  const handleNewPost = () => {
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
      location: '',
      tags: '',
      species: '',
      weather: '',
      temperature: ''
    });
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
            onClick={refreshFeed}
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
          /* Lista de posts reais */
          posts.map(post => (
            <div className="post" key={post.id}>
              <div className="post-header">
                <div className="avatar">
                  {post.username ? post.username.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="post-info">
                  <div className="username">{post.username}</div>
                  <div className="handle">{post.handle}</div>
                </div>
                <div className="post-time">{post.time}</div>
              </div>
              
              <div className="post-content">{post.content}</div>
              
              {post.hashtags && (
                <div className="hashtags">{post.hashtags}</div>
              )}
              
              {post.species && post.species.length > 0 && (
                <div className="species-tags">
                  <strong>Espécies identificadas:</strong> {post.species.join(', ')}
                </div>
              )}
              
              <div className="location">
                <MapPin className="location-icon" size={16} />
                {post.location}
              </div>

              <div className="post-actions">
                <button 
                  className="action-btn" 
                  onClick={() => toast.info('Comentários em breve!')}
                >
                  <MessageCircle size={16} />
                  {post.comments}
                </button>
                <button 
                  className="action-btn" 
                  onClick={() => toast.info('Compartilhamentos em breve!')}
                >
                  <Repeat2 size={16} />
                  {post.reposts}
                </button>
                <button 
                  className={`action-btn ${post.isLiked ? 'liked' : ''}`} 
                  onClick={() => handleLike(post.id)}
                >
                  <Heart size={16} fill={post.isLiked ? 'currentColor' : 'none'} />
                  {post.likes}
                </button>
                <button 
                  className="action-btn" 
                  onClick={() => toast.info('Compartilhar em breve!')}
                >
                  <Share2 size={16} />
                </button>
              </div>
            </div>
          ))
        )}
      </main>

      {/* Modal para novo post */}
      {newPostModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Novo Post</h3>
              <button onClick={closeModal} className="close-btn">
                <X size={20} />
              </button>
            </div>
            
            <div className="modal-body">
              <div className="form-group">
                <label>O que você observou hoje?</label>
                <textarea
                  value={newPostData.content}
                  onChange={(e) => setNewPostData({...newPostData, content: e.target.value})}
                  placeholder="Compartilhe sua descoberta na natureza..."
                  rows={4}
                  style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '6px' }}
                />
              </div>

              <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div className="form-group">
                  <label>Localização</label>
                  <input
                    type="text"
                    value={newPostData.location}
                    onChange={(e) => setNewPostData({...newPostData, location: e.target.value})}
                    placeholder="Ex: Trilha das Borboletas"
                    style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                  />
                </div>

                <div className="form-group">
                  <label>Tags</label>
                  <input
                    type="text"
                    value={newPostData.tags}
                    onChange={(e) => setNewPostData({...newPostData, tags: e.target.value})}
                    placeholder="Ex: natureza, aves, manhã"
                    style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Espécies Observadas</label>
                <input
                  type="text"
                  value={newPostData.species}
                  onChange={(e) => setNewPostData({...newPostData, species: e.target.value})}
                  placeholder="Ex: bem-te-vi, ipê-amarelo"
                  style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                />
              </div>

              <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div className="form-group">
                  <label>Clima</label>
                  <select
                    value={newPostData.weather}
                    onChange={(e) => setNewPostData({...newPostData, weather: e.target.value})}
                    style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                  >
                    <option value="">Selecione...</option>
                    <option value="ensolarado">☀️ Ensolarado</option>
                    <option value="nublado">☁️ Nublado</option>
                    <option value="chuvoso">🌧️ Chuvoso</option>
                    <option value="parcialmente-nublado">⛅ Parcialmente nublado</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Temperatura (°C)</label>
                  <input
                    type="number"
                    value={newPostData.temperature}
                    onChange={(e) => setNewPostData({...newPostData, temperature: e.target.value})}
                    placeholder="Ex: 25"
                    min="-10"
                    max="50"
                    style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                  />
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button onClick={closeModal} disabled={isCreatingPost}>
                Cancelar
              </button>
              <button 
                onClick={createPost} 
                disabled={isCreatingPost || !newPostData.content.trim()}
                style={{
                  background: '#4CAF50',
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '6px',
                  cursor: isCreatingPost ? 'not-allowed' : 'pointer',
                  opacity: isCreatingPost || !newPostData.content.trim() ? 0.6 : 1
                }}
              >
                {isCreatingPost ? 'Publicando...' : 'Publicar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Botão flutuante para novo post */}
      <div className="floating-buttons">
        <button className="post-btn" title="Nova postagem" onClick={handleNewPost}>
          <Plus size={24} />
        </button>
      </div>

      {/* CSS adicional para o modal */}
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
          background: white;
          border-radius: 12px;
          padding: 0;
          width: 90%;
          max-width: 600px;
          max-height: 90vh;
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
          padding: 20px;
        }

        .modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          padding: 20px;
          border-top: 1px solid #eee;
        }

        .close-btn {
          background: none;
          border: none;
          cursor: pointer;
          color: #666;
        }

        .form-group {
          margin-bottom: 15px;
        }

        .form-group label {
          display: block;
          margin-bottom: 5px;
          font-weight: 500;
          color: #333;
        }

        .species-tags {
          margin: 8px 0;
          padding: 8px;
          background: #f0f8f0;
          border-radius: 6px;
          font-size: 14px;
          color: #2d5a32;
        }

        .refresh-btn:hover {
          background: rgba(74, 222, 128, 0.1) !important;
          border-radius: 4px;
        }
      `}</style>
    </>
  );
}

export default Home;
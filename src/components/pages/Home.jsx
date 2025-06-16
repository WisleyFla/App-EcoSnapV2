import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './Home.css';

import { Home as HomeIcon, Users, Book, User, Sun, MessageCircle, Repeat2, Heart, Share2, MapPin, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTheme } from '../../context/ThemeContext'; // ADICIONADO: Import do contexto de tema

function Home() {
  // REMOVIDO: Todo o código de tema local (isDarkMode, setIsDarkMode, useEffect, toggleTheme)
  // ADICIONADO: Usa apenas o contexto de tema
  const { isDarkMode, toggleTheme } = useTheme();

  const [posts, setPosts] = useState([
    {
      id: 1,
      username: 'Maria Silva',
      handle: '@mariasilva_bio',
      time: 'há cerca de 2 horas',
      content: 'Hoje na aula de campo encontramos um Ipê-amarelo florido! É incrível como essa árvore simboliza a resistência do Cerrado. Suas flores aparecem justamente na época seca, mostrando a adaptação perfeita ao clima. 🌼',
      hashtags: '#cerrado #ipêamarelo #educacao #florada',
      location: 'Parque Nacional de Brasília',
      likes: 24,
      comments: 8,
      reposts: 3,
      isLiked: false,
    },
    {
      id: 2,
      username: 'João Costa',
      handle: '@joao_ecologo',
      time: 'há cerca de 4 horas',
      content: 'Observação importante: os pequis estão começando a amadurecer! Este é um dos frutos mais importantes do Cerrado, tanto ecologicamente quanto culturalmente. Quem já provou doce de pequi? 😋',
      hashtags: '#pequi #frutosdocerrado #cultura #alimentacao',
      location: 'Pirenópolis, GO',
      likes: 42,
      comments: 15,
      reposts: 7,
      isLiked: true,
    },
    {
      id: 3,
      username: 'Ana Santos',
      handle: '@ana_natureza',
      time: 'há cerca de 6 horas',
      content: 'Que descoberta incrível! Encontrei uma família de seriemas durante a trilha. Elas são aves símbolo do Cerrado e têm um canto muito característico. Consegui registrar o momento em que os filhotes aprendiam a caminhar! 🐦',
      hashtags: '#seriema #aves #fauna #cerrado #família',
      location: 'Chapada dos Veadeiros, GO',
      likes: 67,
      comments: 23,
      reposts: 12,
      isLiked: false,
    },
  ]);

  const [recommendedUsers, setRecommendedUsers] = useState([
    { id: 1, name: 'Carlos', handle: '@carlos_pesq', isFollowing: false },
    { id: 2, name: 'Sofia', handle: '@sofia_guia', isFollowing: true },
    { id: 3, name: 'Lucas', handle: '@lucas_dev', isFollowing: false },
  ]);

  // ALTERADO: Função simplificada que usa o contexto e mostra toast
  const handleToggleTheme = () => {
    toggleTheme();
    toast.success(`Tema ${isDarkMode ? 'claro' : 'escuro'} ativado!`);
  };

  const handleLike = (postId) => {
    setPosts(prevPosts =>
      prevPosts.map(post =>
        post.id === postId
          ? { ...post, isLiked: !post.isLiked, likes: post.isLiked ? post.likes - 1 : post.likes + 1 }
          : post
      )
    );
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
    toast.info('Funcionalidade de nova postagem em desenvolvimento!');
  };

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
            {/* ALTERADO: Usa a função do contexto */}
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
        </div>

        {posts.map(post => (
          <div className="post" key={post.id}>
            <div className="post-header">
              <div className="avatar">{post.username.charAt(0)}</div>
              <div className="post-info">
                <div className="username">{post.username}</div>
                <div className="handle">{post.handle}</div>
              </div>
              <div className="post-time">{post.time}</div>
            </div>
            <div className="post-content">{post.content}</div>
            <div className="hashtags">{post.hashtags}</div>
            <div className="location">
              <MapPin className="location-icon" size={16} />
              {post.location}
            </div>

            <div className="post-actions">
              <button className="action-btn" onClick={() => toast.info('Comentários em breve!')}>
                <MessageCircle size={16} />
                {post.comments}
              </button>
              <button className="action-btn" onClick={() => toast.info('Compartilhamentos em breve!')}>
                <Repeat2 size={16} />
                {post.reposts}
              </button>
              <button className={`action-btn ${post.isLiked ? 'liked' : ''}`} onClick={() => handleLike(post.id)}>
                <Heart size={16} fill={post.isLiked ? 'currentColor' : 'none'} />
                {post.likes}
              </button>
              <button className="action-btn" onClick={() => toast.info('Compartilhar em breve!')}>
                <Share2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </main>

      <div className="floating-buttons">
        <button className="post-btn" title="Nova postagem" onClick={handleNewPost}>
          +
        </button>
      </div>
    </>
  );
}

export default Home;
// src/hooks/useRealTimeFeed.js
import { useState, useEffect } from 'react';
import { getPosts, toggleLike, createPost } from '../services/postsService';

export const useRealTimeFeed = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Carregar posts inicialmente
  const loadPosts = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getPosts();
      setPosts(data);
    } catch (err) {
      setError(err.message);
      console.error('Erro ao carregar posts:', err);
    } finally {
      setLoading(false);
    }
  };

  // Curtir/descurtir post
  const handleToggleLike = async (postId) => {
    try {
      const result = await toggleLike(postId);
      
      // Atualizar estado local
      setPosts(prev => prev.map(post => {
        if (post.id === postId) {
          return {
            ...post,
            user_has_liked: result.liked,
            likes_count: result.liked 
              ? post.likes_count + 1 
              : Math.max(0, post.likes_count - 1)
          };
        }
        return post;
      }));

      return result;
    } catch (err) {
      console.error('Erro ao curtir post:', err);
      throw err;
    }
  };

  // Criar novo post
  const handleCreatePost = async (postData) => {
    try {
      const newPost = await createPost(postData);
      
      // Adicionar o novo post no início da lista
      setPosts(prev => [newPost, ...prev]);
      
      return newPost;
    } catch (err) {
      console.error('Erro ao criar post:', err);
      throw err;
    }
  };

  // Atualizar feed
  const refresh = async () => {
    await loadPosts();
  };

  // Carregar posts quando o hook for montado
  useEffect(() => {
    loadPosts();
  }, []);

  return {
    posts,
    loading,
    error,
    toggleLike: handleToggleLike,
    createPost: handleCreatePost,
    refresh
  };
};
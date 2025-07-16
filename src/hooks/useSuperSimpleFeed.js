import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export const useSuperSimpleFeed = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ▼▼▼ ESTA É A ÚNICA FUNÇÃO QUE FOI SIGNIFICATIVAMENTE MODIFICADA ▼▼▼
  // Ela agora filtra os posts de comunidade e é muito mais rápida,
  // fazendo uma única chamada ao banco de dados.
  const fetchPosts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select(`
          *,
          profiles:user_id (id, username, full_name, avatar_url),
          likes:likes(user_id),
          comments:comments(count)
        `)
        .is('community_id', null) // O filtro crucial para o feed principal
        .order('created_at', { ascending: false })
        .limit(20);

      if (postsError) {
        throw postsError;
      }
      
      const { data: { user } } = await supabase.auth.getUser();

      const processedPosts = postsData ? postsData.map(post => {
        const likesData = post.likes || [];
        const userHasLiked = user ? likesData.some(like => like.user_id === user.id) : false;
        
        return {
          ...post,
          profiles: post.profiles || {}, // Garante que profiles nunca seja nulo
          likes_count: likesData.length,
          comments_count: post.comments[0]?.count || 0,
          user_has_liked: userHasLiked,
        };
      }) : [];

      setPosts(processedPosts);
      console.log('✅ Posts do feed principal carregados com filtro:', processedPosts.length);

    } catch (err) {
      console.error('❌ Erro ao buscar posts no useSuperSimpleFeed:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);
  // ▲▲▲ O RESTO DO SEU CÓDIGO FOI MANTIDO COMO ESTAVA ORIGINALMENTE ▲▲▲


  // Sua função original de criar post
  const createPost = async (postData) => {
    try {
      console.log('🚀 Criando post:', postData);
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) throw new Error('Usuário não autenticado');
      const postToInsert = { user_id: user.id, content: postData.content, tags: postData.tags || [], media_urls: (postData.media_urls || []).map(media => (typeof media === 'string') ? media : (media.url || media.preview) || null).filter(url => url) };
      if (postData.location && postData.location.coordinates) postToInsert.location = { lat: postData.location.coordinates.latitude, lng: postData.location.coordinates.longitude, address: postData.location.name || 'Localização', place_name: postData.location.name || 'Localização' };
      console.log('📝 Dados a inserir:', postToInsert);
      const { data, error } = await supabase.from('posts').insert(postToInsert).select('*').single();
      if (error) { console.error('❌ Erro ao inserir:', error); throw error; }
      console.log('✅ Post criado:', data);
      await fetchPosts();
      return data;
    } catch (err) {
      console.error('❌ Erro ao criar post:', err);
      throw err;
    }
  };

  // Sua função original de curtir
  const toggleLike = async (postId) => {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) throw new Error('Usuário não autenticado');
      console.log('❤️ Alternando curtida:', postId);
      const { data: existingLike } = await supabase.from('likes').select('id').eq('post_id', postId).eq('user_id', user.id).maybeSingle();
      const isCurrentlyLiked = !!existingLike;
      if (isCurrentlyLiked) {
        const { error: deleteError } = await supabase.from('likes').delete().eq('post_id', postId).eq('user_id', user.id);
        if (deleteError) throw deleteError;
        console.log('💔 Curtida removida');
      } else {
        const { error: insertError } = await supabase.from('likes').insert({ post_id: postId, user_id: user.id, created_at: new Date().toISOString() });
        if (insertError) throw insertError;
        console.log('❤️ Curtida adicionada');
      }
      setPosts(prevPosts => prevPosts.map(post => post.id === postId ? { ...post, likes_count: isCurrentlyLiked ? Math.max(0, post.likes_count - 1) : post.likes_count + 1, user_has_liked: !isCurrentlyLiked } : post));
      return { liked: !isCurrentlyLiked, action: isCurrentlyLiked ? 'unliked' : 'liked' };
    } catch (err) {
      console.error('❌ Erro ao curtir:', err);
      throw err;
    }
  };

  // Sua função original de deletar
  const deletePost = async (postId) => {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) throw new Error('Usuário não autenticado');
      console.log('🗑️ Deletando post:', postId);
      const { error } = await supabase.from('posts').delete().eq('id', postId).eq('user_id', user.id);
      if (error) { console.error('❌ Erro ao deletar:', error); throw error; }
      console.log('✅ Post deletado com sucesso');
      setPosts(prevPosts => prevPosts.filter(post => post.id !== postId));
      return true;
    } catch (err) {
      console.error('❌ Erro ao deletar post:', err);
      throw err;
    }
  };

  // Efeito para carregar os posts na inicialização
  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  // Retorna todas as suas funções originais
  return {
    posts,
    loading,
    error,
    createPost,
    deletePost,
    toggleLike,
    refresh: fetchPosts
  };
};
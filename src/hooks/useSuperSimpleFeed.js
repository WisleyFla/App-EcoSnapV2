// src/hooks/useSuperSimpleFeed.js
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export const useSuperSimpleFeed = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      setError(null);

      // 1. Buscar posts
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (postsError) throw postsError;

      if (!postsData || postsData.length === 0) {
        setPosts([]);
        return;
      }

      // 2. Buscar dados completos para cada post
      const postsWithDetails = await Promise.all(
        postsData.map(async (post) => {
          // Buscar perfil do autor
          const { data: profile } = await supabase
            .from('profiles')
            .select('id, username, full_name, avatar_url')
            .eq('id', post.user_id)
            .single();

          // Contar curtidas
          const { count: likesCount } = await supabase
            .from('likes')
            .select('*', { count: 'exact', head: true })
            .eq('post_id', post.id);

          // Contar comentários
          const { count: commentsCount } = await supabase
            .from('comments')
            .select('*', { count: 'exact', head: true })
            .eq('post_id', post.id);

          // Verificar se usuário atual curtiu
          const { data: { user } } = await supabase.auth.getUser();
          let userHasLiked = false;
          if (user) {
            const { data: likeData } = await supabase
              .from('likes')
              .select('id')
              .eq('post_id', post.id)
              .eq('user_id', user.id)
              .maybeSingle();
            userHasLiked = !!likeData;
          }

          return {
            ...post,
            profiles: profile || {
              id: post.user_id,
              username: 'usuario',
              full_name: 'Usuário',
              avatar_url: null
            },
            likes_count: Number(likesCount) || 0,
            comments_count: Number(commentsCount) || 0,
            user_has_liked: Boolean(userHasLiked),
            // Garantir que tags seja sempre um array de strings
            tags: Array.isArray(post.tags) ? post.tags.filter(tag => typeof tag === 'string') : [],
            // Garantir que media_urls seja sempre um array de URLs válidas
            media_urls: Array.isArray(post.media_urls) ? post.media_urls.map(url => {
              // Se a URL é uma string JSON, tentar extrair a URL real
              if (typeof url === 'string') {
                try {
                  const parsed = JSON.parse(url);
                  return parsed.url || parsed.preview || url;
                } catch {
                  return url;
                }
              }
              return url;
            }).filter(url => typeof url === 'string' && url.length > 0) : [],
          
          };
        })
      );

      setPosts(postsWithDetails);
      console.log('✅ Posts carregados:', postsWithDetails.length);

    } catch (err) {
      console.error('❌ Erro ao buscar posts:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Criar novo post
  const createPost = async (postData) => {
    try {
      console.log('🚀 Criando post:', postData);

      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error('Usuário não autenticado');
      }

      // Preparar dados do post
      const postToInsert = {
        user_id: user.id,
        content: postData.content,
        tags: postData.tags || [],
        media_urls: (postData.media_urls || []).map(media => {
          // Garantir que seja sempre uma URL string
          if (typeof media === 'string') return media;
          if (typeof media === 'object' && media.url) return media.url;
          if (typeof media === 'object' && media.preview) return media.preview;
          return null;
        }).filter(url => url && typeof url === 'string'),
        created_at: new Date().toISOString()
      };

      // Adicionar localização se fornecida
      if (postData.location && postData.location.coordinates) {
        postToInsert.location = {
          lat: postData.location.coordinates.latitude,
          lng: postData.location.coordinates.longitude,
          address: postData.location.name || 'Localização',
          place_name: postData.location.name || 'Localização'
        };
      }

      console.log('📝 Dados a inserir:', postToInsert);

      // Inserir no banco
      const { data, error } = await supabase
        .from('posts')
        .insert(postToInsert)
        .select('*')
        .single();

      if (error) {
        console.error('❌ Erro ao inserir:', error);
        throw error;
      }

      console.log('✅ Post criado:', data);
      
      // Recarregar lista
      await fetchPosts();
      
      return data;
    } catch (err) {
      console.error('❌ Erro ao criar post:', err);
      throw err;
    }
  };

  // Sistema de curtidas
  const toggleLike = async (postId) => {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        throw new Error('Usuário não autenticado');
      }

      console.log('❤️ Alternando curtida:', postId);

      // Verificar se já curtiu
      const { data: existingLike } = await supabase
        .from('likes')
        .select('id')
        .eq('post_id', postId)
        .eq('user_id', user.id)
        .maybeSingle();

      const isCurrentlyLiked = !!existingLike;

      if (isCurrentlyLiked) {
        // Remover curtida
        const { error: deleteError } = await supabase
          .from('likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id);

        if (deleteError) throw deleteError;
        console.log('💔 Curtida removida');
      } else {
        // Adicionar curtida
        const { error: insertError } = await supabase
          .from('likes')
          .insert({
            post_id: postId,
            user_id: user.id,
            created_at: new Date().toISOString()
          });

        if (insertError) throw insertError;
        console.log('❤️ Curtida adicionada');
      }

      // Atualizar estado local
      setPosts(prevPosts => 
        prevPosts.map(post => 
          post.id === postId 
            ? { 
                ...post, 
                likes_count: isCurrentlyLiked 
                  ? Math.max(0, post.likes_count - 1)
                  : post.likes_count + 1,
                user_has_liked: !isCurrentlyLiked
              }
            : post
        )
      );

      return { 
        liked: !isCurrentlyLiked, 
        action: isCurrentlyLiked ? 'unliked' : 'liked' 
      };

    } catch (err) {
      console.error('❌ Erro ao curtir:', err);
      throw err;
    }
  };

  // Deletar post
  const deletePost = async (postId) => {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        throw new Error('Usuário não autenticado');
      }

      console.log('🗑️ Deletando post:', postId);

      // Deletar post (só se for o dono)
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId)
        .eq('user_id', user.id); // Garantir que só o dono pode deletar

      if (error) {
        console.error('❌ Erro ao deletar:', error);
        throw error;
      }

      console.log('✅ Post deletado com sucesso');

      // Remover da lista local
      setPosts(prevPosts => prevPosts.filter(post => post.id !== postId));

      return true;
    } catch (err) {
      console.error('❌ Erro ao deletar post:', err);
      throw err;
    }
  };

  // Carregar posts na inicialização
  useEffect(() => {
    fetchPosts();
  }, []);

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
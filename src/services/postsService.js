// src/services/postsService.js
// Serviço para gerenciar posts no EcoSnap

import { supabase } from '../lib/supabase';

export const postsService = {
  // Buscar posts do feed principal (sem comunidade específica)
  async getMainFeedPosts(limit = 20) {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          users!posts_user_id_fkey (
            username,
            display_name,
            avatar_url,
            role
          ),
          reactions (
            count
          )
        `)
        .is('community_id', null) // SÓ posts do feed principal
        .eq('privacy', 'public')   // SÓ posts públicos
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      // Processar dados para o formato esperado pelo componente
      return data.map(post => ({
        id: post.id,
        username: post.users?.display_name || 'Usuário',
        handle: `@${post.users?.username || 'usuario'}`,
        time: this.formatTimeAgo(post.created_at),
        content: post.content,
        hashtags: post.tags ? post.tags.map(tag => `#${tag}`).join(' ') : '',
        location: post.location_name || 'Localização não informada',
        likes: post.likes_count || 0,
        comments: post.comments_count || 0,
        reposts: post.shares_count || 0,
        isLiked: false, // TODO: verificar se usuário atual curtiu
        latitude: post.latitude,
        longitude: post.longitude,
        species: post.species_identified || [],
        scientificNames: post.scientific_names || [],
        weather: post.weather_condition,
        temperature: post.temperature,
        difficulty: post.difficulty_level,
        isValidated: post.is_scientific_validated,
        validatedBy: post.validated_by,
        originalPost: post
      }));
    } catch (error) {
      console.error('Erro ao buscar posts:', error);
      throw error;
    }
  },

  // Criar novo post
  async createPost(postData, userId) {
    try {
      const { data, error } = await supabase
        .from('posts')
        .insert({
          user_id: userId,
          content: postData.content,
          community_id: null, // Feed principal
          privacy: 'public',
          location_name: postData.location,
          latitude: postData.latitude,
          longitude: postData.longitude,
          tags: postData.tags || [],
          species_identified: postData.species || [],
          scientific_names: postData.scientificNames || [],
          weather_condition: postData.weather,
          temperature: postData.temperature,
          difficulty_level: postData.difficulty || 1,
          category: 'community'
        })
        .select(`
          *,
          users!posts_user_id_fkey (
            username,
            display_name,
            avatar_url,
            role
          )
        `)
        .single();

      if (error) throw error;

      // Retornar no formato esperado
      return {
        id: data.id,
        username: data.users?.display_name || 'Usuário',
        handle: `@${data.users?.username || 'usuario'}`,
        time: 'agora',
        content: data.content,
        hashtags: data.tags ? data.tags.map(tag => `#${tag}`).join(' ') : '',
        location: data.location_name || 'Localização não informada',
        likes: 0,
        comments: 0,
        reposts: 0,
        isLiked: false,
        originalPost: data
      };
    } catch (error) {
      console.error('Erro ao criar post:', error);
      throw error;
    }
  },

  // Curtir/descurtir post
  async toggleLike(postId, userId) {
    try {
      // Verificar se já curtiu
      const { data: existingReaction } = await supabase
        .from('reactions')
        .select('id')
        .eq('post_id', postId)
        .eq('user_id', userId)
        .eq('type', 'like')
        .single();

      if (existingReaction) {
        // Já curtiu, então descurtir
        const { error } = await supabase
          .from('reactions')
          .delete()
          .eq('id', existingReaction.id);

        if (error) throw error;
        return { liked: false, action: 'unliked' };
      } else {
        // Não curtiu, então curtir
        const { error } = await supabase
          .from('reactions')
          .insert({
            post_id: postId,
            user_id: userId,
            type: 'like'
          });

        if (error) throw error;
        return { liked: true, action: 'liked' };
      }
    } catch (error) {
      console.error('Erro ao curtir post:', error);
      throw error;
    }
  },

  // Adicionar comentário
  async addComment(postId, userId, content) {
    try {
      const { data, error } = await supabase
        .from('comments')
        .insert({
          post_id: postId,
          user_id: userId,
          content: content
        })
        .select(`
          *,
          users!comments_user_id_fkey (
            username,
            display_name,
            avatar_url
          )
        `)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao adicionar comentário:', error);
      throw error;
    }
  },

  // Utilitário: Formatar tempo relativo
  formatTimeAgo(dateString) {
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) {
      return 'agora';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `há ${minutes} minuto${minutes > 1 ? 's' : ''}`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `há ${hours} hora${hours > 1 ? 's' : ''}`;
    } else if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400);
      return `há ${days} dia${days > 1 ? 's' : ''}`;
    } else {
      return date.toLocaleDateString('pt-BR', {
        day: 'numeric',
        month: 'short'
      });
    }
  },

  // Buscar posts por usuário
  async getUserPosts(userId, limit = 10) {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          users!posts_user_id_fkey (
            username,
            display_name,
            avatar_url,
            role
          )
        `)
        .eq('user_id', userId)
        .eq('privacy', 'public')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao buscar posts do usuário:', error);
      throw error;
    }
  },

  // Buscar posts por localização
  async getPostsByLocation(latitude, longitude, radius = 1000, limit = 20) {
    try {
      // Busca simples por agora - em produção usaria ST_DWithin do PostGIS
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          users!posts_user_id_fkey (
            username,
            display_name,
            avatar_url,
            role
          )
        `)
        .not('latitude', 'is', null)
        .not('longitude', 'is', null)
        .eq('privacy', 'public')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao buscar posts por localização:', error);
      throw error;
    }
  },

  // Buscar posts por espécie
  async getPostsBySpecies(species, limit = 20) {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          users!posts_user_id_fkey (
            username,
            display_name,
            avatar_url,
            role
          )
        `)
        .contains('species_identified', [species])
        .eq('privacy', 'public')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao buscar posts por espécie:', error);
      throw error;
    }
  }
};
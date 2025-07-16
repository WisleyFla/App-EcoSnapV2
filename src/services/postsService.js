// src/services/postsService.js
// Serviço para gerenciar posts no EcoSnap

import { supabase } from '../lib/supabase';

export const postsService = {
  // Buscar posts do feed principal (atualizado para nova estrutura)
  async getMainFeedPosts(limit = 20, offset = 0) {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          profiles!posts_user_id_fkey (
            id,
            username,
            full_name,
            avatar_url
          ),
          likes (count),
          comments (count)
        `)
        .eq('visibility', 'public')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      // Processar dados para o formato esperado pelo componente
      return data?.map(post => ({
        id: post.id,
        username: post.profiles?.full_name || post.profiles?.username || 'Usuário',
        handle: `@${post.profiles?.username || 'usuario'}`,
        time: this.formatTimeAgo(post.created_at),
        content: post.content,
        hashtags: post.tags ? post.tags.map(tag => `#${tag}`).join(' ') : '',
        location: post.location?.address || 'Localização não informada',
        likes: post.likes_count || 0,
        comments: post.comments_count || 0,
        reposts: 0, // Manter compatibilidade
        isLiked: false, // Será verificado separadamente
        latitude: post.location?.lat,
        longitude: post.location?.lng,
        media_urls: post.media_urls || [],
        tags: post.tags || [],
        originalPost: post,
        profiles: post.profiles
      })) || [];
    } catch (error) {
      console.error('Erro ao buscar posts:', error);
      throw error;
    }
  },

  Perfeito! Obrigado por enviar o arquivo. Analisando o seu NewPostModal.jsx, vejo que ele é bem completo, com upload de mídias e seleção de mapa. Reutilizá-lo é, sem dúvida, a decisão certa.

Para fazer essa integração funcionar da melhor forma e manter seu código organizado, vamos fazer o seguinte:

Centralizar a Lógica: Moveremos a lógica complexa de criação de post (que hoje está dentro do modal) para o seu postsService.js. Isso torna o serviço a única fonte de verdade para criar posts.

Simplificar o Modal: O NewPostModal.jsx ficará mais simples. Sua única responsabilidade será coletar os dados e chamar o serviço.

Integrar na Página: A CommunityDetail.jsx irá chamar o modal simplificado, passando o communityId necessário.

Passo 1: Centralizar a Lógica no postsService.js
Vamos substituir sua função createPost atual por esta versão mais completa, que contém toda a lógica que estava no seu modal, incluindo o upload de mídias.

Arquivo: src/services/postsService.js (Substitua a função createPost)

JavaScript

  // ... (outras funções do serviço)

  // -- NOVA VERSÃO COMPLETA DA FUNÇÃO createPost --
  async createPost(postData) {
    const toastId = toast.loading('Criando post...');
    
    try {
      // 1. Pega o usuário logado
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // 2. Cria o post inicial no banco para obter um ID
      const tagsArray = postData.tags ? postData.tags.split(',').map(tag => tag.trim()).filter(Boolean) : [];
      
      const { data: newPost, error: postError } = await supabase
        .from('posts')
        .insert({
          user_id: user.id,
          content: postData.content.trim(),
          tags: tagsArray,
          location: postData.location,
          media_urls: [], // Começa com array de mídias vazio
          community_id: postData.communityId || null, // Associa à comunidade, se houver
        })
        .select()
        .single();
      
      if (postError) throw postError;

      // 3. Se houver arquivos, faz o upload e atualiza o post
      let finalMediaUrls = [];
      if (postData.filesToUpload && postData.filesToUpload.length > 0) {
        toast.loading('Enviando mídias...', { id: toastId });
        
        // Usando o telegramService que você já tem
        const uploadPromises = postData.filesToUpload.map(file => {
          const isVideo = file.type.startsWith('video/');
          return telegramService.uploadMedia(file, newPost.id, postData.content.trim(), isVideo);
        });
        
        const uploadResults = await Promise.all(uploadPromises);
        const successfulUploads = uploadResults.filter(r => r.success);
        
        if (successfulUploads.length < postData.filesToUpload.length) {
          toast.error("Algumas mídias falharam ao enviar.");
        }
        finalMediaUrls = successfulUploads.map(r => r.download_url);
        
        // 4. Atualiza o post no banco com as URLs das mídias
        if (finalMediaUrls.length > 0) {
          const { error: updateError } = await supabase
            .from('posts')
            .update({ media_urls: finalMediaUrls })
            .eq('id', newPost.id);

          if (updateError) throw updateError;
          newPost.media_urls = finalMediaUrls; // Atualiza o objeto do post
        }
      }
      
      toast.dismiss(toastId);
      toast.success('Post criado com sucesso!');
      
      // 5. Retorna o post completo para a UI
      // Buscamos o perfil associado para ter todos os dados
      const { data: authorProfile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (profileError) throw profileError;

      return { ...newPost, profiles: authorProfile };

    } catch (error) {
      toast.dismiss(toastId);
      console.error('Erro ao criar post no serviço:', error);
      // Lança o erro para que o componente possa tratá-lo se necessário
      throw error; 
    }
  },
  
  // Curtir/descurtir post (atualizado)
  async toggleLike(postId, userId) {
    try {
      if (!userId) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Usuário não autenticado');
        userId = user.id;
      }

      // Verificar se já curtiu
      const { data: existingLike } = await supabase
        .from('likes')
        .select('id')
        .eq('post_id', postId)
        .eq('user_id', userId)
        .single();

      if (existingLike) {
        // Já curtiu, então descurtir
        const { error } = await supabase
          .from('likes')
          .delete()
          .eq('id', existingLike.id);

        if (error) throw error;
        return { liked: false, action: 'unliked' };
      } else {
        // Não curtiu, então curtir
        const { error } = await supabase
          .from('likes')
          .insert({
            post_id: postId,
            user_id: userId
          });

        if (error) throw error;
        return { liked: true, action: 'liked' };
      }
    } catch (error) {
      console.error('Erro ao curtir post:', error);
      throw error;
    }
  },

  // Verificar curtidas do usuário
  async checkUserLikes(userId, postIds) {
    try {
      if (!userId || !postIds.length) return new Set();

      const { data, error } = await supabase
        .from('likes')
        .select('post_id')
        .eq('user_id', userId)
        .in('post_id', postIds);

      if (error) throw error;
      return new Set(data?.map(like => like.post_id) || []);
    } catch (error) {
      console.error('Erro ao verificar curtidas:', error);
      return new Set();
    }
  },

  // Buscar posts do usuário para o perfil
  async getUserPosts(userId, limit = 12, offset = 0) {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          profiles!posts_user_id_fkey (
            id,
            username,
            full_name,
            avatar_url
          )
        `)
        .eq('user_id', userId)
        .eq('visibility', 'public')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro ao buscar posts do usuário:', error);
      throw error;
    }
  },

  // Buscar estatísticas do usuário
  async getUserStats(userId) {
    try {
      // Posts count
      const { count: postsCount, error: postsError } = await supabase
        .from('posts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('visibility', 'public');

      if (postsError) throw postsError;

      // Total likes recebidas
      const { data: likesData, error: likesError } = await supabase
        .from('likes')
        .select('id')
        .in('post_id', supabase
          .from('posts')
          .select('id')
          .eq('user_id', userId)
        );

      if (likesError) throw likesError;

      // Total comentários recebidos
      const { data: commentsData, error: commentsError } = await supabase
        .from('comments')
        .select('id')
        .in('post_id', supabase
          .from('posts')
          .select('id')
          .eq('user_id', userId)
        );

      if (commentsError) throw commentsError;

      return {
        posts: postsCount || 0,
        likes: likesData?.length || 0,
        comments: commentsData?.length || 0
      };
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
      return { posts: 0, likes: 0, comments: 0 };
    }
  },

  // NOVAS FUNCIONALIDADES DE BUSCA

  // Busca avançada de posts
  async searchPosts({
    searchTerm = '',
    tags = [],
    location = null,
    radius = 10, // km
    limit = 20,
    offset = 0
  }) {
    try {
      let query = supabase
        .from('posts')
        .select(`
          *,
          profiles!posts_user_id_fkey (
            id,
            username,
            full_name,
            avatar_url
          )
        `)
        .eq('visibility', 'public');

      // Busca por texto (full-text search)
      if (searchTerm.trim()) {
        query = query.textSearch('content', searchTerm, {
          type: 'websearch',
          config: 'portuguese'
        });
      }

      // Filtro por tags
      if (tags.length > 0) {
        query = query.overlaps('tags', tags);
      }

      // Filtro por localização
      if (location && location.lat && location.lng) {
        // Usar função SQL personalizada para busca geográfica
        query = query.rpc('search_posts_by_location', {
          search_lat: location.lat,
          search_lng: location.lng,
          radius_km: radius,
          search_text: searchTerm || null,
          filter_tags: tags.length > 0 ? tags : null
        });
      }

      const { data, error } = await query
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro na busca de posts:', error);
      throw error;
    }
  },

  // Buscar posts por tags populares
  async getPopularTags(limit = 10) {
    try {
      // Esta query seria otimizada em produção
      const { data, error } = await supabase
        .from('posts')
        .select('tags')
        .eq('visibility', 'public')
        .not('tags', 'is', null);

      if (error) throw error;

      // Contar tags manualmente
      const tagCounts = {};
      data?.forEach(post => {
        post.tags?.forEach(tag => {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
      });

      // Ordenar e retornar top tags
      return Object.entries(tagCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, limit)
        .map(([tag, count]) => ({ tag, count }));
    } catch (error) {
      console.error('Erro ao buscar tags populares:', error);
      return [];
    }
  },

  // Buscar posts próximos
  async getNearbyPosts(latitude, longitude, radius = 5, limit = 20) {
    try {
      const { data, error } = await supabase.rpc('get_nearby_posts', {
        user_lat: latitude,
        user_lng: longitude,
        radius_km: radius,
        max_results: limit
      });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro ao buscar posts próximos:', error);
      // Fallback para busca simples
      return this.getMainFeedPosts(limit);
    }
  },

  // Deletar post
  async deletePost(postId) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId)
        .eq('user_id', user.id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Erro ao deletar post:', error);
      throw error;
    }
  },

  // Utilitário: Formatar tempo relativo (mantido compatível)
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

  // Configurar subscription para posts em tempo real
  subscribeToFeed(callback) {
    const channel = supabase
      .channel('public:posts')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'posts',
          filter: 'visibility=eq.public'
        },
        async (payload) => {
          // Buscar dados completos do novo post
          const { data, error } = await supabase
            .from('posts')
            .select(`
              *,
              profiles!posts_user_id_fkey (
                id,
                username,
                full_name,
                avatar_url
              )
            `)
            .eq('id', payload.new.id)
            .single();

          if (!error && data) {
            callback({
              type: 'INSERT',
              post: data
            });
          }
        }
      )
      .subscribe();

    return channel;
  },

  // Remover subscription
  unsubscribeFromFeed(channel) {
    if (channel) {
      supabase.removeChannel(channel);
    }
  }
};
// src/services/commentsService.js
import { supabase } from '../lib/supabase';

export const commentsService = {
  // Buscar comentários de um post
  async getComments(postId) {
    try {
      const { data, error } = await supabase
        .from('comments')
        .select(`
          *,
          profiles!comments_user_id_fkey (
            id,
            username,
            full_name,
            avatar_url
          )
        `)
        .eq('post_id', postId)
        .is('parent_id', null) // Apenas comentários principais
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro ao buscar comentários:', error);
      throw error;
    }
  },

  // Buscar respostas de um comentário
  async getReplies(commentId) {
    try {
      const { data, error } = await supabase
        .from('comments')
        .select(`
          *,
          profiles!comments_user_id_fkey (
            id,
            username,
            full_name,
            avatar_url
          )
        `)
        .eq('parent_id', commentId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro ao buscar respostas:', error);
      throw error;
    }
  },

  // Criar novo comentário
  async createComment(postId, content, parentId = null) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('comments')
        .insert({
          post_id: postId,
          user_id: user.id,
          content: content.trim(),
          parent_id: parentId
        })
        .select(`
          *,
          profiles!comments_user_id_fkey (
            id,
            username,
            full_name,
            avatar_url
          )
        `)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao criar comentário:', error);
      throw error;
    }
  },

  // Deletar comentário
  async deleteComment(commentId) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Verificar se o comentário pertence ao usuário
      const { data: comment, error: fetchError } = await supabase
        .from('comments')
        .select('user_id')
        .eq('id', commentId)
        .single();

      if (fetchError) throw fetchError;
      if (comment.user_id !== user.id) {
        throw new Error('Você não tem permissão para deletar este comentário');
      }

      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Erro ao deletar comentário:', error);
      throw error;
    }
  },

  // Editar comentário
  async updateComment(commentId, newContent) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('comments')
        .update({ 
          content: newContent.trim(),
          updated_at: new Date().toISOString()
        })
        .eq('id', commentId)
        .eq('user_id', user.id) // Garantir que só o dono pode editar
        .select(`
          *,
          profiles!comments_user_id_fkey (
            id,
            username,
            full_name,
            avatar_url
          )
        `)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao editar comentário:', error);
      throw error;
    }
  },

  // Configurar subscription para comentários em tempo real
  subscribeToComments(postId, callback) {
    const channel = supabase
      .channel(`comments:${postId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'comments',
          filter: `post_id=eq.${postId}`
        },
        async (payload) => {
          // Buscar dados completos do novo comentário
          const { data, error } = await supabase
            .from('comments')
            .select(`
              *,
              profiles!comments_user_id_fkey (
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
              comment: data
            });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'comments',
          filter: `post_id=eq.${postId}`
        },
        (payload) => {
          callback({
            type: 'UPDATE',
            comment: payload.new
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'comments',
          filter: `post_id=eq.${postId}`
        },
        (payload) => {
          callback({
            type: 'DELETE',
            commentId: payload.old.id
          });
        }
      )
      .subscribe();

    return channel;
  },

  // Remover subscription
  unsubscribeFromComments(channel) {
    if (channel) {
      supabase.removeChannel(channel);
    }
  },

  // Buscar estatísticas de comentários
  async getCommentsStats(postId) {
    try {
      const { count, error } = await supabase
        .from('comments')
        .select('*', { count: 'exact', head: true })
        .eq('post_id', postId);

      if (error) throw error;
      return count || 0;
    } catch (error) {
      console.error('Erro ao buscar estatísticas de comentários:', error);
      return 0;
    }
  },

  // Validar conteúdo do comentário
  validateComment(content) {
    if (!content || typeof content !== 'string') {
      return { valid: false, error: 'Conteúdo é obrigatório' };
    }

    const trimmed = content.trim();
    if (trimmed.length === 0) {
      return { valid: false, error: 'Comentário não pode estar vazio' };
    }

    if (trimmed.length > 1000) {
      return { valid: false, error: 'Comentário muito longo (máximo 1000 caracteres)' };
    }

    if (trimmed.length < 2) {
      return { valid: false, error: 'Comentário muito curto (mínimo 2 caracteres)' };
    }

    return { valid: true, content: trimmed };
  }
};
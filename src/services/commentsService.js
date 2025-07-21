import { supabase } from '../lib/supabase';

export const commentsService = {
  /**
   * Busca os comentários de um post com informações completas
   */
  async getCommentsForPost(postId) {
    try {
      const { data, error } = await supabase
        .from('comments')
        .select(`
          id,
          content,
          created_at,
          updated_at,
          post_id,
          user_id,
          parent_id,
          profiles:user_id (id, full_name, username, avatar_url),
          comment_likes (user_id)
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const { data: { user } } = await supabase.auth.getUser();
      
      return data.map(comment => {
        const likes = comment.comment_likes || [];
        return {
          ...comment,
          likes_count: likes.length,
          user_has_liked: user ? likes.some(like => like.user_id === user.id) : false
        };
      });
    } catch (error) {
      console.error("Erro ao buscar comentários:", error);
      throw error;
    }
  },

  /**
   * Adiciona um novo comentário (ou resposta)
   */
  async addComment(postId, content, parentId = null) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { data, error } = await supabase
        .from('comments')
        .insert({ 
          post_id: postId,
          parent_id: parentId,
          user_id: user.id,
          content
        })
        .select(`
          id,
          content,
          created_at,
          post_id,
          user_id,
          parent_id,
          profiles:user_id (id, full_name, username, avatar_url)
        `)
        .single();

      if (error) throw error;
      
      return { 
        ...data, 
        likes_count: 0,
        replies_count: 0,
        user_has_liked: false
      };
    } catch (error) {
      console.error("Erro ao adicionar comentário:", error);
      throw error;
    }
  },

  /**
   * Remove um comentário
   */
  async deleteComment(commentId) {
    try {
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error("Erro ao deletar comentário:", error);
      throw error;
    }
  },

  /**
   * Atualiza um comentário
   */
  async updateComment(commentId, newContent) {
    try {
      const { data, error } = await supabase
        .from('comments')
        .update({ 
          content: newContent, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', commentId)
        .select(`
          id,
          content,
          created_at,
          updated_at,
          post_id,
          user_id,
          parent_id,
          profiles:user_id (id, full_name, username, avatar_url)
        `)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Erro ao atualizar comentário:", error);
      throw error;
    }
  },

  /**
   * Alterna curtida em um comentário
   */
  async toggleCommentLike(commentId, userId) {
    try {
      // Verifica se o usuário já curtiu
      const { data: existingLike, error: checkError } = await supabase
        .from('comment_likes')
        .select()
        .eq('comment_id', commentId)
        .eq('user_id', userId)
        .maybeSingle();

      if (checkError) throw checkError;

      if (existingLike) {
        // Remove o like
        const { error: deleteError } = await supabase
          .from('comment_likes')
          .delete()
          .eq('comment_id', commentId)
          .eq('user_id', userId);
        if (deleteError) throw deleteError;
        return { liked: false };
      } else {
        // Adiciona o like
        const { error: insertError } = await supabase
          .from('comment_likes')
          .insert({
            comment_id: commentId,
            user_id: userId,
            created_at: new Date().toISOString()
          });
        if (insertError) throw insertError;
        return { liked: true };
      }
    } catch (error) {
      console.error("Erro ao curtir:", error);
      throw error;
    }
  },

  /**
   * Busca contagem de comentários para vários posts
   */
  async getCommentsCountForPosts(postIds) {
    try {
      const { data, error } = await supabase
        .from('comments')
        .select('post_id, count')
        .in('post_id', postIds)
        .group('post_id');

      if (error) throw error;

      return data.reduce((acc, item) => {
        acc[item.post_id] = item.count;
        return acc;
      }, {});
    } catch (error) {
      console.error("Erro ao buscar contagem de comentários:", error);
      throw error;
    }
  },

  /**
   * Busca respostas para um comentário
   */
  async getRepliesForComment(commentId) {
    try {
      const { data, error } = await supabase
        .from('comments_with_profiles')
        .select('*')
        .eq('parent_id', commentId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Erro ao buscar respostas:", error);
      throw error;
    }
  }
};
import { supabase } from '../lib/supabase';
import { telegramService } from './telegramService';
import toast from 'react-hot-toast';

export const postsService = {

  // ... (as funções getMainFeedPosts e createPost continuam as mesmas)
  async getMainFeedPosts(limit = 20, offset = 0) {
    try {
      const { data, error } = await supabase.from('posts').select(`*,profiles:user_id (*),likes:likes(count),comments:comments(count)`).eq('visibility', 'public').is('community_id', null).order('created_at', { ascending: false }).range(offset, offset + limit - 1);
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro ao buscar posts do feed:', error);
      throw error;
    }
  },

  async createPost(postData) {
    const toastId = toast.loading('Criando post...');
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');
      const tagsArray = postData.tags ? postData.tags.split(',').map(tag => tag.trim()).filter(Boolean) : [];
      const { data: newPost, error: postError } = await supabase.from('posts').insert({ user_id: user.id, content: postData.content.trim(), tags: tagsArray, location: postData.location, media_urls: [], community_id: postData.communityId || null, }).select().single();
      if (postError) throw postError;
      let finalMediaUrls = [];
      if (postData.filesToUpload && postData.filesToUpload.length > 0) {
        toast.loading('Enviando mídias...', { id: toastId });
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
        if (finalMediaUrls.length > 0) {
          const { error: updateError } = await supabase.from('posts').update({ media_urls: finalMediaUrls }).eq('id', newPost.id);
          if (updateError) throw updateError;
          newPost.media_urls = finalMediaUrls;
        }
      }
      toast.dismiss(toastId);
      toast.success('Post criado com sucesso!');
      const { data: authorProfile, error: profileError } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      if (profileError) throw profileError;
      return { ...newPost, profiles: authorProfile };
    } catch (error) {
      toast.dismiss(toastId);
      console.error('Erro ao criar post no serviço:', error);
      throw error; 
    }
  },

  // --- [FUNÇÃO ADICIONADA] ---
  /**
   * Adiciona ou remove uma curtida de um post.
   * @param {string} postId - O ID do post a ser curtido/descurtido.
   * @param {string} userId - O ID do usuário que está curtindo.
   * @returns {Promise<{liked: boolean}>} - Retorna o novo estado da curtida.
   */
  async toggleLike(postId, userId) {
    try {
      if (!userId) throw new Error('Usuário não autenticado');

      // 1. Verifica se a curtida já existe
      const { data: existingLike, error: selectError } = await supabase
        .from('likes')
        .select('post_id')
        .eq('post_id', postId)
        .eq('user_id', userId)
        .maybeSingle();

      if (selectError) throw selectError;

      // 2. Se já existe, remove (descurtir)
      if (existingLike) {
        const { error: deleteError } = await supabase
          .from('likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', userId);
        if (deleteError) throw deleteError;
        return { liked: false };
      } else {
        // 3. Se não existe, adiciona (curtir)
        const { error: insertError } = await supabase
          .from('likes')
          .insert({ post_id: postId, user_id: userId });
        if (insertError) throw insertError;
        return { liked: true };
      }
    } catch (error) {
      console.error('Erro ao alternar curtida:', error);
      throw error;
    }
  },
  
  async deletePost(postId) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');
      const { error } = await supabase.from('posts').delete().eq('id', postId).eq('user_id', user.id);
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Erro ao deletar post:', error);
      throw error;
    }
  },
};
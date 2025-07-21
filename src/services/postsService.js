// src/services/postsService.js
import { supabase } from '../lib/supabase';
import { uploadPostImages, deletePostImages } from './imageService';
import toast from 'react-hot-toast';

export const postsService = {
  async getMainFeedPosts(limit = 20, offset = 0) {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          profiles:user_id (*),
          likes:likes(count),
          comments:comments(count)
        `)
        .eq('visibility', 'public')
        .is('community_id', null)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);
        
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
      
      const tagsArray = postData.tags 
        ? postData.tags.split(',').map(tag => tag.trim()).filter(Boolean) 
        : [];
      
      // 1. Primeiro, cria o post sem as URLs de mídia
      const { data: newPost, error: postError } = await supabase
        .from('posts')
        .insert({
          user_id: user.id,
          content: postData.content.trim(),
          tags: tagsArray,
          location: postData.location,
          media_urls: [], // Será preenchido depois do upload
          media_metadata: [], // Metadados das mídias
          community_id: postData.communityId || null,
          visibility: postData.visibility || 'public'
        })
        .select()
        .single();
        
      if (postError) throw postError;
      
      let finalMediaUrls = [];
      let mediaMetadata = [];
      
      // 2. Se há arquivos para upload, processa eles
      if (postData.filesToUpload?.length > 0) {
        toast.loading('Enviando mídias...', { id: toastId });
        
        try {
          // Upload de todas as imagens de uma vez
          const uploadResults = await uploadPostImages(
            postData.filesToUpload, 
            newPost.id,
            (progress, index, total) => {
              toast.loading(`Enviando mídias (${index + 1}/${total})...`, { id: toastId });
            }
          );
          
          // Filtra uploads bem-sucedidos
          const successfulUploads = uploadResults.filter(result => result?.url);
          
          if (successfulUploads.length < postData.filesToUpload.length) {
            toast.error("Algumas mídias falharam ao enviar.");
          }
          
          finalMediaUrls = successfulUploads.map(result => result.url);
          mediaMetadata = successfulUploads;
          
          // 3. Atualiza o post com as URLs das mídias
          if (finalMediaUrls.length > 0) {
            const { error: updateError } = await supabase
              .from('posts')
              .update({ 
                media_urls: finalMediaUrls,
                media_metadata: mediaMetadata
              })
              .eq('id', newPost.id);
              
            if (updateError) {
              console.error('Erro ao atualizar URLs de mídia:', updateError);
              // Se falhar, tenta deletar as mídias enviadas
              if (mediaMetadata.length > 0) {
                await deletePostImages(mediaMetadata.map(m => m.path));
              }
            }
            
            newPost.media_urls = finalMediaUrls;
            newPost.media_metadata = mediaMetadata;
          }
          
        } catch (uploadError) {
          console.error('Erro no upload de mídias:', uploadError);
          toast.error('Erro ao enviar mídias, mas o post foi criado.');
        }
      }
      
      toast.dismiss(toastId);
      toast.success('Post criado com sucesso!');
      
      // 4. Busca o perfil do autor para retornar dados completos
      const { data: authorProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
        .catch(() => null); // Ignora erros de perfil
      
      return { 
        ...newPost, 
        profiles: authorProfile || { id: user.id, full_name: 'Usuário' }
      };
      
    } catch (error) {
      toast.dismiss(toastId);
      toast.error('Erro ao criar post');
      console.error('Erro ao criar post:', error);
      throw error; 
    }
  },

  async toggleLike(postId, userId) {
    try {
      if (!userId) throw new Error('Usuário não autenticado');

      // Verifica se a curtida já existe
      const { data: existingLike, error: likeError } = await supabase
        .from('likes')
        .select('post_id')
        .eq('post_id', postId)
        .eq('user_id', userId)
        .maybeSingle();

      if (likeError) throw likeError;

      // Se já existe, remove (descurtir)
      if (existingLike) {
        const { error } = await supabase
          .from('likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', userId);
        if (error) throw error;
        return { liked: false };
      }
      
      // Se não existe, adiciona (curtir)
      const { error } = await supabase
        .from('likes')
        .insert({ post_id: postId, user_id: userId });
      if (error) throw error;
      return { liked: true };

    } catch (error) {
      console.error('Erro ao alternar curtida:', error);
      throw error;
    }
  },
  
  async deletePost(postId) {
    const toastId = toast.loading('Deletando post...');
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');
      
      // 1. Busca o post para obter as informações de mídia
      const { data: post } = await supabase
        .from('posts')
        .select('media_metadata, user_id')
        .eq('id', postId)
        .eq('user_id', user.id) // Garante que só o dono pode deletar
        .single()
        .catch(() => null);
        
      if (!post) throw new Error('Post não encontrado ou não autorizado');
      
      // 2. Remove os arquivos de mídia do storage (se existirem)
      if (post.media_metadata?.length > 0) {
        const filePaths = post.media_metadata
          .filter(media => media?.path)
          .map(media => media.path);
          
        if (filePaths.length > 0) {
          await deletePostImages(filePaths).catch(error => {
            console.error('Erro ao deletar mídias:', error);
          });
        }
      }
      
      // 3. Remove o post do banco de dados
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId)
        .eq('user_id', user.id);
        
      if (error) throw error;
      
      toast.dismiss(toastId);
      toast.success('Post deletado com sucesso!');
      return true;
    } catch (error) {
      toast.dismiss(toastId);
      toast.error('Erro ao deletar post');
      console.error('Erro ao deletar post:', error);
      throw error;
    }
  },

  async getCommunityPosts(communityId, limit = 20, offset = 0) {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          profiles:user_id (*),
          likes:likes(count),
          comments:comments(count)
        `)
        .eq('community_id', communityId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);
        
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro ao buscar posts da comunidade:', error);
      throw error;
    }
  },

  async getPostById(postId) {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          profiles:user_id (*),
          likes:likes(count),
          comments:comments(count)
        `)
        .eq('id', postId)
        .single();
        
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao buscar post por ID:', error);
      throw error;
    }
  }
};
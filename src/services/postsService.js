// src/services/postsService.js
import { supabase } from '../lib/supabase';
import { uploadPostImages, deletePostImages } from './imageService';
import toast from 'react-hot-toast';

export const postsService = {
  /**
   * Busca posts do feed principal
   */
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

  /**
   * Cria um novo post com suporte completo a mídia e localização
   */
  async createPost(postData, userId = null, autoGetLocation = false) {
    const toastId = toast.loading('Criando post...');
    
    try {
      // 1. Verificar autenticação
      let currentUserId = userId;
      if (!currentUserId) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Usuário não autenticado');
        currentUserId = user.id;
      }
      
      // 2. Processar tags
      const tagsArray = postData.tags 
        ? (Array.isArray(postData.tags) 
            ? postData.tags 
            : postData.tags.split(',').map(tag => tag.trim()).filter(Boolean))
        : [];

      // 3. Processar espécies (se fornecidas)
      const speciesArray = postData.species 
        ? (Array.isArray(postData.species)
            ? postData.species
            : postData.species.split(',').map(species => species.trim()).filter(Boolean))
        : [];

      // 4. Processar nomes científicos (se fornecidos)
      const scientificNamesArray = postData.scientificNames 
        ? (Array.isArray(postData.scientificNames)
            ? postData.scientificNames
            : postData.scientificNames.split(',').map(name => name.trim()).filter(Boolean))
        : [];

      // 5. Obter localização automática se solicitado
      let locationData = {
        location: postData.location,
        latitude: postData.latitude,
        longitude: postData.longitude
      };

      if (autoGetLocation && !postData.location) {
        try {
          const position = await new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
              reject(new Error('Geolocalização não suportada'));
              return;
            }
            
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              timeout: 10000,
              enableHighAccuracy: true
            });
          });

          locationData = {
            location: `${position.coords.latitude.toFixed(6)}, ${position.coords.longitude.toFixed(6)}`,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          };
        } catch (geoError) {
          console.warn('Não foi possível obter localização automática:', geoError);
          // Continua sem localização
        }
      }
      
      // 6. Criar o post inicial (sem mídia)
      const postInsertData = {
        user_id: currentUserId,
        content: postData.content.trim(),
        tags: tagsArray,
        species: speciesArray,
        scientific_names: scientificNamesArray,
        difficulty: postData.difficulty || 1,
        location: locationData.location || null,
        latitude: locationData.latitude || null,
        longitude: locationData.longitude || null,
        media_urls: [],
        media_metadata: [],
        community_id: postData.communityId || null,
        visibility: postData.visibility || 'public'
      };

      const { data: newPost, error: postError } = await supabase
        .from('posts')
        .insert(postInsertData)
        .select()
        .single();
        
      if (postError) throw postError;
      
      let finalMediaUrls = [];
      let mediaMetadata = [];
      
      // 7. Processar upload de mídia (se houver)
      if (postData.filesToUpload?.length > 0) {
        toast.loading('Enviando mídias...', { id: toastId });
        
        try {
          const uploadResults = await uploadPostImages(
            postData.filesToUpload, 
            newPost.id,
            (progress, index, total) => {
              toast.loading(`Enviando mídias (${index + 1}/${total})...`, { id: toastId });
            }
          );
          
          const successfulUploads = uploadResults.filter(result => result?.url);
          
          if (successfulUploads.length < postData.filesToUpload.length) {
            toast.error("Algumas mídias falharam ao enviar.");
          }
          
          finalMediaUrls = successfulUploads.map(result => result.url);
          mediaMetadata = successfulUploads;
          
          // 8. Atualizar post com URLs de mídia
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
              // Tentar limpar mídias enviadas em caso de erro
              if (mediaMetadata.length > 0) {
                await deletePostImages(mediaMetadata.map(m => m.path));
              }
              throw updateError;
            }
            
            newPost.media_urls = finalMediaUrls;
            newPost.media_metadata = mediaMetadata;
          }
          
        } catch (uploadError) {
          console.error('Erro no upload de mídias:', uploadError);
          toast.error('Erro ao enviar mídias, mas o post foi criado.');
        }
      }
      
      // 9. Buscar perfil do autor para retorno completo
      const { data: authorProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUserId)
        .single()
        .catch(() => null);
      
      toast.dismiss(toastId);
      toast.success('Post criado com sucesso!');
      
      return { 
        ...newPost, 
        profiles: authorProfile || { id: currentUserId, full_name: 'Usuário' },
        likes: [{ count: 0 }],
        comments: [{ count: 0 }]
      };
      
    } catch (error) {
      toast.dismiss(toastId);
      toast.error('Erro ao criar post');
      console.error('Erro ao criar post:', error);
      throw error; 
    }
  },

  /**
   * Atualiza um post existente com suporte completo a mídia
   */
  async updatePost(postId, updates) {
    const toastId = toast.loading('Atualizando post...');
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // 1. Buscar post existente para validar ownership
      const { data: existingPost, error: fetchError } = await supabase
        .from('posts')
        .select('*')
        .eq('id', postId)
        .eq('user_id', user.id)
        .single();

      if (fetchError || !existingPost) {
        throw new Error('Post não encontrado ou não autorizado');
      }

      // 2. Processar dados de atualização
      const updateData = { ...updates };
      
      // Processar tags
      if (updates.tags && typeof updates.tags === 'string') {
        updateData.tags = updates.tags.split(',').map(tag => tag.trim()).filter(Boolean);
      }

      // Processar espécies
      if (updates.species && typeof updates.species === 'string') {
        updateData.species = updates.species.split(',').map(species => species.trim()).filter(Boolean);
      }

      // Processar nomes científicos
      if (updates.scientificNames && typeof updates.scientificNames === 'string') {
        updateData.scientific_names = updates.scientificNames.split(',').map(name => name.trim()).filter(Boolean);
      }

      // 3. Gerenciar mídia se houver alterações
      let finalMediaUrls = [...(existingPost.media_urls || [])];
      let finalMediaMetadata = [...(existingPost.media_metadata || [])];

      // Remover mídia marcada para deleção
      if (updates.mediaToDelete?.length > 0) {
        const pathsToDelete = [];
        
        // Filtrar mídia a ser mantida
        finalMediaMetadata = finalMediaMetadata.filter(media => {
          const shouldDelete = updates.mediaToDelete.includes(media.id);
          if (shouldDelete && media.path) {
            pathsToDelete.push(media.path);
          }
          return !shouldDelete;
        });

        finalMediaUrls = finalMediaUrls.filter((_, index) => {
          return !updates.mediaToDelete.includes(existingPost.media_metadata?.[index]?.id);
        });

        // Deletar arquivos do storage
        if (pathsToDelete.length > 0) {
          try {
            await deletePostImages(pathsToDelete);
          } catch (deleteError) {
            console.warn('Erro ao deletar algumas mídias:', deleteError);
          }
        }
      }

      // Adicionar nova mídia
      if (updates.newMediaFiles?.length > 0) {
        toast.loading('Enviando novas mídias...', { id: toastId });
        
        try {
          const uploadResults = await uploadPostImages(
            updates.newMediaFiles, 
            postId,
            (progress, index, total) => {
              toast.loading(`Enviando mídias (${index + 1}/${total})...`, { id: toastId });
            }
          );
          
          const successfulUploads = uploadResults.filter(result => result?.url);
          
          if (successfulUploads.length < updates.newMediaFiles.length) {
            toast.error("Algumas mídias falharam ao enviar.");
          }
          
          // Adicionar novas mídias às existentes
          finalMediaUrls = [...finalMediaUrls, ...successfulUploads.map(result => result.url)];
          finalMediaMetadata = [...finalMediaMetadata, ...successfulUploads];
          
        } catch (uploadError) {
          console.error('Erro no upload de novas mídias:', uploadError);
          toast.error('Erro ao enviar novas mídias.');
        }
      }

      // 4. Preparar dados finais para atualização
      const finalUpdateData = {
        ...updateData,
        media_urls: finalMediaUrls,
        media_metadata: finalMediaMetadata,
        updated_at: new Date().toISOString()
      };

      // Remover campos específicos de mídia que não devem ir para o DB
      delete finalUpdateData.mediaToDelete;
      delete finalUpdateData.newMediaFiles;

      // 5. Executar atualização no banco
      const { data: updatedPost, error: updateError } = await supabase
        .from('posts')
        .update(finalUpdateData)
        .eq('id', postId)
        .eq('user_id', user.id)
        .select(`
          *,
          profiles:user_id (*),
          likes:likes(count),
          comments:comments(count)
        `)
        .single();

      if (updateError) throw updateError;

      toast.dismiss(toastId);
      toast.success('Post atualizado com sucesso!');
      return updatedPost;
      
    } catch (error) {
      toast.dismiss(toastId);
      toast.error('Erro ao atualizar post');
      console.error('Erro ao atualizar post:', error);
      throw error;
    }
  },

  /**
   * Alterna like/unlike em um post
   */
  async toggleLike(postId, userId = null) {
    try {
      let currentUserId = userId;
      if (!currentUserId) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Usuário não autenticado');
        currentUserId = user.id;
      }

      // Verificar se já existe like
      const { data: existingLike, error: likeError } = await supabase
        .from('likes')
        .select('id')
        .eq('post_id', postId)
        .eq('user_id', currentUserId)
        .maybeSingle();

      if (likeError) throw likeError;

      if (existingLike) {
        // Remover like
        const { error } = await supabase
          .from('likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', currentUserId);
        if (error) throw error;
        return { liked: false };
      } else {
        // Adicionar like
        const { error } = await supabase
          .from('likes')
          .insert({ post_id: postId, user_id: currentUserId });
        if (error) throw error;
        return { liked: true };
      }

    } catch (error) {
      console.error('Erro ao alternar curtida:', error);
      throw error;
    }
  },

  /**
   * Verifica se usuário curtiu um post
   */
  async isPostLikedByUser(postId, userId = null) {
    try {
      let currentUserId = userId;
      if (!currentUserId) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return false;
        currentUserId = user.id;
      }

      const { data, error } = await supabase
        .from('likes')
        .select('id')
        .eq('post_id', postId)
        .eq('user_id', currentUserId)
        .maybeSingle();

      if (error) throw error;
      return !!data;
    } catch (error) {
      console.error('Erro ao verificar curtida:', error);
      return false;
    }
  },
  
  /**
   * Deleta um post e sua mídia associada
   */
  async deletePost(postId) {
    const toastId = toast.loading('Deletando post...');
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');
      
      // 1. Buscar post para validar ownership e obter mídia
      const { data: post, error: fetchError } = await supabase
        .from('posts')
        .select('media_metadata, user_id, id')
        .eq('id', postId)
        .eq('user_id', user.id)
        .single();
        
      if (fetchError || !post) {
        throw new Error('Post não encontrado ou não autorizado');
      }
      
      // 2. Deletar mídia do storage
      if (post.media_metadata?.length > 0) {
        const filePaths = post.media_metadata
          .filter(media => media?.path)
          .map(media => media.path);
          
        if (filePaths.length > 0) {
          try {
            await deletePostImages(filePaths);
          } catch (error) {
            console.warn('Erro ao deletar algumas mídias:', error);
            // Continua com a deleção do post mesmo se houver erro na mídia
          }
        }
      }
      
      // 3. Deletar post do banco (CASCADE deve cuidar de likes e comments)
      const { error: deleteError } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId)
        .eq('user_id', user.id);
        
      if (deleteError) throw deleteError;
      
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

  /**
   * Busca posts de uma comunidade específica
   */
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

  /**
   * Busca um post específico por ID
   */
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
  },

  /**
   * Busca posts do usuário
   */
  async getUserPosts(userId, limit = 20, offset = 0) {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          profiles:user_id (*),
          likes:likes(count),
          comments:comments(count)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);
        
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro ao buscar posts do usuário:', error);
      throw error;
    }
  },

  /**
   * Busca posts por tags
   */
  async getPostsByTags(tags, limit = 20, offset = 0) {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          profiles:user_id (*),
          likes:likes(count),
          comments:comments(count)
        `)
        .contains('tags', tags)
        .eq('visibility', 'public')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);
        
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro ao buscar posts por tags:', error);
      throw error;
    }
  },

  /**
   * Busca posts por espécies
   */
  async getPostsBySpecies(species, limit = 20, offset = 0) {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          profiles:user_id (*),
          likes:likes(count),
          comments:comments(count)
        `)
        .contains('species', species)
        .eq('visibility', 'public')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);
        
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro ao buscar posts por espécies:', error);
      throw error;
    }
  },

  /**
   * Busca posts por localização (raio em km)
   */
  async getPostsByLocation(latitude, longitude, radiusKm = 10, limit = 20, offset = 0) {
    try {
      const { data, error } = await supabase.rpc('get_posts_near_location', {
        lat: latitude,
        lng: longitude,
        radius_km: radiusKm,
        result_limit: limit,
        result_offset: offset
      });
        
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro ao buscar posts por localização:', error);
      // Fallback para busca sem filtro geográfico
      return this.getMainFeedPosts(limit, offset);
    }
  }
};
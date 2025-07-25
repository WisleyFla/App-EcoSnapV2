// src/services/imageService.js
import { supabase, SUPABASE_CONFIG } from '../lib/supabase';

// Configurações para avatars
const AVATAR_CONFIG = {
  BUCKET: 'avatars',
  MAX_SIZE: 2 * 1024 * 1024, // 2MB
  DIMENSIONS: { width: 400, height: 400, quality: 0.9 }
};

// Configurações para imagens de posts
const POST_IMAGES_CONFIG = {
  BUCKET: 'ecosnap-media',
  MAX_SIZE: 5 * 1024 * 1024, // 5MB
  DIMENSIONS: { width: 1200, height: 800, quality: 0.85 }
};

// Função auxiliar para redimensionamento de imagens
const resizeImage = async (file, width, height, quality) => {
  // Implementação do redimensionamento aqui
  // (mantenha sua implementação existente ou use uma biblioteca como 'browser-image-resizer')
  return file;
};

// ========== Funções para Posts ========== //

/**
 * Upload de múltiplas imagens para um post
 * @param {Array} files - Lista de arquivos de imagem
 * @param {string} postId - ID do post para organização
 * @param {function} onProgress - Callback para progresso
 * @returns {Promise<Array>} URLs das imagens enviadas
 */
export const uploadPostImages = async (files, postId, onProgress = null) => {
  try {
    if (!files || !files.length) return [];
    if (!postId) throw new Error('ID do post é obrigatório');

    const uploadedUrls = [];

    for (const [index, file] of files.entries()) {
      try {
        // Validação
        if (!file.type.match(/^image\/(jpeg|png|webp)$/)) {
          console.warn(`Arquivo ${file.name} ignorado: Formato não suportado`);
          continue;
        }

        if (file.size > POST_IMAGES_CONFIG.MAX_SIZE) {
          console.warn(`Arquivo ${file.name} ignorado: Tamanho excede o limite`);
          continue;
        }

        onProgress?.(0, index, files.length);

        // Redimensionamento
        const resizedFile = await resizeImage(
          file,
          POST_IMAGES_CONFIG.DIMENSIONS.width,
          POST_IMAGES_CONFIG.DIMENSIONS.height,
          POST_IMAGES_CONFIG.DIMENSIONS.quality
        );

        onProgress?.(30, index, files.length);

        // Nome do arquivo organizado por post
        const fileExt = file.name.split('.').pop();
        const fileName = `post_${postId}_${index}.${fileExt}`;
        const filePath = `post/${postId}/${fileName}`;

        // Upload
        const { error: uploadError } = await supabase.storage
          .from(POST_IMAGES_CONFIG.BUCKET)
          .upload(filePath, resizedFile, {
            cacheControl: '3600',
            upsert: true,
            contentType: file.type
          });

        if (uploadError) throw uploadError;

        onProgress?.(70, index, files.length);

        // Obter URL pública
        const { data: { publicUrl } } = supabase.storage
          .from(POST_IMAGES_CONFIG.BUCKET)
          .getPublicUrl(filePath);

        uploadedUrls.push({
          url: publicUrl,
          path: filePath,
          bucket: POST_IMAGES_CONFIG.BUCKET,
          originalName: file.name
        });

        onProgress?.(100, index, files.length);
      } catch (error) {
        console.error(`Erro no upload da imagem ${file.name}:`, error);
        throw error;
      }
    }

    return uploadedUrls;
  } catch (error) {
    console.error('Erro no upload de imagens do post:', error);
    throw error;
  }
};

/**
 * Remove imagens de um post
 * @param {Array} filePaths - Lista de caminhos das imagens
 * @returns {Promise<void>}
 */
export const deletePostImages = async (filePaths) => {
  try {
    if (!filePaths || !filePaths.length) return;

    const { error } = await supabase.storage
      .from(POST_IMAGES_CONFIG.BUCKET)
      .remove(filePaths);

    if (error) throw error;
  } catch (error) {
    console.error('Erro ao deletar imagens do post:', error);
    throw error;
  }
};

// ========== Funções para Avatar ========== //
// (Mantidas as funções originais existentes)

export const uploadProfileImage = async (userId, file, onProgress = null) => {
  // ... (implementação existente mantida igual)
};

export const deleteProfileImage = async (filePath) => {
  // ... (implementação existente mantida igual)
};
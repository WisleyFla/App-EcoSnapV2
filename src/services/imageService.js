// src/services/imageService.js
// ATUALIZADO: Usando Telegram Storage ao invés de Firebase Storage

import { telegramStorage } from './telegramStorage';

// Função para redimensionar imagem antes do upload
const resizeImage = (file, maxWidth = 400, maxHeight = 400, quality = 0.8) => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      // Calcula as novas dimensões mantendo a proporção
      let { width, height } = img;
      
      if (width > height) {
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }
      }
      
      canvas.width = width;
      canvas.height = height;
      
      // Desenha a imagem redimensionada
      ctx.drawImage(img, 0, 0, width, height);
      
      // Converte para blob
      canvas.toBlob(resolve, 'image/jpeg', quality);
    };
    
    img.src = URL.createObjectURL(file);
  });
};

// Função para validar arquivo de imagem
export const validateImageFile = (file) => {
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  const maxSize = 50 * 1024 * 1024; // 50MB (Telegram suporta até 2GB, mas vamos ser conservadores)
  
  if (!validTypes.includes(file.type)) {
    throw new Error('Tipo de arquivo não suportado. Use JPG, PNG ou WebP.');
  }
  
  if (file.size > maxSize) {
    throw new Error('Arquivo muito grande. Máximo 50MB.');
  }
  
  return true;
};

// Função para fazer upload da foto de perfil
export const uploadProfileImage = async (userId, file, onProgress = null) => {
  try {
    // Validar arquivo
    validateImageFile(file);
    
    // Redimensionar imagem
    console.log('Redimensionando imagem...');
    if (onProgress) onProgress(10);
    
    const resizedFile = await resizeImage(file);
    if (onProgress) onProgress(30);
    
    console.log('Iniciando upload para Telegram...');
    
    // Fazer upload para Telegram
    const caption = `Profile Image - User: ${userId}`;
    const result = await telegramStorage.uploadImage(resizedFile, caption);
    
    if (onProgress) onProgress(90);
    
    if (!result.success) {
      throw new Error(result.error || 'Erro ao fazer upload da imagem');
    }
    
    console.log('Upload concluído. URL:', result.download_url);
    if (onProgress) onProgress(100);
    
    return {
      url: result.download_url,
      file_id: result.file_id,
      message_id: result.message_id,
      file_size: result.file_size
    };
    
  } catch (error) {
    console.error('Erro no upload:', error);
    throw error;
  }
};

// Função para deletar foto de perfil anterior
export const deleteProfileImage = async (messageId) => {
  try {
    if (!messageId) {
      console.log('Nenhum message_id fornecido para deletar');
      return;
    }
    
    const deleted = await telegramStorage.deleteFile(messageId);
    if (deleted) {
      console.log('Imagem anterior deletada com sucesso');
    } else {
      console.log('Erro ao deletar imagem anterior');
    }
  } catch (error) {
    // Não é um erro crítico se a imagem não existir
    console.log('Nenhuma imagem anterior para deletar ou erro ao deletar:', error.message);
  }
};

// Função para obter URL da foto de perfil (agora vem do banco)
export const getProfileImageURL = async (userId) => {
  try {
    // Esta função agora só retorna a URL salva no banco
    // A URL real vem do profileService.loadUserProfile()
    console.log('URL da foto será carregada do banco de dados');
    return null; // Será implementada no profileService
  } catch (error) {
    console.log('Erro ao obter URL da foto de perfil:', error);
    return null;
  }
};

// Função para upload de múltiplas imagens (para posts)
export const uploadPostImages = async (images, postId, onProgress = null) => {
  try {
    const uploadedImages = [];
    const totalImages = images.length;
    
    for (let i = 0; i < images.length; i++) {
      const image = images[i];
      
      // Validar cada imagem
      validateImageFile(image);
      
      // Redimensionar para posts (tamanho maior)
      const resizedImage = await resizeImage(image, 1200, 1200, 0.85);
      
      // Upload para Telegram
      const caption = `Post Image - Post: ${postId} - Image: ${i + 1}/${totalImages}`;
      const result = await telegramStorage.uploadImage(resizedImage, caption);
      
      if (result.success) {
        uploadedImages.push({
          url: result.download_url,
          file_id: result.file_id,
          message_id: result.message_id,
          file_size: result.file_size,
          order: i
        });
      } else {
        console.error(`Erro no upload da imagem ${i + 1}:`, result.error);
      }
      
      // Callback de progresso
      if (onProgress) {
        onProgress(Math.round(((i + 1) / totalImages) * 100));
      }
    }
    
    return uploadedImages;
  } catch (error) {
    console.error('Erro no upload de imagens do post:', error);
    throw error;
  }
};

// Função para upload de vídeos
export const uploadVideo = async (file, caption = '', onProgress = null) => {
  try {
    const validTypes = ['video/mp4', 'video/mov', 'video/avi', 'video/webm'];
    const maxSize = 2 * 1024 * 1024 * 1024; // 2GB (limite do Telegram)
    
    if (!validTypes.includes(file.type)) {
      throw new Error('Tipo de vídeo não suportado. Use MP4, MOV, AVI ou WebM.');
    }
    
    if (file.size > maxSize) {
      throw new Error('Vídeo muito grande. Máximo 2GB.');
    }
    
    if (onProgress) onProgress(10);
    
    // Upload direto para Telegram (sem compressão por enquanto)
    const result = await telegramStorage.uploadFile(file, caption);
    
    if (onProgress) onProgress(100);
    
    if (!result.success) {
      throw new Error(result.error || 'Erro ao fazer upload do vídeo');
    }
    
    return {
      url: result.download_url,
      file_id: result.file_id,
      message_id: result.message_id,
      file_size: result.file_size
    };
    
  } catch (error) {
    console.error('Erro no upload do vídeo:', error);
    throw error;
  }
};

// Função para comprimir imagem para diferentes tamanhos
export const createImageThumbnails = async (file, prefix = 'thumbnail') => {
  try {
    const thumbnails = {};
    
    // Criar diferentes tamanhos
    const sizes = [
      { name: 'small', width: 100, height: 100 },
      { name: 'medium', width: 200, height: 200 },
      { name: 'large', width: 400, height: 400 }
    ];
    
    for (const size of sizes) {
      const resized = await resizeImage(file, size.width, size.height, 0.9);
      const caption = `${prefix} - ${size.name} (${size.width}x${size.height})`;
      
      const result = await telegramStorage.uploadImage(resized, caption);
      
      if (result.success) {
        thumbnails[size.name] = {
          url: result.download_url,
          file_id: result.file_id,
          message_id: result.message_id,
          dimensions: { width: size.width, height: size.height }
        };
      }
    }
    
    return thumbnails;
  } catch (error) {
    console.error('Erro ao criar thumbnails:', error);
    throw new Error('Erro ao processar imagem');
  }
};

// Função utilitária para verificar se Telegram está configurado
export const isTelegramConfigured = () => {
  return telegramStorage.isConfigured();
};

// Função para testar upload
export const testTelegramUpload = async () => {
  try {
    return await telegramStorage.testConnection();
  } catch (error) {
    console.error('Erro no teste do Telegram:', error);
    return { success: false, error: error.message };
  }
};
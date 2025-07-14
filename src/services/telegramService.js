// src/services/telegramService.js
import { supabase } from '../lib/supabase';

class TelegramService {
  
  // A compressão de imagem acontece no frontend, pois usa APIs do navegador.
  async compressImage(file, maxWidth = 1280, quality = 0.8) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.src = URL.createObjectURL(file);
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
        canvas.width = img.width * ratio;
        canvas.height = img.height * ratio;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(blob => {
          if (!blob) {
            reject(new Error('Falha na compressão da imagem.'));
            return;
          }
          resolve(new File([blob], file.name, {
            type: 'image/jpeg',
            lastModified: Date.now(),
          }));
        }, 'image/jpeg', quality);
      };
      img.onerror = (error) => reject(error);
    });
  }

  // Função para fazer UPLOAD através da Edge Function, agora com suporte a vídeo.
  async uploadMedia(file, postId, caption = '', isVideo = false) {
    if (!postId) {
      throw new Error("O ID do Post é necessário para o upload.");
    }
  
    try {
      // Validação do arquivo
      if (!file || !(file instanceof File)) {
        throw new Error("Arquivo inválido para upload.");
      }
  
      // Validação do TIPO de arquivo
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm'];
      if (!allowedTypes.includes(file.type)) {
        throw new Error(`Tipo de arquivo não suportado: ${file.type}`);
      }
      
      // Validação do TAMANHO do arquivo
      const isImage = file.type.startsWith('image/');
      const maxSize = isImage ? 50 * 1024 * 1024 : 2 * 1024 * 1024 * 1024; // 50MB para fotos, 2GB para vídeos
      if (file.size > maxSize) {
        throw new Error(`Arquivo muito grande. O tamanho máximo para ${isImage ? 'fotos' : 'vídeos'} é de ${isImage ? '50MB' : '2GB'}.`);
      }
  
      // Comprime se for imagem, senão usa o arquivo original
      const fileToUpload = isImage ? await this.compressImage(file) : file;
  
      const formData = new FormData();
      formData.append('action', 'upload');
      formData.append('file', fileToUpload);
      formData.append('post_id', postId.toString());
      formData.append('caption', caption || '');
      formData.append('is_video', isVideo.toString());
  
      console.log('Enviando para a Edge Function:', {
        fileName: fileToUpload.name,
        type: fileToUpload.type,
        size: fileToUpload.size,
        postId,
        isVideo
      });
  
      const { data, error } = await supabase.functions.invoke('telegram-handler', {
        body: formData,
      });
  
      if (error) throw error;

      return { 
        success: true, 
        is_video: isVideo,
        ...data 
      };
  
    } catch (error) {
      console.error('❌ Erro detalhado no serviço de upload:', {
        error: error.message,
        stack: error.stack,
        fileInfo: file ? { name: file.name, type: file.type, size: file.size } : null
      });
      return { success: false, error: error.message };
    }
  }

  // Função para DELETAR através da Edge Function
  async deleteMessage(messageId) {
    try {
      const formData = new FormData();
      formData.append('action', 'delete');
      formData.append('message_id', messageId);

      const { data, error } = await supabase.functions.invoke('telegram-handler', {
        body: formData,
      });

      if (error) throw error;
      return { success: true, ...data };

    } catch (error) {
      console.error('❌ Erro no serviço de deleção:', error);
      return { success: false, error: error.message };
    }
  }
}

// Instância singleton do novo serviço
export const telegramService = new TelegramService();
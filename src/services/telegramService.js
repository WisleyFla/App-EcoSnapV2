// src/services/telegramStorage.js
import { supabase } from '../lib/supabase';

class TelegramService {
  
  // A compressão continua no frontend, pois usa APIs do navegador!
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

  // Função para fazer UPLOAD através da Edge Function
  async uploadMedia(file, postId, caption = '') {
    if (!postId) {
      throw new Error("O ID do Post é necessário para o upload.");
    }

    try {
      // Comprime se for imagem
      const fileToUpload = file.type.startsWith('image/')
        ? await this.compressImage(file)
        : file;

      const formData = new FormData();
      formData.append('action', 'upload');
      formData.append('file', fileToUpload);
      formData.append('post_id', postId);
      formData.append('caption', caption);

      const { data, error } = await supabase.functions.invoke('telegram-handler', {
        body: formData,
      });

      if (error) throw error;
      return { success: true, ...data };

    } catch (error) {
      console.error('❌ Erro no serviço de upload:', error);
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
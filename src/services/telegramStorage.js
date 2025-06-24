// src/services/telegramStorage.js
// Serviço para usar Telegram como storage de mídia

class TelegramStorage {
  constructor() {
    this.botToken = import.meta.env.VITE_TELEGRAM_BOT_TOKEN
    this.chatId = import.meta.env.VITE_TELEGRAM_CHAT_ID
    this.baseUrl = `https://api.telegram.org/bot${this.botToken}`
    
    if (!this.botToken || !this.chatId) {
      console.warn('⚠️ Credenciais do Telegram não configuradas no .env')
    }
  }

  // Upload de arquivo para Telegram
  async uploadFile(file, caption = '') {
    try {
      const formData = new FormData()
      formData.append('chat_id', this.chatId)
      formData.append('document', file)
      formData.append('caption', `EcoSnap: ${caption} | ${new Date().toISOString()}`)

      const response = await fetch(`${this.baseUrl}/sendDocument`, {
        method: 'POST',
        body: formData
      })

      const data = await response.json()
      
      if (data.ok) {
        return {
          success: true,
          file_id: data.result.document.file_id,
          file_name: data.result.document.file_name,
          file_size: data.result.document.file_size,
          message_id: data.result.message_id,
          download_url: await this.getDownloadUrl(data.result.document.file_id)
        }
      } else {
        throw new Error(`Telegram API Error: ${data.description}`)
      }
    } catch (error) {
      console.error('❌ Erro no upload para Telegram:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  // Obter URL de download
  async getDownloadUrl(fileId) {
    try {
      const fileInfo = await fetch(`${this.baseUrl}/getFile?file_id=${fileId}`)
      const data = await fileInfo.json()
      
      if (data.ok) {
        return `https://api.telegram.org/file/bot${this.botToken}/${data.result.file_path}`
      }
      throw new Error('Erro ao obter URL de download')
    } catch (error) {
      console.error('❌ Erro ao obter URL:', error)
      return null
    }
  }

  // Upload de imagem com compressão
  async uploadImage(file, caption = '') {
    // Comprimir imagem antes do upload
    const compressedFile = await this.compressImage(file)
    return await this.uploadFile(compressedFile, caption)
  }

  // Comprimir imagem
  async compressImage(file, maxWidth = 1200, quality = 0.8) {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const img = new Image()
      
      img.onload = () => {
        // Calcular novo tamanho mantendo proporção
        const ratio = Math.min(maxWidth / img.width, maxWidth / img.height)
        canvas.width = img.width * ratio
        canvas.height = img.height * ratio
        
        // Desenhar imagem redimensionada
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        
        // Converter para blob com qualidade reduzida
        canvas.toBlob(resolve, 'image/jpeg', quality)
      }
      
      img.src = URL.createObjectURL(file)
    })
  }

  // Upload múltiplo
  async uploadMultipleFiles(files, caption = '') {
    const results = []
    
    for (const file of files) {
      const result = file.type.startsWith('image/') 
        ? await this.uploadImage(file, caption)
        : await this.uploadFile(file, caption)
      
      results.push(result)
    }
    
    return results
  }

  // Deletar arquivo (deletar mensagem)
  async deleteFile(messageId) {
    try {
      const response = await fetch(`${this.baseUrl}/deleteMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: this.chatId,
          message_id: messageId
        })
      })

      const data = await response.json()
      return data.ok
    } catch (error) {
      console.error('❌ Erro ao deletar arquivo:', error)
      return false
    }
  }

  // Verificar se serviço está configurado
  isConfigured() {
    return !!(this.botToken && this.chatId)
  }

  // Teste de conexão
  async testConnection() {
    if (!this.isConfigured()) {
      return { success: false, error: 'Telegram não configurado' }
    }

    try {
      const response = await fetch(`${this.baseUrl}/getMe`)
      const data = await response.json()
      
      if (data.ok) {
        return { 
          success: true, 
          bot_name: data.result.first_name,
          bot_username: data.result.username
        }
      } else {
        return { success: false, error: data.description }
      }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }
}

// Instância singleton
export const telegramStorage = new TelegramStorage()

// Funções utilitárias
export const uploadToTelegram = (file, caption) => telegramStorage.uploadFile(file, caption)
export const uploadImageToTelegram = (file, caption) => telegramStorage.uploadImage(file, caption)
export const uploadMultipleToTelegram = (files, caption) => telegramStorage.uploadMultipleFiles(files, caption)
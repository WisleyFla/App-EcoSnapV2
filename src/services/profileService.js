// src/services/profileService.js
import { supabase } from '../lib/supabase';

// Configurações para Telegram Storage
const TELEGRAM_CONFIG = {
  BOT_TOKEN: import.meta.env.VITE_TELEGRAM_BOT_TOKEN,
  CHAT_ID: import.meta.env.VITE_TELEGRAM_CHAT_ID,
  MAX_FILE_SIZE: 20 * 1024 * 1024, // 20MB (limite do Telegram)
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
};

// ===================================
// CARREGAR PERFIL DO USUÁRIO
// ===================================
export const loadUserProfile = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Erro ao carregar perfil:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Erro inesperado ao carregar perfil:', error);
    return { success: false, error: error.message };
  }
};

// ===================================
// SALVAR PERFIL DO USUÁRIO
// ===================================
export const saveUserProfile = async (userId, profileData) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .update({
        display_name: profileData.display_name,
        username: profileData.username,
        bio: profileData.bio,
        institution: profileData.institution,
        website: profileData.website,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('Erro ao salvar perfil:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Erro inesperado ao salvar perfil:', error);
    return { success: false, error: error.message };
  }
};

// ===================================
// CARREGAR CONFIGURAÇÕES
// ===================================
export const loadUserSettings = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('preferences')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Erro ao carregar configurações:', error);
      return { success: false, error: error.message };
    }

    const defaultSettings = {
      pushNotifications: true,
      publicProfile: true,
      locationPhotos: false,
      offlineMode: false,
      syncDiary: true,
      theme: 'auto'
    };

    const settings = data?.preferences || defaultSettings;
    return { success: true, settings };
  } catch (error) {
    console.error('Erro inesperado ao carregar configurações:', error);
    return { success: false, error: error.message };
  }
};

// ===================================
// SALVAR CONFIGURAÇÕES
// ===================================
export const saveUserSettings = async (userId, settings) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .update({
        preferences: settings,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('Erro ao salvar configurações:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Erro inesperado ao salvar configurações:', error);
    return { success: false, error: error.message };
  }
};

// ===================================
// UPLOAD DE IMAGEM VIA TELEGRAM (COM DEBUG)
// ===================================
export const updateProfileImage = async (userId, file, onProgress = null) => {
  try {
    console.log('🔄 Iniciando upload de avatar via Telegram...');
    
    // Verificar configurações
    if (!TELEGRAM_CONFIG.BOT_TOKEN || !TELEGRAM_CONFIG.CHAT_ID) {
      throw new Error('Configurações do Telegram não encontradas. Verifique o arquivo .env');
    }

    console.log('✅ Configurações do Telegram OK');

    // Validações...
    if (!file) throw new Error('Nenhum arquivo selecionado');
    if (!TELEGRAM_CONFIG.ALLOWED_IMAGE_TYPES.includes(file.type)) {
      throw new Error('Tipo de arquivo não permitido. Use JPEG, PNG ou WebP.');
    }
    if (file.size > TELEGRAM_CONFIG.MAX_FILE_SIZE) {
      throw new Error('Arquivo muito grande. Máximo: 20MB');
    }

    if (onProgress) onProgress(10);

    // PRIMEIRO: Verificar se há avatar anterior para deletar
    console.log('🔍 Verificando avatar anterior...');
    try {
      const { data: currentUser, error } = await supabase
        .from('users')
        .select('avatar_url, preferences')
        .eq('id', userId)
        .single();

      if (error) {
        console.warn('⚠️ Erro ao buscar usuário atual:', error);
      } else {
        console.log('📄 Dados atuais do usuário:', {
          hasAvatar: !!currentUser?.avatar_url,
          avatarUrl: currentUser?.avatar_url,
          preferences: currentUser?.preferences
        });

        // Se tem avatar anterior do Telegram, tentar deletar
        if (currentUser?.avatar_url?.includes('api.telegram.org')) {
          const messageId = currentUser?.preferences?.telegram_message_id;
          
          console.log('🗑️ Tentando deletar avatar anterior...');
          console.log('Message ID para deletar:', messageId);
          
          if (messageId) {
            const deletePayload = {
              chat_id: TELEGRAM_CONFIG.CHAT_ID,
              message_id: messageId
            };
            
            console.log('📤 Enviando requisição de deleção:', deletePayload);
            
            const deleteResponse = await fetch(
              `https://api.telegram.org/bot${TELEGRAM_CONFIG.BOT_TOKEN}/deleteMessage`,
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(deletePayload)
              }
            );

            const deleteResult = await deleteResponse.json();
            console.log('📥 Resposta da deleção:', deleteResult);
            
            if (deleteResult.ok) {
              console.log('✅ Avatar anterior deletado com sucesso!');
            } else {
              console.warn('⚠️ Falha ao deletar avatar anterior:', deleteResult);
            }
          } else {
            console.warn('⚠️ Message ID não encontrado, não é possível deletar');
          }
        }
      }
    } catch (deleteError) {
      console.warn('⚠️ Erro ao tentar deletar avatar anterior:', deleteError);
    }

    if (onProgress) onProgress(30);

    // Preparar upload
    console.log('📤 Preparando upload para Telegram...');
    const formData = new FormData();
    formData.append('chat_id', TELEGRAM_CONFIG.CHAT_ID);
    formData.append('photo', file);
    formData.append('caption', `🖼️ Avatar: ${userId}\n📅 ${new Date().toLocaleString('pt-BR')}`);

    console.log('📡 Enviando para Telegram...');
    
    // Enviar para o Telegram
    const telegramResponse = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_CONFIG.BOT_TOKEN}/sendPhoto`,
      {
        method: 'POST',
        body: formData
      }
    );

    if (onProgress) onProgress(60);

    if (!telegramResponse.ok) {
      const errorData = await telegramResponse.json();
      console.error('❌ Erro na resposta do Telegram:', errorData);
      throw new Error(`Erro do Telegram: ${errorData.description || 'Erro desconhecido'}`);
    }

    const telegramData = await telegramResponse.json();
    console.log('📥 Resposta completa do Telegram:', telegramData);
    
    if (!telegramData.ok) {
      throw new Error(`Erro do Telegram: ${telegramData.description || 'Falha no upload'}`);
    }

    if (onProgress) onProgress(80);

    // Extrair dados
    const photo = telegramData.result.photo;
    const largestPhoto = photo[photo.length - 1];
    const fileId = largestPhoto.file_id;
    const messageId = telegramData.result.message_id;

    console.log('📋 Dados extraídos:', {
      fileId,
      messageId,
      photoSizes: photo.length
    });

    // Obter URL do arquivo
    const fileResponse = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_CONFIG.BOT_TOKEN}/getFile?file_id=${fileId}`
    );

    if (!fileResponse.ok) {
      throw new Error('Erro ao obter URL da imagem do Telegram');
    }

    const fileData = await fileResponse.json();
    console.log('📥 Dados do arquivo:', fileData);
    
    if (!fileData.ok) {
      throw new Error('Erro ao processar arquivo do Telegram');
    }

    const imageURL = `https://api.telegram.org/file/bot${TELEGRAM_CONFIG.BOT_TOKEN}/${fileData.result.file_path}`;
    console.log('🔗 URL final da imagem:', imageURL);

    if (onProgress) onProgress(90);

    // Atualizar banco com dados do Telegram
    const currentPreferencesResult = await supabase
      .from('users')
      .select('preferences')
      .eq('id', userId)
      .single();

    const currentPreferences = currentPreferencesResult.data?.preferences || {};
    
    const updatePayload = {
      avatar_url: imageURL,
      preferences: {
        ...currentPreferences,
        telegram_message_id: messageId,
        telegram_file_id: fileId
      },
      updated_at: new Date().toISOString()
    };

    console.log('💾 Atualizando banco de dados:', updatePayload);

    const { data: updateData, error: updateError } = await supabase
      .from('users')
      .update(updatePayload)
      .eq('id', userId)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Erro ao atualizar perfil:', updateError);
      throw new Error(updateError.message);
    }

    console.log('✅ Perfil atualizado com sucesso:', updateData);

    if (onProgress) onProgress(100);

    return {
      success: true,
      imageURL: imageURL,
      data: updateData,
      telegramData: {
        messageId: messageId,
        fileId: fileId,
        filePath: fileData.result.file_path
      }
    };

  } catch (error) {
    console.error('❌ Erro completo no upload:', error);
    throw error;
  }
};

// ===================================
// REMOVER IMAGEM (COM DEBUG)
// ===================================
export const removeProfileImage = async (userId) => {
  try {
    console.log('🗑️ Iniciando remoção de avatar...');
    
    // Obter dados atuais
    const { data: userData, error: fetchError } = await supabase
      .from('users')
      .select('avatar_url, preferences')
      .eq('id', userId)
      .single();

    if (fetchError) {
      console.error('❌ Erro ao buscar dados do usuário:', fetchError);
      throw new Error(fetchError.message);
    }

    console.log('📄 Dados do usuário para remoção:', {
      hasAvatar: !!userData?.avatar_url,
      avatarUrl: userData?.avatar_url,
      preferences: userData?.preferences
    });

    if (!userData?.avatar_url) {
      console.log('ℹ️ Nenhuma imagem para remover');
      return { success: true, message: 'Nenhuma imagem para remover' };
    }

    let telegramDeleted = false;

    // Tentar deletar do Telegram
    if (userData.avatar_url.includes('api.telegram.org')) {
      const messageId = userData.preferences?.telegram_message_id;
      
      console.log('🔍 Dados para deleção do Telegram:', {
        messageId,
        chatId: TELEGRAM_CONFIG.CHAT_ID,
        botToken: TELEGRAM_CONFIG.BOT_TOKEN ? 'Configurado' : 'Não configurado'
      });
      
      if (messageId) {
        try {
          const deletePayload = {
            chat_id: TELEGRAM_CONFIG.CHAT_ID,
            message_id: messageId
          };
          
          console.log('📤 Enviando requisição de deleção:', deletePayload);
          
          const deleteResponse = await fetch(
            `https://api.telegram.org/bot${TELEGRAM_CONFIG.BOT_TOKEN}/deleteMessage`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(deletePayload)
            }
          );

          const deleteData = await deleteResponse.json();
          console.log('📥 Resposta da deleção:', deleteData);
          
          if (deleteData.ok) {
            telegramDeleted = true;
            console.log('✅ Imagem deletada com sucesso do Telegram!');
          } else {
            console.warn('⚠️ Falha na deleção do Telegram:', deleteData);
          }
        } catch (telegramError) {
          console.error('❌ Erro na comunicação com Telegram:', telegramError);
        }
      } else {
        console.warn('⚠️ Message ID não encontrado, não é possível deletar do Telegram');
      }
    } else {
      console.log('ℹ️ Avatar não é do Telegram, apenas removendo do perfil');
    }

    // Limpar dados do banco
    const currentPreferences = userData.preferences || {};
    delete currentPreferences.telegram_message_id;
    delete currentPreferences.telegram_file_id;

    console.log('💾 Atualizando banco para remover avatar...');

    const { data: updateData, error: updateError } = await supabase
      .from('users')
      .update({
        avatar_url: null,
        preferences: currentPreferences,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Erro ao atualizar perfil:', updateError);
      throw new Error(updateError.message);
    }

    console.log('✅ Banco atualizado com sucesso:', updateData);

    const message = telegramDeleted 
      ? '✅ Avatar removido completamente (incluindo do Telegram)' 
      : '⚠️ Avatar removido do perfil (pode permanecer no Telegram)';

    console.log('🎯 Resultado final:', message);

    return { 
      success: true, 
      data: updateData,
      telegramDeleted,
      message
    };

  } catch (error) {
    console.error('❌ Erro completo na remoção:', error);
    throw error;
  }
};

// ===================================
// OBTER ESTATÍSTICAS DO USUÁRIO
// ===================================
export const getUserStats = async (userId) => {
  try {
    const stats = {
      posts: 0,
      followers: 0,
      following: 0,
      points: 0
    };

    return { success: true, stats };

  } catch (error) {
    console.error('Erro ao obter estatísticas:', error);
    return { 
      success: false, 
      error: error.message,
      stats: { posts: 0, followers: 0, following: 0, points: 0 }
    };
  }
};

// ===================================
// VERIFICAR SE USERNAME ESTÁ DISPONÍVEL
// ===================================
export const checkUsernameAvailability = async (username, currentUserId = null) => {
  try {
    let query = supabase
      .from('users')
      .select('id')
      .eq('username', username);

    if (currentUserId) {
      query = query.neq('id', currentUserId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Erro ao verificar username:', error);
      return { success: false, error: error.message };
    }

    const available = !data || data.length === 0;
    return { success: true, available };

  } catch (error) {
    console.error('Erro inesperado ao verificar username:', error);
    return { success: false, error: error.message };
  }
};

// ===================================
// BUSCAR PERFIL PÚBLICO DE OUTRO USUÁRIO
// ===================================
export const getPublicProfile = async (username) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select(`
        id,
        username,
        display_name,
        bio,
        avatar_url,
        institution,
        website,
        role,
        created_at
      `)
      .eq('username', username)
      .single();

    if (error) {
      console.error('Erro ao buscar perfil público:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data };

  } catch (error) {
    console.error('Erro inesperado ao buscar perfil público:', error);
    return { success: false, error: error.message };
  }
};

// ===================================
// TESTAR CONFIGURAÇÃO DO TELEGRAM
// ===================================
export const testTelegramConfig = async () => {
  try {
    if (!TELEGRAM_CONFIG.BOT_TOKEN) {
      return { success: false, error: 'VITE_TELEGRAM_BOT_TOKEN não configurado' };
    }

    if (!TELEGRAM_CONFIG.CHAT_ID) {
      return { success: false, error: 'VITE_TELEGRAM_CHAT_ID não configurado' };
    }

    // Testar se o bot está ativo
    const response = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_CONFIG.BOT_TOKEN}/getMe`
    );

    if (!response.ok) {
      return { success: false, error: 'Token do bot inválido' };
    }

    const data = await response.json();

    if (!data.ok) {
      return { success: false, error: 'Bot não está ativo' };
    }

    return { 
      success: true, 
      botInfo: data.result,
      config: {
        chatId: TELEGRAM_CONFIG.CHAT_ID,
        maxFileSize: `${TELEGRAM_CONFIG.MAX_FILE_SIZE / 1024 / 1024}MB`
      }
    };

  } catch (error) {
    return { success: false, error: error.message };
  }
};
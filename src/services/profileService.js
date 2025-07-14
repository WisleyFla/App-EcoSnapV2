import { supabase } from '../lib/supabase';

const TELEGRAM_CONFIG = {
  BOT_TOKEN: import.meta.env.VITE_TELEGRAM_BOT_TOKEN,
  CHAT_ID: import.meta.env.VITE_TELEGRAM_CHAT_ID,
  MAX_FILE_SIZE: 20 * 1024 * 1024,
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
};

export const loadUserProfile = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('profiles') // CORRIGIDO
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

export const saveUserProfile = async (userId, profileData) => {
  try {
    const { data, error } = await supabase
      .from('profiles') // CORRIGIDO
      .update({
        full_name: profileData.full_name, // CORRIGIDO para full_name
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

export const loadUserSettings = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('profiles') // CORRIGIDO
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

export const saveUserSettings = async (userId, settings) => {
  try {
    const { data, error } = await supabase
      .from('profiles') // CORRIGIDO
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

export const updateProfileImage = async (userId, file, onProgress = null) => {
  try {
    console.log('🔄 Iniciando upload de avatar via Telegram...');
    
    if (!TELEGRAM_CONFIG.BOT_TOKEN || !TELEGRAM_CONFIG.CHAT_ID) {
      throw new Error('Configurações do Telegram não encontradas. Verifique o arquivo .env');
    }

    if (!file) throw new Error('Nenhum arquivo selecionado');
    if (!TELEGRAM_CONFIG.ALLOWED_IMAGE_TYPES.includes(file.type)) {
      throw new Error('Tipo de arquivo não permitido. Use JPEG, PNG ou WebP.');
    }
    if (file.size > TELEGRAM_CONFIG.MAX_FILE_SIZE) {
      throw new Error('Arquivo muito grande. Máximo: 20MB');
    }

    if (onProgress) onProgress(10);

    try {
      const { data: currentUser } = await supabase
        .from('profiles') // CORRIGIDO
        .select('avatar_url, preferences')
        .eq('id', userId)
        .single();

      if (currentUser?.avatar_url?.includes('api.telegram.org')) {
        const messageId = currentUser?.preferences?.telegram_message_id;
        if (messageId) {
          await fetch(
            `https://api.telegram.org/bot${TELEGRAM_CONFIG.BOT_TOKEN}/deleteMessage`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ chat_id: TELEGRAM_CONFIG.CHAT_ID, message_id: messageId })
            }
          );
        }
      }
    } catch (deleteError) {
      console.warn('⚠️ Erro ao tentar deletar avatar anterior:', deleteError);
    }

    if (onProgress) onProgress(30);

    const formData = new FormData();
    formData.append('chat_id', TELEGRAM_CONFIG.CHAT_ID);
    formData.append('photo', file);
    formData.append('caption', `🖼️ Avatar: ${userId}\n📅 ${new Date().toLocaleString('pt-BR')}`);

    const telegramResponse = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_CONFIG.BOT_TOKEN}/sendPhoto`,
      { method: 'POST', body: formData }
    );

    if (onProgress) onProgress(60);

    if (!telegramResponse.ok) {
      const errorData = await telegramResponse.json();
      throw new Error(`Erro do Telegram: ${errorData.description || 'Erro desconhecido'}`);
    }

    const telegramData = await telegramResponse.json();
    if (!telegramData.ok) throw new Error(`Erro do Telegram: ${telegramData.description || 'Falha no upload'}`);

    if (onProgress) onProgress(80);

    const photo = telegramData.result.photo;
    const largestPhoto = photo[photo.length - 1];
    const fileId = largestPhoto.file_id;
    const messageId = telegramData.result.message_id;

    const fileResponse = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_CONFIG.BOT_TOKEN}/getFile?file_id=${fileId}`
    );
    if (!fileResponse.ok) throw new Error('Erro ao obter URL da imagem do Telegram');

    const fileData = await fileResponse.json();
    if (!fileData.ok) throw new Error('Erro ao processar arquivo do Telegram');

    const imageURL = `https://api.telegram.org/file/bot${TELEGRAM_CONFIG.BOT_TOKEN}/${fileData.result.file_path}`;

    if (onProgress) onProgress(90);

    const { data: currentPreferencesResult } = await supabase
      .from('profiles') // CORRIGIDO
      .select('preferences')
      .eq('id', userId)
      .single();

    const currentPreferences = currentPreferencesResult?.preferences || {};
    
    const updatePayload = {
      avatar_url: imageURL,
      preferences: { ...currentPreferences, telegram_message_id: messageId, telegram_file_id: fileId },
      updated_at: new Date().toISOString()
    };

    const { data: updateData, error: updateError } = await supabase
      .from('profiles') // CORRIGIDO
      .update(updatePayload)
      .eq('id', userId)
      .select()
      .single();

    if (updateError) throw new Error(updateError.message);

    if (onProgress) onProgress(100);

    return {
      success: true,
      imageURL: imageURL,
      data: updateData
    };

  } catch (error) {
    console.error('❌ Erro completo no upload:', error);
    throw error;
  }
};

export const removeProfileImage = async (userId) => {
  try {
    const { data: userData, error: fetchError } = await supabase
      .from('profiles') // CORRIGIDO
      .select('avatar_url, preferences')
      .eq('id', userId)
      .single();

    if (fetchError) throw new Error(fetchError.message);
    if (!userData?.avatar_url) return { success: true, message: 'Nenhuma imagem para remover' };

    let telegramDeleted = false;

    if (userData.avatar_url.includes('api.telegram.org')) {
      const messageId = userData.preferences?.telegram_message_id;
      if (messageId) {
        try {
          const deleteResponse = await fetch(
            `https://api.telegram.org/bot${TELEGRAM_CONFIG.BOT_TOKEN}/deleteMessage`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ chat_id: TELEGRAM_CONFIG.CHAT_ID, message_id: messageId })
            }
          );
          const deleteData = await deleteResponse.json();
          if (deleteData.ok) telegramDeleted = true;
        } catch (telegramError) {
          console.error('❌ Erro na comunicação com Telegram:', telegramError);
        }
      }
    }

    const currentPreferences = userData.preferences || {};
    delete currentPreferences.telegram_message_id;
    delete currentPreferences.telegram_file_id;

    const { data: updateData, error: updateError } = await supabase
      .from('profiles') // CORRIGIDO
      .update({
        avatar_url: null,
        preferences: currentPreferences,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();

    if (updateError) throw new Error(updateError.message);

    const message = telegramDeleted 
      ? '✅ Avatar removido completamente' 
      : '⚠️ Avatar removido do perfil (pode permanecer no Telegram)';

    return { success: true, data: updateData, telegramDeleted, message };

  } catch (error) {
    console.error('❌ Erro completo na remoção:', error);
    throw error;
  }
};

export const getUserStats = async (userId) => {
  try {
    const stats = { posts: 0, followers: 0, following: 0, points: 0 };
    return { success: true, stats };
  } catch (error) {
    console.error('Erro ao obter estatísticas:', error);
    return { success: false, error: error.message, stats: { posts: 0, followers: 0, following: 0, points: 0 }};
  }
};

export const checkUsernameAvailability = async (username, currentUserId = null) => {
  try {
    let query = supabase
      .from('profiles') // CORRIGIDO
      .select('id')
      .eq('username', username);

    if (currentUserId) {
      query = query.neq('id', currentUserId);
    }

    const { data, error } = await query;
    if (error) return { success: false, error: error.message };

    const available = !data || data.length === 0;
    return { success: true, available };

  } catch (error) {
    console.error('Erro inesperado ao verificar username:', error);
    return { success: false, error: error.message };
  }
};

export const getPublicProfile = async (username) => {
  try {
    const { data, error } = await supabase
      .from('profiles') // CORRIGIDO
      .select(`
        id,
        username,
        full_name,
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

export const testTelegramConfig = async () => {
  try {
    if (!TELEGRAM_CONFIG.BOT_TOKEN) {
      return { success: false, error: 'VITE_TELEGRAM_BOT_TOKEN não configurado' };
    }
    if (!TELEGRAM_CONFIG.CHAT_ID) {
      return { success: false, error: 'VITE_TELEGRAM_CHAT_ID não configurado' };
    }
    const response = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_CONFIG.BOT_TOKEN}/getMe`
    );
    if (!response.ok) return { success: false, error: 'Token do bot inválido' };
    const data = await response.json();
    if (!data.ok) return { success: false, error: 'Bot não está ativo' };
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
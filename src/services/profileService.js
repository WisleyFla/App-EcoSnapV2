import { supabase } from '../lib/supabase';

/**
 * Configurações para armazenamento de avatares
 * Usando o bucket 'ecosnap-media' com subpasta 'avatars'
 */
const STORAGE_CONFIG = {
  BUCKET: 'ecosnap-media',
  AVATARS_FOLDER: 'avatars',
  MAX_AVATAR_SIZE: 2 * 1024 * 1024, // 2MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp']
};

/**
 * Carrega os dados completos do perfil do usuário
 * @param {string} userId - ID do usuário
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export const loadUserProfile = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        id,
        username,
        full_name,
        bio,
        avatar_url,
        institution,
        website,
        role,
        created_at,
        preferences
      `)
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

/**
 * Atualiza os dados do perfil do usuário
 * @param {string} userId - ID do usuário
 * @param {object} profileData - Dados do perfil para atualização
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export const saveUserProfile = async (userId, profileData) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .update({
        full_name: profileData.full_name,
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

/**
 * Carrega as configurações do usuário
 * @param {string} userId - ID do usuário
 * @returns {Promise<{success: boolean, settings?: object, error?: string}>}
 */
export const loadUserSettings = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
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

    return { 
      success: true, 
      settings: data?.preferences || defaultSettings 
    };
  } catch (error) {
    console.error('Erro inesperado ao carregar configurações:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Salva as configurações do usuário
 * @param {string} userId - ID do usuário
 * @param {object} settings - Configurações para salvar
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export const saveUserSettings = async (userId, settings) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
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

/**
 * Faz upload de uma nova imagem de perfil para o Supabase Storage
 * @param {string} userId - ID do usuário
 * @param {File} file - Arquivo de imagem
 * @param {function} [onProgress] - Callback para acompanhar progresso (opcional)
 * @returns {Promise<{success: boolean, url?: string, error?: string}>}
 */
export const updateProfileImage = async (userId, file, onProgress = null) => {
  try {
    // Validações do arquivo
    if (!file) throw new Error('Nenhum arquivo selecionado');
    if (!STORAGE_CONFIG.ALLOWED_IMAGE_TYPES.includes(file.type)) {
      throw new Error('Tipo de arquivo não permitido. Use JPEG, PNG ou WebP.');
    }
    if (file.size > STORAGE_CONFIG.MAX_AVATAR_SIZE) {
      throw new Error(`Tamanho máximo permitido: ${STORAGE_CONFIG.MAX_AVATAR_SIZE / 1024 / 1024}MB`);
    }

    if (onProgress) onProgress(10);

    // Remove imagem anterior se existir
    const { data: currentProfile } = await supabase
      .from('profiles')
      .select('avatar_url')
      .eq('id', userId)
      .single();

    if (currentProfile?.avatar_url) {
      try {
        await removeProfileImage(userId);
      } catch (error) {
        console.warn('Não foi possível remover avatar anterior:', error);
      }
    }

    if (onProgress) onProgress(30);

    // Prepara o nome do arquivo
    const fileExt = file.name.split('.').pop();
    const fileName = `${STORAGE_CONFIG.AVATARS_FOLDER}/${userId}_${Date.now()}.${fileExt}`;

    // Faz upload para o storage
    const { error: uploadError } = await supabase.storage
      .from(STORAGE_CONFIG.BUCKET)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: true,
        contentType: file.type
      });

    if (uploadError) throw uploadError;

    if (onProgress) onProgress(70);

    // Obtém URL pública
    const { data: { publicUrl } } = supabase.storage
      .from(STORAGE_CONFIG.BUCKET)
      .getPublicUrl(fileName);

    // Atualiza o perfil com a nova URL
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        avatar_url: publicUrl,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (updateError) throw updateError;

    if (onProgress) onProgress(100);

    return { 
      success: true, 
      url: publicUrl,
      path: fileName // Retorna o caminho para possível deleção futura
    };

  } catch (error) {
    console.error('Erro no upload do avatar:', error);
    throw error;
  }
};

/**
 * Remove a imagem de perfil do usuário
 * @param {string} userId - ID do usuário
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const removeProfileImage = async (userId) => {
  try {
    // Busca a URL atual do avatar
    const { data: user, error: fetchError } = await supabase
      .from('profiles')
      .select('avatar_url')
      .eq('id', userId)
      .single();

    if (fetchError) throw fetchError;
    if (!user?.avatar_url) return { success: true };

    // Extrai o caminho do arquivo da URL
    const url = new URL(user.avatar_url);
    const filePath = url.pathname.split(`${STORAGE_CONFIG.BUCKET}/`).pop();

    // Remove do storage
    const { error: deleteError } = await supabase.storage
      .from(STORAGE_CONFIG.BUCKET)
      .remove([filePath]);

    if (deleteError) throw deleteError;

    // Remove a referência no perfil
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        avatar_url: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (updateError) throw updateError;

    return { success: true };

  } catch (error) {
    console.error('Erro ao remover avatar:', error);
    throw error;
  }
};

/**
 * Obtém estatísticas do usuário (posts, seguidores, etc.)
 * @param {string} userId - ID do usuário
 * @returns {Promise<{success: boolean, stats?: object, error?: string}>}
 */
export const getUserStats = async (userId) => {
  try {
    // Implementação básica - adapte conforme sua estrutura de banco
    const stats = {
      posts: 0,
      followers: 0,
      following: 0,
      points: 0
    };

    // Exemplo de consulta real (descomente e adapte):
    // const { count: posts } = await supabase
    //   .from('posts')
    //   .select('*', { count: 'exact' })
    //   .eq('user_id', userId);
    // stats.posts = posts || 0;

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

/**
 * Verifica se um nome de usuário está disponível
 * @param {string} username - Nome de usuário a verificar
 * @param {string} [currentUserId] - ID do usuário atual (para evitar conflito)
 * @returns {Promise<{success: boolean, available?: boolean, error?: string}>}
 */
export const checkUsernameAvailability = async (username, currentUserId = null) => {
  try {
    let query = supabase
      .from('profiles')
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

    return { 
      success: true, 
      available: !data || data.length === 0 
    };
  } catch (error) {
    console.error('Erro ao verificar username:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Busca um perfil público pelo nome de usuário
 * @param {string} username - Nome de usuário para buscar
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export const getPublicProfile = async (username) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        id,
        username,
        full_name,
        bio,
        avatar_url,
        institution,
        website,
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
    console.error('Erro ao buscar perfil público:', error);
    return { success: false, error: error.message };
  }
};
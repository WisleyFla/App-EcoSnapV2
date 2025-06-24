// src/services/profileService.js
// ATUALIZADO: Usando Supabase ao invés de Firebase Firestore

import { supabase } from '../lib/supabase';
import { uploadProfileImage, deleteProfileImage } from './imageService';

// Função para salvar dados do perfil no Supabase
export const saveUserProfile = async (userId, profileData) => {
  try {
    // Dados a serem salvos
    const dataToSave = {
      ...profileData,
      updated_at: new Date().toISOString(),
      id: userId // Garantir que o ID está correto
    };
    
    // Usar upsert (insert ou update)
    const { data, error } = await supabase
      .from('users')
      .upsert(dataToSave)
      .select()
      .single();
    
    if (error) throw error;
    
    console.log('Perfil salvo com sucesso no Supabase:', data);
    return { success: true, data };
  } catch (error) {
    console.error('Erro ao salvar perfil:', error);
    throw new Error('Erro ao salvar perfil: ' + error.message);
  }
};

// Função para carregar dados do perfil do Supabase
export const loadUserProfile = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error && error.code !== 'PGRST116') { // PGRST116 = not found
      throw error;
    }
    
    if (data) {
      console.log('Perfil carregado do Supabase:', data);
      return {
        success: true,
        data: data
      };
    } else {
      // Usuário não tem perfil salvo ainda
      console.log('Nenhum perfil encontrado para este usuário');
      return {
        success: true,
        data: null
      };
    }
  } catch (error) {
    console.error('Erro ao carregar perfil:', error);
    throw new Error('Erro ao carregar perfil: ' + error.message);
  }
};

// Função para atualizar apenas campos específicos do perfil
export const updateUserProfile = async (userId, updates) => {
  try {
    const updateData = {
      ...updates,
      updated_at: new Date().toISOString()
    };
    
    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', userId)
      .select()
      .single();
    
    if (error) throw error;
    
    console.log('Perfil atualizado com sucesso:', data);
    return { success: true, data };
  } catch (error) {
    console.error('Erro ao atualizar perfil:', error);
    throw new Error('Erro ao atualizar perfil: ' + error.message);
  }
};

// Função para fazer upload de foto de perfil
export const updateProfileImage = async (userId, file, onProgress = null) => {
  try {
    // Primeiro, carregar perfil atual para ver se já tem foto
    const currentProfile = await loadUserProfile(userId);
    
    // Se já tem foto, deletar a anterior
    if (currentProfile.data?.profile_image_message_id) {
      await deleteProfileImage(currentProfile.data.profile_image_message_id);
    }
    
    // Fazer upload da nova imagem
    const imageResult = await uploadProfileImage(userId, file, onProgress);
    
    // Atualizar perfil do usuário com dados da nova imagem
    const updateData = {
      avatar_url: imageResult.url,
      profile_image_file_id: imageResult.file_id,
      profile_image_message_id: imageResult.message_id,
      has_profile_image: true
    };
    
    await updateUserProfile(userId, updateData);
    
    console.log('Foto de perfil atualizada com sucesso');
    return {
      success: true,
      imageURL: imageResult.url,
      imageData: imageResult
    };
  } catch (error) {
    console.error('Erro ao atualizar foto de perfil:', error);
    throw error;
  }
};

// Função para remover foto de perfil
export const removeProfileImage = async (userId) => {
  try {
    // Carregar perfil atual
    const currentProfile = await loadUserProfile(userId);
    
    if (currentProfile.data?.profile_image_message_id) {
      // Deletar imagem do Telegram
      await deleteProfileImage(currentProfile.data.profile_image_message_id);
    }
    
    // Atualizar perfil do usuário
    const updateData = {
      avatar_url: null,
      profile_image_file_id: null,
      profile_image_message_id: null,
      has_profile_image: false
    };
    
    await updateUserProfile(userId, updateData);
    
    console.log('Foto de perfil removida com sucesso');
    return { success: true };
  } catch (error) {
    console.error('Erro ao remover foto de perfil:', error);
    throw error;
  }
};

// Função para verificar se um nome de usuário já existe
export const checkUsernameAvailability = async (username, currentUserId) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .eq('username', username)
      .neq('id', currentUserId) // Excluir o usuário atual
      .limit(1);
    
    if (error) throw error;
    
    const available = !data || data.length === 0;
    
    console.log('Verificação de username:', { username, available });
    return { available };
  } catch (error) {
    console.error('Erro ao verificar username:', error);
    return { available: false }; // Assume não disponível em caso de erro
  }
};

// Função para buscar usuários por filtros
export const searchUsers = async (searchTerm, filters = {}) => {
  try {
    let query = supabase
      .from('users')
      .select('id, username, display_name, avatar_url, bio, role, institution, specialization')
      .limit(20);
    
    // Buscar por nome ou username
    if (searchTerm) {
      query = query.or(`display_name.ilike.%${searchTerm}%,username.ilike.%${searchTerm}%`);
    }
    
    // Filtros adicionais
    if (filters.role) {
      query = query.eq('role', filters.role);
    }
    
    if (filters.institution) {
      query = query.eq('institution', filters.institution);
    }
    
    if (filters.specialization) {
      query = query.contains('specialization', [filters.specialization]);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    return { success: true, data: data || [] };
  } catch (error) {
    console.error('Erro ao buscar usuários:', error);
    throw new Error('Erro ao buscar usuários: ' + error.message);
  }
};

// Função para obter estatísticas do usuário
export const getUserStats = async (userId) => {
  try {
    // Buscar contagem de posts
    const { count: postsCount } = await supabase
      .from('posts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);
    
    // Buscar contagem de seguidores
    const { count: followersCount } = await supabase
      .from('user_relationships')
      .select('*', { count: 'exact', head: true })
      .eq('following_id', userId)
      .eq('relationship_type', 'follow');
    
    // Buscar contagem de seguindo
    const { count: followingCount } = await supabase
      .from('user_relationships')
      .select('*', { count: 'exact', head: true })
      .eq('follower_id', userId)
      .eq('relationship_type', 'follow');
    
    // Buscar total de likes recebidos
    const { data: likesData } = await supabase
      .from('reactions')
      .select('post_id, posts!inner(user_id)')
      .eq('posts.user_id', userId)
      .eq('type', 'like');
    
    return {
      success: true,
      stats: {
        posts: postsCount || 0,
        followers: followersCount || 0,
        following: followingCount || 0,
        likes: likesData?.length || 0
      }
    };
  } catch (error) {
    console.error('Erro ao carregar estatísticas:', error);
    return {
      success: false,
      stats: { posts: 0, followers: 0, following: 0, likes: 0 }
    };
  }
};

// Função para seguir/desseguir usuário
export const toggleFollow = async (followerId, followingId) => {
  try {
    // Verificar se já segue
    const { data: existing } = await supabase
      .from('user_relationships')
      .select('id')
      .eq('follower_id', followerId)
      .eq('following_id', followingId)
      .eq('relationship_type', 'follow')
      .single();
    
    if (existing) {
      // Já segue, então desseguir
      const { error } = await supabase
        .from('user_relationships')
        .delete()
        .eq('id', existing.id);
      
      if (error) throw error;
      return { success: true, action: 'unfollowed' };
    } else {
      // Não segue, então seguir
      const { error } = await supabase
        .from('user_relationships')
        .insert({
          follower_id: followerId,
          following_id: followingId,
          relationship_type: 'follow'
        });
      
      if (error) throw error;
      return { success: true, action: 'followed' };
    }
  } catch (error) {
    console.error('Erro ao seguir/desseguir:', error);
    throw new Error('Erro ao atualizar relacionamento: ' + error.message);
  }
};

// Função para verificar se usuário A segue usuário B
export const checkIfFollowing = async (followerId, followingId) => {
  try {
    const { data, error } = await supabase
      .from('user_relationships')
      .select('id')
      .eq('follower_id', followerId)
      .eq('following_id', followingId)
      .eq('relationship_type', 'follow')
      .single();
    
    return { isFollowing: !!data };
  } catch (error) {
    return { isFollowing: false };
  }
};

// Função para salvar configurações do usuário
export const saveUserSettings = async (userId, settings) => {
  try {
    const { error } = await supabase
      .from('users')
      .update({
        settings: settings,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);
    
    if (error) throw error;
    
    console.log('Configurações salvas com sucesso');
    return { success: true };
  } catch (error) {
    console.error('Erro ao salvar configurações:', error);
    throw new Error('Erro ao salvar configurações: ' + error.message);
  }
};

// Função para carregar configurações do usuário
export const loadUserSettings = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('settings')
      .eq('id', userId)
      .single();
    
    if (error && error.code !== 'PGRST116') {
      throw error;
    }
    
    return {
      success: true,
      settings: data?.settings || {}
    };
  } catch (error) {
    console.error('Erro ao carregar configurações:', error);
    throw new Error('Erro ao carregar configurações: ' + error.message);
  }
};

// Função para obter perfil completo (com stats)
export const getCompleteUserProfile = async (userId, viewerId = null) => {
  try {
    // Carregar perfil básico
    const profileResult = await loadUserProfile(userId);
    
    if (!profileResult.success || !profileResult.data) {
      return { success: false, data: null };
    }
    
    // Carregar estatísticas
    const statsResult = await getUserStats(userId);
    
    let isFollowing = false;
    if (viewerId && viewerId !== userId) {
      const followResult = await checkIfFollowing(viewerId, userId);
      isFollowing = followResult.isFollowing;
    }
    
    return {
      success: true,
      data: {
        ...profileResult.data,
        stats: statsResult.stats,
        isFollowing
      }
    };
  } catch (error) {
    console.error('Erro ao carregar perfil completo:', error);
    throw error;
  }
};
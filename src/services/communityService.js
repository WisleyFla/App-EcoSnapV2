import { supabase } from '../lib/supabase';

export const communityService = {
  // ... (as funções getCommunities, getCommunityDetails, getCommunityPosts continuam as mesmas)
  async getCommunities() {
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase.from('communities').select(`id,name,description,avatar_url,community_members ( user_id )`).order('created_at', { ascending: false });
    if (error) { console.error("Supabase error fetching communities:", error); throw error; }
    if (!data) return [];
    return data.map(community => {
      const members = community.community_members || []; 
      const isMember = user ? members.some(m => m.user_id === user.id) : false;
      return { ...community, members_count: members.length, is_member: isMember };
    });
  },
  async getCommunityDetails(communityId) {
    const { data, error } = await supabase.from('communities').select(`*,profiles!created_by ( full_name, username )`).eq('id', communityId).single();
    if (error) { console.error("Supabase error fetching community details:", error); throw error; }
    return data;
  },
  async getCommunityPosts(communityId) {
    const { data, error } = await supabase.from('posts').select(`*,profiles!user_id (id, full_name, username, avatar_url),likes:likes(count),comments:comments(count)`).eq('community_id', communityId).order('created_at', { ascending: false });
    if (error) { console.error("Supabase error fetching community posts:", error); throw error; }
    return data.map(post => ({ ...post, user_has_liked: false, likes_count: post.likes[0]?.count || 0, comments_count: post.comments[0]?.count || 0, }));
  },
  async createCommunity({ name, description, avatarFile }) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado');
    let avatar_url = null;
    if (avatarFile) {
      const filePath = `community-avatars/${user.id}/${Date.now()}-${avatarFile.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage.from('ecosnap-media').upload(filePath, avatarFile);
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from('ecosnap-media').getPublicUrl(uploadData.path);
      avatar_url = urlData.publicUrl;
    }
    const { data: communityData, error: communityError } = await supabase.from('communities').insert({ name, description, avatar_url, created_by: user.id }).select().single();
    if (communityError) throw communityError;
    await supabase.from('community_members').insert({ community_id: communityData.id, user_id: user.id, role: 'admin' });
    return communityData;
  },

  // --- [NOVA FUNÇÃO] ---
  async updateCommunity(communityId, { name, description, newAvatarFile }) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado');

    const dataToUpdate = { name, description };

    // Se um novo arquivo de avatar foi enviado, faça o upload
    if (newAvatarFile) {
      // Opcional: deletar o avatar antigo aqui se desejar
      const filePath = `community-avatars/${user.id}/${Date.now()}-${newAvatarFile.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('ecosnap-media')
        .upload(filePath, newAvatarFile);
      
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('ecosnap-media').getPublicUrl(uploadData.path);
      dataToUpdate.avatar_url = urlData.publicUrl;
    }

    const { data, error } = await supabase
      .from('communities')
      .update(dataToUpdate)
      .eq('id', communityId)
      .select()
      .single();

    if (error) {
      console.error("Erro ao atualizar comunidade:", error);
      throw error;
    }

    return data;
  },

  // --- [NOVA FUNÇÃO] ---
  // Apaga uma comunidade. A RLS garante que apenas o dono pode fazer isso.
  async deleteCommunity(communityId) {
    const { error } = await supabase
      .from('communities')
      .delete()
      .eq('id', communityId);

    if (error) {
      console.error("Erro ao deletar comunidade:", error);
      throw error;
    }
    return true;
  },

  // --- [NOVA FUNÇÃO] ---
  // Entrar ou sair de uma comunidade.
  async toggleMembership(communityId, userId, isMember) {
    if (!userId) throw new Error('Usuário não autenticado');

    if (isMember) {
      // Sair da comunidade
      const { error } = await supabase.from('community_members')
        .delete()
        .eq('community_id', communityId)
        .eq('user_id', userId);
      if (error) throw error;
      return { joined: false };
    } else {
      // Entrar na comunidade
      const { error } = await supabase.from('community_members')
        .insert({ community_id: communityId, user_id: userId });
      if (error) throw error;
      return { joined: true };
    }
  },

  // --- [NOVA FUNÇÃO] ---
  // Verifica se o usuário atual é membro de uma comunidade específica
  async checkMembership(communityId, userId) {
    if (!userId) return { isMember: false, isOwner: false };

    const { data, error } = await supabase
      .from('community_members')
      .select('role, communities(created_by)')
      .eq('community_id', communityId)
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') { // Ignora erro de "nenhuma linha encontrada"
      console.error("Erro ao verificar membresia:", error);
      throw error;
    }

    const isMember = !!data;
    const isOwner = data?.communities?.created_by === userId;

    return { isMember, isOwner };
  }
};
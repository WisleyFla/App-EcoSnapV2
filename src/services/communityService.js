import { supabase } from '../lib/supabase';

export const communityService = {
  // ... (a função getCommunities continua a mesma)
  async getCommunities() {
    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from('communities')
      .select(`
        id,
        name,
        description,
        avatar_url,
        community_members ( user_id )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Supabase error fetching communities:", error);
      throw error;
    }

    if (!data) return [];

    return data.map(community => {
      const members = community.community_members || []; 
      const isMember = user ? members.some(m => m.user_id === user.id) : false;
      return {
        ...community,
        members_count: members.length,
        is_member: isMember
      };
    });
  },

  /**
   * Busca os detalhes de uma única comunidade.
   * -- VERSÃO CORRIGIDA PARA AMBIGUIDADE --
   */
  async getCommunityDetails(communityId) {
    const { data, error } = await supabase
      .from('communities')
      // CORREÇÃO: Especificamos que queremos o perfil da coluna "created_by"
      .select(`
        *,
        profiles!created_by ( full_name, username )
      `)
      .eq('id', communityId)
      .single();

    if (error) {
      console.error("Supabase error fetching community details:", error);
      throw error;
    }
    return data;
  },

  /**
   * Busca os posts de uma comunidade.
   * -- VERSÃO CORRIGIDA PARA AMBIGUIDADE --
   */
  async getCommunityPosts(communityId) {
    const { data, error } = await supabase
      .from('posts')
      // CORREÇÃO: Usamos a sintaxe mais explícita para o perfil do autor do post
      .select(`
        *,
        profiles!user_id (id, full_name, username, avatar_url),
        likes:likes(count),
        comments:comments(count)
      `)
      .eq('community_id', communityId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Supabase error fetching community posts:", error);
      throw error;
    }

    return data.map(post => ({
        ...post,
        user_has_liked: false, 
        likes_count: post.likes[0]?.count || 0,
        comments_count: post.comments[0]?.count || 0,
    }));
  },
  
  // ... (o resto do arquivo, como createCommunity e toggleMembership, continua igual)
  async createCommunity({ name, description, avatarFile }) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado');

    let avatar_url = null;
    if (avatarFile) {
      const filePath = `community-avatars/${user.id}/${Date.now()}-${avatarFile.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('ecosnap-media')
        .upload(filePath, avatarFile);
      
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('ecosnap-media')
        .getPublicUrl(uploadData.path);
      avatar_url = urlData.publicUrl;
    }
    
    const { data: communityData, error: communityError } = await supabase
      .from('communities')
      .insert({
        name,
        description,
        avatar_url,
        created_by: user.id
      })
      .select()
      .single();
      
    if (communityError) throw communityError;

    await supabase.from('community_members').insert({
        community_id: communityData.id,
        user_id: user.id,
        role: 'admin'
    });

    return communityData;
  },

  async toggleMembership(communityId, isMember) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado');

    if (isMember) {
      const { error } = await supabase.from('community_members')
        .delete()
        .eq('community_id', communityId)
        .eq('user_id', user.id);
      if (error) throw error;
    } else {
      const { error } = await supabase.from('community_members')
        .insert({ community_id: communityId, user_id: user.id });
      if (error) throw error;
    }
  }
};
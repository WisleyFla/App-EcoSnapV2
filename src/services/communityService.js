import { supabase } from '../lib/supabase';

export const communityService = {
  async getCommunities(userId) {
    const { data, error } = await supabase
      .from('communities')
      .select(`
        *,
        community_members!inner(
          user_id
        ),
        posts:posts(count)
      `)
      .eq('community_members.user_id', userId);

    return { data, error };
  },

  async createCommunity({ name, description, avatarFile, userId }) {
    // Upload da imagem se existir
    let avatarUrl = null;
    if (avatarFile) {
      const fileName = `community-${Date.now()}`;
      const { data, error } = await supabase.storage
        .from('community-avatars')
        .upload(fileName, avatarFile);
      
      if (error) throw error;
      avatarUrl = data.path;
    }

    const { data: community, error } = await supabase
      .from('communities')
      .insert({
        name,
        description,
        avatar_url: avatarUrl,
        created_by: userId
      })
      .select()
      .single();

    if (error) throw error;

    // Adiciona criador como admin
    await supabase
      .from('community_members')
      .insert({
        community_id: community.id,
        user_id: userId,
        role: 'admin'
      });

    return community;
  }
};
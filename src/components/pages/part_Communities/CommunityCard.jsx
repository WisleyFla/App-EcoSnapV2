import { useState } from 'react';
import { communityService } from '../../../services/communityService';
import toast from 'react-hot-toast';
import './styles.css';

export function CommunityCard({ community, isMember, onToggle }) {
  const [loading, setLoading] = useState(false);

  const handleToggle = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      await communityService.toggleMembership(community.id, user.id);
      onToggle(community.id, !isMember);
      toast.success(isMember ? 'Você saiu da comunidade' : 'Bem-vindo(a)!');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="community-card" data-theme="light">
      <div className="community-header">
        <div className="community-avatar">
          {community.avatar_url ? (
            <img src={community.avatar_url} alt={community.name} />
          ) : (
            <span>{community.name.charAt(0)}</span>
          )}
        </div>
        <div className="community-info">
          <h3>{community.name}</h3>
          <p>{community.description}</p>
          <div className="community-stats">
            {community.members_count} membros • {community.posts_count} posts
          </div>
        </div>
      </div>
      <button
        className={`join-btn ${isMember ? 'joined' : ''}`}
        onClick={handleToggle}
        disabled={loading}
      >
        {loading ? '...' : isMember ? 'Participando' : 'Participar'}
      </button>
    </div>
  );
}
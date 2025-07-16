import { useState, useEffect } from 'react';
import { communityService } from '../../../services/communityService';
import { CreateCommunityModal } from './CreateCommunityModal';
import { CommunityCard } from './CommunityCard';
import './styles.css';

export function Communities() {
  const [communities, setCommunities] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCommunities();
  }, []);

  const fetchCommunities = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      const { data } = await communityService.getCommunities(user.id);
      setCommunities(data);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleMembership = (communityId, isNowMember) => {
    setCommunities(prev => prev.map(c => 
      c.id === communityId 
        ? { ...c, members_count: isNowMember ? c.members_count + 1 : c.members_count - 1 }
        : c
    ));
  };

  return (
    <>
      <div className="communities-container">
        <div className="communities-header">
          <h1>Comunidades</h1>
          <button 
            className="create-btn"
            onClick={() => setShowModal(true)}
          >
            Criar
          </button>
        </div>

        {loading ? (
          <div className="loading">Carregando...</div>
        ) : (
          <div className="communities-list">
            {communities.map(community => (
              <CommunityCard
                key={community.id}
                community={community}
                isMember={community.community_members?.length > 0}
                onToggle={handleToggleMembership}
              />
            ))}
          </div>
        )}
      </div>

      <CreateCommunityModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onCreate={fetchCommunities}
      />
    </>
  );
}
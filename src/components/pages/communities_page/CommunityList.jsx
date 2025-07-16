import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../../../context/AuthContext';
import { communityService } from '../../../services/communityService';
import CommunityCard from './CommunityCard';
import CreateCommunityModal from './CreateCommunityModal';
import Loading from '../../ui/Loading'; 
import './community.css';

export default function CommunityList() {
  const [communities, setCommunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  const fetchCommunities = async () => {
    try {
      const data = await communityService.getCommunities();
      setCommunities(data);
    } catch (err) {
      console.error("Erro ao buscar comunidades:", err);
      toast.error("Não foi possível carregar as comunidades.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchCommunities();
    }
  }, [user]);
  
  const handleCommunityCreated = () => {
    toast.success("Comunidade criada com sucesso!");
    setIsModalOpen(false);
    setLoading(true);
    fetchCommunities();
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <>
      <div className="page-container">
        <div className="communities-header">
          <h1>Comunidades</h1>
          <button className="create-community-btn" onClick={() => setIsModalOpen(true)}>
            Criar Comunidade
          </button>
        </div>
        <div className="community-list-container">
          {communities.length > 0 ? (
            communities.map(community => (
              <CommunityCard 
                key={community.id} 
                community={community}
                onClick={() => navigate(`/communities/${community.id}`)}
              />
            ))
          ) : (
            <p style={{ color: 'var(--text-secondary)'}}>Nenhuma comunidade encontrada. Que tal criar a primeira?</p>
          )}
        </div>
      </div>
      <CreateCommunityModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleCommunityCreated}
      />
    </>
  );
}
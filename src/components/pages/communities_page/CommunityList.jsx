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
  const [isJoining, setIsJoining] = useState(null); // <-- 1. ADICIONE ESTA LINHA DE ESTADO
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
  
  const handleJoinToggle = async (communityId) => {
    setIsJoining(communityId);
    try {
      await communityService.toggleMembership(communityId, user.id, false);
      toast.success("Você entrou na comunidade!");

      setCommunities(currentCommunities => 
        currentCommunities.map(c => {
          if (c.id === communityId) {
            return {
              ...c,
              is_member: true,
              members_count: (c.members_count || 0) + 1
            };
          }
          return c;
        })
      );
    } catch (error) {
      toast.error("Erro ao entrar na comunidade.");
    } finally {
      setIsJoining(null);
    }
  };

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
                // --- 2. AS MUDANÇAS NECESSÁRIAS ESTÃO ABAIXO ---
                onClick={() => {
                  // Apenas navega se o usuário for membro e não estiver no meio de uma ação
                  if (community.is_member && !isJoining) {
                  navigate(`/communities/${community.id}`);
                  }
                }}
                onJoinToggle={handleJoinToggle} // Passa a função para o card
                isJoining={isJoining === community.id} // Informa ao card se o botão deve estar em modo "carregando"
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
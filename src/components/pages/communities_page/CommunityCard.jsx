import React from 'react';
import { Users } from 'lucide-react';
import './community.css';

export default function CommunityCard({ community, onClick, onJoinToggle, isJoining }) {

  // Função para chamar o onJoinToggle e parar a navegação
  const handleJoinClick = (e) => {
    e.stopPropagation(); // Impede que o clique no botão navegue para a página de detalhes
    onJoinToggle(community.id);
  };

  return (
    <div 
      className="community-card" 
      onClick={onClick}
      // Adiciona um estilo para mudar o cursor se o usuário não for membro
      style={{ cursor: community.is_member ? 'pointer' : 'default' }}
      >
      <div className="community-card-avatar">
        {community.avatar_url ? (
          <img src={community.avatar_url} alt={`Avatar de ${community.name}`} />
        ) : (
          <span>{community.name.charAt(0).toUpperCase()}</span>
        )}
      </div>
      <div className="community-card-info">
        <h3>{community.name}</h3>
        <p className="community-card-description">{community.description}</p>
        <div className="community-card-stats">
          <Users size={14} />
          <span>{community.members_count || 0} membro(s)</span>
          {!community.is_member && (
            <button 
              className="join-card-btn"
              onClick={handleJoinClick}
              disabled={isJoining}
            >
              {isJoining ? 'Entrando...' : 'Participar'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
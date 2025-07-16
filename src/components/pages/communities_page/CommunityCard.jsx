import React from 'react';
import { Users } from 'lucide-react';
import './community.css';

export default function CommunityCard({ community, onClick }) {
  return (
    <div className="community-card" onClick={onClick}>
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
        </div>
      </div>
    </div>
  );
}
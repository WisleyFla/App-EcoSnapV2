import React from 'react';
import Logo from './Logo';
import './Loading.css';

const Loading = () => {
  return (
    <div className="loading-overlay">
      <div className="loading-container-inner">
        {/* A logo que já temos */}
        <Logo />
        {/* O texto que queremos adicionar */}
        <p className="loading-text">EcoSnap</p>
      </div>
    </div>
  );
};

export default Loading;
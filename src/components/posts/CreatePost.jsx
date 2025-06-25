// src/components/posts/CreatePost.jsx
import React, { useState } from 'react';
import PostForm from './PostForm';
import { useAuth } from '../../context/AuthContext';
import './CreatePost.css';

const CreatePost = ({ onPostCreated }) => {
  const { user } = useAuth();
  const [isFormOpen, setIsFormOpen] = useState(false);

  if (!user) {
    return (
      <div className="create-post-wrapper">
        <div className="login-prompt">
          <p>Faça login para compartilhar suas descobertas na natureza!</p>
        </div>
      </div>
    );
  }

  const handlePostCreated = (newPost) => {
    setIsFormOpen(false);
    onPostCreated?.(newPost);
  };

  const handleCancel = () => {
    setIsFormOpen(false);
  };

  return (
    <div className="create-post-wrapper">
      {!isFormOpen ? (
        <div className="create-post-trigger" onClick={() => setIsFormOpen(true)}>
          <div className="user-avatar">
            {user.profile?.avatar_url ? (
              <img 
                src={user.profile.avatar_url} 
                alt={user.profile.full_name || 'Usuário'} 
              />
            ) : (
              <div className="avatar-placeholder">
                {(user.profile?.full_name?.[0] || user.email?.[0] || 'U').toUpperCase()}
              </div>
            )}
          </div>
          <div className="post-prompt">
            <span>O que você descobriu na natureza hoje?</span>
          </div>
          <div className="post-button">
            <span>📸</span>
          </div>
        </div>
      ) : (
        <PostForm 
          onPostCreated={handlePostCreated}
          onCancel={handleCancel}
        />
      )}
    </div>
  );
};

export default CreatePost;
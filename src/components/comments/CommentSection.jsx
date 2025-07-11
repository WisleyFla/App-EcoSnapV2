// src/components/comments/CommentSection.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import CommentForm from './CommentForm';
import CommentItem from './CommentItem';
import './CommentSection.css';

const CommentSection = ({ postId, onCommentAdded, onCommentRemoved }) => {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [subscription, setSubscription] = useState(null);

  // Buscar usuário atual
  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
    };
    getCurrentUser();
  }, []);

  // Buscar comentários quando o componente for montado
  useEffect(() => {
    if (postId) {
      loadComments();
    }

    return () => {
      if (subscription) {
        supabase.removeChannel(subscription);
      }
    };
  }, [postId]);

  const loadComments = async () => {
    setError('');
    
    try {
      // Buscar comentários primeiro
      const { data: commentsData, error: commentsError } = await supabase
        .from('comments')
        .select('*')
        .eq('post_id', postId)
        .is('parent_id', null)
        .order('created_at', { ascending: true });

      if (commentsError) throw commentsError;

      // Buscar perfis separadamente para cada comentário
      const commentsWithProfiles = await Promise.all(
        (commentsData || []).map(async (comment) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('id, username, full_name, avatar_url')
            .eq('id', comment.user_id)
            .single();

          return {
            ...comment,
            profiles: profile || {
              id: comment.user_id,
              username: 'usuario',
              full_name: 'Usuário',
              avatar_url: null
            }
          };
        })
      );

      setComments(commentsWithProfiles);
    } catch (err) {
      setError('Erro ao carregar comentários');
      console.error('Erro ao carregar comentários:', err);
    }
  };

  // Função para lidar com um novo comentário, agora notificando o componente pai.
  const handleNewComment = (newComment) => {
    if (!comments.some(c => c.id === newComment.id)) {
      setComments(prev => [...prev, newComment]);
      onCommentAdded?.(); // Notifica o PostCard que um comentário foi adicionado
    }
  };

  // Função para lidar com a exclusão de um comentário, notificando o pai.
  const handleCommentDelete = (commentId) => {
    setComments(prev => prev.filter(comment => comment.id !== commentId));
    onCommentRemoved?.(); // Notifica o PostCard que um comentário foi removido
  };

  // Função para lidar com a edição de um comentário.
  const handleCommentEdit = (commentId, updatedComment) => {
    setComments(prev => 
      prev.map(comment => 
        comment.id === commentId 
          ? { ...comment, ...updatedComment }
          : comment
      )
    );
  };

  // Função para lidar com uma nova resposta, notificando o pai.
  const handleReply = (parentId, newReply) => {
    console.log('Nova resposta no post:', newReply);
    onCommentAdded?.(); // Notifica o PostCard, pois uma resposta também aumenta a contagem total.
  };

  return (
    <div className="comment-section-inline">
      {/* Formulário para novo comentário */}
      <div className="inline-comment-form">
        <CommentForm
          postId={postId}
          onCommentSubmit={handleNewComment}
          placeholder="Adicione um comentário..."
        />
      </div>

      {/* Lista de comentários */}
      <div className="inline-comments-list">
        {error && (
          <div className="inline-comments-error">
            <span>{error}</span>
            <button onClick={loadComments} className="inline-retry-btn">
              Tentar novamente
            </button>
          </div>
        )}

        {!error && comments.length === 0 && (
          <div className="inline-no-comments">
            <p style={{ 
              fontSize: '14px', 
              color: '#9ca3af', 
              textAlign: 'center',
              padding: '16px',
              margin: 0
            }}>
              Seja o primeiro a comentar
            </p>
          </div>
        )}

        {comments.map((comment) => (
          <div key={comment.id}>
            <CommentItem
              comment={comment}
              onReply={handleReply}
              onDelete={handleCommentDelete}
              onEdit={handleCommentEdit}
              currentUserId={currentUser?.id}
              // Passando a prop para notificar sobre a exclusão de respostas aninhadas
              onCommentRemoved={onCommentRemoved}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default CommentSection;
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

  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
    };
    getCurrentUser();
  }, []);

  useEffect(() => {
    if (postId) {
      loadComments();
    }
  }, [postId]);

  const loadComments = async () => {
    setLoading(true);
    setError('');
    
    try { // O 'try' começa aqui
      const { data, error: commentsError } = await supabase
        .from('comments_with_profiles') // Usando a VIEW que criamos
        .select('*')
        .eq('post_id', postId)
        .is('parent_id', null)
        .order('created_at', { ascending: true });
  
      if (commentsError) {
        throw commentsError;
      }
      setComments(data || []);
  
    } catch (err) { // <-- O bloco 'catch' que estava faltando
      setError('Erro ao carregar comentários.');
      console.error('Erro ao carregar comentários:', err);
  
    } finally { // <-- O bloco 'finally' que estava faltando
      setLoading(false);
    }
  };

  const handleNewComment = (newComment) => {
    setComments(prev => [...prev, newComment]);
    onCommentAdded?.();
  };

  const handleCommentDelete = (commentId) => {
    setComments(prev => prev.filter(comment => comment.id !== commentId));
    onCommentRemoved?.();
  };

  // ESTA É A FUNÇÃO CORRIGIDA PARA ATUALIZAR UM COMENTÁRIO NA LISTA PRINCIPAL
  const handleCommentEdit = (commentId, updatedCommentData) => {
    setComments(prevComments =>
      prevComments.map(comment =>
        comment.id === commentId
          ? { ...comment, ...updatedCommentData }
          : comment
      )
    );
  };

  const handleReply = () => {
    onCommentAdded?.();
  };

  return (
    <div className="comment-section-inline">
      <div className="inline-comment-form">
        <CommentForm
          postId={postId}
          onCommentSubmit={handleNewComment}
          placeholder="Adicione um comentário..."
        />
      </div>

      <div className="inline-comments-list">
        {loading && <div className="inline-no-comments"><p>Carregando...</p></div>}
        {error && <div className="inline-comments-error"><span>{error}</span></div>}
        
        {!loading && !error && comments.length === 0 && (
          <div className="inline-no-comments">
            <p>Seja o primeiro a comentar</p>
          </div>
        )}

        {comments.map((comment) => (
          <CommentItem
            key={comment.id}
            comment={comment}
            onReply={handleReply}
            onDelete={handleCommentDelete}
            onEdit={handleCommentEdit} // AQUI GARANTIMOS QUE A FUNÇÃO SEJA PASSADA
            currentUserId={currentUser?.id}
            onCommentRemoved={onCommentRemoved}
          />
        ))}
      </div>
    </div>
  );
};

export default CommentSection;
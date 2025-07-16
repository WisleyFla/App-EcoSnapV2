import React, { useState, useEffect } from 'react';
import { commentsService } from '../../services/commentsService';
import CommentForm from './CommentForm';
import CommentItem from './CommentItem';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import './CommentSection.css';

export default function CommentSection({ postId, onCommentAdded, onCommentRemoved }) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    const fetchComments = async () => {
      try {
        setLoading(true);
        setError(null);
        const fetchedComments = await commentsService.getCommentsForPost(postId);
        setComments(fetchedComments);
      } catch (error) {
        console.error('Error loading comments:', error);
        setError('Não foi possível carregar os comentários.');
        toast.error("Erro ao carregar comentários.");
      } finally {
        setLoading(false);
      }
    };

    if (postId) {
      fetchComments();
    }
  }, [postId]);

  const handleAddComment = async (content, parentId = null) => {
    try {
      const newComment = await commentsService.addComment(postId, content);
      setComments(prev => [...prev, newComment]);
      onCommentAdded?.();
      toast.success("Comentário adicionado!");
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error("Erro ao adicionar comentário.");
      throw error;
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm("Tem certeza que deseja apagar este comentário?")) return;
    
    try {
      await commentsService.deleteComment(commentId);
      setComments(prev => prev.filter(c => c.id !== commentId));
      onCommentRemoved?.();
      toast.success("Comentário removido!");
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast.error("Erro ao apagar comentário.");
    }
  };

  const handleUpdateComment = async (commentId, newContent) => {
    try {
      const updatedComment = await commentsService.updateComment(commentId, newContent);
      setComments(prev => 
        prev.map(c => c.id === commentId ? { ...c, ...updatedComment } : c)
      );
      toast.success("Comentário atualizado!");
    } catch (error) {
      console.error('Error updating comment:', error);
      toast.error("Erro ao atualizar comentário.");
      throw error;
    }
  };
  
  const handleToggleCommentLike = async (commentId) => {
    try {
      await commentsService.toggleCommentLike(commentId, user.id);
    } catch (error) {
      console.error('Error toggling comment like:', error);
      throw error;
    }
  };

  const handleReply = (newReply) => {
    setComments(prev => [...prev, newReply]);
    onCommentAdded?.();
  };

  return (
    <div className="comment-section-container">
      {user && (
        <div className="comment-form-container">
          <CommentForm 
            onSubmit={(content) => handleAddComment(content)}
            placeholder="Adicione um comentário..."
          />
        </div>
      )}

      <div className="comments-list">
        {loading && <div className="loading-comments">Carregando comentários...</div>}
        
        {error && (
          <div className="comments-error">
            {error} <button onClick={() => window.location.reload()}>Tentar novamente</button>
          </div>
        )}

        {!loading && !error && comments.length === 0 && (
          <div className="no-comments">
            <p>Nenhum comentário ainda. Seja o primeiro a comentar!</p>
          </div>
        )}

        {comments.map(comment => (
          <CommentItem 
            key={comment.id} 
            comment={comment}
            onDelete={handleDeleteComment}
            onUpdate={handleUpdateComment}
            onToggleLike={handleToggleCommentLike}
            onReply={handleReply}
            currentUserId={user?.id}
            onCommentRemoved={onCommentRemoved}
          />
        ))}
      </div>
    </div>
  );
}
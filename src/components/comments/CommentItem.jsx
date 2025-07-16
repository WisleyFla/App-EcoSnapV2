import React, { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Heart, MessageSquare, Edit2, Trash2, MoreHorizontal, X, Check, Reply } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import CommentForm from './CommentForm';

const CommentItem = ({ 
  comment, 
  onDelete, 
  onUpdate,
  onToggleLike,
  onReply,
  currentUserId,
  level = 0,
  onCommentRemoved
}) => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(comment.content);
  const [isSaving, setIsSaving] = useState(false);
  const [isLiked, setIsLiked] = useState(comment.user_has_liked);
  const [likeCount, setLikeCount] = useState(comment.likes_count);
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [replies, setReplies] = useState([]);
  const [showReplies, setShowReplies] = useState(false);
  const [loadingReplies, setLoadingReplies] = useState(false);
  const [repliesCount, setRepliesCount] = useState(comment.replies_count || 0);

  const isOwner = currentUserId === comment.user_id;
  const canReply = !!currentUserId;

  useEffect(() => {
    setEditText(comment.content);
    setIsLiked(comment.user_has_liked);
    setLikeCount(comment.likes_count);
  }, [comment]);

  const formatTimeAgo = (dateString) => {
    try {
      return formatDistanceToNow(new Date(dateString), { 
        addSuffix: true, 
        locale: ptBR 
      });
    } catch {
      return 'há algum tempo';
    }
  };

  const handleUpdate = async () => {
    if (editText.trim() === '' || editText.trim() === comment.content) {
      setIsEditing(false);
      return;
    }

    setIsSaving(true);
    try {
      await onUpdate(comment.id, editText);
      setIsEditing(false);
      toast.success("Comentário atualizado!");
    } catch (error) {
      toast.error("Erro ao atualizar comentário.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleLikeClick = async () => {
    // Feedback instantâneo
    const newLikedState = !isLiked;
    setIsLiked(newLikedState);
    setLikeCount(prev => newLikedState ? prev + 1 : prev - 1);
    
    try {
      await onToggleLike(comment.id, user.id);
    } catch (error) {
      // Reverte em caso de erro
      setIsLiked(!newLikedState);
      setLikeCount(prev => newLikedState ? prev - 1 : prev + 1);
      toast.error("Erro ao processar curtida.");
    }
  };

  const handleDelete = async () => {
    setShowMenu(false);
    if (!window.confirm("Tem certeza que deseja apagar este comentário?")) return;
    
    try {
      await onDelete(comment.id);
      toast.success("Comentário removido!");
      onCommentRemoved?.();
    } catch (error) {
      toast.error("Erro ao remover comentário.");
    }
  };

  const loadReplies = async () => {
    if (replies.length > 0) {
      setShowReplies(!showReplies);
      return;
    }

    setLoadingReplies(true);
    try {
      // Aqui você chamaria seu serviço para carregar respostas
      // Exemplo: const repliesData = await commentsService.getReplies(comment.id);
      // setReplies(repliesData);
      setShowReplies(true);
    } catch (error) {
      toast.error('Erro ao carregar respostas.');
    } finally {
      setLoadingReplies(false);
    }
  };

  const handleReplySubmit = (newReply) => {
    setReplies(prev => [...prev, newReply]);
    setShowReplyForm(false);
    setShowReplies(true);
    setRepliesCount(prev => prev + 1);
    onReply?.();
  };

  const getAvatarInitials = () => {
    const name = comment.profiles?.full_name || comment.profiles?.username || 
                comment.user_id?.slice(0, 2).toUpperCase() || 'U';
    return name.charAt(0).toUpperCase();
  };

  return (
    <div className={`comment-item level-${level}`}>
      <div className="comment-content">
        <div className="comment-avatar">
          {comment.profiles?.avatar_url ? (
            <img 
              src={comment.profiles.avatar_url} 
              alt={`Foto de ${comment.profiles.full_name}`} 
              className="comment-avatar-image" 
            />
          ) : (
            <div className="comment-avatar-circle">{getAvatarInitials()}</div>
          )}
        </div>

        <div className="comment-body">
          <div className="comment-header">
            <h4 className="comment-author">
              {comment.profiles?.full_name || comment.profiles?.username || 'Usuário'}
            </h4>
            <span className="comment-time">
              {formatTimeAgo(comment.created_at)}
              {comment.updated_at !== comment.created_at && (
                <span className="edited-indicator"> (editado)</span>
              )}
            </span>

            {isOwner && !isEditing && (
              <div className="comment-menu">
                <button
                  className="menu-toggle"
                  onClick={() => setShowMenu(!showMenu)}
                  aria-label="Opções do comentário"
                >
                  <MoreHorizontal size={16} />
                </button>
                
                {showMenu && (
                  <div className="menu-dropdown">
                    <button
                      onClick={() => { setIsEditing(true); setShowMenu(false); }}
                      className="menu-item"
                    >
                      <Edit2 size={14} /> Editar
                    </button>
                    <button
                      onClick={handleDelete}
                      className="menu-item destructive"
                    >
                      <Trash2 size={14} /> Deletar
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="comment-text">
            {isEditing ? (
              <div className="edit-form">
                <textarea
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  className="edit-textarea"
                  rows={3}
                  autoFocus
                  disabled={isSaving}
                />
                <div className="edit-actions">
                  <button onClick={() => setIsEditing(false)} className="cancel-edit-btn" disabled={isSaving}>
                    <X size={16} /> Cancelar
                  </button>
                  <button onClick={handleUpdate} className="save-edit-btn" disabled={isSaving || !editText.trim()}>
                    {isSaving ? 'Salvando...' : <Check size={16} />}
                  </button>
                </div>
              </div>
            ) : (
              <p>{comment.content}</p>
            )}
          </div>

          <div className="comment-footer">
            <button
              onClick={handleLikeClick}
              className={`footer-action-btn ${isLiked ? 'liked' : ''}`}
            >
              <Heart size={16} fill={isLiked ? 'currentColor' : 'none'} />
              <span>{likeCount}</span>
            </button>

            {canReply && (
              <button
                className="footer-action-btn"
                onClick={() => setShowReplyForm(!showReplyForm)}
              >
                <Reply size={16} /> Responder
              </button>
            )}

            {repliesCount > 0 && (
              <button
                className="footer-action-btn"
                onClick={loadReplies}
                disabled={loadingReplies}
              >
                <MessageSquare size={16} />
                {loadingReplies ? 'Carregando...' : showReplies ? `Ocultar (${repliesCount})` : `Ver respostas (${repliesCount})`}
              </button>
            )}
          </div>

          {showReplyForm && (
            <div className="reply-form-container">
              <CommentForm
                postId={comment.post_id}
                parentId={comment.id}
                onCommentSubmit={handleReplySubmit}
                onCancel={() => setShowReplyForm(false)}
                placeholder={`Respondendo para ${comment.profiles?.full_name || comment.profiles?.username}...`}
                autoFocus={true}
              />
            </div>
          )}
        </div>
      </div>

      {showReplies && replies.length > 0 && (
        <div className="comment-replies">
          {replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              onDelete={onDelete}
              onUpdate={onUpdate}
              onToggleLike={onToggleLike}
              onReply={onReply}
              currentUserId={currentUserId}
              level={level + 1}
              onCommentRemoved={() => {
                setReplies(prev => prev.filter(r => r.id !== reply.id));
                setRepliesCount(prev => Math.max(0, prev - 1));
                onCommentRemoved?.();
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default CommentItem;
// src/components/comments/CommentItem.jsx
import React, { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';
import CommentForm from './CommentForm';
import { MoreHorizontal, Reply, Edit3, Trash2 } from 'lucide-react';
// Não precisamos mais do modal de exclusão aqui
// import DeleteCommentModal from './DeleteCommentModal';

const CommentItem = ({ 
  comment, 
  onReply, 
  onDelete, 
  onEdit,
  currentUserId,
  level = 0,
  onCommentRemoved
}) => {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [replies, setReplies] = useState([]);
  const [showReplies, setShowReplies] = useState(false);
  const [loadingReplies, setLoadingReplies] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [repliesCount, setRepliesCount] = useState(0);
  const [showMenu, setShowMenu] = useState(false);

  const isOwner = currentUserId && currentUserId === comment.user_id;
  const canReply = !!currentUserId;

  useEffect(() => {
    const fetchRepliesCount = async () => {
      const { count, error } = await supabase
        .from('comments')
        .select('*', { count: 'exact', head: true })
        .eq('parent_id', comment.id);

      if (!error) {
        setRepliesCount(count || 0);
      }
    };

    fetchRepliesCount();
  }, [comment.id]);

  const formatTimeAgo = (dateString) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true, locale: ptBR });
    } catch {
      return 'há algum tempo';
    }
  };

  const loadReplies = async () => {
    if (replies.length > 0) {
      setShowReplies(!showReplies);
      return;
    }
    setLoadingReplies(true);
    try {
      const { data, error } = await supabase
        .from('comments')
        .select('*, profiles(id, username, full_name, avatar_url)')
        .eq('parent_id', comment.id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setReplies(data || []);
      setShowReplies(true);
    } catch (error) {
      toast.error('Erro ao carregar respostas.');
      console.error('Erro ao carregar respostas:', error);
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
  
  const handleSaveEdit = async () => {
    if (!editContent.trim()) {
      toast.error("O comentário não pode estar vazio.");
      return;
    }
    setIsSaving(true);
    try {
      const { data: updatedComment, error } = await supabase
        .from('comments')
        .update({ 
          content: editContent.trim(),
          updated_at: new Date().toISOString()
        })
        .eq('id', comment.id)
        .eq('user_id', currentUserId)
        .select('*, profiles(id, username, full_name, avatar_url)')
        .single();

      if (error) throw error;
      
      onEdit?.(comment.id, updatedComment);
      toast.success("Comentário atualizado!");
      setIsEditing(false);
    } catch (error) {
      console.error('Erro ao editar comentário:', error);
      toast.error('Não foi possível editar o comentário.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    setShowMenu(false);
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', comment.id)
        .eq('user_id', currentUserId);

      if (error) throw error;
      
      toast.success("Comentário deletado!");
      onDelete?.(comment.id);
    } catch (error) {
      console.error('Erro ao deletar comentário:', error)
      toast.error('Não foi possível deletar o comentário.');
    } finally {
      setIsDeleting(false);
    }
  };
  
  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditContent(comment.content);
  };

  const getAvatarInitials = () => {
    const name = comment.profiles?.full_name || comment.profiles?.username || 'U';
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
                      className="menu-item edit-item"
                    >
                      <Edit3 size={14} /> Editar
                    </button>
                    <button
                      onClick={handleDelete}
                      className="menu-item delete-item"
                      disabled={isDeleting}
                    >
                      <Trash2 size={14} />
                      {isDeleting ? 'Deletando...' : 'Deletar'}
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
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="edit-textarea"
                  rows={3}
                  autoFocus
                  disabled={isSaving}
                />
                <div className="edit-actions">
                  <button onClick={handleCancelEdit} className="cancel-edit-btn" disabled={isSaving}>
                    Cancelar
                  </button>
                  <button onClick={handleSaveEdit} className="save-edit-btn" disabled={isSaving || !editContent.trim()}>
                    {isSaving ? 'Salvando...' : 'Salvar'}
                  </button>
                </div>
              </div>
            ) : (
              <p>{comment.content}</p>
            )}
          </div>

          {!isEditing && (
            <div className="comment-actions">
              {canReply && (
                <button
                  className="action-btn reply-btn"
                  onClick={() => setShowReplyForm(!showReplyForm)}
                >
                  <Reply size={14} /> Responder
                </button>
              )}
              {repliesCount > 0 && (
                <button
                  className="action-btn replies-btn"
                  onClick={loadReplies}
                  disabled={loadingReplies}
                >
                  {loadingReplies ? 'Carregando...' : showReplies ? `Ocultar respostas (${repliesCount})` : `Ver respostas (${repliesCount})`}
                </button>
              )}
            </div>
          )}

          {showReplyForm && canReply && (
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
              onReply={onReply}
              onDelete={(replyId) => {
                setReplies(prev => prev.filter(r => r.id !== replyId));
                setRepliesCount(prev => Math.max(0, prev - 1));
                onCommentRemoved?.(); 
              }}
              onEdit={(editedReplyId, updatedReplyData) => {
                setReplies(currentReplies =>
                  currentReplies.map(r => 
                    r.id === editedReplyId ? { ...r, ...updatedReplyData } : r
                  )
                );
              }}
              currentUserId={currentUserId}
              level={level + 1}
              onCommentRemoved={onCommentRemoved}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default CommentItem;
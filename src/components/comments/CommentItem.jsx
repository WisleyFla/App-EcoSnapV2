import React, { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Heart, MessageSquare, Edit2, Trash2, MoreHorizontal, X, Check, Reply } from 'lucide-react';
import CommentForm from './CommentForm';

const useAuth = () => {
  return {
    user: {
      id: 'current-user-id',
      username: 'usuario_exemplo',
      full_name: 'Usuário Exemplo'
    }
  };
};

const toast = {
  success: (message) => console.log('SUCCESS:', message),
  error: (message) => console.log('ERROR:', message)
};

const CommentItem = ({ 
  comment, 
  onDelete, 
  onUpdate,
  onEdit,
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
  const [likeCount, setLikeCount] = useState(comment.likes_count || 0);
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [replies, setReplies] = useState([]);
  const [showReplies, setShowReplies] = useState(false);
  const [loadingReplies, setLoadingReplies] = useState(false);
  const [repliesCount, setRepliesCount] = useState(comment.replies_count || 0);

  const isOwner = currentUserId === comment.user_id;
  const canReply = !!currentUserId;
  const updateHandler = onEdit || onUpdate;

  useEffect(() => {
    setEditText(comment.content);
    setIsLiked(comment.user_has_liked);
    setLikeCount(comment.likes_count);
  }, [comment]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showMenu && !event.target.closest('.comment-menu')) {
        setShowMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu]);

  const formatTimeAgo = (dateString) => {
    try {
      return formatDistanceToNow(new Date(dateString), { 
        addSuffix: true, 
        locale: ptBR 
      });
    } catch (error) {
      console.error('Erro ao formatar data:', error);
      return 'há algum tempo';
    }
  };

  const handleUpdate = async () => {
    const trimmedText = editText.trim();
    
    // Validações simples
    if (trimmedText === '' || trimmedText === comment.content) {
      setIsEditing(false);
      return;
    }

    // Pega o handler correto (onEdit ou onUpdate)
    const updateHandler = onEdit || onUpdate;

    if (!updateHandler) {
      toast.error('Função de atualização não definida');
      return;
    }

    setIsSaving(true);
    try {
      // Apenas CHAMA a função do pai, passando o ID e o NOVO TEXTO
      await updateHandler(comment.id, trimmedText);
      setIsEditing(false); // Só fecha a edição se a atualização der certo

    } catch (error) {
      // Se a função do pai der erro, ele será capturado aqui
      // e o formulário de edição permanecerá aberto para o usuário tentar novamente.
      console.error('Falha ao salvar a edição:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLikeClick = async () => {
    if (!onToggleLike) {
      toast.error('Função de curtida não definida');
      return;
    }

    if (!currentUserId) {
      toast.error('Faça login para curtir comentários');
      return;
    }

    // Lógica otimista para a UI responder rápido
    const newLikedState = !isLiked;
    setIsLiked(newLikedState);
    setLikeCount(prev => newLikedState ? prev + 1 : prev - 1);
    
    try {
      // CORREÇÃO: Passa apenas o ID do comentário.
      await onToggleLike(comment.id);
    } catch (error) {
      // Reverte a mudança na UI se der erro
      console.error('Erro ao processar curtida:', error);
      setIsLiked(!newLikedState);
      setLikeCount(prev => newLikedState ? prev - 1 : prev - 1);
      toast.error("Erro ao processar curtida.");
    }
  };

  const handleDelete = async () => {
    setShowMenu(false);
    
    if (!window.confirm("Tem certeza que deseja apagar este comentário?")) {
      return;
    }
    
    if (!onDelete) {
      toast.error('Função de exclusão não definida');
      return;
    }

    try {
      await onDelete(comment.id);
      toast.success("Comentário removido!");
      if (onCommentRemoved) {
        onCommentRemoved();
      }
    } catch (error) {
      console.error('Erro ao remover comentário:', error);
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
      const mockReplies = [
        {
          id: Date.now() + 1,
          content: "Esta é uma resposta de exemplo ao comentário",
          post_id: comment.post_id,
          parent_id: comment.id,
          user_id: 'other-user-id',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          likes_count: 0,
          replies_count: 0,
          user_has_liked: false,
          profiles: {
            id: 'other-user-id',
            username: 'outro_usuario',
            full_name: 'Outro Usuário',
            avatar_url: null
          }
        },
        {
          id: Date.now() + 2,
          content: "Outra resposta de exemplo para demonstrar múltiplas respostas",
          post_id: comment.post_id,
          parent_id: comment.id,
          user_id: 'third-user-id',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          likes_count: 2,
          replies_count: 0,
          user_has_liked: false,
          profiles: {
            id: 'third-user-id',
            username: 'terceiro_usuario',
            full_name: 'Terceiro Usuário',
            avatar_url: null
          }
        }
      ];
      
      setReplies(mockReplies);
      setShowReplies(true);
    } catch (error) {
      console.error('Erro ao carregar respostas:', error);
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
    if (onReply) {
      onReply();
    }
  };

  const handleReplyRemoved = () => {
    setRepliesCount(prev => Math.max(0, prev - 1));
    if (onCommentRemoved) {
      onCommentRemoved();
    }
  };

  const handleReplyUpdated = (replyId, updatedReply) => {
    setReplies(prev => 
      prev.map(reply => 
        reply.id === replyId ? updatedReply : reply
      )
    );
  };

  const handleReplyDeleted = (replyId) => {
    setReplies(prev => prev.filter(reply => reply.id !== replyId));
    handleReplyRemoved();
  };

  const getAvatarInitials = () => {
    if (comment.profiles?.full_name) {
      return comment.profiles.full_name.charAt(0).toUpperCase();
    }
    if (comment.profiles?.username) {
      return comment.profiles.username.charAt(0).toUpperCase();
    }
    if (comment.user_id) {
      return comment.user_id.slice(0, 2).toUpperCase();
    }
    return 'U';
  };

  const handleEditCancel = () => {
    setIsEditing(false);
    setEditText(comment.content);
  };

  const handleEditTextChange = (e) => {
    setEditText(e.target.value);
  };

  const handleEditKeyDown = (e) => {
    if (e.key === 'Escape') {
      handleEditCancel();
    }
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleUpdate();
    }
  };

  const remainingChars = 1000 - editText.length;
  const isOverLimit = remainingChars < 0;

  return (
    <div className={`comment-item level-${level}`}>
      <div className="comment-content">
        <div className="comment-avatar">
          {comment.profiles?.avatar_url ? (
            <img 
              src={comment.profiles.avatar_url} 
              alt={`Foto de ${comment.profiles.full_name || comment.profiles.username}`} 
              className="comment-avatar-image" 
            />
          ) : (
            <div className="comment-avatar-circle">
              {getAvatarInitials()}
            </div>
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
                      onClick={() => { 
                        setIsEditing(true); 
                        setShowMenu(false); 
                      }}
                      className="menu-item edit-item"
                    >
                      <Edit2 size={14} /> Editar
                    </button>
                    <button
                      onClick={handleDelete}
                      className="menu-item delete-item"
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
                  onChange={handleEditTextChange}
                  onKeyDown={handleEditKeyDown}
                  className="edit-textarea"
                  rows={3}
                  autoFocus
                  disabled={isSaving}
                  maxLength={1000}
                />
                
                {editText.length > 0 && (
                  <div className={`char-counter ${remainingChars < 100 ? 'warning' : ''} ${isOverLimit ? 'error' : ''}`}>
                    {remainingChars} caracteres restantes
                  </div>
                )}
                
                <div className="edit-actions">
                  <button 
                    onClick={handleEditCancel} 
                    className="cancel-edit-btn" 
                    disabled={isSaving}
                  >
                    <X size={16} /> Cancelar
                  </button>
                  <button 
                    onClick={handleUpdate} 
                    className="save-edit-btn" 
                    disabled={isSaving || !editText.trim() || isOverLimit}
                  >
                    {isSaving ? (
                      <>
                        <svg className="loading-spinner" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                        </svg>
                        Salvando...
                      </>
                    ) : (
                      <>
                        <Check size={16} /> Salvar
                      </>
                    )}
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
              disabled={!currentUserId}
            >
              <Heart size={16} fill={isLiked ? 'currentColor' : 'none'} />
              <span>{Number(likeCount) || 0}</span>
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
                {loadingReplies ? (
                  'Carregando...'
                ) : showReplies ? (
                  `Ocultar respostas (${repliesCount})`
                ) : (
                  `Ver respostas (${repliesCount})`
                )}
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
                placeholder={`Respondendo para ${comment.profiles?.full_name || comment.profiles?.username || 'usuário'}...`}
                autoFocus={true}
                isReply={true}
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
              onDelete={handleReplyDeleted}
              onUpdate={handleReplyUpdated}
              onEdit={handleReplyUpdated}
              onToggleLike={onToggleLike}
              onReply={onReply}
              currentUserId={currentUserId}
              level={level + 1}
              onCommentRemoved={handleReplyRemoved}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default CommentItem;
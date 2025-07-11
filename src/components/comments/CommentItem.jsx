// src/components/comments/CommentItem.jsx
import React, { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '../../lib/supabase';
import CommentForm from './CommentForm';
import { MoreHorizontal, Reply, Edit3, Trash2 } from 'lucide-react';

const CommentItem = ({ 
  comment, 
  onReply, 
  onDelete, 
  onEdit,
  currentUserId,
  level = 0, // Continuamos usando 'level' para a indentação visual
  // REMOVIDO: maxLevel = 2
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
  // ALTERADO: A condição agora apenas verifica se o usuário está logado
  const canReply = !!currentUserId;

  // Buscar contagem de respostas
  useEffect(() => {
    const fetchRepliesCount = async () => {
      // REMOVIDO: A verificação 'if (level < maxLevel)' foi removida para contar respostas em todos os níveis.
      const { count, error } = await supabase
        .from('comments')
        .select('*', { count: 'exact', head: true })
        .eq('parent_id', comment.id);

      if (!error) {
        setRepliesCount(count || 0);
      }
    };

    fetchRepliesCount();
  }, [comment.id]); // REMOVIDO: 'level' e 'maxLevel' da lista de dependências

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

  // ... (Nenhuma outra função precisa de alteração) ...
  const loadReplies = async () => {
    if (replies.length > 0) {
      setShowReplies(!showReplies);
      return;
    }

    setLoadingReplies(true);
    try {
      const { data, error } = await supabase
        .from('comments')
        .select('*')
        .eq('parent_id', comment.id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      const repliesWithProfiles = await Promise.all(
        (data || []).map(async (reply) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('id, username, full_name, avatar_url')
            .eq('id', reply.user_id)
            .single();

          return {
            ...reply,
            profiles: profile || {
              id: reply.user_id,
              username: 'usuario',
              full_name: 'Usuário',
              avatar_url: null
            }
          };
        })
      );

      setReplies(repliesWithProfiles);
      setShowReplies(true);
    } catch (error) {
      console.error('Erro ao carregar respostas:', error);
      alert('Erro ao carregar respostas');
    } finally {
      setLoadingReplies(false);
    }
  };

  const handleReplySubmit = (newReply) => {
    setReplies(prev => [...prev, newReply]);
    setShowReplyForm(false);
    setShowReplies(true);
    setRepliesCount(prev => prev + 1);
    onReply?.(comment.id, newReply);
  };

  const handleEdit = async () => {
    const validation = validateComment(editContent);
    if (!validation.valid) {
      alert(validation.error);
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('comments')
        .update({ 
          content: validation.content,
          updated_at: new Date().toISOString()
        })
        .eq('id', comment.id)
        .eq('user_id', currentUserId);

      if (error) throw error;
      const updatedComment = {
        content: validation.content,
        updated_at: new Date().toISOString()
      };
      
      onEdit?.(comment.id, updatedComment);
      
      setIsEditing(false);
      setShowMenu(false);
    } catch (error) {
      console.error('Erro ao editar comentário:', error);
      alert('Erro ao editar comentário: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', comment.id)
        .eq('user_id', currentUserId);

      if (error) throw error;
      onDelete?.(comment.id);
    } catch (error) {
      alert('Erro ao deletar comentário: ' + error.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const validateComment = (content) => {
    if (!content || typeof content !== 'string') {
      return { valid: false, error: 'Conteúdo é obrigatório' };
    }
    const trimmed = content.trim();
    if (trimmed.length === 0) {
      return { valid: false, error: 'Comentário não pode estar vazio' };
    }
    if (trimmed.length > 1000) {
      return { valid: false, error: 'Comentário muito longo (máximo 1000 caracteres)' };
    }
    return { valid: true, content: trimmed };
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditContent(comment.content);
    setShowMenu(false);
  };


  return (
    <div className={`comment-item level-${level}`}>
      <div className="comment-content">
        <div className="comment-avatar">
          <img
            src={comment.profiles?.avatar_url || '/default-avatar.png'}
            alt={comment.profiles?.full_name || comment.profiles?.username}
            onError={(e) => {
              e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzYiIGhlaWdodD0iMzYiIHZpZXdCb3g9IjAgMCAzNiAzNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTgiIGN5PSIxOCIgcj0iMTgiIGZpbGw9IiNmM2Y0ZjYiLz4KPGNpcmNsZSBjeD0iMTgiIGN5PSIxNCIgcj0iNSIgZmlsbD0iIzZiNzI4MCIvPgo8cGF0aCBkPSJNNiAyOGMwLTUuNTIzIDQuNDc3LTEwIDEwLTEwczEwIDQuNDc3IDEwIDEwIiBmaWxsPSIjNmI3MjgwIi8+Cjwvc3ZnPgo=';
            }}
          />
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
                
                {isOwner && (
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
                        <Edit3 size={14} />
                        Editar
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
                    maxLength={1000}
                    disabled={isSaving}
                    />
                    <div className="edit-actions">
                    <button
                        onClick={handleCancelEdit}
                        className="cancel-edit-btn"
                        disabled={isSaving}
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleEdit}
                        className="save-edit-btn"
                        disabled={isSaving || !editContent.trim()}
                    >
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
                    <Reply size={14} />
                    Responder
                    </button>
                )}

                {repliesCount > 0 && (
                    <button
                    className="action-btn replies-btn"
                    onClick={loadReplies}
                    disabled={loadingReplies}
                    >
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
                    r.id === editedReplyId 
                      ? { ...r, ...updatedReplyData }
                      : r
                  )
                );
              }}
              currentUserId={currentUserId}
              level={level + 1}
              // REMOVIDO: A prop 'maxLevel' não é mais necessária.
              onCommentRemoved={onCommentRemoved}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default CommentItem;
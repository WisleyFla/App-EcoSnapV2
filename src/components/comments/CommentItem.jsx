import React, { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Heart, MessageSquare, Edit2, Trash2, MoreHorizontal, X, Check, Reply } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import CommentForm from './CommentForm';

// Hook simulado para auth - substitua pela sua implementação real
const useAuth = () => {
  return {
    user: {
      id: 'current-user-id',
      username: 'usuario_exemplo',
      full_name: 'Usuário Exemplo'
    }
  };
};

// Sistema de toast simulado - substitua pela sua implementação real
const toast = {
  success: (message) => console.log('SUCCESS:', message),
  error: (message) => console.log('ERROR:', message)
};

const CommentItem = ({ 
  comment,
  postId,
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
  const [isLiked, setIsLiked] = useState(comment.user_has_liked || false);
  const [likeCount, setLikeCount] = useState(comment.likes_count || 0);
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [replies, setReplies] = useState([]);
  const [showReplies, setShowReplies] = useState(false);
  const [loadingReplies, setLoadingReplies] = useState(false);
  const [repliesCount, setRepliesCount] = useState(comment.replies_count || 0);

  const isOwner = currentUserId === comment.user_id;
  const canReply = !!currentUserId && level < 100; // Limita aninhamento a 3 níveis
  const updateHandler = onEdit || onUpdate;

  console.log('Created:', comment.created_at, 'Updated:', comment.updated_at);
  

  // Sincroniza estado local com props do comentário
  useEffect(() => {
    setEditText(comment.content);
    setIsLiked(comment.user_has_liked || false);
    setLikeCount(comment.likes_count || 0);
    setRepliesCount(comment.replies_count || 0);
  }, [comment]);

  // Fecha menu quando clica fora
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

  // Formatar tempo relativo
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

  // Manipular atualização de comentário
  const handleUpdate = async () => {
    const trimmedText = editText.trim();
    
    if (trimmedText === '' || trimmedText === comment.content) {
      setIsEditing(false);
      return;
    }

    if (!updateHandler) {
      toast.error('Função de atualização não definida');
      return;
    }

    setIsSaving(true);
    try {
      await updateHandler(comment.id, trimmedText);
      setIsEditing(false);
      toast.success('Comentário atualizado!');
    } catch (error) {
      console.error('Falha ao salvar a edição:', error);
      toast.error('Erro ao atualizar comentário');
    } finally {
      setIsSaving(false);
    }
  };

  // Manipular curtida
  const handleLikeClick = async () => {
    if (!onToggleLike) {
      toast.error('Função de curtida não definida');
      return;
    }

    if (!currentUserId) {
      toast.error('Faça login para curtir comentários');
      return;
    }

    const newLikedState = !isLiked;
    const originalLikeCount = likeCount;
    
    // Atualização otimista
    setIsLiked(newLikedState);
    setLikeCount(prev => newLikedState ? prev + 1 : prev - 1);
    
    try {
      await onToggleLike(comment.id);
    } catch (error) {
      console.error('Erro ao processar curtida:', error);
      // Reverte se der erro
      setIsLiked(!newLikedState);
      setLikeCount(originalLikeCount);
      toast.error("Erro ao processar curtida.");
    }
  };

  // Manipular exclusão
  const handleDelete = async () => {
    setShowMenu(false);
    
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

  // Carregar respostas
  const loadReplies = async () => {
    if (showReplies) {
      setShowReplies(false);
      return;
    }

    if (repliesCount === 0) {
      return;
    }

    setLoadingReplies(true);
    try {
      const { data: repliesData, error } = await supabase
        .from('comments_with_profiles')
        .select('*')
        .eq('parent_id', comment.id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      setReplies(repliesData || []);
      setShowReplies(true);
    } catch (error) {
      console.error('Erro ao carregar respostas:', error);
      toast.error('Erro ao carregar respostas.');
      setReplies([]);
    } finally {
      setLoadingReplies(false);
    }
  };

  // Manipular envio de resposta
  const handleReplySubmit = async (newReply) => {
    if (!currentUserId) {
      toast.error('Você precisa estar logado para responder');
      return;
    }

    try {
      // Insere no banco
      const { data: savedReply, error: insertError } = await supabase
        .from('comments')
        .insert({
          post_id: postId,
          parent_id: comment.id,
          user_id: currentUserId,
          content: newReply.content
        })
        .select('id')
        .single();

      if (insertError) throw insertError;

      // Busca o comentário completo com perfil
      const { data: replyWithProfile, error: fetchError } = await supabase
        .from('comments_with_profiles')
        .select('*')
        .eq('id', savedReply.id)
        .single();

      if (fetchError) throw fetchError;
      
      // Atualiza estado local
      setReplies(prev => [...prev, replyWithProfile]);
      setRepliesCount(prev => prev + 1);
      setShowReplyForm(false);
      
      // Se não estava mostrando respostas, mostra agora
      if (!showReplies) {
        setShowReplies(true);
      }
      
      if (onReply) {
        onReply();
      }
      
      toast.success('Resposta enviada com sucesso!');
    } catch (error) {
      console.error('Erro ao enviar resposta:', error);
      toast.error('Erro ao enviar resposta');
    }
  };

  // Manipular remoção de resposta
  const handleReplyRemoved = () => {
    setRepliesCount(prev => Math.max(0, prev - 1));
    if (onCommentRemoved) {
      onCommentRemoved();
    }
  };

  // Manipular atualização de resposta
  const handleReplyUpdated = (replyId, updatedContent) => {
    setReplies(prev => 
      prev.map(reply => 
        reply.id === replyId 
          ? { ...reply, content: updatedContent, updated_at: new Date().toISOString() }
          : reply
      )
    );
  };

  // Manipular exclusão de resposta
  const handleReplyDeleted = (replyId) => {
    setReplies(prev => prev.filter(reply => reply.id !== replyId));
    handleReplyRemoved();
  };

  // Gerar iniciais do avatar
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

  // Cancelar edição
  const handleEditCancel = () => {
    setIsEditing(false);
    setEditText(comment.content);
  };

  // Manipular mudança no texto de edição
  const handleEditTextChange = (e) => {
    setEditText(e.target.value);
  };

  // Manipular teclas na edição
  const handleEditKeyDown = (e) => {
    if (e.key === 'Escape') {
      handleEditCancel();
    }
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleUpdate();
    }
  };

  // Calcular caracteres restantes
  const remainingChars = 1000 - editText.length;
  const isNearLimit = remainingChars < 100;
  const isOverLimit = remainingChars < 0;

  return (
    <div className={`comment-item level-${level}`}>
      <div className="comment-content">
        {/* Avatar */}
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

        {/* Corpo do comentário */}
        <div className="comment-body">
          {/* Cabeçalho */}
          <div className="comment-header">
            <h4 className="comment-author">
              {comment.profiles?.full_name || comment.profiles?.username || 'Usuário'}
            </h4>
            <span className="comment-time">
              {formatTimeAgo(comment.created_at)}
              {comment.updated_at && comment.updated_at > comment.created_at && (
                <span className="edited-indicator"> (editado)</span>
              )}
            </span>

            {/* Menu de opções para o proprietário */}
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

          {/* Conteúdo do comentário */}
          <div className="comment-text">
            {isEditing ? (
              <div className="edit-form">
                <textarea
                  value={editText}
                  onChange={handleEditTextChange}
                  onKeyDown={handleEditKeyDown}
                  className={`edit-textarea ${isOverLimit ? 'error' : ''}`}
                  rows={3}
                  autoFocus
                  disabled={isSaving}
                  maxLength={1000}
                />
                
                {editText.length > 0 && (
                  <div className={`char-counter ${isNearLimit ? 'warning' : ''} ${isOverLimit ? 'error' : ''}`}>
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

          {/* Rodapé com ações */}
          <div className="comment-footer">
            {/* Botão de curtir */}
            <button
              onClick={handleLikeClick}
              className={`footer-action-btn ${isLiked ? 'liked' : ''}`}
              disabled={!currentUserId}
              title={currentUserId ? 'Curtir comentário' : 'Faça login para curtir'}
            >
              <Heart size={16} fill={isLiked ? 'currentColor' : 'none'} />
              <span>{Number(likeCount) || 0}</span>
            </button>

            {/* Botão de responder */}
            {canReply && (
              <button
                className="footer-action-btn"
                onClick={() => setShowReplyForm(!showReplyForm)}
                title="Responder comentário"
              >
                <Reply size={16} /> Responder
              </button>
            )}

            {/* Botão para ver/ocultar respostas */}
            {repliesCount > 0 && (
              <button
                className="footer-action-btn"
                onClick={loadReplies}
                disabled={loadingReplies}
                title={showReplies ? 'Ocultar respostas' : 'Ver respostas'}
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

          {/* Formulário de resposta */}
          {showReplyForm && (
            <div className="reply-form-container">
              <CommentForm
                postId={postId}
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

      {/* Lista de respostas */}
      {showReplies && Array.isArray(replies) && replies.length > 0 && (
        <div className="comment-replies">
          {replies.map((reply) => (
            <CommentItem
              key={`reply-${reply.id}-${level}`}
              comment={reply}
              postId={postId}
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
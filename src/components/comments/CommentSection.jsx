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
  const [submittingComment, setSubmittingComment] = useState(false);

  // Função para obter o usuário atual
  useEffect(() => {
    const getCurrentUser = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) {
          console.error('Erro ao obter usuário:', error);
          return;
        }
        setCurrentUser(user);
      } catch (err) {
        console.error('Erro ao carregar usuário:', err);
      }
    };
    getCurrentUser();
  }, []);

  // Carrega comentários quando postId muda
  useEffect(() => {
    if (postId) {
      loadComments();
    }
  }, [postId]);

  // Função para carregar comentários do banco
  const loadComments = async () => {
    setLoading(true);
    setError('');
    try {
      const { data, error: commentsError } = await supabase
        .from('comments_with_profiles')
        .select('*')
        .eq('post_id', postId)
        .is('parent_id', null)
        .order('created_at', { ascending: true });

      if (commentsError) {
        throw commentsError;
      }
      
      setComments(data || []);
    } catch (err) {
      setError('Erro ao carregar comentários');
      console.error('Erro ao carregar comentários:', err);
    } finally {
      setLoading(false);
    }
  };

  // Função para adicionar novo comentário
  const handleCommentEdit = async (commentId, newContent) => {
    try {
      // 1. Prepara os dados para atualização
      const updateData = {
        content: newContent.trim(),
        updated_at: new Date().toISOString()
      };

      // 2. Atualiza no banco de dados
      const { data: updatedComment, error: updateError } = await supabase
        .from('comments')
        .update(updateData)
        .eq('id', commentId)
        .eq('user_id', currentUser.id) // Só permite editar próprios comentários
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }

      // 3. Atualiza a lista de comentários na tela
      setComments(prevComments =>
        prevComments.map(comment =>
          comment.id === commentId
            // Substitui o conteúdo e a data de atualização no comentário existente
            ? { ...comment, content: updatedComment.content, updated_at: updatedComment.updated_at }
            : comment
        )
      );

      console.log('Comentário atualizado com sucesso:', commentId);
      toast.success("Comentário atualizado!");

    } catch (err) {
      console.error('Erro ao atualizar comentário:', err);
      toast.error("Erro ao atualizar comentário.");
      // O 'throw err' aqui é importante para que o CommentItem saiba que deu erro
      throw err;
    }
  };

  // Cole esta função completa dentro do seu componente CommentSection

const handleNewComment = async (commentDataFromForm) => {
  if (!currentUser) {
    setError('Você precisa estar logado para comentar.');
    return;
  }

  try {
    // 1. Insere o novo comentário no banco, pegando o texto do formulário
    //    e usando o ID do post e do usuário que já temos.
    const { data: savedComment, error: insertError } = await supabase
      .from('comments')
      .insert({
        post_id: postId,
        parent_id: null, // Como este é um comentário principal, o parent_id é nulo
        user_id: currentUser.id,
        content: commentDataFromForm.content 
      })
      .select('id') // Pega de volta apenas o ID do comentário recém-criado
      .single();

    if (insertError) {
      throw insertError;
    }

    // 2. Com o ID, busca o comentário completo usando a nossa VIEW para ter os dados do perfil
    const { data: newCommentWithProfile, error: fetchError } = await supabase
        .from('comments_with_profiles')
        .select('*')
        .eq('id', savedComment.id)
        .single();

      if (fetchError) {
        throw fetchError;
      }
      
      // 3. Adiciona o comentário completo à lista na tela
      setComments(prevComments => [...prevComments, newCommentWithProfile]);

      // 4. Avisa o componente pai (PostCard) que a contagem de comentários mudou
      if (onCommentAdded) {
        onCommentAdded();
      }

    } catch (err) {
      console.error('Erro ao adicionar comentário:', err);
      setError(err.message || 'Erro ao adicionar comentário');
    }
  };

  // Função para deletar comentário
  const handleCommentDelete = async (commentId) => {
    if (!currentUser) {
      setError('Usuário não autenticado');
      return;
    }

    try {
      // Remove do banco de dados
      const { error: deleteError } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId)
        .eq('user_id', currentUserId); // Só permite deletar próprios comentários

      if (deleteError) {
        throw deleteError;
      }

      // Remove da lista local
      setComments(prevComments => 
        prevComments.filter(comment => comment.id !== commentId)
      );

      // Notifica componente pai sobre remoção
      if (onCommentRemoved) {
        onCommentRemoved();
      }

      console.log('Comentário removido com sucesso:', commentId);
    } catch (err) {
      console.error('Erro ao deletar comentário:', err);
      setError(err.message || 'Erro ao deletar comentário');
    }
  };


  // Função para toggle like em comentário
  const handleToggleLike = async (commentId) => { // CORREÇÃO: Não recebe mais 'userId'
    if (!currentUser) {
      setError('Usuário não autenticado');
      throw new Error('Usuário não autenticado');
    }

    try {
      // Verifica se o usuário já curtiu o comentário
      const { data: existingLike, error: checkError } = await supabase
        .from('comment_likes')
        .select('id')
        .eq('comment_id', commentId)
        .eq('user_id', currentUser.id) // CORREÇÃO: Usa o 'currentUser.id' do estado
        .single();

      // ... resto da função permanece igual ...

      if (existingLike) {
        // Remove like
        const { error: deleteError } = await supabase
          .from('comment_likes')
          .delete()
          .eq('comment_id', commentId)
          .eq('user_id', currentUser.id); // CORREÇÃO: Usa o 'currentUser.id' do estado
        // ...
      } else {
        // Adiciona like
        const { error: insertError } = await supabase
          .from('comment_likes')
          .insert([{
            comment_id: commentId,
            user_id: currentUser.id, // CORREÇÃO: Usa o 'currentUser.id' do estado
            created_at: new Date().toISOString()
          }]);
        // ...
      }
      
    } catch (err) {
      console.error('Erro ao processar like:', err);
      setError(err.message || 'Erro ao processar like');
      throw err; 
    }
  };

  // Função para quando uma resposta é adicionada
  const handleReply = () => {
    if (onCommentAdded) {
      onCommentAdded();
    }
  };

  // Função para refrescar comentários
  const refreshComments = () => {
    loadComments();
  };

  // Função para limpar erro
  const clearError = () => {
    setError('');
  };

  return (
    <div className="comment-section-inline">
      {/* Formulário para novo comentário */}
      <div className="inline-comment-form">
        {currentUser ? (
          <CommentForm
            postId={postId}
            onSubmit={handleNewComment}
            placeholder="Adicione um comentário..."
            disabled={submittingComment}
          />
        ) : (
          <div className="inline-login-prompt">
            <p>Faça login para comentar</p>
          </div>
        )}
      </div>

      {/* Exibição de erro */}
      {error && (
        <div className="inline-comments-error">
          <span>{error}</span>
          <button onClick={clearError} className="error-dismiss">
            ×
          </button>
        </div>
      )}

      {/* Lista de comentários */}
      <div className="inline-comments-list">
        {loading && (
          <div className="inline-no-comments">
            <p>Carregando comentários...</p>
          </div>
        )}

        {!loading && !error && comments.length === 0 && (
          <div className="inline-no-comments">
            <p>Seja o primeiro a comentar</p>
          </div>
        )}

        {!loading && comments.length > 0 && (
          <div className="comments-container">
            {comments.map((comment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                onReply={handleReply}
                onDelete={handleCommentDelete}
                onEdit={handleCommentEdit}
                onToggleLike={handleToggleLike}
                currentUserId={currentUser?.id}
                onCommentRemoved={onCommentRemoved}
                level={0}
              />
            ))}
          </div>
        )}
      </div>

      {/* Botão para refrescar comentários */}
      {!loading && (
        <div className="comment-section-footer">
          <button
            onClick={refreshComments}
            className="refresh-comments-btn"
            disabled={submittingComment}
          >
            Atualizar comentários
          </button>
        </div>
      )}
    </div>
  );
};

export default CommentSection;
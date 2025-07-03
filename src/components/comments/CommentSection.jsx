// src/components/comments/CommentSection.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import CommentForm from './CommentForm';
import CommentItem from './CommentItem';
import './CommentSection.css';

const CommentSection = ({ postId }) => {
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
      // Real-time desabilitado temporariamente devido a problemas de conexão
      // setupRealTimeSubscription();
    }

    return () => {
      if (subscription) {
        supabase.removeChannel(subscription);
      }
    };
  }, [postId]);

  const loadComments = async () => {
    // Removido setLoading(true) - não mostra loading inicial
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
    // Removido setLoading(false)
  };

  const setupRealTimeSubscription = () => {
    if (subscription) {
      supabase.removeChannel(subscription);
    }

    try {
      const channel = supabase
        .channel(`comments:${postId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'comments',
            filter: `post_id=eq.${postId}`
          },
          async (payload) => {
            try {
              // Buscar perfil do novo comentário
              const { data: profile } = await supabase
                .from('profiles')
                .select('id, username, full_name, avatar_url')
                .eq('id', payload.new.user_id)
                .single();

              const newComment = {
                ...payload.new,
                profiles: profile || {
                  id: payload.new.user_id,
                  username: 'usuario',
                  full_name: 'Usuário',
                  avatar_url: null
                }
              };

              if (!newComment.parent_id) {
                setComments(prev => [...prev, newComment]);
              }
            } catch (error) {
              console.error('Erro ao processar novo comentário real-time:', error);
            }
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'DELETE',
            schema: 'public',
            table: 'comments',
          },
          (payload) => {
            setComments(prev => prev.filter(c => c.id !== payload.old.id));
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log('✅ Real-time conectado para comentários');
          } else if (status === 'CHANNEL_ERROR') {
            console.warn('⚠️ Erro na conexão real-time, funcionando sem updates automáticos');
          }
        });

      setSubscription(channel);
    } catch (error) {
      console.warn('⚠️ Real-time não disponível, funcionando sem updates automáticos:', error);
    }
  };

  const handleNewComment = (newComment) => {
    // Adicionar visualmente sem esperar o real-time
    if (!comments.some(c => c.id === newComment.id)) {
      setComments(prev => [...prev, newComment]);
    }
  };

  const handleCommentDelete = (commentId) => {
    setComments(prev => prev.filter(comment => comment.id !== commentId));
  };

  const handleCommentEdit = (commentId, updatedComment) => {
    setComments(prev => 
      prev.map(comment => 
        comment.id === commentId 
          ? { ...comment, ...updatedComment }
          : comment
      )
    );
  };

  const handleReply = (parentId, newReply) => {
    console.log('Nova resposta no post:', newReply);
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
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default CommentSection;
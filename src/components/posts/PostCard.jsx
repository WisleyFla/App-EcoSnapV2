// src/components/posts/PostCard.jsx

import React, { useState } from 'react';
import { MessageCircle, Heart, Share2, MoreHorizontal, Trash2, Copy, Twitter, Facebook } from 'lucide-react';
import CommentSection from '../comments/CommentSection';
import { useTheme } from '../../context/ThemeContext';
import { toast } from 'react-hot-toast';
import DeletePostModal from './DeletePostModal';
import './PostCard.css';

const PostCard = ({
    post,
    currentUser,
    onLike,
    onDelete,
    onToggleComments,
    showComments = false
}) => {
    const { isDarkMode } = useTheme();
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showMenu, setShowMenu] = useState(false); // Estado do menu foi adicionado de volta
    const [isDeleting, setIsDeleting] = useState(false);
    const [commentsCount, setCommentsCount] = useState(Number(post.comments_count) || 0);
    const [showShareOptions, setShowShareOptions] = useState(false);

    // Verificação de dono do post foi adicionada de volta
    const isOwner = currentUser && post.user_id === currentUser.id;

    const handleCommentAdded = () => {
        setCommentsCount(prevCount => prevCount + 1);
    };

    const handleCommentRemoved = () => {
        setCommentsCount(prevCount => Math.max(0, prevCount - 1));
    };

    const formatTimeAgo = (dateString) => {
        const now = new Date();
        const date = new Date(dateString);
        const diffInSeconds = Math.floor((now - date) / 1000);

        if (diffInSeconds < 60) return 'agora';
        if (diffInSeconds < 3600) return `há ${Math.floor(diffInSeconds / 60)}min`;
        if (diffInSeconds < 86400) return `há ${Math.floor(diffInSeconds / 3600)}h`;
        if (diffInSeconds < 604800) return `há ${Math.floor(diffInSeconds / 86400)}d`;
        return date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' });
    };

    const renderLocation = () => {
        if (!post.location) return 'Localização não informada';
        if (typeof post.location === 'string') return post.location;
        if (typeof post.location === 'object') {
            return post.location.address || post.location.place_name || post.location.name || 'Localização não informada';
        }
        return 'Localização não informada';
    };
    
    // Função para abrir o modal de deleção a partir do menu
    const handleDeleteClick = () => {
        setShowDeleteConfirm(true);
        setShowMenu(false);
    };

    const handleDeleteCancel = () => {
        setShowDeleteConfirm(false);
    };

    const handleDeleteConfirm = async () => {
        if (isDeleting) return;
        setIsDeleting(true);
        try {
            await onDelete(post.id);
            setShowDeleteConfirm(false);
        } catch (error) {
            console.error('Erro ao deletar post:', error);
            toast.error(`Erro ao deletar: ${error.message}`);
        } finally {
            setIsDeleting(false);
        }
    };

    const getAvatarInitials = () => {
        const name = post.profiles?.full_name || post.profiles?.username || 'U';
        return name.charAt(0).toUpperCase();
    };

    const renderTags = () => {
        if (!post.tags || !Array.isArray(post.tags) || post.tags.length === 0) return null;
        return (
            <div className="post-tags">
                {post.tags.filter(tag => typeof tag === 'string').map((tag, index) => (
                    <span key={index} className="tag">#{tag}</span>
                ))}
            </div>
        );
    };

    const renderMedia = () => {
        if (!post.media_urls || !Array.isArray(post.media_urls) || post.media_urls.length === 0) return null;
        const validUrls = post.media_urls.filter(url => url && typeof url === 'string');
        if (validUrls.length === 0) return null;
        if (validUrls.length === 1) {
            return ( <div className="post-media"><div className="single-media"><img src={validUrls[0]} alt="Post media" className="media-image" onError={(e) => e.target.style.display = 'none'} /></div></div> );
        }
        return ( <div className="post-media"><div className={`media-grid grid-${Math.min(validUrls.length, 4)}`}>{validUrls.slice(0, 4).map((url, index) => ( <div key={index} className="media-item"><img src={url} alt={`Media ${index + 1}`} className="media-image" onError={(e) => e.target.style.display = 'none'} />{index === 3 && validUrls.length > 4 && (<div className="media-overlay">+{validUrls.length - 4}</div>)}</div>))}</div></div> );
    };

    const generateShareLink = (postId) => `${window.location.origin}/post/${postId}`;

    const copyToClipboard = () => {
        navigator.clipboard.writeText(generateShareLink(post.id));
        toast.success('Link copiado!');
        setShowShareOptions(false);
    };


    const handleNativeShare = async () => {
        try {
            await navigator.share({
                title: `Post de ${post.profiles?.full_name || post.profiles?.username || 'Usuário'}`,
                text: post.content.length > 100 ? `${post.content.substring(0, 100)}...` : post.content,
                url: generateShareLink(post.id),
            });
        } catch (error) {
            console.log('Web Share API não suportada ou compartilhamento cancelado', error);
            setShowShareOptions(true);
        }
    };


    return (
        <>
            <article className="post-card" data-theme={isDarkMode ? 'dark' : 'light'}>
                <header className="post-header">
                    <div className="post-avatar">
                        <div className="avatar-circle">{getAvatarInitials()}</div>
                    </div>
                    <div className="post-author-info">
                        <div className="author-name">{post.profiles?.full_name || post.profiles?.username || 'Usuário'}</div>
                        <div className="author-handle">@{post.profiles?.username || 'usuario'}</div>
                    </div>
                    <div className="post-metadata">
                        <time className="post-time" dateTime={post.created_at}>{formatTimeAgo(post.created_at)}</time>
                        
                        {/* O MENU DE OPÇÕES FOI ADICIONADO DE VOLTA AQUI */}
                        {isOwner && (
                            <div className="post-menu">
                                <button className="menu-trigger" onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }} aria-label="Opções do post">
                                    <MoreHorizontal size={18} />
                                </button>
                                {showMenu && (
                                    <div className="menu-dropdown" onClick={(e) => e.stopPropagation()}>
                                        <div
                                          onClick={handleDeleteClick}
                                          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { handleDeleteClick(); } }}
                                          className="menu-item delete-item"
                                          role="button"
                                          tabIndex="0"
                                        >
                                            <span className="menu-item-content">
                                                <Trash2 size={16} />
                                                Apagar
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </header>

                <div className="post-body">
                    <div className="post-content">{post.content}</div>
                    {renderTags()}
                    {renderMedia()}
                    <div className="post-location">
                        <svg className="location-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
                        <span>{renderLocation()}</span>
                    </div>
                </div>

                <footer className="post-actions">
                    <button className={`action-button like-button ${post.user_has_liked ? 'liked' : ''}`} onClick={() => onLike(post.id)} aria-label={post.user_has_liked ? 'Descurtir' : 'Curtir'}><Heart size={18} fill={post.user_has_liked ? 'currentColor' : 'none'} /><span>{Number(post.likes_count) || 0}</span></button>
                    <button className="action-button comment-button" onClick={() => onToggleComments(post.id)} aria-label="Comentários"><MessageCircle size={18} /><span>{commentsCount}</span></button>
                    <button className="action-button share-button" onClick={() => { if (navigator.share) { handleNativeShare(); } else { setShowShareOptions(true); } }} aria-label="Compartilhar"><Share2 size={18} /></button>
                </footer>

                {showComments && ( <div className="post-comments"><CommentSection postId={post.id} onCommentAdded={handleCommentAdded} onCommentRemoved={handleCommentRemoved} /></div> )}
            </article>

            <DeletePostModal
              isOpen={showDeleteConfirm}
              onConfirm={handleDeleteConfirm}
              onCancel={handleDeleteCancel}
              isDeleting={isDeleting}
              postContent={post.content}
            />

            {showShareOptions && ( <div className="modal-overlay" onClick={() => setShowShareOptions(false)}><div className="share-modal" onClick={(e) => e.stopPropagation()}><div className="modal-header"><h3>Compartilhar Post</h3></div><div className="modal-body"><div className="share-options"><button onClick={copyToClipboard} className="share-option"><Copy size={24} /> <span>Copiar link</span></button><a href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(generateShareLink(post.id))}&text=${encodeURIComponent(post.content.substring(0, 100))}`} target="_blank" rel="noopener noreferrer" className="share-option"><Twitter size={24} /> <span>Twitter</span></a><a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(generateShareLink(post.id))}`} target="_blank" rel="noopener noreferrer" className="share-option"><Facebook size={24} /> <span>Facebook</span></a><a href={`whatsapp://send?text=${encodeURIComponent(`Confira este post: ${generateShareLink(post.id)}`)}`} className="share-option"><Share2 size={24} /> <span>WhatsApp</span></a></div></div><div className="modal-footer"><button onClick={() => setShowShareOptions(false)} className="button-secondary">Fechar</button></div></div></div>)}
            
            {/* Overlay para fechar o menu dropdown */}
            {showMenu && <div className="menu-overlay" onClick={() => setShowMenu(false)} />}
        </>
    );
};

export default PostCard;
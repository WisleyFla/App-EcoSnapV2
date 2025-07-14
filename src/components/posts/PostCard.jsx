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
    console.log('DADOS DO POST RECEBIDO PELO CARD:', post);

    const { isDarkMode } = useTheme();
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [commentsCount, setCommentsCount] = useState(Number(post.comments_count) || 0);
    const [showShareOptions, setShowShareOptions] = useState(false);

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
        if (!post.location) {
            return null;
        }

        let locationData = post.location;

        // Garante que o dado seja um objeto, mesmo que venha como string JSON
        if (typeof locationData === 'string') {
            try {
                locationData = JSON.parse(locationData);
            } catch (error) {
                return locationData; // Retorna a string se não for um JSON válido
            }
        }

        if (typeof locationData === 'object' && locationData !== null) {
            const displayName = locationData.fullAddress || locationData.name;
            const hasCoordinates = locationData.coordinates &&
                                   typeof locationData.coordinates.latitude === 'number' &&
                                   typeof locationData.coordinates.longitude === 'number';

            // 1. Caso Ideal: Temos nome E coordenadas
            if (displayName && hasCoordinates) {
                const lat = locationData.coordinates.latitude.toFixed(4);
                const lon = locationData.coordinates.longitude.toFixed(4);
                return `${displayName} · Lat: ${lat}, Lon: ${lon}`;
            }

            // 2. Fallback: Temos apenas o nome
            if (displayName) {
                return displayName;
            }

            // 3. Fallback: Temos apenas as coordenadas
            if (hasCoordinates) {
                const lat = locationData.coordinates.latitude.toFixed(4);
                const lon = locationData.coordinates.longitude.toFixed(4);
                return `Lat: ${lat}, Lon: ${lon}`;
            }
        }
        
        // Retorna a string original se for o caso
        if (typeof post.location === 'string') {
            return post.location;
        }

        return 'Localização não informada';
    };
    
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
    
    // FUNÇÃO ATUALIZADA PARA SUPORTE A VÍDEO
    const renderMedia = () => {
        if (!post.media_urls || !Array.isArray(post.media_urls) || post.media_urls.length === 0) {
            return null;
        }
        
        const validUrls = post.media_urls.filter(url => typeof url === 'string' && url);

        if (validUrls.length === 0) return null;

        // Se houver apenas uma mídia
        if (validUrls.length === 1) {
            const url = validUrls[0];
            const isVideo = url.endsWith('.mp4') || url.endsWith('.webm');
            
            return (
                <div className="post-media-container">
                    {isVideo ? (
                        <div className="video-container">
                            <video src={url} controls className="post-media-item" />
                        </div>
                    ) : (
                        <div className="single-media">
                            <img src={url} alt="Mídia do post" className="post-media-item" />
                        </div>
                    )}
                </div>
            );
        }

        // Se houver múltiplas mídias (grid)
        return (
            <div className={`post-media-container grid-layout grid-${Math.min(validUrls.length, 4)}`}>
                {validUrls.slice(0, 4).map((url, index) => {
                    const isVideo = url.endsWith('.mp4') || url.endsWith('.webm');
                    return (
                        <div key={index} className="media-grid-item">
                            {isVideo ? (
                                <video src={url} className="post-media-item" />
                            ) : (
                                <img src={url} alt={`Mídia do post ${index + 1}`} className="post-media-item" />
                            )}
                            {index === 3 && validUrls.length > 4 && (
                                <div className="media-overlay">+{validUrls.length - 4}</div>
                            )}
                        </div>
                    );
                })}
            </div>
        );
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
                        {post.profiles?.avatar_url ? (
                            <img src={post.profiles.avatar_url} alt={`Foto de ${post.profiles.full_name}`} className="avatar-image" />
                        ) : (
                            <div className="avatar-circle">{getAvatarInitials()}</div>
                        )}
                    </div>
                    <div className="post-author-info">
                        <div className="author-name">{post.profiles?.full_name || post.profiles?.username || 'Usuário'}</div>
                        <div className="author-handle">@{post.profiles?.username || 'usuario'}</div>
                    </div>
                    <div className="post-metadata">
                        <time className="post-time" dateTime={post.created_at}>{formatTimeAgo(post.created_at)}</time>
                        {isOwner && (
                            <div className="post-menu">
                                <button className="menu-trigger" onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }} aria-label="Opções do post">
                                    <MoreHorizontal size={18} />
                                </button>
                                {showMenu && (
                                    <div className="menu-dropdown" onClick={(e) => e.stopPropagation()}>
                                        <div onClick={handleDeleteClick} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { handleDeleteClick(); } }} className="menu-item delete-item" role="button" tabIndex="0">
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

            <DeletePostModal isOpen={showDeleteConfirm} onConfirm={handleDeleteConfirm} onCancel={handleDeleteCancel} isDeleting={isDeleting} postContent={post.content}/>
            {showShareOptions && ( <div className="modal-overlay" onClick={() => setShowShareOptions(false)}><div className="share-modal" onClick={(e) => e.stopPropagation()}><div className="modal-header"><h3>Compartilhar Post</h3></div><div className="modal-body"><div className="share-options"><button onClick={copyToClipboard} className="share-option"><Copy size={24} /> <span>Copiar link</span></button><a href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(generateShareLink(post.id))}&text=${encodeURIComponent(post.content.substring(0, 100))}`} target="_blank" rel="noopener noreferrer" className="share-option"><Twitter size={24} /> <span>Twitter</span></a><a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(generateShareLink(post.id))}`} target="_blank" rel="noopener noreferrer" className="share-option"><Facebook size={24} /> <span>Facebook</span></a><a href={`whatsapp://send?text=${encodeURIComponent(`Confira este post: ${generateShareLink(post.id)}`)}`} className="share-option"><Share2 size={24} /> <span>WhatsApp</span></a></div></div><div className="modal-footer"><button onClick={() => setShowShareOptions(false)} className="button-secondary">Fechar</button></div></div></div>)}
            {showMenu && <div className="menu-overlay" onClick={() => setShowMenu(false)} />}
        </>
    );
};

export default PostCard;
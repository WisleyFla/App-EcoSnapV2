import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { MoreVertical, Edit, LogOut, Trash2 } from 'lucide-react';

// Services
import { communityService } from '../../../services/communityService';
import { postsService } from '../../../services/postsService';
import { useAuth } from '../../../context/AuthContext';

// Components
import PostCard from '../../posts/PostCard';
import Loading from '../../ui/Loading';
import EditCommunityModal from './EditCommunityModal';
import { NewPostModal } from '../../pages/part_Home/NewPostModal';

// Styles
import './community.css';

export default function CommunityDetail() {
  // Hooks
  const { communityId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // States
  const [community, setCommunity] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [membership, setMembership] = useState({ isMember: false, isOwner: false });
  const [isProcessing, setIsProcessing] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isNewPostModalOpen, setIsNewPostModalOpen] = useState(false);
  const [activeCommentSection, setActiveCommentSection] = useState(null);

  // Fetch community data
  useEffect(() => {
    async function fetchData() {
      if (!user) return;
      
      try {
        setLoading(true);
        const [details, communityPosts, memStatus] = await Promise.all([
          communityService.getCommunityDetails(communityId),
          communityService.getCommunityPosts(communityId),
          communityService.checkMembership(communityId, user.id)
        ]);
        
        setCommunity(details);
        setPosts(communityPosts);
        setMembership(memStatus);
      } catch (error) {
        toast.error("Não foi possível carregar a comunidade.");
        navigate('/communities');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [communityId, user, navigate]);

  // Community actions
  const handleLeaveCommunity = async () => {
    if (!window.confirm("Tem certeza que deseja sair desta comunidade?")) return;
    
    setIsProcessing(true);
    try {
      await communityService.toggleMembership(communityId, user.id, true);
      toast.success("Você saiu da comunidade.");
      setMembership({ ...membership, isMember: false });
    } catch (error) {
      toast.error("Erro ao sair da comunidade.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteCommunity = async () => {
    if (!window.confirm("ATENÇÃO: Esta ação é irreversível e apagará a comunidade para todos. Deseja continuar?")) return;

    setIsProcessing(true);
    try {
      await communityService.deleteCommunity(communityId);
      toast.success("Comunidade apagada com sucesso.");
      navigate('/communities');
    } catch (error) {
      toast.error("Erro ao apagar a comunidade.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCommunityUpdated = (updatedData) => {
    setCommunity(prev => ({ ...prev, ...updatedData }));
    toast.success("Comunidade atualizada!");
    setIsEditModalOpen(false);
  };

  // Post actions
  const handlePostCreated = (newPost) => {
    setPosts(prevPosts => [newPost, ...prevPosts]);
    setIsNewPostModalOpen(false);
  };

  const handleLike = async (postId) => {
    try {
      const { liked } = await postsService.toggleLike(postId, user.id);
      
      setPosts(currentPosts => 
        currentPosts.map(p => {
          if (p.id === postId) {
            return {
              ...p,
              user_has_liked: liked,
              likes_count: liked ? p.likes_count + 1 : p.likes_count - 1,
            };
          }
          return p;
        })
      );
    } catch (error) {
      toast.error("Erro ao processar curtida.");
      console.error(error);
    }
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm("Tem certeza que deseja apagar esta publicação?")) return;
    
    try {
      await postsService.deletePost(postId);
      setPosts(currentPosts => currentPosts.filter(p => p.id !== postId));
      toast.success("Publicação apagada.");
    } catch (error) {
      toast.error("Erro ao apagar publicação.");
      console.error(error);
    }
  };

  const handleToggleComments = (postId) => {
    setActiveCommentSection(currentId => (currentId === postId ? null : postId));
  };

  if (loading) return <Loading />;

  return (
    <>
      <div className="community-detail-container">
        <main className="main-content">
          <header className="community-header">
            <div className="header-left">
              <button className="back-btn" onClick={() => navigate(-1)}>←</button>
              <h1 className="community-title">{community?.name}</h1>
            </div>
            
            {(membership.isOwner || membership.isMember) && (
              <div className="options-menu-container">
                <button 
                  className="options-menu-btn" 
                  onClick={() => setIsMenuOpen(true)}
                >
                  <MoreVertical size={20} />
                </button>

                {isMenuOpen && (
                  <div className="options-dropdown-menu">
                    {membership.isOwner && (
                      <>
                        <button 
                          onClick={() => { 
                            setIsEditModalOpen(true); 
                            setIsMenuOpen(false); 
                          }} 
                          className="dropdown-item"
                        >
                          <Edit size={16} /> Editar Comunidade
                        </button>
                        <button 
                          onClick={() => { 
                            handleDeleteCommunity(); 
                            setIsMenuOpen(false); 
                          }} 
                          className="dropdown-item destructive"
                        >
                          <Trash2 size={16} /> Apagar Comunidade
                        </button>
                      </>
                    )}
                    {membership.isMember && !membership.isOwner && (
                      <button 
                        onClick={() => { 
                          handleLeaveCommunity(); 
                          setIsMenuOpen(false); 
                        }} 
                        className="dropdown-item"
                      >
                        <LogOut size={16} /> Sair da Comunidade
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </header>

          <section className="community-info-bar">
            <div className="community-avatar">
              {community?.avatar_url ? (
                <img src={community.avatar_url} alt="Avatar da comunidade"/>
              ) : (
                '🌿'
              )}
            </div>
            <div className="community-details">
              <p className="community-info-description">{community?.description}</p>
              <div className="community-meta">
                Criado por {community?.profiles?.full_name || '...'} • {community?.members_count || 0} membros
              </div>
            </div>
          </section>

          <div className="posts-feed">
            <h2>Publicações</h2>
            {posts.length > 0 ? (
              posts.map(post => (
                <PostCard 
                  key={post.id} 
                  post={post} 
                  currentUser={user}
                  onLike={() => handleLike(post.id)}
                  onDelete={() => handleDeletePost(post.id)}
                  onToggleComments={() => handleToggleComments(post.id)}
                  showComments={activeCommentSection === post.id}
                />
              ))
            ) : (
              <div className="empty-posts-message">
                <p>Ainda não há publicações nesta comunidade.</p>
                <p>Seja o primeiro a compartilhar algo!</p>
              </div>
            )}
          </div>
        </main>

        <button 
          className="add-post-btn" 
          title="Nova Publicação"
          onClick={() => setIsNewPostModalOpen(true)}
        >
          +
        </button>
      </div>

      {isMenuOpen && (
        <div 
          className="menu-overlay" 
          onClick={() => setIsMenuOpen(false)}
        />
      )}

      <EditCommunityModal 
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={handleCommunityUpdated}
        communityData={community}
      />

      <NewPostModal 
        isOpen={isNewPostModalOpen}
        onClose={() => setIsNewPostModalOpen(false)}
        onCreatePost={handlePostCreated}
        communityId={communityId}
      />
    </>
  );
}
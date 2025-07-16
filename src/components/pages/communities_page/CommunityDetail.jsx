import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { communityService } from '../../../services/communityService';
import { useAuth } from '../../../context/AuthContext';
import PostCard from '../../posts/PostCard';
import Loading from '../../ui/Loading';
import toast from 'react-hot-toast';
import './community.css';

export default function CommunityDetail() {
  const { communityId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [community, setCommunity] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const details = await communityService.getCommunityDetails(communityId);
        const communityPosts = await communityService.getCommunityPosts(communityId);
        setCommunity(details);
        setPosts(communityPosts);
      } catch (error) {
        toast.error("Não foi possível carregar a comunidade.");
        navigate('/communities');
      } finally {
        setLoading(false);
      }
    }
    if (user) {
      fetchData();
    }
  }, [communityId, user, navigate]);

  if (loading) return <Loading />;

  return (
    <div className="page-container">
      <header className="community-detail-header">
        <button onClick={() => navigate(-1)} className="back-button">&larr;</button>
        {community?.avatar_url && <img src={community.avatar_url} alt="Avatar da comunidade" className="community-detail-avatar" />}
        <div>
          <h1>{community?.name}</h1>
          <p>{community?.description}</p>
        </div>
      </header>

      <div className="posts-feed">
        <h2>Publicações</h2>
        {posts.length > 0 ? (
          posts.map(post => (
            <PostCard key={post.id} post={post} currentUser={user} />
          ))
        ) : (
          <p>Ainda não há publicações nesta comunidade.</p>
        )}
      </div>
    </div>
  );
}
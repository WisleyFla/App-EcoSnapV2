// src/components/pages/part_Home/Home.jsx
import React, { useState } from 'react';
import { useTheme } from '../../../context/ThemeContext';
import { useAuth } from '../../../context/AuthContext';
import { useSuperSimpleFeed } from '../../../hooks/useSuperSimpleFeed';
import LocationMapSelector from '../../ui/LocationMapSelector';
import PostCard from '../../posts/PostCard';
import { Plus } from 'lucide-react';
import toast from 'react-hot-toast';

// Importando dos componentes locais
import {
  Sidebar,
  SearchBar,
  NewPostModal,
  EmptyFeedMessage,
  HomeLoading,
  HomeError
} from './index'; // Importa do arquivo index.js local

function Home() {
  const { isDarkMode } = useTheme();
  const { user } = useAuth();
  const {
    posts,
    loading,
    error,
    toggleLike: handleLikeAction,
    createPost: handleCreatePost,
    deletePost: handleDeletePost,
    refresh: refreshFeed
  } = useSuperSimpleFeed();

  const [newPostModal, setNewPostModal] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [showMapSelector, setShowMapSelector] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [openCommentsPostId, setOpenCommentsPostId] = useState(null);

  // Função para obter localização rápida via GPS
  const getQuickLocation = async () => {
    if (!navigator.geolocation) {
      toast.error('Geolocalização não suportada pelo seu navegador');
      return;
    }

    setLocationLoading(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude, accuracy } = position.coords;

        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=16&addressdetails=1&accept-language=pt-BR`
          );

          let locationName = 'Localização atual';
          if (response.ok) {
            const data = await response.json();
            const address = data.address || {};
            locationName = address.village || address.town || address.suburb ||
              address.neighbourhood || address.city || 'Localização atual';
          }

          setCurrentLocation({
            name: locationName,
            fullAddress: `${locationName} (GPS)`,
            coordinates: { latitude, longitude },
            accuracy: `${Math.round(accuracy)}m`,
            source: 'GPS'
          });

          setLocationLoading(false);
          toast.success('Localização atual obtida!');
        } catch (error) {
          setLocationLoading(false);
          toast.error('Erro ao obter detalhes da localização');
        }
      },
      (error) => {
        setLocationLoading(false);
        toast.error('Erro ao obter localização atual');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleRefreshFeed = async () => {
    try {
      setRefreshing(true);
      await refreshFeed();
      toast.success('Feed atualizado!');
    } catch (error) {
      toast.error('Erro ao atualizar feed');
    } finally {
      setRefreshing(false);
    }
  };

  const handleToggleComments = (postId) => {
    setOpenCommentsPostId(prevId => (prevId === postId ? null : postId));
  };

  if (loading) return <HomeLoading />;
  if (error) return <HomeError error={error} onRetry={handleRefreshFeed} />;

  return (
    <>
      <Sidebar />

      <main className="main-content">
        <SearchBar onRefresh={handleRefreshFeed} refreshing={refreshing} />

        {posts.length === 0 ? (
          <EmptyFeedMessage />
        ) : (
          posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              currentUser={user}
              onLike={handleLikeAction}
              onDelete={handleDeletePost}
              onToggleComments={handleToggleComments}
              showComments={openCommentsPostId === post.id}
            />
          ))
        )}
      </main>

      <NewPostModal
        isOpen={newPostModal}
        onClose={() => setNewPostModal(false)}
        onCreatePost={handleCreatePost}
        isDarkMode={isDarkMode}
        initialLocation={currentLocation}
        onLocationSelect={setCurrentLocation}
        onGetQuickLocation={getQuickLocation}
        locationLoading={locationLoading}
      />

      <LocationMapSelector
        isOpen={showMapSelector}
        onClose={() => setShowMapSelector(false)}
        onLocationSelect={setCurrentLocation}
        initialLocation={currentLocation?.coordinates}
        isDarkMode={isDarkMode}
      />

      {/* Oculta o botão flutuante quando o modal está aberto */}
      {!newPostModal && (
        <div className="floating-buttons">
          <button className="post-btn" onClick={() => setNewPostModal(true)}>
            <Plus size={24} />
          </button>
        </div>
      )}

      {/* FIX: Moved the style block inside the component's return fragment */}
      <style jsx>{`
        .post-btn {
          background-color: #ffffff;
          color: #275736;
          border: 2px solid #275736;
          width: 50px;
          height: 50px;
          border-radius: 50%;
          font-size: 24px;
          font-weight: bold;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .post-btn:hover {
          background-color: #f0f0f0;
          transform: scale(1.1);
        }
          
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}

export default Home;

// The stray </> at the end of the original file has been removed.
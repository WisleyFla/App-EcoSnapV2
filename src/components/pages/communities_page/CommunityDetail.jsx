import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

// --- Importações de Serviços e Contextos ---
import { communityService } from '../../../services/communityService';
import { useAuth } from '../../../context/AuthContext';

// --- Importações de Componentes de UI ---
import PostCard from '../../posts/PostCard';
import Loading from '../../ui/Loading';
import EditCommunityModal from './EditCommunityModal';
// Reutilizamos o modal de criação de post que você já tinha
import { NewPostModal } from '../../pages/part_Home/NewPostModal'; 

// --- Importações de Ícones e Estilos ---
import { MoreVertical, Edit, LogOut, Trash2 } from 'lucide-react';
import './community.css';


// --- Início do Componente ---
export default function CommunityDetail() {
  // =============================================
  // HOOKS E ESTADOS (State)
  // =============================================
  
  // Hooks do React Router para obter parâmetros da URL e para navegação
  const { communityId } = useParams();
  const navigate = useNavigate();
  
  // Hook personalizado para obter o usuário logado
  const { user } = useAuth();
  
  // Estados para armazenar os dados da página
  const [community, setCommunity] = useState(null); // Guarda as informações da comunidade
  const [posts, setPosts] = useState([]); // Guarda a lista de posts
  const [membership, setMembership] = useState({ isMember: false, isOwner: false }); // Guarda o status do usuário na comunidade

  // Estados para controlar a interface
  const [loading, setLoading] = useState(true); // Controla a exibição da tela de carregamento
  const [isProcessing, setIsProcessing] = useState(false); // Desativa botões durante uma ação
  const [isMenuOpen, setIsMenuOpen] = useState(false); // Controla o menu de opções (três pontinhos)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false); // Controla o modal de edição da comunidade
  const [isNewPostModalOpen, setIsNewPostModalOpen] = useState(false); // Controla o modal de criação de post


  // =============================================
  // EFEITO PARA BUSCAR DADOS (useEffect)
  // =============================================
  
  // Este bloco é executado quando o componente é carregado ou quando uma de suas dependências (communityId ou user) muda.
  useEffect(() => {
    async function fetchData() {
      if (!user) return; // Só busca dados se o usuário estiver carregado

      try {
        setLoading(true);
        // Dispara todas as buscas de dados em paralelo para mais performance
        const detailsPromise = communityService.getCommunityDetails(communityId);
        const postsPromise = communityService.getCommunityPosts(communityId);
        const membershipPromise = communityService.checkMembership(communityId, user.id);
        
        // Espera todas as buscas terminarem
        const [details, communityPosts, memStatus] = await Promise.all([
          detailsPromise, 
          postsPromise, 
          membershipPromise
        ]);

        // Atualiza os estados do componente com os dados recebidos do serviço
        setCommunity(details);
        setPosts(communityPosts);
        setMembership(memStatus);

      } catch (error) {
        toast.error("Não foi possível carregar a comunidade.");
        navigate('/communities'); // Em caso de erro, volta para a lista
      } finally {
        setLoading(false); // Garante que o loading termine, mesmo com erro
      }
    }
    fetchData();
  }, [communityId, user, navigate]); // Dependências do efeito


  // =============================================
  // FUNÇÕES DE AÇÃO (Event Handlers)
  // =============================================

  // Função para quando o usuário clica em "Sair da Comunidade"
  const handleLeaveCommunity = async () => {
    if (!window.confirm("Tem certeza que deseja sair desta comunidade?")) return;
    
    setIsProcessing(true);
    try {
      await communityService.toggleMembership(communityId, user.id, true); // 'true' indica que ele é membro e quer sair
      toast.success("Você saiu da comunidade.");
      setMembership({ ...membership, isMember: false });
    } catch (error) {
      toast.error("Erro ao sair da comunidade.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Função para quando o dono clica em "Apagar Comunidade"
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
  
  // Função chamada quando o modal de edição salva com sucesso
  const handleCommunityUpdated = (updatedData) => {
    // Atualiza os dados da comunidade na tela sem precisar recarregar a página
    setCommunity(prev => ({ ...prev, ...updatedData }));
    toast.success("Comunidade atualizada!");
    setIsEditModalOpen(false); // Fecha o modal de edição
  };

  // Função chamada quando um novo post é criado com sucesso
  const handlePostCreated = (newPost) => {
    // Adiciona o novo post no topo da lista para feedback instantâneo
    setPosts(prevPosts => [newPost, ...prevPosts]);
    // O toast de sucesso já é mostrado pelo serviço
    setIsNewPostModalOpen(false); // Fecha o modal de criação de post
  };


  // Se a página estiver carregando, mostra o componente de Loading
  if (loading) {
    return <Loading />;
  }


  // =============================================
  // RENDERIZAÇÃO DO COMPONENTE (JSX)
  // =============================================

  return (
    // Fragment <>...</> para agrupar o conteúdo da página e os modais
    <>
      <div className="community-detail-container">
        <main className="main-content">

          {/* Cabeçalho da página otimizado para mobile */}
          <header className="community-header">
            <div className="header-left">
              <button className="back-btn" onClick={() => navigate(-1)}>←</button>
              <h1 className="community-title">{community?.name}</h1>
            </div>
            
            <div className="options-menu-container">
              {/* O botão de opções só aparece se houver alguma ação disponível */}
              {(membership.isOwner || membership.isMember) && (
                <button className="options-menu-btn" onClick={() => setIsMenuOpen(true)}>
                  <MoreVertical size={20} />
                </button>
              )}

              {/* O menu dropdown que aparece quando isMenuOpen é true */}
              {isMenuOpen && (
                <div className="options-dropdown-menu">
                  {membership.isOwner && (
                    <>
                      <button onClick={() => { setIsEditModalOpen(true); setIsMenuOpen(false); }} className="dropdown-item">
                        <Edit size={16} /> Editar Comunidade
                      </button>
                      <button onClick={() => { handleDeleteCommunity(); setIsMenuOpen(false); }} className="dropdown-item destructive">
                        <Trash2 size={16} /> Apagar Comunidade
                      </button>
                    </>
                  )}
                  {membership.isMember && !membership.isOwner && (
                    <button onClick={() => { handleLeaveCommunity(); setIsMenuOpen(false); }} className="dropdown-item">
                      <LogOut size={16} /> Sair da Comunidade
                    </button>
                  )}
                </div>
              )}
            </div>
          </header>

          {/* Barra de Informações da Comunidade */}
          <section className="community-info-bar">
            <div className="community-avatar">
              {community?.avatar_url ? (
                <img src={community.avatar_url} alt="Avatar da comunidade"/>
              ) : (
                '🌿' // Ícone padrão
              )}
            </div>
            <div className="community-details">
              <p className="community-info-description">{community?.description}</p>
              <div className="community-meta">
                Criado por {community?.profiles?.full_name || '...'} • {community?.members_count || 0} membros
              </div>
            </div>
          </section>

          {/* Feed de Posts */}
          <div className="posts-feed">
            <h2>Publicações</h2>
            {posts.length > 0 ? (
              posts.map(post => (
                <PostCard key={post.id} post={post} currentUser={user} />
              ))
            ) : (
              <div className="empty-posts-message">
                <p>Ainda não há publicações nesta comunidade.</p>
                <p>Seja o primeiro a compartilhar algo!</p>
              </div>
            )}
          </div>
        </main>

        {/* Botão Flutuante para Adicionar Post */}
        <button 
          className="add-post-btn" 
          title="Nova Publicação"
          onClick={() => setIsNewPostModalOpen(true)}
        >
          +
        </button>
      </div>

      {/* Overlay para fechar o menu ao clicar fora */}
      {isMenuOpen && <div className="menu-overlay" onClick={() => setIsMenuOpen(false)}></div>}

      {/* Renderização condicional dos Modais */}
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
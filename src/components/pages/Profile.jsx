import React, { useState, useEffect, useRef } from 'react';
import { User as UserIcon, Camera, Bell, Globe, MapPin, Activity, Settings, CheckCircle, LogOut, X, Save, Upload, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { 
  saveUserProfile, 
  loadUserProfile, 
  saveUserSettings, 
  loadUserSettings, 
  updateProfileImage, 
  removeProfileImage,
  getUserStats,
  checkUsernameAvailability
} from '../../services/profileService';

import '../../styles/pages/Profile.css';

function Profile() {
  const [activeTab, setActiveTab] = useState('activity');
  const [pushNotifications, setPushNotifications] = useState(true);
  const [publicProfile, setPublicProfile] = useState(true);
  const [offlineMode, setOfflineMode] = useState(false);
  const [syncDiary, setSyncDiary] = useState(true);

  // Estados para edição de perfil
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [profileData, setProfileData] = useState({
    name: 'Usuário EcoSnap',
    handle: '@usuario_ecosnap',
    bio: 'Apaixonado pela natureza e pela conservação do Cerrado. Compartilhando descobertas e aprendizados sobre a biodiversidade brasileira. 🌱',
    location: 'Brasília, DF',
    website: '',
    profileImageURL: null
  });
  const [editingProfile, setEditingProfile] = useState({...profileData});
  const [userStats, setUserStats] = useState({
    posts: 0,
    followers: 0,
    following: 0,
    points: 0
  });

  // Estados para upload de imagem
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef(null);

  const navigate = useNavigate();
  const { logout: authLogout, user } = useAuth();

  // Estado de carregamento
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // ===================================
  // FUNÇÕES DAS CONFIGURAÇÕES
  // ===================================
  
  const requestNotificationPermission = async () => {
    try {
      if ('Notification' in window) {
        const permission = await Notification.requestPermission();
        
        if (permission === 'granted') {
          console.log('✅ Permissão de notificação concedida');
          new Notification('EcoSnap', {
            body: 'Notificações ativadas com sucesso!',
            icon: '/vite.svg'
          });
        } else {
          console.log('❌ Permissão de notificação negada');
          toast.error('Permissão de notificação negada pelo navegador');
        }
      } else {
        console.log('❌ Notificações não suportadas neste navegador');
        toast.error('Notificações não suportadas neste navegador');
      }
    } catch (error) {
      console.error('Erro ao solicitar permissão:', error);
      toast.error('Erro ao ativar notificações');
    }
  };

  const updateProfilePrivacy = async (isPublic) => {
    try {
      const { data: currentUser, error: fetchError } = await supabase
        .from('profiles') // CORRIGIDO
        .select('preferences')
        .eq('id', user.id)
        .single();

      if (fetchError) {
        console.error('Erro ao buscar configurações atuais:', fetchError);
        return;
      }

      const currentPreferences = currentUser?.preferences || {};
      
      const { data, error } = await supabase
        .from('profiles') // CORRIGIDO
        .update({ 
          preferences: {
            ...currentPreferences,
            publicProfile: isPublic
          }
        })
        .eq('id', user.id);

      if (error) throw error;
      
      console.log('✅ Privacidade do perfil atualizada:', isPublic ? 'Público' : 'Privado');
    } catch (error) {
      console.error('❌ Erro ao atualizar privacidade:', error);
    }
  };

  const toggleOfflineMode = (enabled) => {
    try {
      if (enabled) {
        if ('serviceWorker' in navigator) {
          console.log('✅ Modo offline ativado - dados serão salvos localmente');
          localStorage.setItem('ecosnap_offline_mode', 'true');
        } else {
          toast.error('Modo offline não suportado neste navegador');
        }
      } else {
        console.log('✅ Modo offline desativado');
        localStorage.removeItem('ecosnap_offline_mode');
      }
    } catch (error) {
      console.error('❌ Erro ao configurar modo offline:', error);
    }
  };

  const toggleDiarySync = (enabled) => {
    try {
      if (enabled) {
        console.log('✅ Sincronização do diário ativada');
        localStorage.setItem('ecosnap_diary_sync', 'true');
      } else {
        console.log('✅ Sincronização do diário desativada');
        localStorage.removeItem('ecosnap_diary_sync');
      }
    } catch (error) {
      console.error('❌ Erro ao configurar sincronização do diário:', error);
    }
  };

  useEffect(() => {
    if (user?.id) {
      loadProfileData();
      loadSettingsData();
      loadUserStats();
    }
  }, [user]);

  const loadUserStats = async () => {
    try {
      const result = await getUserStats(user.id);
      if (result.success) {
        setUserStats(result.stats);
      }
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    }
  };

  const loadProfileData = async () => {
    try {
      setIsLoading(true);
      const result = await loadUserProfile(user.id);
      
      if (result.success && result.data) {
        const loadedData = {
          name: result.data.full_name || user.email?.split('@')[0] || 'Usuário EcoSnap', // CORRIGIDO para full_name
          handle: result.data.username ? `@${result.data.username}` : `@${user.email?.split('@')[0] || 'usuario'}`,
          bio: result.data.bio || 'Novo no EcoSnap! 🌱',
          location: result.data.institution || '',
          website: result.data.website || '',
          profileImageURL: result.data.avatar_url || null
        };
        
        setProfileData(loadedData);
        setEditingProfile(loadedData);
      }
    } catch (error) {
      console.error('Erro ao carregar perfil:', error);
      toast.error('Erro ao carregar dados do perfil');
    } finally {
      setIsLoading(false);
    }
  };

  const loadSettingsData = async () => {
    try {
      const result = await loadUserSettings(user.id);
      
      if (result.success && result.settings) {
        const settings = result.settings;
        setPushNotifications(settings.pushNotifications ?? true);
        setPublicProfile(settings.publicProfile ?? true);
        setOfflineMode(settings.offlineMode ?? false);
        setSyncDiary(settings.syncDiary ?? true);
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
    }
  };

  const showTab = (tabName) => {
    setActiveTab(tabName);
  };

  const toggleSetting = async (settingName) => {
    let newState;
    let currentSettings = {
      pushNotifications,
      publicProfile,
      offlineMode,
      syncDiary
    };
    
    switch (settingName) {
      case 'pushNotifications':
        newState = !pushNotifications;
        setPushNotifications(newState);
        if (newState) {
          requestNotificationPermission();
          toast.success('Notificações Push ativadas!');
        } else {
          toast.success('Notificações Push desativadas!');
        }
        console.log(`Estado Notificações Push: ${newState}`);
        break;
        
      case 'publicProfile':
        newState = !publicProfile;
        setPublicProfile(newState);
        setTimeout(() => updateProfilePrivacy(newState), 0);
        if (newState) {
          toast.success('Perfil agora é público - visível para todos!');
        } else {
          toast.success('Perfil agora é privado - apenas você pode ver!');
        }
        console.log(`Estado Perfil Público: ${newState}`);
        break;
        
      case 'offlineMode':
        newState = !offlineMode;
        setOfflineMode(newState);
        toggleOfflineMode(newState);
        if (newState) {
          toast.success('Modo Offline ativado - dados salvos localmente!');
        } else {
          toast.success('Modo Offline desativado - usando conexão online!');
        }
        console.log(`Estado Modo Offline: ${newState}`);
        break;
        
      case 'syncDiary':
        newState = !syncDiary;
        setSyncDiary(newState);
        toggleDiarySync(newState);
        if (newState) {
          toast.success('Sincronização do Diário ativada!');
        } else {
          toast.success('Sincronização do Diário desativada!');
        }
        console.log(`Estado Sincronizar Diário: ${newState}`);
        break;
        
      default:
        return;
    }

    currentSettings[settingName] = newState;
    
    try {
      await saveUserSettings(user.id, currentSettings);
      console.log('Configurações salvas no Supabase:', currentSettings);
    } catch (error) {
      console.error('Erro ao salvar configuração:', error);
      toast.error('Erro ao salvar configuração');
    }
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      setIsUploadingImage(true);
      setUploadProgress(0);

      const onProgress = (progress) => {
        setUploadProgress(progress);
      };

      const result = await updateProfileImage(user.id, file, onProgress);
      
      if (result.success) {
        const updatedProfile = {
          ...profileData,
          profileImageURL: result.imageURL
        };
        
        setProfileData(updatedProfile);
        setEditingProfile(updatedProfile);
        
        toast.success('Foto de perfil atualizada com sucesso!');
      }
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      toast.error(error.message || 'Erro ao fazer upload da imagem');
    } finally {
      setIsUploadingImage(false);
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveImage = async () => {
    try {
      setIsUploadingImage(true);
      
      await removeProfileImage(user.id);
      
      const updatedProfile = {
        ...profileData,
        profileImageURL: null
      };
      
      setProfileData(updatedProfile);
      setEditingProfile(updatedProfile);
      
      toast.success('Foto de perfil removida com sucesso!');
    } catch (error) {
      console.error('Erro ao remover foto:', error);
      toast.error('Erro ao remover foto de perfil');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const openFileSelector = () => {
    fileInputRef.current?.click();
  };

  const openEditModal = () => {
    setEditingProfile({...profileData});
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setEditingProfile({...profileData});
  };

  const handleInputChange = (field, value) => {
    setEditingProfile(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const saveProfile = async () => {
    if (!editingProfile.name.trim()) {
      toast.error('O nome não pode estar vazio!');
      return;
    }

    let correctedHandle = editingProfile.handle.trim();
    if (!correctedHandle.startsWith('@')) {
      correctedHandle = '@' + correctedHandle.replace('@', '');
    }

    const username = correctedHandle.replace('@', '');
    
    if (!username) {
      toast.error('O nome de usuário não pode estar vazio!');
      return;
    }

    try {
      setIsSaving(true);
      
      const availabilityCheck = await checkUsernameAvailability(username, user.id);
      if (!availabilityCheck.success) {
        toast.error('Erro ao verificar nome de usuário');
        return;
      }
      
      if (!availabilityCheck.available) {
        toast.error('Este nome de usuário já está em uso');
        return;
      }
      
      const dataToSave = {
        full_name: editingProfile.name.trim(), // CORRIGIDO para full_name
        username: username,
        bio: editingProfile.bio.trim(),
        institution: editingProfile.location.trim(),
        website: editingProfile.website.trim()
      };
      
      const result = await saveUserProfile(user.id, dataToSave);
      
      if (!result.success) {
        toast.error(result.error || 'Erro ao salvar perfil');
        return;
      }
      
      setProfileData({...editingProfile, handle: correctedHandle});
      setIsEditModalOpen(false);
      
      toast.success('Perfil atualizado com sucesso!');
      
    } catch (error) {
      console.error('Erro ao salvar perfil:', error);
      toast.error('Erro ao salvar perfil. Tente novamente.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    toast((t) => (
      <div className="custom-toast-confirm">
        <p>Tem certeza que deseja sair da sua conta?</p>
        <div className="custom-toast-buttons">
          <button onClick={async () => {
            toast.dismiss(t.id);
            try {
              await authLogout();
              toast.success('Você foi deslogado com sucesso!');
              navigate('/login');
            } catch (error) {
              toast.error('Erro ao fazer logout.');
              console.error("Erro ao fazer logout:", error);
            }
          }}>Sim</button>
          <button onClick={() => toast.dismiss(t.id)}>Não</button>
        </div>
      </div>
    ), { duration: 5000, position: 'top-center' });
  };

  if (isLoading) {
    return (
      <main className="main-content">
        <div className="profile-section" style={{ textAlign: 'center', padding: '40px' }}>
          <div style={{ fontSize: '18px', color: 'var(--secondary-text-color)' }}>
            Carregando perfil...
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="main-content">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImageUpload}
        accept="image/*"
        style={{ display: 'none' }}
      />
      
      <div className="profile-header">
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '20px',
          marginBottom: '20px'
        }}>
          <div className="profile-avatar-container" style={{
            width: '120px',
            height: '120px',
            margin: '0',
            borderRadius: '30%',
            overflow: 'hidden',
            backgroundColor: 'var(--input-bg)',
            border: '3px solid var(--post-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {profileData.profileImageURL ? (
              <img 
                src={profileData.profileImageURL} 
                alt="Foto de perfil"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover'
                }}
              />
            ) : (
              <div className="profile-avatar-placeholder">
                <UserIcon size={48} />
              </div>
            )}
          </div>
          
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '15px'
          }}>
            <button 
              onClick={openFileSelector}
              disabled={isUploadingImage}
              title="Alterar foto"
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                border: '3px solid white',
                backgroundColor: '#2d5a3d',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                fontSize: '20px',
                transition: 'all 0.3s ease'
              }}
            >
              <Camera size={22} />
            </button>
            
            {profileData.profileImageURL && (
              <button 
                onClick={handleRemoveImage}
                disabled={isUploadingImage}
                title="Remover foto"
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  border: '3px solid white',
                  backgroundColor: '#e5e5e5',
                  color: '#333',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                  fontSize: '20px',
                  transition: 'all 0.3s ease'
                }}
              >
                <Trash2 size={22} />
              </button>
            )}
          </div>
        </div>
        
        {isUploadingImage && (
          <div className="upload-progress">
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
            <span className="progress-text">{uploadProgress}%</span>
          </div>
        )}
        
        <div className="profile-name">{profileData.name}</div>
        <div className="profile-handle">{profileData.handle}</div>
        <div className="profile-bio">{profileData.bio}</div>
        
        {profileData.location && (
          <div className="profile-location">
            <MapPin size={14} style={{ marginRight: '5px' }} />
            {profileData.location}
          </div>
        )}
        
        {profileData.website && (
          <div className="profile-website">
            <a href={profileData.website} target="_blank" rel="noopener noreferrer">
              <Globe size={14} style={{ marginRight: '5px' }} />
              {profileData.website}
            </a>
          </div>
        )}
        
        <div className="profile-stats">
          <div className="stat-item">
            <div className="stat-number">{userStats.posts}</div>
            <div className="stat-label">Posts</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">{userStats.followers}</div>
            <div className="stat-label">Seguidores</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">{userStats.following}</div>
            <div className="stat-label">Seguindo</div>
          </div>
        </div>
        
        <button className="edit-profile-btn" onClick={openEditModal}>
          Editar Perfil
        </button>
      </div>

      {isEditModalOpen && (
        <div className="modal-overlay" onClick={closeEditModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-body">
              <div className="form-group">
                <label htmlFor="edit-name">Nome</label>
                <input
                  type="text"
                  id="edit-name"
                  value={editingProfile.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Seu nome completo"
                  maxLength={50}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    borderRadius: '12px',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                    background: 'rgba(255, 255, 255, 0.1)',
                    color: '#FFFFFF',
                    fontFamily: 'inherit',
                    outline: 'none'
                  }}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="edit-handle">Nome de usuário</label>
                <input
                  type="text"
                  id="edit-handle"
                  value={editingProfile.handle}
                  onChange={(e) => handleInputChange('handle', e.target.value)}
                  placeholder="@seu_usuario"
                  maxLength={20}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    borderRadius: '12px',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                    background: 'rgba(255, 255, 255, 0.1)',
                    color: '#FFFFFF',
                    fontFamily: 'inherit',
                    outline: 'none'
                  }}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="edit-bio">Biografia</label>
                <textarea
                  id="edit-bio"
                  value={editingProfile.bio}
                  onChange={(e) => handleInputChange('bio', e.target.value)}
                  placeholder="Conte um pouco sobre você..."
                  maxLength={200}
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    borderRadius: '12px',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                    background: 'rgba(255, 255, 255, 0.1)',
                    color: '#FFFFFF',
                    fontFamily: 'inherit',
                    outline: 'none',
                    resize: 'none'
                  }}
                />
                <div style={{ 
                  fontSize: '12px', 
                  color: 'rgba(255, 255, 255, 0.6)', 
                  textAlign: 'right', 
                  marginTop: '4px' 
                }}>
                  {editingProfile.bio.length}/200
                </div>
              </div>
              
              <div className="form-group">
                <label htmlFor="edit-location">Instituição/Escola</label>
                <input
                  type="text"
                  id="edit-location"
                  value={editingProfile.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  placeholder="Sua escola ou instituição"
                  maxLength={50}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    borderRadius: '12px',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                    background: 'rgba(255, 255, 255, 0.1)',
                    color: '#FFFFFF',
                    fontFamily: 'inherit',
                    outline: 'none'
                  }}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="edit-website">Website</label>
                <input
                  type="url"
                  id="edit-website"
                  value={editingProfile.website}
                  onChange={(e) => handleInputChange('website', e.target.value)}
                  placeholder="https://seusite.com"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    borderRadius: '12px',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                    background: 'rgba(255, 255, 255, 0.1)',
                    color: '#FFFFFF',
                    fontFamily: 'inherit',
                    outline: 'none'
                  }}
                />
              </div>
            </div>
            
            <div className="modal-footer">
              <button 
                onClick={closeEditModal} 
                disabled={isSaving}
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  color: '#FFFFFF',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  padding: '12px 24px',
                  borderRadius: '12px',
                  fontWeight: '500',
                  fontSize: '14px',
                  flex: '1',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  minWidth: 'auto'
                }}
              >
                Cancelar
              </button>
              <button 
                onClick={saveProfile} 
                disabled={isSaving}
                style={{
                  background: '#90EE90',
                  color: '#2F4F4F',
                  border: '1px solid #90EE90',
                  padding: '12px 24px',
                  borderRadius: '12px',
                  fontWeight: '600',
                  fontSize: '14px',
                  flex: '1',
                  cursor: isSaving ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease',
                  minWidth: 'auto',
                  boxShadow: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  opacity: isSaving ? 0.6 : 1
                }}
              >
                {isSaving ? (
                  'Salvando...'
                ) : (
                  <>
                    <Save size={16} />
                    Salvar
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="tab-container">
        <button 
          className={`tab-btn ${activeTab === 'activity' ? 'active' : ''}`} 
          onClick={() => showTab('activity')}
        >
          Atividade
        </button>
        <button 
          className={`tab-btn ${activeTab === 'settings' ? 'active' : ''}`} 
          onClick={() => showTab('settings')}
        >
          Configurações
        </button>
      </div>

      <div id="activity" className={`tab-content ${activeTab === 'activity' ? 'active' : ''}`}>
        <div className="profile-section">
          <h3 className="section-title">Atividade Recente</h3>
          <div className="activity-item">
            <div className="activity-icon">🎉</div>
            <div className="activity-content">
              <div className="activity-text">Bem-vindo ao EcoSnap! Complete seu perfil para começar.</div>
              <div className="activity-time">Agora</div>
            </div>
          </div>
          <div className="activity-item">
            <div className="activity-icon">🌱</div>
            <div className="activity-content">
              <div className="activity-text">Conta criada com sucesso</div>
              <div className="activity-time">Hoje</div>
            </div>
          </div>
        </div>
      </div>

      <div id="settings" className={`tab-content ${activeTab === 'settings' ? 'active' : ''}`}>
        <div className="profile-section">
          <h3 className="section-title">Configurações</h3>
          
          <div className="settings-item">
            <div>
              <span className="setting-label">Notificações Push</span>
              <div style={{ fontSize: '12px', color: 'var(--secondary-text-color)', marginTop: '2px' }}>
                Receber notificações no navegador
              </div>
            </div>
            <div className={`toggle-switch ${pushNotifications ? 'active' : ''}`} onClick={() => toggleSetting('pushNotifications')}>
              <div className="toggle-slider"></div>
            </div>
          </div>
          
          <div className="settings-item">
            <div>
              <span className="setting-label">Perfil Público</span>
              <div style={{ fontSize: '12px', color: 'var(--secondary-text-color)', marginTop: '2px' }}>
                Seu perfil será visível para outros usuários
              </div>
            </div>
            <div className={`toggle-switch ${publicProfile ? 'active' : ''}`} onClick={() => toggleSetting('publicProfile')}>
              <div className="toggle-slider"></div>
            </div>
          </div>
          
          <div className="settings-item">
            <div>
              <span className="setting-label">Modo Offline</span>
              <div style={{ fontSize: '12px', color: 'var(--secondary-text-color)', marginTop: '2px' }}>
                Salvar dados localmente para uso sem internet
              </div>
            </div>
            <div className={`toggle-switch ${offlineMode ? 'active' : ''}`} onClick={() => toggleSetting('offlineMode')}>
              <div className="toggle-slider"></div>
            </div>
          </div>
          
          <div className="settings-item">
            <div>
              <span className="setting-label">Sincronizar Diário</span>
              <div style={{ fontSize: '12px', color: 'var(--secondary-text-color)', marginTop: '2px' }}>
                Backup automático das suas anotações
              </div>
            </div>
            <div className={`toggle-switch ${syncDiary ? 'active' : ''}`} onClick={() => toggleSetting('syncDiary')}>
              <div className="toggle-slider"></div>
            </div>
          </div>
          
          <div className="settings-item" style={{ borderBottom: 'none', paddingTop: '30px' }}>
            <button className="logout-btn" onClick={handleLogout}>
              <LogOut size={18} style={{ marginRight: '8px' }} />
              Sair da Conta
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}

export default Profile;
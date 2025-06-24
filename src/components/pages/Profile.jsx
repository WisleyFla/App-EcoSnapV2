import React, { useState, useEffect, useRef } from 'react';
import { User as UserIcon, Camera, Bell, Globe, MapPin, Activity, Settings, CheckCircle, LogOut, X, Save, Upload, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { saveUserProfile, loadUserProfile, saveUserSettings, loadUserSettings, updateProfileImage, removeProfileImage } from '../../services/profileService';

import './Profile.css';

function Profile() {
  const [activeTab, setActiveTab] = useState('activity');
  const [pushNotifications, setPushNotifications] = useState(true);
  const [publicProfile, setPublicProfile] = useState(true);
  const [locationPhotos, setLocationPhotos] = useState(false);
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

  // Estados para upload de imagem
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef(null);

  const navigate = useNavigate();
  const { logout: authLogout, user } = useAuth();

  // Estado de carregamento
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Carregar dados do perfil quando o componente monta
  useEffect(() => {
    if (user?.uid) {
      loadProfileData();
      loadSettingsData();
    }
  }, [user]);

  // Função para carregar dados do perfil do Firebase
  const loadProfileData = async () => {
    try {
      setIsLoading(true);
      const result = await loadUserProfile(user.uid);
      
      if (result.success && result.data) {
        const loadedData = {
          name: result.data.name || 'Usuário EcoSnap',
          handle: result.data.handle || '@usuario_ecosnap',
          bio: result.data.bio || 'Apaixonado pela natureza e pela conservação do Cerrado. Compartilhando descobertas e aprendizados sobre a biodiversidade brasileira. 🌱',
          location: result.data.location || 'Brasília, DF',
          website: result.data.website || '',
          profileImageURL: result.data.profileImageURL || null
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

  // Função para carregar configurações do Firebase
  const loadSettingsData = async () => {
    try {
      const result = await loadUserSettings(user.uid);
      
      if (result.success && result.settings) {
        const settings = result.settings;
        
        if (settings.pushNotifications !== undefined) setPushNotifications(settings.pushNotifications);
        if (settings.publicProfile !== undefined) setPublicProfile(settings.publicProfile);
        if (settings.locationPhotos !== undefined) setLocationPhotos(settings.locationPhotos);
        if (settings.offlineMode !== undefined) setOfflineMode(settings.offlineMode);
        if (settings.syncDiary !== undefined) setSyncDiary(settings.syncDiary);
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
    }
  };

  const showTab = (tabName) => {
    setActiveTab(tabName);
    console.log(`Aba ativa alterada para: ${tabName}`);
  };

  const toggleSetting = async (settingName) => {
    let newState;
    
    switch (settingName) {
      case 'pushNotifications':
        setPushNotifications(prev => {
          newState = !prev;
          toast.success(`Notificações Push: ${newState ? 'Ativadas' : 'Desativadas'}`);
          console.log(`Estado Notificações Push: ${newState}`);
          return newState;
        });
        break;
      case 'publicProfile':
        setPublicProfile(prev => {
          newState = !prev;
          toast.success(`Perfil Público: ${newState ? 'Ativado' : 'Desativado'}`);
          console.log(`Estado Perfil Público: ${newState}`);
          return newState;
        });
        break;
      case 'locationPhotos':
        setLocationPhotos(prev => {
          newState = !prev;
          toast.success(`Localização nas Fotos: ${newState ? 'Ativada' : 'Desativada'}`);
          console.log(`Estado Localização nas Fotos: ${newState}`);
          return newState;
        });
        break;
      case 'offlineMode':
        setOfflineMode(prev => {
          newState = !prev;
          toast.success(`Modo Offline: ${newState ? 'Ativado' : 'Desativado'}`);
          console.log(`Estado Modo Offline: ${newState}`);
          return newState;
        });
        break;
      case 'syncDiary':
        setSyncDiary(prev => {
          newState = !prev;
          toast.success(`Sincronizar Diário: ${newState ? 'Ativado' : 'Desativado'}`);
          console.log(`Estado Sincronizar Diário: ${newState}`);
          return newState;
        });
        break;
      default:
        return;
    }

    // Salvar configurações no Firebase
    try {
      const currentSettings = {
        pushNotifications,
        publicProfile,
        locationPhotos,
        offlineMode,
        syncDiary,
        [settingName]: newState
      };
      
      await saveUserSettings(user.uid, currentSettings);
    } catch (error) {
      console.error('Erro ao salvar configuração:', error);
      toast.error('Erro ao salvar configuração');
    }
  };

  // Função para fazer upload de foto de perfil
  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      setIsUploadingImage(true);
      setUploadProgress(0);

      const onProgress = (progress) => {
        setUploadProgress(progress);
      };

      const result = await updateProfileImage(user.uid, file, onProgress);
      
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

  // Função para remover foto de perfil
  const handleRemoveImage = async () => {
    try {
      setIsUploadingImage(true);
      
      await removeProfileImage(user.uid);
      
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

  // Função para abrir seletor de arquivo
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

    if (!editingProfile.handle.trim()) {
      toast.error('O nome de usuário não pode estar vazio!');
      return;
    }

    let correctedHandle = editingProfile.handle;
    if (!correctedHandle.startsWith('@')) {
      correctedHandle = '@' + correctedHandle.replace('@', '');
      setEditingProfile(prev => ({
        ...prev,
        handle: correctedHandle
      }));
    }

    try {
      setIsSaving(true);
      
      const dataToSave = {
        ...editingProfile,
        handle: correctedHandle
      };
      
      await saveUserProfile(user.uid, dataToSave);
      
      setProfileData({...dataToSave});
      setIsEditModalOpen(false);
      
      toast.success('Perfil atualizado com sucesso!');
      
      console.log('Dados do perfil salvos no Firebase:', dataToSave);
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

  // Mostrar loading enquanto carrega os dados
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
        <div className="profile-avatar-container">
          {profileData.profileImageURL ? (
            <img 
              src={profileData.profileImageURL} 
              alt="Foto de perfil"
              className="profile-avatar-image"
            />
          ) : (
            <div className="profile-avatar-placeholder">
              <UserIcon size={48} />
            </div>
          )}
          
          <div className="avatar-overlay">
            <button 
              className="avatar-action-btn upload-btn" 
              onClick={openFileSelector}
              disabled={isUploadingImage}
              title="Alterar foto"
            >
              <Camera size={16} />
            </button>
            
            {profileData.profileImageURL && (
              <button 
                className="avatar-action-btn remove-btn" 
                onClick={handleRemoveImage}
                disabled={isUploadingImage}
                title="Remover foto"
              >
                <Trash2 size={16} />
              </button>
            )}
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
        </div>
        
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
            <Globe size={14} style={{ marginRight: '5px' }} />
            <a href={profileData.website} target="_blank" rel="noopener noreferrer">
              {profileData.website}
            </a>
          </div>
        )}
        
        <div className="profile-stats">
          <div className="stat-item">
            <div className="stat-number">47</div>
            <div className="stat-label">Posts</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">156</div>
            <div className="stat-label">Seguidores</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">89</div>
            <div className="stat-label">Seguindo</div>
          </div>
        </div>
        
        <button className="edit-profile-btn" onClick={openEditModal}>
          Editar Perfil
        </button>
      </div>

      {isEditModalOpen && (
        <div className="edit-modal-overlay" onClick={closeEditModal}>
          <div className="edit-modal" onClick={(e) => e.stopPropagation()}>
            <div className="edit-modal-header">
              <h2>Editar Perfil</h2>
              <button className="modal-close-btn" onClick={closeEditModal}>
                <X size={20} />
              </button>
            </div>
            
            <div className="edit-modal-content">
              <div className="form-group">
                <label htmlFor="edit-name">Nome</label>
                <input
                  type="text"
                  id="edit-name"
                  className="form-input"
                  value={editingProfile.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Seu nome completo"
                  maxLength={50}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="edit-handle">Nome de usuário</label>
                <input
                  type="text"
                  id="edit-handle"
                  className="form-input"
                  value={editingProfile.handle}
                  onChange={(e) => handleInputChange('handle', e.target.value)}
                  placeholder="@seu_usuario"
                  maxLength={20}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="edit-bio">Biografia</label>
                <textarea
                  id="edit-bio"
                  className="form-textarea"
                  value={editingProfile.bio}
                  onChange={(e) => handleInputChange('bio', e.target.value)}
                  placeholder="Conte um pouco sobre você..."
                  maxLength={200}
                  rows={4}
                />
                <div className="char-count">
                  {editingProfile.bio.length}/200
                </div>
              </div>
              
              <div className="form-group">
                <label htmlFor="edit-location">Localização</label>
                <input
                  type="text"
                  id="edit-location"
                  className="form-input"
                  value={editingProfile.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  placeholder="Sua cidade, estado"
                  maxLength={30}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="edit-website">Website</label>
                <input
                  type="url"
                  id="edit-website"
                  className="form-input"
                  value={editingProfile.website}
                  onChange={(e) => handleInputChange('website', e.target.value)}
                  placeholder="https://seusite.com"
                />
              </div>
            </div>
            
            <div className="edit-modal-footer">
              <button className="cancel-btn" onClick={closeEditModal} disabled={isSaving}>
                Cancelar
              </button>
              <button className="save-btn" onClick={saveProfile} disabled={isSaving}>
                {isSaving ? (
                  <>Salvando...</>
                ) : (
                  <>
                    <Save size={16} style={{ marginRight: '8px' }} />
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
            <div className="activity-icon">❤️</div>
            <div className="activity-content">
              <div className="activity-text">Curtiu o post de Maria Silva sobre ipê-amarelo</div>
              <div className="activity-time">há 2 horas</div>
            </div>
          </div>
          <div className="activity-item">
            <div className="activity-icon">📝</div>
            <div className="activity-content">
              <div className="activity-text">Adicionou uma nova entrada no diário</div>
              <div className="activity-time">há 4 horas</div>
            </div>
          </div>
          <div className="activity-item">
            <div className="activity-icon">📸</div>
            <div className="activity-content">
              <div className="activity-text">Publicou uma foto de bem-te-vi</div>
              <div className="activity-time">há 1 dia</div>
            </div>
          </div>
          <div className="activity-item">
            <div className="activity-icon">👥</div>
            <div className="activity-content">
              <div className="activity-text">Começou a seguir João Costa</div>
              <div className="activity-time">há 2 dias</div>
            </div>
          </div>
          <div className="activity-item">
            <div className="activity-icon">🌟</div>
            <div className="activity-content">
              <div className="activity-text">Conquistou o badge "Observador"</div>
              <div className="activity-time">há 3 dias</div>
            </div>
          </div>
        </div>
      </div>

      <div id="settings" className={`tab-content ${activeTab === 'settings' ? 'active' : ''}`}>
        <div className="profile-section">
          <h3 className="section-title">Configurações</h3>
          <div className="settings-item">
            <span className="setting-label">Notificações Push</span>
            <div className={`toggle-switch ${pushNotifications ? 'active' : ''}`} onClick={() => toggleSetting('pushNotifications')}>
              <div className="toggle-slider"></div>
            </div>
          </div>
          <div className="settings-item">
            <span className="setting-label">Perfil Público</span>
            <div className={`toggle-switch ${publicProfile ? 'active' : ''}`} onClick={() => toggleSetting('publicProfile')}>
              <div className="toggle-slider"></div>
            </div>
          </div>
          <div className="settings-item">
            <span className="setting-label">Localização nas Fotos</span>
            <div className={`toggle-switch ${locationPhotos ? 'active' : ''}`} onClick={() => toggleSetting('locationPhotos')}>
              <div className="toggle-slider"></div>
            </div>
          </div>
          <div className="settings-item">
            <span className="setting-label">Modo Offline</span>
            <div className={`toggle-switch ${offlineMode ? 'active' : ''}`} onClick={() => toggleSetting('offlineMode')}>
              <div className="toggle-slider"></div>
            </div>
          </div>
          <div className="settings-item">
            <span className="setting-label">Sincronizar Diário</span>
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
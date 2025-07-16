import React, { useState, useEffect } from 'react';
import { communityService } from '../../../services/communityService';
import MediaUpload from '../../ui/MediaUpload';
import toast from 'react-hot-toast';
import './community.css';

export default function EditCommunityModal({ isOpen, onClose, communityData, onSuccess }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [newAvatarFile, setNewAvatarFile] = useState(null);
  const [loading, setLoading] = useState(false);

  // Preenche o formulário com os dados atuais da comunidade quando o modal abre
  useEffect(() => {
    if (communityData) {
      setName(communityData.name || '');
      setDescription(communityData.description || '');
    }
  }, [communityData]);

  if (!isOpen) return null;

  const handleFilesChange = (files) => {
    setNewAvatarFile(files[0] || null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("O nome da comunidade é obrigatório.");
      return;
    }
    
    setLoading(true);
    try {
      const updatedCommunity = await communityService.updateCommunity(communityData.id, { 
        name, 
        description, 
        newAvatarFile 
      });
      onSuccess(updatedCommunity); // Passa os dados atualizados de volta
    } catch (error) {
      toast.error(`Erro ao atualizar comunidade: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <form onSubmit={handleSubmit}>
          <div className="modal-header">
            <h3>Editar Comunidade</h3>
            <button type="button" className="close-btn" onClick={onClose}>&times;</button>
          </div>
          <div className="modal-body">
            <div className="form-group">
              <label htmlFor="comm-edit-name">Nome</label>
              <input id="comm-edit-name" type="text" value={name} onChange={e => setName(e.target.value)} required />
            </div>
            <div className="form-group">
              <label htmlFor="comm-edit-desc">Descrição</label>
              <textarea id="comm-edit-desc" value={description} onChange={e => setDescription(e.target.value)}></textarea>
            </div>
            <div className="form-group">
              <label>Alterar Avatar (Opcional)</label>
              <MediaUpload onFilesChange={handleFilesChange} maxFiles={1} />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="cancel-btn" onClick={onClose}>Cancelar</button>
            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
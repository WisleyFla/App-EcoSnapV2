import React, { useState } from 'react';
import { communityService } from '../../../services/communityService';
import MediaUpload from '../../ui/MediaUpload';
import toast from 'react-hot-toast';
import './community.css';

export default function CreateCommunityModal({ isOpen, onClose, onSuccess }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [avatarFile, setAvatarFile] = useState(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleFilesChange = (files) => {
    setAvatarFile(files[0] || null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("O nome da comunidade é obrigatório.");
      return;
    }
    
    setLoading(true);
    try {
      await communityService.createCommunity({ name, description, avatarFile });
      onSuccess(); // Chama a função de sucesso passada pelo pai
    } catch (error) {
      toast.error(`Erro ao criar comunidade: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <form onSubmit={handleSubmit}>
          <div className="modal-header">
            <h3>Criar Nova Comunidade</h3>
            <button type="button" className="close-btn" onClick={onClose}>&times;</button>
          </div>
          <div className="modal-body">
            <div className="form-group">
              <label htmlFor="comm-name">Nome</label>
              <input id="comm-name" type="text" placeholder="Nome da sua comunidade" value={name} onChange={e => setName(e.target.value)} required />
            </div>
            <div className="form-group">
              <label htmlFor="comm-desc">Descrição (Opcional)</label>
              <textarea id="comm-desc" placeholder="Descreva o propósito do grupo" value={description} onChange={e => setDescription(e.target.value)}></textarea>
            </div>
            <div className="form-group">
              <label>Avatar (Opcional)</label>
              <MediaUpload onFilesChange={handleFilesChange} maxFiles={1} />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="cancel-btn" onClick={onClose}>Cancelar</button>
            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? 'Criando...' : 'Criar Comunidade'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
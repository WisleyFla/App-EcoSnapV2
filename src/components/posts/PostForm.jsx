// src/components/posts/PostForm.jsx
import React, { useState } from 'react';
import LocationPicker from './LocationPicker';
import { postsService } from '../../services/postsService';
import { useAuth } from '../../context/AuthContext';
import './PostForm.css';

const PostForm = ({ onPostCreated, onCancel }) => {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
  const [species, setSpecies] = useState('');
  const [scientificNames, setScientificNames] = useState('');
  const [difficulty, setDifficulty] = useState(1);
  const [location, setLocation] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [useLocation, setUseLocation] = useState(true);

  const handleLocationChange = (newLocation) => {
    setLocation(newLocation);
  };

  const parseTagsAndSpecies = (text) => {
    return text
      .split(',')
      .map(item => item.trim())
      .filter(item => item.length > 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim() || !user) return;

    setIsSubmitting(true);
    try {
      const postData = {
        content: content.trim(),
        tags: parseTagsAndSpecies(tags),
        species: parseTagsAndSpecies(species),
        scientificNames: parseTagsAndSpecies(scientificNames),
        difficulty: parseInt(difficulty),
        ...(location && useLocation && {
          location: location.address,
          latitude: location.latitude,
          longitude: location.longitude
        })
      };

      const newPost = await postsService.createPost(
        postData, 
        user.id, 
        useLocation && !location // Auto-location se não tiver localização manual
      );
      
      // Limpar formulário
      setContent('');
      setTags('');
      setSpecies('');
      setScientificNames('');
      setDifficulty(1);
      setLocation(null);
      
      // Notificar componente pai
      onPostCreated?.(newPost);
      
    } catch (error) {
      console.error('Erro ao criar post:', error);
      alert('Erro ao criar post: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="post-form">
      <form onSubmit={handleSubmit}>
        {/* Área de texto principal */}
        <div className="form-group">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="O que você descobriu na natureza hoje? Compartilhe sua observação..."
            rows={4}
            required
            maxLength={500}
            className="content-textarea"
          />
          <div className="character-count">
            {content.length}/500
          </div>
        </div>

        {/* Tags */}
        <div className="form-group">
          <label htmlFor="tags">Tags (separadas por vírgula)</label>
          <input
            id="tags"
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="natureza, biodiversidade, fotografia..."
            className="form-input"
          />
        </div>

        {/* Espécies identificadas */}
        <div className="form-group">
          <label htmlFor="species">Espécies identificadas (separadas por vírgula)</label>
          <input
            id="species"
            type="text"
            value={species}
            onChange={(e) => setSpecies(e.target.value)}
            placeholder="Bem-te-vi, Ipê-amarelo, Borboleta-monarca..."
            className="form-input"
          />
        </div>

        {/* Nomes científicos */}
        <div className="form-group">
          <label htmlFor="scientific">Nomes científicos (separados por vírgula)</label>
          <input
            id="scientific"
            type="text"
            value={scientificNames}
            onChange={(e) => setScientificNames(e.target.value)}
            placeholder="Pitangus sulphuratus, Handroanthus albus..."
            className="form-input"
          />
        </div>

        {/* Nível de dificuldade */}
        <div className="form-group">
          <label htmlFor="difficulty">Nível de dificuldade para observação</label>
          <select
            id="difficulty"
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
            className="form-select"
          >
            <option value={1}>1 - Muito fácil</option>
            <option value={2}>2 - Fácil</option>
            <option value={3}>3 - Moderado</option>
            <option value={4}>4 - Difícil</option>
            <option value={5}>5 - Muito difícil</option>
          </select>
        </div>

        {/* Controle de localização */}
        <div className="form-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={useLocation}
              onChange={(e) => setUseLocation(e.target.checked)}
            />
            Incluir localização no post
          </label>
        </div>

        {/* Seletor de localização */}
        {useLocation && (
          <LocationPicker 
            onLocationChange={handleLocationChange}
            autoGetLocation={true}
          />
        )}

        {/* Botões de ação */}
        <div className="form-actions">
          {onCancel && (
            <button 
              type="button" 
              onClick={onCancel}
              className="cancel-button"
              disabled={isSubmitting}
            >
              Cancelar
            </button>
          )}
          <button 
            type="submit" 
            disabled={isSubmitting || !content.trim()}
            className="submit-button"
          >
            {isSubmitting ? 'Publicando...' : 'Publicar'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PostForm;
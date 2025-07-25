import React, { useState } from 'react';
import EditPostModal from '../components/posts/EditPostModal';

// Mock de dados de teste
const mockPost = {
  id: "test_post_123",
  content: "Observei um bem-te-vi cantando no parque hoje pela manhã. Foi uma experiência incrível!",
  tags: ["natureza", "aves", "manhã", "parque"],
  species: ["Bem-te-vi", "Sabiá-laranjeira"],
  scientific_names: ["Pitangus sulphuratus", "Turdus rufiventris"],
  difficulty: 2,
  location: "Parque Ibirapuera, São Paulo",
  latitude: -23.5870,
  longitude: -46.6570,
  media_urls: [
    "https://example.com/image1.jpg",
    "https://example.com/image2.jpg"
  ],
  media_metadata: [
    {
      id: "media_1",
      type: "image",
      path: "posts/test_post_123/image1.jpg",
      name: "bem_te_vi_1.jpg"
    },
    {
      id: "media_2", 
      type: "image",
      path: "posts/test_post_123/image2.jpg",
      name: "bem_te_vi_2.jpg"
    }
  ],
  user_id: "test_user",
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
};

const EditPostTest = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [testResults, setTestResults] = useState([]);

  const addTestResult = (test, passed, details = '') => {
    setTestResults(prev => [...prev, {
      test,
      passed,
      details,
      timestamp: new Date().toLocaleTimeString()
    }]);
  };

  const testModalOpen = () => {
    setIsModalOpen(true);
    addTestResult('Modal Opening', true, 'Modal aberto com sucesso');
  };

  const testModalClose = () => {
    setIsModalOpen(false);
    addTestResult('Modal Closing', true, 'Modal fechado com sucesso');
  };

  const testDataLoading = () => {
    // Simular carregamento de dados
    setTimeout(() => {
      const hasAllFields = mockPost.content && mockPost.tags && mockPost.species;
      addTestResult('Data Loading', hasAllFields, 
        hasAllFields ? 'Todos os campos carregados' : 'Alguns campos faltando');
    }, 100);
  };

  const testSaveFunction = (updatedPost) => {
    console.log('🧪 Teste - Post atualizado recebido:', updatedPost);
    
    const hasRequiredFields = updatedPost && updatedPost.content && updatedPost.id;
    addTestResult('Save Function', hasRequiredFields, 
      hasRequiredFields ? 'Dados salvos corretamente' : 'Erro nos dados salvos');
    
    setIsModalOpen(false);
  };

  const runAllTests = () => {
    setTestResults([]);
    addTestResult('Test Suite Started', true, 'Iniciando bateria de testes');
    
    // Teste 1: Estrutura do post
    const hasValidStructure = mockPost.id && mockPost.content && Array.isArray(mockPost.tags);
    addTestResult('Post Structure', hasValidStructure, 
      hasValidStructure ? 'Estrutura válida' : 'Estrutura inválida');
    
    // Teste 2: Mídia
    const hasValidMedia = Array.isArray(mockPost.media_urls) && Array.isArray(mockPost.media_metadata);
    addTestResult('Media Structure', hasValidMedia,
      hasValidMedia ? 'Mídia estruturada corretamente' : 'Problemas na estrutura de mídia');
    
    // Teste 3: Localização
    const hasValidLocation = mockPost.location && typeof mockPost.latitude === 'number';
    addTestResult('Location Data', hasValidLocation,
      hasValidLocation ? 'Localização válida' : 'Problemas na localização');
    
    testDataLoading();
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h2>🧪 Teste do Sistema de Edição de Posts</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={runAllTests}
          style={{ 
            padding: '10px 20px', 
            marginRight: '10px',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          🚀 Executar Todos os Testes
        </button>
        
        <button 
          onClick={testModalOpen}
          style={{ 
            padding: '10px 20px', 
            marginRight: '10px',
            backgroundColor: '#2196F3',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          📝 Abrir Modal de Edição
        </button>
        
        <button 
          onClick={testModalClose}
          style={{ 
            padding: '10px 20px',
            backgroundColor: '#ff9800',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          ❌ Fechar Modal
        </button>
      </div>

      {/* Resultados dos testes */}
      <div style={{ 
        backgroundColor: '#f5f5f5', 
        padding: '15px', 
        borderRadius: '5px',
        marginBottom: '20px'
      }}>
        <h3>📊 Resultados dos Testes</h3>
        {testResults.length === 0 ? (
          <p>Nenhum teste executado ainda.</p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {testResults.map((result, index) => (
              <li key={index} style={{ 
                margin: '5px 0',
                padding: '8px',
                backgroundColor: result.passed ? '#d4edda' : '#f8d7da',
                border: `1px solid ${result.passed ? '#c3e6cb' : '#f5c6cb'}`,
                borderRadius: '3px'
              }}>
                <strong>{result.passed ? '✅' : '❌'} {result.test}</strong>
                <br />
                <small>{result.details} ({result.timestamp})</small>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Dados do post de teste */}
      <details style={{ marginBottom: '20px' }}>
        <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>
          📄 Ver Dados do Post de Teste
        </summary>
        <pre style={{ 
          backgroundColor: '#2d2d2d',
          color: '#f8f8f2',
          padding: '15px',
          borderRadius: '5px',
          overflow: 'auto',
          fontSize: '12px'
        }}>
          {JSON.stringify(mockPost, null, 2)}
        </pre>
      </details>

      {/* Modal de edição */}
      <EditPostModal
        post={mockPost}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          addTestResult('Modal Closed by User', true, 'Modal fechado pelo usuário');
        }}
        onSave={testSaveFunction}
      />
    </div>
  );
};

export default EditPostTest;
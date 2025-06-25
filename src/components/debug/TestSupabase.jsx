// src/components/debug/TestSupabase.jsx
// Componente para testar a conexão com Supabase
import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

function TestSupabase() {
  const [connectionStatus, setConnectionStatus] = useState('testing');
  const [error, setError] = useState(null);
  const [tableExists, setTableExists] = useState(false);
  const [userCount, setUserCount] = useState(0);
  const { user } = useAuth();

  useEffect(() => {
    testConnection();
  }, []);

  const testConnection = async () => {
    try {
      console.log('🔗 Testando conexão com Supabase...');
      
      // Teste 1: Verificar se consegue conectar com a tabela users
      const { data, error: connectionError } = await supabase
        .from('users')
        .select('count')
        .limit(1);

      if (connectionError) {
        if (connectionError.code === '42P01') {
          // Tabela não existe
          console.log('⚠️ Tabela users não existe ainda');
          setTableExists(false);
          setConnectionStatus('error');
          setError('Tabela users não encontrada. Execute o SQL primeiro.');
          return;
        } else {
          throw new Error(`Erro ao conectar: ${connectionError.message}`);
        }
      }

      // Teste 2: Contar usuários
      const { count, error: countError } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });

      if (countError) {
        throw new Error(`Erro ao contar usuários: ${countError.message}`);
      }

      console.log('✅ Conexão funcionando!');
      console.log(`👥 Total de usuários: ${count || 0}`);
      
      setTableExists(true);
      setUserCount(count || 0);
      setConnectionStatus('success');
      
    } catch (err) {
      console.error('❌ Erro na conexão:', err);
      setConnectionStatus('error');
      setError(err.message);
    }
  };

  const testCurrentUser = async () => {
    if (!user) {
      setError('Usuário não logado');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      console.log('👤 Dados do usuário atual:', data);
      alert(`Usuário: ${data.display_name}\nEmail: ${data.email}\nRole: ${data.role}`);
    } catch (err) {
      console.error('❌ Erro ao buscar usuário:', err);
      setError(err.message);
    }
  };

  const getStatusIcon = () => {
    switch (connectionStatus) {
      case 'testing': return '🔄';
      case 'success': return '✅';
      case 'error': return '❌';
      default: return '🔄';
    }
  };

  const getStatusText = () => {
    switch (connectionStatus) {
      case 'testing': return 'Testando conexão...';
      case 'success': return 'Conexão funcionando!';
      case 'error': return 'Erro na conexão';
      default: return 'Verificando...';
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      background: 'var(--bg-color-secondary)',
      border: '1px solid var(--border-color)',
      borderRadius: '8px',
      padding: '16px',
      minWidth: '320px',
      zIndex: 1000,
      fontSize: '14px',
      maxHeight: '80vh',
      overflowY: 'auto'
    }}>
      <h3 style={{ margin: '0 0 12px 0', color: 'var(--text-color-main)' }}>
        🔧 Debug Supabase
      </h3>
      
      <div style={{ marginBottom: '8px' }}>
        <strong>Status:</strong> {getStatusIcon()} {getStatusText()}
      </div>
      
      <div style={{ marginBottom: '8px' }}>
        <strong>URL:</strong> {import.meta.env.VITE_SUPABASE_URL ? '✅ Configurada' : '❌ Ausente'}
      </div>
      
      <div style={{ marginBottom: '8px' }}>
        <strong>Key:</strong> {import.meta.env.VITE_SUPABASE_ANON_KEY ? '✅ Configurada' : '❌ Ausente'}
      </div>
      
      <div style={{ marginBottom: '8px' }}>
        <strong>Tabela users:</strong> {tableExists ? '✅ Existe' : '❌ Não existe'}
      </div>

      {tableExists && (
        <div style={{ marginBottom: '8px' }}>
          <strong>Total usuários:</strong> {userCount}
        </div>
      )}

      <div style={{ marginBottom: '8px' }}>
        <strong>Usuário logado:</strong> {user ? '✅ Sim' : '❌ Não'}
      </div>

      {user && (
        <div style={{ marginBottom: '8px', fontSize: '12px', color: 'var(--text-color-secondary)' }}>
          ID: {user.id.substring(0, 8)}...
        </div>
      )}

      {error && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: '4px',
          padding: '8px',
          margin: '8px 0',
          fontSize: '12px',
          color: '#ef4444'
        }}>
          <strong>Erro:</strong> {error}
        </div>
      )}

      {!tableExists && connectionStatus === 'error' && (
        <div style={{
          background: 'rgba(255, 193, 7, 0.1)',
          border: '1px solid rgba(255, 193, 7, 0.3)',
          borderRadius: '4px',
          padding: '8px',
          margin: '8px 0',
          fontSize: '12px',
          color: '#fbbf24'
        }}>
          <strong>⚠️ Execute o SQL primeiro!</strong><br/>
          <a 
            href={`https://app.supabase.com/project/${import.meta.env.VITE_SUPABASE_URL?.split('.')[0].split('//')[1]}/sql`}
            target="_blank" 
            rel="noopener noreferrer"
            style={{ color: '#fbbf24', textDecoration: 'underline' }}
          >
            Abrir SQL Editor
          </a>
        </div>
      )}

      <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
        <button
          onClick={testConnection}
          style={{
            flex: 1,
            padding: '8px 12px',
            background: 'transparent',
            color: 'var(--text-color-main)',
            border: '1px solid var(--border-color)',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px'
          }}
        >
          Reconectar
        </button>

        {user && tableExists && (
          <button
            onClick={testCurrentUser}
            style={{
              flex: 1,
              padding: '8px 12px',
              background: 'transparent',
              color: 'var(--text-color-main)',
              border: '1px solid var(--border-color)',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            Ver Perfil
          </button>
        )}
      </div>
    </div>
  );
}

export default TestSupabase;
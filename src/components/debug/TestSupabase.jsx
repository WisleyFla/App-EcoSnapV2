// src/components/debug/TestSupabase.jsx
// Componente temporário para testar a conexão com Supabase
import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

function TestSupabase() {
  const [connectionStatus, setConnectionStatus] = useState('testing');
  const [error, setError] = useState(null);
  const [tableExists, setTableExists] = useState(false);

  useEffect(() => {
    testConnection();
  }, []);

  const testConnection = async () => {
    try {
      console.log('🔗 Testando conexão com Supabase...');
      
      // Teste 1: Verificar se consegue conectar (teste simples)
      const { data, error: connectionError } = await supabase
        .from('profiles')
        .select('count')
        .limit(1);

      if (connectionError) {
        if (connectionError.code === '42P01') {
          // Tabela não existe - isso é ok, vamos criá-la
          console.log('⚠️ Tabela profiles não existe ainda');
          setTableExists(false);
          setConnectionStatus('success');
          return;
        } else {
          throw new Error(`Erro ao conectar: ${connectionError.message}`);
        }
      }

      console.log('✅ Conexão básica funcionando!');
      setTableExists(true);
      setConnectionStatus('success');
      
    } catch (err) {
      console.error('❌ Erro na conexão:', err);
      setConnectionStatus('error');
      setError(err.message);
    }
  };

  const createProfilesTable = async () => {
    setError('A criação de tabela via código não está disponível. Execute o SQL manualmente no dashboard do Supabase.');
    
    // Instruções para o usuário
    const instructions = `
1. Acesse: https://app.supabase.com/project/ohtweoqzgnjmbmuxtawh/sql
2. Cole o SQL fornecido no artifact "Setup Manual do Banco Supabase"
3. Clique em "RUN" para executar
4. Volte aqui e clique "Testar Novamente"
    `;
    
    console.log('📋 Instruções para criar tabela:', instructions);
  };

  const getStatusIcon = () => {
    switch (connectionStatus) {
      case 'testing': return '🔄';
      case 'creating': return '⚙️';
      case 'success': return '✅';
      case 'error': return '❌';
      default: return '🔄';
    }
  };

  const getStatusText = () => {
    switch (connectionStatus) {
      case 'testing': return 'Testando conexão...';
      case 'creating': return 'Criando tabela...';
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
      minWidth: '300px',
      zIndex: 1000,
      fontSize: '14px'
    }}>
      <h3 style={{ margin: '0 0 12px 0', color: 'var(--text-color-main)' }}>
        🔧 Debug Supabase
      </h3>
      
      <div style={{ marginBottom: '8px' }}>
        <strong>Status:</strong> {getStatusIcon()} {getStatusText()}
      </div>
      
      <div style={{ marginBottom: '8px' }}>
        <strong>URL:</strong> {import.meta.env.VITE_SUPABASE_URL ? '✅' : '❌'}
      </div>
      
      <div style={{ marginBottom: '8px' }}>
        <strong>Key:</strong> {import.meta.env.VITE_SUPABASE_ANON_KEY ? '✅' : '❌'}
      </div>
      
      <div style={{ marginBottom: '8px' }}>
        <strong>Tabela profiles:</strong> {tableExists ? '✅' : '❌'}
      </div>

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

      {!tableExists && connectionStatus === 'success' && (
        <div style={{
          background: 'rgba(255, 193, 7, 0.1)',
          border: '1px solid rgba(255, 193, 7, 0.3)',
          borderRadius: '4px',
          padding: '8px',
          margin: '8px 0',
          fontSize: '12px',
          color: '#fbbf24'
        }}>
          <strong>⚠️ Tabela não existe!</strong><br/>
          Execute o SQL no dashboard do Supabase:<br/>
          <a 
            href="https://app.supabase.com/project/ohtweoqzgnjmbmuxtawh/sql" 
            target="_blank" 
            rel="noopener noreferrer"
            style={{ color: '#fbbf24', textDecoration: 'underline' }}
          >
            Abrir SQL Editor
          </a>
        </div>
      )}

      <button
        onClick={testConnection}
        style={{
          width: '100%',
          padding: '8px 12px',
          background: 'transparent',
          color: 'var(--text-color-main)',
          border: '1px solid var(--border-color)',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '12px',
          marginTop: '8px'
        }}
      >
        Testar Novamente
      </button>
    </div>
  );
}

export default TestSupabase;
// src/components/debug/TelegramTest.jsx
import React, { useState } from 'react';
import { testTelegramConfig } from '../../services/profileService';

function TelegramTest() {
  const [testResult, setTestResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const runTest = async () => {
    setIsLoading(true);
    try {
      const result = await testTelegramConfig();
      setTestResult(result);
      console.log('Teste Telegram:', result);
    } catch (error) {
      setTestResult({ success: false, error: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  if (!import.meta.env.DEV) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
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
        🤖 Teste Telegram
      </h3>
      
      <div style={{ marginBottom: '8px' }}>
        <strong>Bot Token:</strong> {import.meta.env.VITE_TELEGRAM_BOT_TOKEN ? '✅' : '❌'}
      </div>
      
      <div style={{ marginBottom: '8px' }}>
        <strong>Chat ID:</strong> {import.meta.env.VITE_TELEGRAM_CHAT_ID ? '✅' : '❌'}
      </div>

      {testResult && (
        <div style={{
          background: testResult.success ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
          border: `1px solid ${testResult.success ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
          borderRadius: '4px',
          padding: '8px',
          margin: '8px 0',
          fontSize: '12px',
          color: testResult.success ? '#10b981' : '#ef4444'
        }}>
          <strong>{testResult.success ? '✅ Sucesso' : '❌ Erro'}:</strong>
          <pre style={{ margin: '4px 0 0 0', whiteSpace: 'pre-wrap' }}>
            {JSON.stringify(testResult, null, 2)}
          </pre>
        </div>
      )}

      <button
        onClick={runTest}
        disabled={isLoading}
        style={{
          width: '100%',
          padding: '8px 12px',
          background: 'transparent',
          color: 'var(--text-color-main)',
          border: '1px solid var(--border-color)',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '12px'
        }}
      >
        {isLoading ? '🔄 Testando...' : '🧪 Testar Configuração'}
      </button>

      <div style={{ marginTop: '12px', fontSize: '10px', color: 'var(--secondary-text-color)' }}>
        <strong>Instruções:</strong><br/>
        1. Crie um canal privado<br/>
        2. Adicione o bot como admin<br/>
        3. Obtenha o Chat ID<br/>
        4. Configure no .env
      </div>
    </div>
  );
}

export default TelegramTest;
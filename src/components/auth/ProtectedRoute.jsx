// src/components/auth/ProtectedRoute.jsx
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

function ProtectedRoute({ children, requireAuth = true }) {
  const { user, session, loading } = useAuth();
  const location = useLocation();

  // Mostrar loading enquanto verifica autenticação
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: 'var(--bg-color-main)',
        color: 'var(--text-color-main)'
      }}>
        <div>Carregando...</div>
      </div>
    );
  }

  // Se requer autenticação mas não está logado
  if (requireAuth && (!user || !session)) {
    return (
      <Navigate 
        to="/login" 
        state={{ from: location }} 
        replace 
      />
    );
  }

  // Se não requer autenticação mas está logado (ex: páginas de login/register)
  if (!requireAuth && user && session) {
    return (
      <Navigate 
        to="/" 
        replace 
      />
    );
  }

  return children;
}

export default ProtectedRoute;
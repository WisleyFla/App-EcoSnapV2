import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, Outlet, Link } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './config/firebase';
import { Toaster } from 'react-hot-toast';
import toast from 'react-hot-toast';

import Login from './components/auth/Login';
import Register from './components/auth/Register';

import Home from './components/pages/Home';
import Profile from './components/pages/Profile';

import Loading from './components/ui/Loading';

import { AuthProvider } from './context/AuthContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';

import './index.css';
import './App.css';

// Ícones Lucide React para o Navbar
import { Home as HomeIcon, Users, Book, User, Sun } from 'lucide-react';

// Componente de Layout para rotas autenticadas
function AuthenticatedLayout() {
  const location = useLocation();
  const { isDarkMode, toggleTheme } = useTheme();

  // Função para alternar tema com toast
  const handleToggleTheme = () => {
    toggleTheme();
    toast.success(`Tema ${isDarkMode ? 'claro' : 'escuro'} ativado!`);
  };

  return (
    <div className="authenticated-layout">
      <nav className="sidebar">
        <ul className="nav-menu">
          <li className="nav-item">
            <Link to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}>
              <HomeIcon className="nav-icon" />
              Início
            </Link>
          </li>
          <li className="nav-item">
            <Link to="/profile" className={`nav-link ${location.pathname === '/profile' ? 'active' : ''}`}>
              <User className="nav-icon" />
              Perfil
            </Link>
          </li>
          <li className="nav-item">
            <Link to="/diary" className={`nav-link ${location.pathname === '/diary' ? 'active' : ''}`}>
              <Book className="nav-icon" />
              Diário
            </Link>
          </li>
          <li className="nav-item">
            <Link to="/communities" className={`nav-link ${location.pathname === '/communities' ? 'active' : ''}`}>
              <Users className="nav-icon" />
              Comunidades
            </Link>
          </li>
          <li className="nav-item">
            <button className="nav-link" id="themeBtn" title="Alterar tema" onClick={handleToggleTheme}>
              <Sun className="nav-icon" />
              Tema
            </button>
          </li>
        </ul>
      </nav>
      
      {/* Container principal do conteúdo com rolagem completa */}
      <main className="main-content">
        <div className="content-wrapper page-container">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return <Loading />;
  }

  return (
    <ThemeProvider>
      <AuthProvider>
        <div className="app-container">
          <Toaster 
            position="top-right"
            toastOptions={{
              duration: 3000,
              style: {
                zIndex: 9999,
              },
            }}
          />
          <Router>
            <div className="app">
              <Routes>
                {/* Rotas para usuários NÃO autenticados */}
                {!user ? (
                  <>
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="*" element={<Navigate to="/login" replace />} />
                  </>
                ) : (
                  /* Rotas para usuários AUTENTICADOS */
                  <Route element={<AuthenticatedLayout />}>
                    <Route index element={<Home />} />
                    <Route path="profile" element={<Profile />} />
                    {/* Adicione outras rotas autenticadas aqui */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Route>
                )}
              </Routes>
            </div>
          </Router>
        </div>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
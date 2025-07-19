import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, Outlet, Link } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import toast from 'react-hot-toast';

// Componentes de Autenticação
import Login from './components/auth/Login';
import Register from './components/auth/Register';

// Componentes das Páginas
import Home from './components/pages/part_Home/Home';
import Profile from './components/pages/Profile';
import CommunityList from './components/pages/communities_page/CommunityList';
import CommunityDetail from './components/pages/communities_page/CommunityDetail';
import DiaryPage from './components/pages/diary_page/DiaryPage'; // Importa a página do Diário

// Componentes de UI
import Loading from './components/ui/Loading';

// Contextos
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';

// Estilos
import './index.css';
import './App.css';

// Ícones
import { Home as HomeIcon, Users, Book, User, Sun } from 'lucide-react';

function AuthenticatedLayout() {
  const location = useLocation();
  const { isDarkMode, toggleTheme } = useTheme();

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
            <Link to="/communities" className={`nav-link ${location.pathname.startsWith('/communities') ? 'active' : ''}`}>
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
      
      <main className="main-content">
        <div className="content-wrapper page-container">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return <Loading />;
  }

  const ProtectedRouteWrapper = () => {
    return user ? <AuthenticatedLayout /> : <Navigate to="/login" replace />;
  };

  return (
    <Routes>
      <Route path="/login" element={!user ? <Login /> : <Navigate to="/" replace />} />
      <Route path="/register" element={!user ? <Register /> : <Navigate to="/" replace />} />

      <Route element={<ProtectedRouteWrapper />}>
        <Route index element={<Home />} />
        <Route path="profile" element={<Profile />} />
        <Route path="diary" element={<DiaryPage />} /> {/* Adiciona a rota para o Diário */}
        <Route path="communities" element={<CommunityList />} />
        <Route path="communities/:communityId" element={<CommunityDetail />} />
      </Route>

      <Route path="*" element={<Navigate to={user ? "/" : "/login"} replace />} />
    </Routes>
  );
}

function App() {
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
              <AppRoutes />
            </div>
          </Router>
        </div>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;

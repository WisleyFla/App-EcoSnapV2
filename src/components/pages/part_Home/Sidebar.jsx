import { HomeIcon, Users, Book, User, Sun } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTheme } from '../../../context/ThemeContext';

export function Sidebar() {
  const { isDarkMode, toggleTheme } = useTheme();

  return (
    <nav className="sidebar">
      <ul className="nav-menu">
        <li className="nav-item">
          <Link to="/" className="nav-link active">
            <HomeIcon className="nav-icon" />
            Início
          </Link>
        </li>
        <li className="nav-item">
          <Link to="/profile" className="nav-link">
            <User className="nav-icon" />
            Perfil
          </Link>
        </li>
        <li className="nav-item">
          <Link to="/diary" className="nav-link">
            <Book className="nav-icon" />
            Diário
          </Link>
        </li>
        <li className="nav-item">
          <Link to="/communities" className="nav-link">
            <Users className="nav-icon" />
            Comunidades
          </Link>
        </li>
        <li className="nav-item">
          <button className="nav-link" id="themeBtn" title="Alterar tema" onClick={toggleTheme}>
            <Sun className="nav-icon" />
            Tema
          </button>
        </li>
      </ul>
    </nav>
  );
}
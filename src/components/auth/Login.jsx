// src/components/auth/Login.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext'; // ADICIONADO: Import do tema
import Logo from '../ui/Logo';
import './Login.css'; // Importa o CSS específico do Login

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  const { login } = useAuth();
  const { isDarkMode } = useTheme(); // ADICIONADO: Acesso ao tema
  const navigate = useNavigate();

  /**
   * Alterna a visibilidade do campo de senha.
   * @returns {void}
   */
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  /**
   * Lida com o envio do formulário de login.
   * Previne o comportamento padrão do formulário, ativa o carregamento,
   * tenta autenticar com o Firebase e lida com sucesso/erro.
   * @param {Event} e - O evento de envio do formulário.
   * @returns {Promise<void>}
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

    try {
      await login(email, password);
      setMessage('Login realizado com sucesso!');
      navigate('/');
    } catch (error) {
      console.error("Erro ao fazer login:", error);
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        setMessage('Email ou senha inválidos. Por favor, verifique suas credenciais.');
      } else if (error.code === 'auth/invalid-email') {
        setMessage('O formato do email é inválido.');
      } else if (error.code === 'auth/too-many-requests') {
        setMessage('Muitas tentativas de login. Por favor, tente novamente mais tarde.');
      }
      else {
        setMessage('Ocorreu um erro ao tentar fazer login. Tente novamente.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Adiciona um efeito visual de escala ao elemento pai do input/select quando focado.
   * @param {Event} e - O evento de foco.
   * @returns {void}
   */
  const handleInputFocus = (e) => {
    e.target.parentElement.style.transform = 'scale(1.02)';
  };

  /**
   * Remove o efeito visual de escala do elemento pai do input/select quando desfocado.
   * @param {Event} e - O evento de desfoque.
   * @returns {void}
   */
  const handleInputBlur = (e) => {
    e.target.parentElement.style.transform = 'scale(1)';
  };

  return (
    <div className="login-page"> {/* ALTERADO: Container principal da página */}
      <div className="login-container"> {/* ALTERADO: Container do formulário centralizado */}
        <div className="logo-section">
          <div className="logo">
            <Logo />
            <span className="logo-text" style={{ display: 'none' }}>EcoSnap</span>
          </div>
          <h1 className="login-title">Entrar no EcoSnap</h1>
          <p className="login-subtitle">
            Não tem conta? <a href="/register" className="signup-link">Inscreva-se</a>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="login-form"> {/* ADICIONADO: Classe para o formulário */}
          <div className="form-group">
            <input
              type="email"
              className="form-input"
              placeholder="Email"
              required
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
            />
          </div>

          <div className="form-group">
            <div className="password-container">
              <input
                type={showPassword ? 'text' : 'password'}
                className="form-input"
                placeholder="Senha"
                required
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={handleInputFocus}
                onBlur={handleInputBlur}
              />
              <button type="button" className="password-toggle" onClick={togglePasswordVisibility}>
                {showPassword ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                )}
              </button>
            </div>
          </div>

          {message && <p className="login-message">{message}</p>}

          <button type="submit" className="login-button" disabled={isLoading}>
            {isLoading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <div className="about-section">
          <p className="about-title">Sobre o EcoSnap</p>
          <div className="features">
            <div className="feature-item">
              <span className="feature-icon">🌱</span>
              <span>Ciência cidadã</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">🎓</span>
              <span>Educação participativa</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">🌿</span>
              <span>Preservação do Cerrado</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
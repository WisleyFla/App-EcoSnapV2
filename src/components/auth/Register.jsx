// src/components/auth/Register.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Logo from '../ui/Logo';
import './Register.css'; // Importa o CSS específico do Register

function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [userType, setUserType] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  const { register } = useAuth();
  const navigate = useNavigate();

  const togglePasswordVisibility = (field) => {
    if (field === 'password') {
      setShowPassword(!showPassword);
    } else if (field === 'confirmPassword') {
      setShowConfirmPassword(!showConfirmPassword);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

    // Validações
    if (password !== confirmPassword) {
      setMessage('As senhas não coincidem!');
      setIsLoading(false);
      return;
    }

    if (password.length < 6) {
      setMessage('A senha deve ter pelo menos 6 caracteres!');
      setIsLoading(false);
      return;
    }

    if (!userType) {
      setMessage('Por favor, selecione seu perfil.');
      setIsLoading(false);
      return;
    }

    try {
      // Mapear userType para role do Supabase
      const role = userType === 'professor' ? 'professor' : 'estudante';
      
      await register(email, password, {
        displayName: name,
        username: email.split('@')[0], // Username baseado no email
        role: role,
        institution: '', // Será preenchido depois
        gradeYear: '' // Será preenchido depois
      });
      
      setMessage('Conta criada com sucesso! Bem-vindo ao EcoSnap!');
      
      // Redirecionar após pequeno delay
      setTimeout(() => {
        navigate('/');
      }, 2000);
      
    } catch (error) {
      console.error("Erro ao registrar:", error);
      
      const errorMessage = error.message;
      
      if (errorMessage.includes('já está cadastrado')) {
        setMessage('Este email já está em uso. Tente fazer login ou use outro email.');
      } else if (errorMessage.includes('formato do email')) {
        setMessage('O formato do email é inválido.');
      } else if (errorMessage.includes('6 caracteres')) {
        setMessage('A senha deve ter pelo menos 6 caracteres.');
      } else {
        setMessage(errorMessage || 'Ocorreu um erro ao tentar criar a conta. Tente novamente.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputFocus = (e) => {
    e.target.parentElement.style.transform = 'scale(1.02)';
  };

  const handleInputBlur = (e) => {
    e.target.parentElement.style.transform = 'scale(1)';
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="logo-section">
          <div className="logo">
            <Logo />
            <span className="logo-text" style={{ display: 'none' }}>EcoSnap</span>
          </div>
          <h1 className="login-title">Junte-se ao EcoSnap hoje</h1>
          <p className="login-subtitle">
            Já tem uma conta? <a href="/login" className="signup-link">Entrar</a>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <input
              type="text"
              className="form-input"
              placeholder="Nome completo"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
            />
          </div>

          <div className="form-group">
            <input
              type="email"
              className="form-input"
              placeholder="Email"
              required
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
                placeholder="Senha (mín. 6 caracteres)"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={handleInputFocus}
                onBlur={handleInputBlur}
              />
              <button type="button" className="password-toggle" onClick={() => togglePasswordVisibility('password')}>
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

          <div className="form-group">
            <div className="password-container">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                className="form-input"
                placeholder="Confirmar senha"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onFocus={handleInputFocus}
                onBlur={handleInputBlur}
              />
              <button type="button" className="password-toggle" onClick={() => togglePasswordVisibility('confirmPassword')}>
                {showConfirmPassword ? (
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

          <div className="form-group">
            <select
              className="form-input"
              required
              value={userType}
              onChange={(e) => setUserType(e.target.value)}
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
              style={{ 
                color: userType ? 'white' : 'rgba(255, 255, 255, 0.7)',
                backgroundColor: 'rgba(255, 255, 255, 0.05)'
              }}
            >
              <option value="" disabled>Selecione seu perfil</option>
              <option value="estudante" style={{ color: 'black' }}>🎓 Sou estudante</option>
              <option value="professor" style={{ color: 'black' }}>👨‍🏫 Sou professor</option>
            </select>
          </div>

          {message && <p className="login-message">{message}</p>}

          <button type="submit" className="login-button" disabled={isLoading}>
            {isLoading ? 'Criando conta...' : 'Criar conta'}
          </button>
        </form>

        <div className="about-section">
          <p className="about-title">Você completará o perfil depois</p>
          <div className="features">
            <div className="feature-item">
              <span className="feature-icon">🎓</span>
              <span>Informações da escola</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">❤️</span>
              <span>Interesses e biografia</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">🏆</span>
              <span>Comece explorando!</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Register;
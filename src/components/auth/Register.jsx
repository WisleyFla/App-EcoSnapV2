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

  /**
   * Alterna a visibilidade do campo de senha.
   * @param {string} field - O campo da senha ('password' ou 'confirmPassword').
   * @returns {void}
   */
  const togglePasswordVisibility = (field) => {
    if (field === 'password') {
      setShowPassword(!showPassword);
    } else if (field === 'confirmPassword') {
      setShowConfirmPassword(!showConfirmPassword);
    }
  };

  /**
   * Lida com o envio do formulário de registro.
   * Previne o comportamento padrão do formulário, valida as senhas,
   * ativa o carregamento, tenta registrar com o Firebase e lida com sucesso/erro.
   * @param {Event} e - O evento de envio do formulário.
   * @returns {Promise<void>}
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

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
      await register(email, password);
      setMessage('Conta criada com sucesso! Bem-vindo ao EcoSnap!');
      navigate('/');
      // TODO: Salvar nome e userType em Firestore ou Realtime Database aqui, após o registro bem-sucedido
    } catch (error) {
      console.error("Erro ao registrar:", error);
      if (error.code === 'auth/email-already-in-use') {
        setMessage('Este email já está em uso. Tente fazer login ou use outro email.');
      } else if (error.code === 'auth/invalid-email') {
        setMessage('O formato do email é inválido.');
      } else if (error.code === 'auth/weak-password') {
        setMessage('A senha é muito fraca. Ela deve ter pelo menos 6 caracteres.');
      }
      else {
        setMessage('Ocorreu um erro ao tentar criar a conta. Tente novamente.');
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
    <div className="register-container"> {/* Apenas a classe específica */}
      <div className="logo-section">
        <div className="logo">
          <Logo />
          <span className="logo-text" style={{ display: 'none' }}>EcoSnap</span>
        </div>
        <h1 className="register-title">Junte-se ao EcoSnap hoje</h1> {/* Apenas a classe específica */}
        <p className="register-subtitle"> {/* Apenas a classe específica */}
          Já tem uma conta? <a href="/login" className="login-link">Entrar</a> {/* Apenas a classe específica */}
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <input
            type="text"
            className="form-input"
            placeholder="Nome"
            required
            id="nome"
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
              id="confirmPassword"
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
            className="form-select"
            required
            id="userType"
            value={userType}
            onChange={(e) => {
              setUserType(e.target.value);
              e.target.style.color = e.target.value ? 'white' : 'rgba(255, 255, 255, 0.7)';
            }}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            style={{ color: userType ? 'white' : 'rgba(255, 255, 255, 0.7)' }}
          >
            <option value="" disabled>Selecione seu perfil</option>
            <option value="estudante">🎓 Sou estudante</option>
            <option value="professor">👨‍🏫 Sou professor</option>
          </select>
        </div>

        {message && <p className="register-message">{message}</p>}

        <button type="submit" className="register-button" disabled={isLoading}>
          {isLoading ? 'Criando conta...' : 'Criar conta'}
        </button>
      </form>

      <div className="completion-section">
        <p className="completion-title">Você completará o perfil depois</p>
        <div className="completion-steps">
          <div className="step-item">
            <span className="step-icon">🎓</span>
            <span>Informações da escola</span>
          </div>
          <div className="step-item">
            <span className="step-icon">❤️</span>
            <span>Interesses e biografia</span>
          </div>
          <div className="step-item">
            <span className="step-icon">🏆</span>
            <span>Comece explorando!</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Register;

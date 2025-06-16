// src/context/AuthContext.jsx
import React, { createContext, useContext, useEffect, useState } from 'react'
import { 
  onAuthStateChanged, 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut
} from 'firebase/auth'
import { auth, debugFirebase } from '../config/firebase'
import toast from 'react-hot-toast'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const USER_TYPES = {
    STUDENT: 'student',
    TEACHER: 'teacher',
    ADMIN: 'admin'
  }

  // Debug ao montar o componente
  useEffect(() => {
    console.log('🔍 INICIANDO DEBUG COMPLETO DO FIREBASE:')
    const debugInfo = debugFirebase()
    console.log('Debug result:', debugInfo)
    
    if (!debugInfo.auth) {
      console.error('❌ FIREBASE AUTH NÃO INICIALIZADO!')
      alert('ERRO: Firebase Auth não foi inicializado corretamente!')
      return
    }
  }, [])

  useEffect(() => {
    console.log('🔐 Configurando listener de autenticação...')
    
    if (!auth) {
      console.error('❌ Auth object não disponível!')
      setLoading(false)
      return
    }
    
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log('👤 Auth state changed:', user ? `Logado: ${user.uid}` : 'Deslogado')
      setUser(user)
      setLoading(false)
    })

    return unsubscribe
  }, [])

  const register = async (email, password, userData) => {
    console.log('📝 INICIANDO REGISTRO COM DEBUG COMPLETO')
    console.log('📧 Email:', email)
    console.log('👤 Dados do usuário:', userData)
    
    // Debug pré-registro
    console.log('🔍 Verificando Auth object:', auth)
    if (!auth) {
      const error = 'Firebase Auth não está disponível'
      console.error('❌', error)
      toast.error(error)
      throw new Error(error)
    }

    console.log('🔍 Verificando se Auth está configurado:', auth.app)
    console.log('🔍 Config do Auth:', auth.config)

    try {
      console.log('🚀 Chamando createUserWithEmailAndPassword...')
      console.log('🔗 URL que será chamada:', `https://identitytoolkit.googleapis.com/v1/accounts:signUp`)
      
      const result = await createUserWithEmailAndPassword(auth, email, password)
      
      console.log('✅ SUCESSO! Usuário criado:', result.user.uid)
      console.log('📊 Resultado completo:', result)
      
      toast.success('Conta criada com sucesso! 🎉')
      return result

    } catch (error) {
      console.error('❌ ERRO DETALHADO NO REGISTRO:')
      console.error('- Code:', error.code)
      console.error('- Message:', error.message)
      console.error('- Stack:', error.stack)
      console.error('- Erro completo:', error)
      
      // Diagnóstico específico para auth/configuration-not-found
      if (error.code === 'auth/configuration-not-found') {
        console.error('🚨 DIAGNÓSTICO PARA auth/configuration-not-found:')
        console.error('1. Verifique se Authentication está ATIVADO no Firebase Console')
        console.error('2. Verifique se Email/Password está HABILITADO')
        console.error('3. Verifique se o Project ID está correto')
        console.error('4. Verifique se a API Key está correta')
        
        toast.error('❌ Erro de configuração do Firebase. Verifique o console!')
        
        // Instruções específicas
        alert(`
🚨 ERRO DE CONFIGURAÇÃO FIREBASE

PASSOS PARA RESOLVER:

1. Acesse: https://console.firebase.google.com/project/ecosnap-9529a

2. Vá em "Authentication" → "Sign-in method"

3. Clique em "Email/password" e ATIVE a primeira opção

4. Salve e tente novamente

Se o problema persistir, o projeto pode não estar configurado corretamente.
        `)
      }
      
      let errorMessage = 'Erro ao criar conta'
      
      switch (error.code) {
        case 'auth/email-already-in-use':
          errorMessage = 'Este email já está sendo usado'
          break
        case 'auth/weak-password':
          errorMessage = 'A senha deve ter pelo menos 6 caracteres'
          break
        case 'auth/invalid-email':
          errorMessage = 'Email inválido'
          break
        case 'auth/operation-not-allowed':
          errorMessage = 'Cadastro não permitido. Authentication não está ativado!'
          break
        case 'auth/configuration-not-found':
          errorMessage = 'Configuração do Firebase incorreta ou Authentication não ativado'
          break
        case 'auth/network-request-failed':
          errorMessage = 'Erro de rede. Verifique sua conexão'
          break
        default:
          errorMessage = `Firebase Error: ${error.message}`
      }
      
      toast.error(errorMessage)
      throw new Error(errorMessage)
    }
  }

  const login = async (email, password) => {
    try {
      console.log('🔑 Tentando login:', email)
      const result = await signInWithEmailAndPassword(auth, email, password)
      console.log('✅ Login bem-sucedido:', result.user.uid)
      toast.success('Login realizado!')
      return result
    } catch (error) {
      console.error('❌ Erro no login:', error)
      toast.error('Erro no login: ' + error.message)
      throw error
    }
  }

  const logout = async () => {
    try {
      await signOut(auth)
      // O listener onAuthStateChanged em App.jsx cuidará de atualizar o estado do user para null
      toast.success('Logout realizado!')
    } catch (error) {
      console.error('❌ Erro no logout:', error)
      toast.error('Erro no logout')
    }
  }

  const value = {
    user,
    loading,
    USER_TYPES,
    register,
    login,
    logout,
    isAuthenticated: !!user // Adiciona uma flag de autenticação para fácil verificação
  }

  return (
    <AuthContext.Provider value={value}>
      {/* Renderiza os filhos apenas depois que o estado de autenticação for carregado */}
      {!loading && children} 
    </AuthContext.Provider>
  )
}

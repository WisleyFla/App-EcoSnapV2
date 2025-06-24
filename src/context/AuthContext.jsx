// src/context/AuthContext.jsx
// NOVA versão usando Supabase (substitui a versão Firebase)

import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

const AuthContext = createContext({})

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
  const [session, setSession] = useState(null)

  useEffect(() => {
    // Verificar sessão atual
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Escutar mudanças de autenticação
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)

      // Toast para eventos de auth
      if (event === 'SIGNED_IN') {
        toast.success('Login realizado com sucesso!')
      } else if (event === 'SIGNED_OUT') {
        toast.success('Logout realizado com sucesso!')
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  // Fazer login
  const login = async (email, password) => {
    try {
      setLoading(true)
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      return data
    } catch (error) {
      console.error('Erro no login:', error)
      
      // Tratar erros específicos do Supabase
      if (error.message.includes('Invalid login credentials')) {
        throw new Error('Email ou senha inválidos')
      } else if (error.message.includes('Email not confirmed')) {
        throw new Error('Email não confirmado. Verifique sua caixa de entrada.')
      } else {
        throw new Error(error.message || 'Erro ao fazer login')
      }
    } finally {
      setLoading(false)
    }
  }

  // Fazer registro
  const register = async (email, password, userData = {}) => {
    try {
      setLoading(true)
      
      // 1. Criar conta no Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: userData.displayName || email.split('@')[0],
          }
        }
      })

      if (authError) throw authError

      // 2. Criar perfil na tabela users
      if (authData.user) {
        const { error: profileError } = await supabase
          .from('users')
          .insert({
            id: authData.user.id,
            email: authData.user.email,
            username: userData.username || email.split('@')[0],
            display_name: userData.displayName || email.split('@')[0],
            bio: userData.bio || '',
            role: userData.role || 'estudante', // Role padrão
            institution: userData.institution || '',
            grade_year: userData.gradeYear || '',
            specialization: userData.specialization || []
          })

        if (profileError) {
          console.error('Erro ao criar perfil:', profileError)
          // Continuar mesmo se der erro no perfil
        }
      }

      return authData
    } catch (error) {
      console.error('Erro no registro:', error)
      
      if (error.message.includes('already registered')) {
        throw new Error('Este email já está cadastrado')
      } else if (error.message.includes('Password should be at least')) {
        throw new Error('A senha deve ter pelo menos 6 caracteres')
      } else {
        throw new Error(error.message || 'Erro ao criar conta')
      }
    } finally {
      setLoading(false)
    }
  }

  // Fazer logout
  const logout = async () => {
    try {
      setLoading(true)
      const { error } = await supabase.auth.signOut()
      if (error) throw error
    } catch (error) {
      console.error('Erro no logout:', error)
      toast.error('Erro ao fazer logout')
    } finally {
      setLoading(false)
    }
  }

  // Recuperar senha
  const resetPassword = async (email) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })
      
      if (error) throw error
      
      toast.success('Email de recuperação enviado!')
      return true
    } catch (error) {
      console.error('Erro ao recuperar senha:', error)
      throw new Error(error.message || 'Erro ao enviar email de recuperação')
    }
  }

  // Atualizar perfil
  const updateProfile = async (updates) => {
    try {
      if (!user) throw new Error('Usuário não autenticado')

      const { error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', user.id)

      if (error) throw error

      toast.success('Perfil atualizado com sucesso!')
      return true
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error)
      toast.error('Erro ao atualizar perfil')
      throw error
    }
  }

  // Buscar dados do usuário completos
  const getUserProfile = async (userId = null) => {
    try {
      const targetId = userId || user?.id
      if (!targetId) return null

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', targetId)
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Erro ao buscar perfil:', error)
      return null
    }
  }

  const value = {
    user,
    session,
    loading,
    login,
    register,
    logout,
    resetPassword,
    updateProfile,
    getUserProfile
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
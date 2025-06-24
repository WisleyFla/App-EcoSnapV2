// src/lib/supabase.js
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Credenciais do Supabase não encontradas no .env')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Configurações específicas do EcoSnap
export const SUPABASE_CONFIG = {
  STORAGE_BUCKET: 'ecosnap-media',
  AVATARS_FOLDER: 'avatars',
  POSTS_FOLDER: 'posts'
}

// Função de teste de conexão
export const testConnection = async () => {
  try {
    const { data, error } = await supabase.from('users').select('count').limit(1)
    if (error) throw error
    console.log('✅ Supabase conectado com sucesso!')
    return true
  } catch (error) {
    console.error('❌ Erro ao conectar com Supabase:', error)
    return false
  }
}
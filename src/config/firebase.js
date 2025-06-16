// src/config/firebase.js - VERSÃO DEFINITIVA (SEM DEPENDÊNCIA DO .env)

import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

// ⚡ CONFIGURAÇÕES FIXAS - SUBSTITUA suas antigas
const firebaseConfig = {
  apiKey: "AIzaSyBl-fjJTqMmo7LCxkkE5I__s37TJUmjXCM",
  authDomain: "ecosnap-9529a.firebaseapp.com",
  projectId: "ecosnap-9529a",
  storageBucket: "ecosnap-9529a.firebasestorage.app",
  messagingSenderId: "522110389165",
  appId: "1:522110389165:web:ae3bfcbaa5caeffdb12f24"
}

// Debug completo
console.log('🔧 VERIFICANDO CONFIGURAÇÕES FIREBASE (firebase.js):')
console.log('API Key:', firebaseConfig.apiKey ? '✅ OK' : '❌ FALTANDO')
console.log('Auth Domain:', firebaseConfig.authDomain ? '✅ OK' : '❌ FALTANDO')
console.log('Project ID:', firebaseConfig.projectId ? '✅ OK' : '❌ FALTANDO')
console.log('Storage Bucket:', firebaseConfig.storageBucket ? '✅ OK' : '❌ FALTANDO')
console.log('Messaging Sender ID:', firebaseConfig.messagingSenderId ? '✅ OK' : '❌ FALTANDO')
console.log('App ID:', firebaseConfig.appId ? '✅ OK' : '❌ FALTANDO')

// Verificar se todos os campos estão preenchidos
const requiredFields = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId']
const missingFields = requiredFields.filter(field => !firebaseConfig[field])

if (missingFields.length > 0) {
  console.error('❌ CAMPOS OBRIGATÓRIOS FALTANDO (firebase.js):', missingFields)
  console.error('ERRO: Configuração Firebase incompleta. Verifique o console para detalhes.');
}

let app, auth, db, storage

try {
  console.log('🚀 Inicializando Firebase com configurações fixas (firebase.js)...')

  if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
    throw new Error('Configurações essenciais do Firebase estão faltando')
  }

  app = initializeApp(firebaseConfig)
  console.log('✅ Firebase App inicializado (firebase.js)')

  auth = getAuth(app)
  console.log('✅ Firebase Auth inicializado (firebase.js)')

  db = getFirestore(app)
  console.log('✅ Firestore inicializado (firebase.js)')

  storage = getStorage(app)
  console.log('✅ Storage inicializado (firebase.js)')

  console.log('🎉 TODOS OS SERVIÇOS FIREBASE PRONTOS (firebase.js)!')

  console.log('🧪 Testando Auth (firebase.js)...')
  console.log('Auth currentUser (firebase.js):', auth.currentUser)
  console.log('Auth config (firebase.js):', auth.config)

} catch (error) {
  console.error('❌ ERRO CRÍTICO ao inicializar Firebase (firebase.js):', error)
  console.error('📋 Detalhes do erro (firebase.js):', error.message)
  console.error(`ERRO FIREBASE (firebase.js): ${error.message}`);
}

export { auth, db, storage }
export default app

export const debugFirebase = () => {
  console.log('🔍 DEBUG FIREBASE (função debugFirebase):')
  console.log('- App:', app ? '✅' : '❌')
  console.log('- Auth:', auth ? '✅' : '❌')
  console.log('- DB:', db ? '✅' : '❌')
  console.log('- Storage:', storage ? '✅' : '❌')
  console.log('- Config completa:', firebaseConfig)

  return {
    app: !!app,
    auth: !!auth,
    db: !!db,
    storage: !!storage,
    config: firebaseConfig
  }
}

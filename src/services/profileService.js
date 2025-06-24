// src/services/profileService.js
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { uploadProfileImage, deleteProfileImage, getProfileImageURL } from './imageService';

// Função para salvar dados do perfil no Firestore
export const saveUserProfile = async (userId, profileData) => {
  try {
    const userDocRef = doc(db, 'users', userId);
    
    // Dados a serem salvos
    const dataToSave = {
      ...profileData,
      updatedAt: new Date().toISOString(),
      // Se é o primeiro salvamento, adiciona createdAt
      ...(!(await getDoc(userDocRef)).exists() && { 
        createdAt: new Date().toISOString() 
      })
    };
    
    // Use setDoc para criar/sobrescrever ou updateDoc para apenas atualizar
    await setDoc(userDocRef, dataToSave, { merge: true });
    
    console.log('Perfil salvo com sucesso no Firebase');
    return { success: true };
  } catch (error) {
    console.error('Erro ao salvar perfil:', error);
    throw new Error('Erro ao salvar perfil: ' + error.message);
  }
};

// Função para carregar dados do perfil do Firestore
export const loadUserProfile = async (userId) => {
  try {
    const userDocRef = doc(db, 'users', userId);
    const docSnap = await getDoc(userDocRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      
      // Tentar carregar URL da foto de perfil
      try {
        const profileImageURL = await getProfileImageURL(userId);
        data.profileImageURL = profileImageURL;
      } catch (error) {
        console.log('Nenhuma foto de perfil encontrada');
        data.profileImageURL = null;
      }
      
      console.log('Perfil carregado do Firebase:', data);
      return {
        success: true,
        data: data
      };
    } else {
      // Usuário não tem perfil salvo ainda
      console.log('Nenhum perfil encontrado para este usuário');
      return {
        success: true,
        data: null
      };
    }
  } catch (error) {
    console.error('Erro ao carregar perfil:', error);
    throw new Error('Erro ao carregar perfil: ' + error.message);
  }
};

// Função para atualizar apenas campos específicos do perfil
export const updateUserProfile = async (userId, updates) => {
  try {
    const userDocRef = doc(db, 'users', userId);
    
    const updateData = {
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    await updateDoc(userDocRef, updateData);
    
    console.log('Perfil atualizado com sucesso');
    return { success: true };
  } catch (error) {
    console.error('Erro ao atualizar perfil:', error);
    throw new Error('Erro ao atualizar perfil: ' + error.message);
  }
};

// ADICIONADO: Função para fazer upload de foto de perfil
export const updateProfileImage = async (userId, file, onProgress = null) => {
  try {
    // Deletar imagem anterior se existir
    await deleteProfileImage(userId);
    
    // Fazer upload da nova imagem
    const imageURL = await uploadProfileImage(userId, file, onProgress);
    
    // Atualizar documento do usuário com a URL da imagem
    await updateUserProfile(userId, {
      profileImageURL: imageURL,
      hasProfileImage: true
    });
    
    console.log('Foto de perfil atualizada com sucesso');
    return {
      success: true,
      imageURL: imageURL
    };
  } catch (error) {
    console.error('Erro ao atualizar foto de perfil:', error);
    throw error;
  }
};

// ADICIONADO: Função para remover foto de perfil
export const removeProfileImage = async (userId) => {
  try {
    // Deletar imagem do Storage
    await deleteProfileImage(userId);
    
    // Atualizar documento do usuário
    await updateUserProfile(userId, {
      profileImageURL: null,
      hasProfileImage: false
    });
    
    console.log('Foto de perfil removida com sucesso');
    return { success: true };
  } catch (error) {
    console.error('Erro ao remover foto de perfil:', error);
    throw error;
  }
};

// Função para verificar se um nome de usuário já existe
export const checkUsernameAvailability = async (username, currentUserId) => {
  try {
    // Implementar busca por username em todos os usuários
    // Por simplicidade, vou retornar true por enquanto
    // Em produção, você precisaria de uma estrutura de dados otimizada para isso
    console.log('Verificando disponibilidade do username:', username);
    return { available: true };
  } catch (error) {
    console.error('Erro ao verificar username:', error);
    return { available: true }; // Assume disponível em caso de erro
  }
};

// Função para salvar configurações do usuário
export const saveUserSettings = async (userId, settings) => {
  try {
    const userDocRef = doc(db, 'users', userId);
    
    await updateDoc(userDocRef, {
      settings: settings,
      updatedAt: new Date().toISOString()
    });
    
    console.log('Configurações salvas com sucesso');
    return { success: true };
  } catch (error) {
    console.error('Erro ao salvar configurações:', error);
    throw new Error('Erro ao salvar configurações: ' + error.message);
  }
};

// Função para carregar configurações do usuário
export const loadUserSettings = async (userId) => {
  try {
    const userDocRef = doc(db, 'users', userId);
    const docSnap = await getDoc(userDocRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        success: true,
        settings: data.settings || {}
      };
    } else {
      return {
        success: true,
        settings: {}
      };
    }
  } catch (error) {
    console.error('Erro ao carregar configurações:', error);
    throw new Error('Erro ao carregar configurações: ' + error.message);
  }
};
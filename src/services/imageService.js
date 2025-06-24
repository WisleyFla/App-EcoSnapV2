// src/services/imageService.js
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '../config/firebase';

// Função para redimensionar imagem antes do upload
const resizeImage = (file, maxWidth = 400, maxHeight = 400, quality = 0.8) => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      // Calcula as novas dimensões mantendo a proporção
      let { width, height } = img;
      
      if (width > height) {
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }
      }
      
      canvas.width = width;
      canvas.height = height;
      
      // Desenha a imagem redimensionada
      ctx.drawImage(img, 0, 0, width, height);
      
      // Converte para blob
      canvas.toBlob(resolve, 'image/jpeg', quality);
    };
    
    img.src = URL.createObjectURL(file);
  });
};

// Função para validar arquivo de imagem
export const validateImageFile = (file) => {
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  const maxSize = 5 * 1024 * 1024; // 5MB
  
  if (!validTypes.includes(file.type)) {
    throw new Error('Tipo de arquivo não suportado. Use JPG, PNG ou WebP.');
  }
  
  if (file.size > maxSize) {
    throw new Error('Arquivo muito grande. Máximo 5MB.');
  }
  
  return true;
};

// Função para fazer upload da foto de perfil
export const uploadProfileImage = async (userId, file, onProgress = null) => {
  try {
    // Validar arquivo
    validateImageFile(file);
    
    // Redimensionar imagem
    console.log('Redimensionando imagem...');
    const resizedFile = await resizeImage(file);
    
    // Criar referência no Storage
    const imageRef = ref(storage, `profile-images/${userId}/profile.jpg`);
    
    // Fazer upload com metadata
    const metadata = {
      contentType: 'image/jpeg',
      customMetadata: {
        uploadedAt: new Date().toISOString(),
        originalName: file.name
      }
    };
    
    console.log('Iniciando upload...');
    
    // Upload com progresso (se callback fornecido)
    let uploadTask;
    if (onProgress) {
      const { uploadBytesResumable } = await import('firebase/storage');
      uploadTask = uploadBytesResumable(imageRef, resizedFile, metadata);
      
      return new Promise((resolve, reject) => {
        uploadTask.on('state_changed',
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            onProgress(Math.round(progress));
          },
          (error) => {
            console.error('Erro no upload:', error);
            reject(new Error('Erro ao fazer upload da imagem'));
          },
          async () => {
            try {
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
              console.log('Upload concluído. URL:', downloadURL);
              resolve(downloadURL);
            } catch (error) {
              reject(new Error('Erro ao obter URL da imagem'));
            }
          }
        );
      });
    } else {
      // Upload simples sem progresso
      const snapshot = await uploadBytes(imageRef, resizedFile, metadata);
      const downloadURL = await getDownloadURL(snapshot.ref);
      console.log('Upload concluído. URL:', downloadURL);
      return downloadURL;
    }
    
  } catch (error) {
    console.error('Erro no upload:', error);
    throw error;
  }
};

// Função para deletar foto de perfil anterior
export const deleteProfileImage = async (userId) => {
  try {
    const imageRef = ref(storage, `profile-images/${userId}/profile.jpg`);
    await deleteObject(imageRef);
    console.log('Imagem anterior deletada com sucesso');
  } catch (error) {
    // Não é um erro crítico se a imagem não existir
    console.log('Nenhuma imagem anterior para deletar ou erro ao deletar:', error.message);
  }
};

// Função para obter URL da foto de perfil
export const getProfileImageURL = async (userId) => {
  try {
    const imageRef = ref(storage, `profile-images/${userId}/profile.jpg`);
    const url = await getDownloadURL(imageRef);
    return url;
  } catch (error) {
    console.log('Nenhuma foto de perfil encontrada para o usuário');
    return null;
  }
};

// Função para comprimir imagem para diferentes tamanhos
export const createImageThumbnails = async (file, userId) => {
  try {
    const thumbnails = {};
    
    // Criar diferentes tamanhos
    const sizes = [
      { name: 'small', width: 100, height: 100 },
      { name: 'medium', width: 200, height: 200 },
      { name: 'large', width: 400, height: 400 }
    ];
    
    for (const size of sizes) {
      const resized = await resizeImage(file, size.width, size.height, 0.9);
      const imageRef = ref(storage, `profile-images/${userId}/profile_${size.name}.jpg`);
      
      const snapshot = await uploadBytes(imageRef, resized, {
        contentType: 'image/jpeg',
        customMetadata: {
          size: size.name,
          uploadedAt: new Date().toISOString()
        }
      });
      
      thumbnails[size.name] = await getDownloadURL(snapshot.ref);
    }
    
    return thumbnails;
  } catch (error) {
    console.error('Erro ao criar thumbnails:', error);
    throw new Error('Erro ao processar imagem');
  }
};
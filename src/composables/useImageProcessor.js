// src/composables/useImageProcessor.js

import imageCompression from 'browser-image-compression';

/**
 * Comprime e otimiza uma imagem no navegador antes do upload.
 * @param {File} file - O arquivo de imagem original.
 * @returns {Promise<File>} - O arquivo de imagem otimizado como um novo objeto File.
 */
export async function compressImage(file) {
  // Opções de otimização
  const options = {
    maxSizeMB: 0.5, // Tamanho máximo do arquivo final em MB (500KB)
    maxWidthOrHeight: 1280, // Redimensiona a imagem para ter no máximo 1280px de largura ou altura
    useWebWorker: true, // Usa um worker para não travar a interface durante a compressão
    fileType: 'image/webp', // Converte a imagem para o formato WebP
    initialQuality: 0.8, // Qualidade inicial para JPEGs/PNGs antes da conversão
  };

  try {
    console.log(`Otimizando imagem: ${file.name}, tamanho original: ${(file.size / 1024 / 1024).toFixed(2)} MB`);
    
    const compressedBlob = await imageCompression(file, options);
    
    // O nome do arquivo é perdido na compressão, então criamos um novo File object com o nome original (mudando a extensão)
    const originalName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
    const compressedFile = new File([compressedBlob], `${originalName}.webp`, {
      type: 'image/webp',
      lastModified: Date.now(),
    });

    console.log(`Imagem otimizada: ${compressedFile.name}, novo tamanho: ${(compressedFile.size / 1024 / 1024).toFixed(2)} MB`);

    return compressedFile;
  } catch (error) {
    console.error('Erro ao comprimir a imagem:', error);
    // Se a compressão falhar, retorna o arquivo original para não quebrar o fluxo de upload
    return file;
  }
}

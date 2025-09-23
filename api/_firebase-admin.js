// api/_firebase-admin.js

import admin from 'firebase-admin';

// Adiciona logs para depuração
console.log("API Route Handler: Verificando inicialização do Firebase Admin...");

if (!admin.apps.length) {
  console.log("Firebase Admin não inicializado. Tentando inicializar...");
  
  const adminConfig = process.env.FIREBASE_ADMIN_CONFIG;
  
  if (!adminConfig) {
    console.error("ERRO CRÍTICO: A variável de ambiente FIREBASE_ADMIN_CONFIG não foi encontrada.");
    throw new Error('Configuração do Firebase Admin (FIREBASE_ADMIN_CONFIG) está ausente.');
  }
  
  console.log("Variável FIREBASE_ADMIN_CONFIG encontrada. Verificando se é um JSON válido...");

  try {
    const serviceAccount = JSON.parse(adminConfig);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log("Firebase Admin inicializado com SUCESSO.");
  } catch (error) {
    console.error('ERRO CRÍTICO AO INICIALIZAR FIREBASE ADMIN:', error.message);
    console.error('Isso geralmente significa que o conteúdo da variável FIREBASE_ADMIN_CONFIG não é um JSON válido. Verifique se você copiou o conteúdo completo do arquivo, incluindo o { e o }.');
    throw new Error('Configuração do Firebase Admin é inválida.');
  }
} else {
  console.log("Firebase Admin já estava inicializado.");
}

const auth = admin.auth();
const db = admin.firestore();

export { auth, db };

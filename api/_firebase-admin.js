// api/_firebase-admin.js

import admin from 'firebase-admin';

// Verifica se o app já foi inicializado para evitar erros em "hot-reloads" durante o desenvolvimento
if (!admin.apps.length) {
  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_ADMIN_CONFIG);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  } catch (error) {
    console.error('Falha ao inicializar Firebase Admin:', error.message);
    // Lançar o erro impede que a API funcione sem autenticação, o que é uma falha de segurança.
    throw new Error('Configuração do Firebase Admin está ausente ou inválida.');
  }
}

const auth = admin.auth();
const db = admin.firestore();

export { auth, db };

// ARQUIVO: src/firebase.js (VERSÃO CORRIGIDA E COMPLETA)

import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth"; // 1. Importa a função de autenticação

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Inicializa o app Firebase
const app = initializeApp(firebaseConfig);

// Obtém referências para os serviços
const db = getFirestore(app);
const auth = getAuth(app); // 2. Cria a instância do serviço de autenticação

// Exporta ambos para serem usados em outros lugares
export { db, auth }; // 3. Exporta tanto o 'db' quanto o 'auth'
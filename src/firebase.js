// ARQUIVO: src/firebase.js (VERSÃO FINAL E SEGURA)

import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth"; // Importa o serviço de autenticação
import { getStorage } from "firebase/storage"; // Importa o serviço de Storage

// Monta o objeto de configuração a partir de variáveis de ambiente individuais
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Validação para garantir que as variáveis foram carregadas
if (!firebaseConfig.apiKey) {
  throw new Error("Variáveis de ambiente do Firebase não foram carregadas corretamente. Verifique sua configuração no Vercel e o prefixo VITE_.");
}

// Inicializa o Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app); // Inicializa o serviço de autenticação
const storage = getStorage(app); // Inicializa o serviço de Storage

// Exporta os serviços para serem usados em outros arquivos
export { app, db, auth, storage };
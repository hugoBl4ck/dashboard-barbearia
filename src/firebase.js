// ARQUIVO: src/firebase.js (versão para produção)

import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Decodifica a string JSON da variável de ambiente
const firebaseConfig = JSON.parse(import.meta.env.VITE_FIREBASE_CONFIG);

// Inicializa o Firebase
const app = initializeApp(firebaseConfig);

// Obtém uma referência ao serviço Firestore e a exporta
const db = getFirestore(app);

export { db };
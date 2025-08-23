// ARQUIVO: src/firebase.js

// 1. Importar as funções necessárias do Firebase SDK
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// 2. Colar o objeto de configuração que você copiou do Firebase


const firebaseConfig = {
  apiKey: "AIzaSyDHNsSzgJntMw1AJD61cb9TCy7-QHkiaNI",
  authDomain: "chatbot-barbearia-638a7.firebaseapp.com",
  projectId: "chatbot-barbearia-638a7",
  storageBucket: "chatbot-barbearia-638a7.firebasestorage.app",
  messagingSenderId: "232281131537",
  appId: "1:232281131537:web:0d3b7bbe4b9a2d1f7dbfb0"
};



// 3. Inicializar o Firebase
const app = initializeApp(firebaseConfig);

// 4. Obter uma referência ao serviço Firestore e exportá-la
//    Isso permite que outros arquivos no nosso projeto importem e usem o banco de dados.
const db = getFirestore(app);

export { db };
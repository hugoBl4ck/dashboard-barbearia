// ARQUIVO: src/composables/useAuth.js

import { ref, onMounted } from 'vue';
import { getAuth, onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';

// Cria uma única instância do provedor Google
const provider = new GoogleAuthProvider();

// Variável de estado reativa que guarda o usuário.
// Ela será compartilhada por toda a aplicação.
const user = ref(null);

export function useAuth() {
  const auth = getAuth();

  // Função para lidar com o login
  const login = async () => {
    try {
      await signInWithPopup(auth, provider);
      // O onAuthStateChanged vai lidar com a atualização do 'user'
    } catch (error) {
      console.error("Erro durante o login:", error);
      alert("Falha no login. Tente novamente.");
    }
  };

  // Função para lidar com o logout
  const logout = async () => {
    try {
      await signOut(auth);
      // O onAuthStateChanged vai lidar com a atualização do 'user' para null
    } catch (error) {
      console.error("Erro durante o logout:", error);
    }
  };

  // Um "listener" que observa mudanças no estado de autenticação.
  // Ele é configurado apenas uma vez.
  const setupAuthStateListener = () => {
    onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        console.log("Usuário logado:", firebaseUser.email);
        user.value = firebaseUser; // Usuário está logado
      } else {
        console.log("Usuário deslogado.");
        user.value = null; // Usuário está deslogado
      }
    });
  };
  
  // Quando o composable é usado pela primeira vez, ele configura o listener.
  onMounted(setupAuthStateListener);

  // Expõe o estado do usuário e as funções para os componentes
  return {
    user,
    login,
    logout,
  };
}
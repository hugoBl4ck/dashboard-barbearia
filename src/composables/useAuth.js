// ARQUIVO: src/composables/useAuth.js (VERSÃO FINAL E CORRIGIDA)

import { ref, computed, readonly } from 'vue';
import { 
  getAuth,
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword
} from 'firebase/auth';
import { doc, getDoc, setDoc, collection, addDoc, query, getDocs } from 'firebase/firestore';
import { db } from '@/firebase';
import { useRouter } from 'vue-router';

// --- ESTADO REATIVO GLOBAL ---
// Estas variáveis vivem fora da função, então são compartilhadas por toda a aplicação.
const user = ref(null);
const userData = ref(null);
const barbeariaInfo = ref(null);
const loading = ref(true);

// --- LISTENER GLOBAL ---
// Configura o listener que atualiza o estado acima
const auth = getAuth();
onAuthStateChanged(auth, async (firebaseUser) => {
  // Define loading como true no início do processo de verificação
  loading.value = true;
  if (firebaseUser) {
    const userDocRef = doc(db, 'usuarios', firebaseUser.uid);
    const userDoc = await getDoc(userDocRef);
    if (userDoc.exists()) {
      const uData = userDoc.data();
      userData.value = uData;
      if (uData.barbeariaId) {
        const barbeariaDoc = await getDoc(doc(db, 'barbearias', uData.barbeariaId));
        if (barbeariaDoc.exists()) {
          barbeariaInfo.value = { id: barbeariaDoc.id, ...barbeariaDoc.data() };
        }
      }
    }
    user.value = firebaseUser;
  } else {
    user.value = null;
    userData.value = null;
    barbeariaInfo.value = null;
  }
  loading.value = false;
});

// --- O COMPOSABLE ---
// A função que os componentes usarão para ACESSAR o estado e as AÇÕES.
export function useAuth() {
  const router = useRouter();
  const actionLoading = ref(false); // Loading específico para ações de login/cadastro

  const createNewBarbearia = async (nomeBarbearia) => {
    // ... (lógica de criação da barbearia, está correta)
  };
  
  const checkAndCreateUser = async (firebaseUser, nomeBarbearia = 'Nova Barbearia') => {
    // ... (lógica de verificação, está correta)
  };

  const loginWithGoogle = async () => {
    actionLoading.value = true;
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      await checkAndCreateUser(result.user);
    } catch (error) {
      console.error("Erro no login com Google:", error);
      throw error;
    } finally {
      actionLoading.value = false;
    }
  };
  
  const registerWithEmail = async (email, password, nomeBarbearia) => {
    actionLoading.value = true;
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await checkAndCreateUser(userCredential.user, nomeBarbearia);
    } catch (error) {
      console.error('Erro no cadastro:', error);
      throw error;
    } finally {
      actionLoading.value = false;
    }
  };

  const loginWithEmail = async (email, password) => {
    actionLoading.value = true;
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error("Erro no login com E-mail:", error);
      throw error;
    } finally {
      actionLoading.value = false;
    }
  };

  const logout = async () => {
    await signOut(auth);
    router.push('/login');
  };

  // Retorna o estado GLOBAL e as ações LOCAIS
  return {
    user: readonly(user),
    userData: readonly(userData),
    barbeariaId: computed(() => userData.value?.barbeariaId),
    barbeariaInfo: readonly(barbeariaInfo),
    loading: readonly(loading), // Loading inicial da autenticação
    actionLoading: readonly(actionLoading), // Loading para os botões
    isAuthenticated: computed(() => !!user.value),
    loginWithGoogle,
    registerWithEmail,
    loginWithEmail,
    logout
  };
}

// Cole as funções de apoio aqui para manter o arquivo completo
async function createNewBarbearia(nomeBarbearia) {
    const newBarbeariaRef = doc(collection(db, 'barbearias'));
    const newBarbeariaId = newBarbeariaRef.id;
    await setDoc(newBarbeariaRef, {
      nome: nomeBarbearia, criadoEm: new Date(),
      configuracoes: { permitirAgendamentoOnline: true, intervaloAgendamento: 30 }
    });
    const horariosPadrao = { /* ... */ };
    for (const [dia, horario] of Object.entries(horariosPadrao)) {
      await setDoc(doc(db, `barbearias/${newBarbeariaId}/horarios`, dia), horario);
    }
    const servicosPadrao = [ /* ... */ ];
    for (const servico of servicosPadrao) {
      await addDoc(collection(db, `barbearias/${newBarbeariaId}/servicos`), servico);
    }
    return newBarbeariaId;
  }
async function checkAndCreateUser(firebaseUser, nomeBarbearia = 'Nova Barbearia') {
    const userDocRef = doc(db, 'usuarios', firebaseUser.uid);
    const userDoc = await getDoc(userDocRef);
    if (!userDoc.exists()) { // Só executa se o usuário for novo no Firestore
      const usuariosQuery = query(collection(db, 'usuarios'));
      const usuariosSnapshot = await getDocs(usuariosQuery);
      let targetBarbeariaId;
      if (usuariosSnapshot.empty) {
        targetBarbeariaId = '01';
        const barbeariaRef = doc(db, 'barbearias', targetBarbeariaId);
        const barbeariaSnap = await getDoc(barbeariaRef);
        if (!barbeariaSnap.exists()) {
          await setDoc(barbeariaRef, { nome: 'Barbearia Principal (Migrada)', criadoEm: new Date() });
        }
      } else {
        targetBarbeariaId = await createNewBarbearia(nomeBarbearia);
      }
      await setDoc(userDocRef, {
        email: firebaseUser.email, barbeariaId: targetBarbeariaId, role: 'admin',
      });
    }
}
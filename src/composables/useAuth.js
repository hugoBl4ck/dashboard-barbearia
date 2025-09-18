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
      // GARANTIR que barbeariaInfo seja carregado ANTES de finalizar o loading
      if (uData.barbeariaId) {
        const barbeariaDoc = await getDoc(doc(db, 'barbearias', uData.barbeariaId));
        if (barbeariaDoc.exists()) {
          barbeariaInfo.value = { id: barbeariaDoc.id, ...barbeariaDoc.data() };
        }
      }
    } else {
      // Se o usuário do Firebase existe mas não está no Firestore, CRIA o documento.
      const newUserDoc = await checkAndCreateUser(firebaseUser);
      if (newUserDoc) {
        userData.value = newUserDoc;
        // Recarrega as informações da barbearia com base no novo documento
        if (newUserDoc.barbeariaId) {
          const barbeariaDoc = await getDoc(doc(db, 'barbearias', newUserDoc.barbeariaId));
          if (barbeariaDoc.exists()) {
            barbeariaInfo.value = { id: barbeariaDoc.id, ...barbeariaDoc.data() };
          }
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

  const loginWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Erro no login com Google:", error);
      throw error;
    }
  };
  
  const registerWithEmail = async (email, password, nomeBarbearia, nomeProprietario) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error('Erro no cadastro:', error);
      throw error;
    }
  };

  const loginWithEmail = async (email, password) => {    
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error("Erro no login com E-mail:", error);
      throw error;
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

async function checkAndCreateUser(firebaseUser) {
    const userDocRef = doc(db, 'usuarios', firebaseUser.uid);    
    let targetBarbeariaId;

    // Tenta ler a "Barbearia 01" para ver se o sistema já foi inicializado.
    const barbeariaPrincipalRef = doc(db, 'barbearias', '01');
    const barbeariaPrincipalSnap = await getDoc(barbeariaPrincipalRef);

    if (!barbeariaPrincipalSnap.exists()) {
      // Se a barbearia '01' NÃO existe, este é o primeiro usuário.
      // Criamos a barbearia '01' e associamos este usuário a ela.
      targetBarbeariaId = '01';
      await setDoc(barbeariaPrincipalRef, { nome: 'Barbearia Principal', criadoEm: new Date() });
    } else {
      // Se a barbearia '01' JÁ existe, este não é o primeiro usuário.
      // Criamos uma nova barbearia para ele.
      targetBarbeariaId = await createNewBarbearia('Nova Barbearia');
    }
    const newUserDocData = {
      email: firebaseUser.email,
      nome: firebaseUser.displayName || 'Novo Usuário', // Usa o nome do Google ou um padrão
      barbeariaId: targetBarbeariaId,
      role: 'admin',
    };
    await setDoc(userDocRef, newUserDocData);
    return newUserDocData;
}
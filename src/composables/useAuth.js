import { ref, onMounted, computed, readonly } from 'vue'; // LINHA CORRIGIDA
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword 
} from 'firebase/auth';
import { doc, getDoc, setDoc, collection, query, getDocs } from 'firebase/firestore';
import { auth, db } from '@/firebase';
import { useRouter } from 'vue-router';

// A função exportada agora pode ser nomeada, o que é uma boa prática
export function useAuth() {
  const user = ref(null);
  const loading = ref(true);
  const barbeariaId = ref(null);
  const barbeariaInfo = ref(null);
  const router = useRouter();

  const provider = new GoogleAuthProvider();

  const loginWithGoogle = async () => {
    try {
      loading.value = true;
      const result = await signInWithPopup(auth, provider);
      // O listener onAuthStateChanged cuidará do resto
      return { success: true };
    } catch (error) {
      console.error('Erro no login com Google:', error);
      return { success: false, error: error.message };
    } finally {
      loading.value = false;
    }
  };

  const loginWithEmail = async (email, password) => {
    try {
      loading.value = true;
      await signInWithEmailAndPassword(auth, email, password);
      // O listener onAuthStateChanged cuidará do resto
      return { success: true };
    } catch (error) {
      console.error('Erro no login com E-mail:', error);
      return { success: false, error: error.message };
    } finally {
      loading.value = false;
    }
  };

  const createNewBarbearia = async (nomeBarbearia) => {
    const newBarbeariaRef = doc(collection(db, 'barbearias'));
    const newBarbeariaId = newBarbeariaRef.id;
    
    await setDoc(newBarbeariaRef, {
      nome: nomeBarbearia,
      criadoEm: new Date(),
      configuracoes: {
        permitirAgendamentoOnline: true,
        intervaloAgendamento: 30
      }
    });

    // Criar horários e serviços padrão
    const horariosPadrao = {
      '0': {}, '1': { InicioManha: '09:00', FimManha: '12:00', InicioTarde: '14:00', FimTarde: '19:00' },
      '2': { InicioManha: '09:00', FimManha: '12:00', InicioTarde: '14:00', FimTarde: '19:00' }, '3': { InicioManha: '09:00', FimManha: '12:00', InicioTarde: '14:00', FimTarde: '19:00' },
      '4': { InicioManha: '09:00', FimManha: '12:00', InicioTarde: '14:00', FimTarde: '19:00' }, '5': { InicioManha: '09:00', FimManha: '12:00', InicioTarde: '14:00', FimTarde: '19:00' },
      '6': { InicioManha: '09:00', FimManha: '13:00' }
    };
    for (const [dia, horario] of Object.entries(horariosPadrao)) {
      await setDoc(doc(db, `barbearias/${newBarbeariaId}/horarios`, dia), horario);
    }
    const servicosPadrao = [
      { nome: 'Corte', preco: 50, duracaoMinutos: 45, ativo: true },
      { nome: 'Barba', preco: 40, duracaoMinutos: 30, ativo: true },
    ];
    for (const servico of servicosPadrao) {
      await addDoc(collection(db, `barbearias/${newBarbeariaId}/servicos`), servico);
    }
    return newBarbeariaId;
  };

  const checkAndCreateUser = async (firebaseUser, nomeBarbearia = 'Nova Barbearia') => {
    const userDocRef = doc(db, 'usuarios', firebaseUser.uid);
    const userDoc = await getDoc(userDocRef);
    
    if (!userDoc.exists()) {
      const usuariosQuery = query(collection(db, 'usuarios'));
      const usuariosSnapshot = await getDocs(usuariosQuery);
      
      let targetBarbeariaId;
      if (usuariosSnapshot.empty) {
        // Primeiro usuário do sistema, associa à barbearia '01' migrada
        targetBarbeariaId = '01';
        const barbeariaRef = doc(db, 'barbearias', targetBarbeariaId);
        const barbeariaSnap = await getDoc(barbeariaRef);
        if (!barbeariaSnap.exists()) {
          // Garante que a barbearia '01' exista, caso a migração não tenha rodado
          await setDoc(barbeariaRef, { nome: 'Barbearia Principal (Migrada)', criadoEm: new Date() });
        }
      } else {
        targetBarbeariaId = await createNewBarbearia(nomeBarbearia);
      }
      
      await setDoc(userDocRef, {
        email: firebaseUser.email,
        barbeariaId: targetBarbeariaId,
        role: 'admin',
      });
    }
  };

  const registerWithEmail = async (email, password, nomeBarbearia) => {
    loading.value = true;
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await checkAndCreateUser(userCredential.user, nomeBarbearia);
      return { success: true };
    } catch (error) {
      console.error('Erro no cadastro:', error);
      return { success: false, error: error.message };
    } finally {
      loading.value = false;
    }
  };

  const logout = async () => {
    await signOut(auth);
    router.push('/login');
  };

  onAuthStateChanged(auth, async (firebaseUser) => {
    if (firebaseUser) {
      const userDoc = await getDoc(doc(db, 'usuarios', firebaseUser.uid));
      if (userDoc.exists()) {
        const uData = userDoc.data();
        userData.value = uData;
        barbeariaId.value = uData.barbeariaId;
        const barbeariaDoc = await getDoc(doc(db, 'barbearias', uData.barbeariaId));
        if (barbeariaDoc.exists()) {
          barbeariaInfo.value = { id: barbeariaDoc.id, ...barbeariaDoc.data() };
        }
      }
      user.value = firebaseUser;
    } else {
      user.value = null;
      userData.value = null;
      barbeariaId.value = null;
      barbeariaInfo.value = null;
    }
    loading.value = false;
  });

  const isAuthenticated = computed(() => !!user.value);

  return {
    user: readonly(user),
    userData: readonly(userData),
    loading: readonly(loading),
    barbeariaId: readonly(barbeariaId),
    barbeariaInfo: readonly(barbeariaInfo),
    isAuthenticated,
    loginWithGoogle,
    loginWithEmail,
    registerWithEmail,
    logout
  };
}
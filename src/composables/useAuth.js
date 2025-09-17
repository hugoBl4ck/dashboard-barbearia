// composables/useAuth.js
import { ref, onMounted, watch, computed, readonly } from 'vue'
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword 
} from 'firebase/auth'
import { doc, getDoc, setDoc, collection, query, where, getDocs } from 'firebase/firestore'
import { auth, db } from '@/firebase'
import { useRouter } from 'vue-router'

export const useAuth = () => {
  const user = ref(null)
  const loading = ref(true)
  const barbeariaId = ref(null)
  const barbeariaInfo = ref(null)
  const router = useRouter()

  // Provider do Google
  const provider = new GoogleAuthProvider()

  // Login com Google
  const loginWithGoogle = async () => {
    try {
      loading.value = true
      const result = await signInWithPopup(auth, provider)
      const user = result.user
      
      // Verificar se usuário já existe no sistema
      await checkAndCreateUser(user)
      
      return { success: true }
    } catch (error) {
      console.error('Erro no login:', error)
      return { success: false, error: error.message }
    } finally {
      loading.value = false
    }
  }

  // Login com email e senha
  const loginWithEmail = async (email, password) => {
    try {
      loading.value = true
      const result = await signInWithEmailAndPassword(auth, email, password)
      await checkAndCreateUser(result.user)
      return { success: true }
    } catch (error) {
      console.error('Erro no login:', error)
      return { success: false, error: error.message }
    } finally {
      loading.value = false
    }
  }

  // Cadastro com email e senha
  const registerWithEmail = async (email, password, nomeIBarbearia) => {
    try {
      loading.value = true
      const result = await createUserWithEmailAndPassword(auth, email, password)
      
      // Criar nova barbearia
      const novaBarbeariaId = await createNewBarbearia(nomeIBarbearia)
      
      // Criar usuário no Firestore
      await setDoc(doc(db, 'usuarios', result.user.uid), {
        email: result.user.email,
        nome: result.user.displayName || email.split('@')[0],
        barbeariaId: novaBarbeariaId,
        role: 'admin',
        criadoEm: new Date().toISOString(),
        avatar: result.user.photoURL || null
      })

      return { success: true, barbeariaId: novaBarbeariaId }
    } catch (error) {
      console.error('Erro no cadastro:', error)
      return { success: false, error: error.message }
    } finally {
      loading.value = false
    }
  }

  // Verificar e criar usuário se necessário
  const checkAndCreateUser = async (firebaseUser) => {
    const userDoc = await getDoc(doc(db, 'usuarios', firebaseUser.uid))
    
    if (!userDoc.exists()) {
      // Usuário novo - verificar se é o primeiro usuário (ID 01)
      const usuariosQuery = query(collection(db, 'usuarios'))
      const usuariosSnapshot = await getDocs(usuariosQuery)
      
      let targetBarbeariaId = '01' // ID padrão para primeiro usuário
      
      if (usuariosSnapshot.empty) {
        // Primeiro usuário do sistema - usar ID 01 (dados existentes)
        await createBarbeariaIfNotExists('01', 'Barbearia Principal')
      } else {
        // Criar nova barbearia para este usuário
        targetBarbeariaId = await createNewBarbearia('Nova Barbearia')
      }

      // Criar documento do usuário
      await setDoc(doc(db, 'usuarios', firebaseUser.uid), {
        email: firebaseUser.email,
        nome: firebaseUser.displayName || firebaseUser.email.split('@')[0],
        barbeariaId: targetBarbeariaId,
        role: 'admin',
        criadoEm: new Date().toISOString(),
        avatar: firebaseUser.photoURL || null
      })
    }
    
    // Carregar dados do usuário
    await loadUserData(firebaseUser.uid)
  }

  // Carregar dados do usuário
  const loadUserData = async (uid) => {
    try {
      const userDoc = await getDoc(doc(db, 'usuarios', uid))
      if (userDoc.exists()) {
        const userData = userDoc.data()
        barbeariaId.value = userData.barbeariaId
        
        // Carregar informações da barbearia
        const barbeariaDoc = await getDoc(doc(db, 'barbearias', userData.barbeariaId))
        if (barbeariaDoc.exists()) {
          barbeariaInfo.value = { id: userData.barbeariaId, ...barbeariaDoc.data() }
        }
      }
    } catch (error) {
      console.error('Erro ao carregar dados do usuário:', error)
    }
  }

  // Criar nova barbearia
  const createNewBarbearia = async (nomeBarbearia) => {
    // Gerar ID único
    const timestamp = Date.now().toString()
    const barbeariaId = timestamp.slice(-8) // Usar últimos 8 dígitos do timestamp
    
    await createBarbeariaIfNotExists(barbeariaId, nomeBarbearia)
    return barbeariaId
  }

  // Criar barbearia se não existir
  const createBarbeariaIfNotExists = async (id, nome) => {
    const barbeariaDoc = await getDoc(doc(db, 'barbearias', id))
    
    if (!barbeariaDoc.exists()) {
      // Criar documento da barbearia
      await setDoc(doc(db, 'barbearias', id), {
        nome: nome,
        criadoEm: new Date().toISOString(),
        tema: 'default',
        configuracoes: {
          permitirAgendamentoOnline: true,
          intervaloAgendamento: 30,
          antecedenciaMinima: 60, // minutos
          antecedenciaMaxima: 30 // dias
        }
      })

      // Se for ID 01, não criar dados padrão (já existem)
      if (id !== '01') {
        // Criar horários padrão para nova barbearia
        const horariosPadrao = {
          0: { InicioManha: null, FimManha: null, InicioTarde: null, FimTarde: null }, // Domingo
          1: { InicioManha: '08:00', FimManha: '12:00', InicioTarde: '13:00', FimTarde: '18:00' }, // Segunda
          2: { InicioManha: '08:00', FimManha: '12:00', InicioTarde: '13:00', FimTarde: '18:00' }, // Terça
          3: { InicioManha: '08:00', FimManha: '12:00', InicioTarde: '13:00', FimTarde: '18:00' }, // Quarta
          4: { InicioManha: '08:00', FimManha: '12:00', InicioTarde: '13:00', FimTarde: '18:00' }, // Quinta
          5: { InicioManha: '08:00', FimManha: '12:00', InicioTarde: '13:00', FimTarde: '18:00' }, // Sexta
          6: { InicioManha: '08:00', FimManha: '12:00', InicioTarde: null, FimTarde: null }, // Sábado
        }

        // Criar horários no Firestore
        for (const [dia, horario] of Object.entries(horariosPadrao)) {
          await setDoc(doc(db, `barbearias/${id}/horarios`, dia), horario)
        }

        // Criar serviços padrão
        const servicosPadrao = [
          { nome: 'Corte Simples', preco: 25, duracaoMinutos: 30, ativo: true },
          { nome: 'Corte + Barba', preco: 35, duracaoMinutos: 45, ativo: true },
          { nome: 'Apenas Barba', preco: 15, duracaoMinutos: 20, ativo: true }
        ]

        for (const servico of servicosPadrao) {
          await setDoc(doc(collection(db, `barbearias/${id}/servicos`)), {
            ...servico,
            criadoEm: new Date().toISOString()
          })
        }
      }
    }
  }

  // Logout
  const logout = async () => {
    try {
      await signOut(auth)
      user.value = null
      barbeariaId.value = null
      barbeariaInfo.value = null
      router.push('/login')
    } catch (error) {
      console.error('Erro no logout:', error)
    }
  }

  // Observar mudanças na autenticação
  onMounted(() => {
    onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        user.value = firebaseUser
        await loadUserData(firebaseUser.uid)
      } else {
        user.value = null
        barbeariaId.value = null
        barbeariaInfo.value = null
      }
      loading.value = false
    })
  })

  // Verificar se usuário está autenticado
  const isAuthenticated = computed(() => !!user.value && !!barbeariaId.value)

  return {
    user: readonly(user),
    loading: readonly(loading),
    barbeariaId: readonly(barbeariaId),
    barbeariaInfo: readonly(barbeariaInfo),
    isAuthenticated,
    loginWithGoogle,
    loginWithEmail,
    registerWithEmail,
    logout
  }
}
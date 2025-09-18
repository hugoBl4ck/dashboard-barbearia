// ARQUIVO: src/composables/useAuth.js (VERSÃO SUGERIDA PELO USUÁRIO COM LOGS)

import { ref, computed, readonly } from 'vue'
import {
  getAuth,
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
} from 'firebase/auth'
import { doc, getDoc, setDoc, collection } from 'firebase/firestore'
import { db } from '@/firebase'
import { useRouter } from 'vue-router'
import { createInitialTenantData } from '@/firebase/tenantSetup'

// --- ESTADO REATIVO GLOBAL ---
const user = ref(null)
const userData = ref(null)
const barbeariaInfo = ref(null)
const loading = ref(true)

// --- FUNÇÕES DE APOIO (HELPER) ---

async function loadBarbeariaInfo(barbeariaId) {
  if (!barbeariaId) return null
  const snap = await getDoc(doc(db, 'barbearias', barbeariaId))
  return snap.exists() ? { id: snap.id, ...snap.data() } : null
}

async function createUserProfile(firebaseUser, additionalData) {
  const userDocRef = doc(db, 'usuarios', firebaseUser.uid)
  const newUserDocData = {
    email: firebaseUser.email,
    nome: additionalData.nome || firebaseUser.displayName || 'Novo Usuário',
    barbeariaId: additionalData.barbeariaId,
    role: 'admin',
    criadoEm: new Date(),
  }
  await setDoc(userDocRef, newUserDocData)
  return newUserDocData
}

async function createNewBarbearia(nomeBarbearia = 'Nova Barbearia') {
  const newBarbeariaRef = doc(collection(db, 'barbearias'))
  const newBarbeariaId = newBarbeariaRef.id
  await setDoc(newBarbeariaRef, {
    nome: nomeBarbearia,
    criadoEm: new Date(),
    configuracoes: { permitirAgendamentoOnline: true, intervaloAgendamento: 30 },
  })
  return newBarbeariaId
}

async function checkAndCreateUserOnFirstLogin(firebaseUser) {
  let targetBarbeariaId

  const barbeariaPrincipalRef = doc(db, 'barbearias', '01')
  const barbeariaPrincipalSnap = await getDoc(barbeariaPrincipalRef)

  if (!barbeariaPrincipalSnap.exists()) {
    targetBarbeariaId = '01'
    await setDoc(barbeariaPrincipalRef, { nome: 'Barbearia Principal', criadoEm: new Date() })
  } else {
    targetBarbeariaId = await createNewBarbearia('Nova Barbearia (Google)')
  }

  const newUserDoc = await createUserProfile(firebaseUser, {
    barbeariaId: targetBarbeariaId,
    nome: firebaseUser.displayName || 'Novo Usuário',
  })

  await createInitialTenantData(db, targetBarbeariaId)

  return newUserDoc
}

// --- LISTENER GLOBAL ---
const auth = getAuth()
onAuthStateChanged(auth, async (firebaseUser) => {
  loading.value = true
  try {
    console.log('[AUTH STATE CHANGED] Usuário Firebase:', firebaseUser?.uid || 'nenhum')

    if (firebaseUser) {
      const userDocRef = doc(db, 'usuarios', firebaseUser.uid)
      const userDoc = await getDoc(userDocRef)

      if (userDoc.exists()) {
        console.log('[USER DOC ENCONTRADO]', userDoc.data())
        const uData = userDoc.data()
        userData.value = uData

        const barbearia = await loadBarbeariaInfo(uData.barbeariaId)
        console.log('[BARBEARIA CARREGADA]', barbearia)
        barbeariaInfo.value = barbearia
      } else {
        console.log('[USER DOC NÃO EXISTE] UID:', firebaseUser.uid)

        if (firebaseUser.providerData[0]?.providerId === 'google.com') {
          console.log('[CRIANDO PERFIL GOOGLE LOGIN]')
          const newUserDoc = await checkAndCreateUserOnFirstLogin(firebaseUser)
          console.log('[NOVO USER DOC CRIADO]', newUserDoc)

          userData.value = newUserDoc
          barbeariaInfo.value = await loadBarbeariaInfo(newUserDoc.barbeariaId)
        }
      }

      user.value = firebaseUser
    } else {
      console.log('[LOGOUT] Usuário saiu')
      user.value = null
      userData.value = null
      barbeariaInfo.value = null
    }
  } catch (e) {
    console.error('Erro crítico no onAuthStateChanged:', e)
  } finally {
    loading.value = false
  }
})

// --- O COMPOSABLE ---
export function useAuth() {
  const router = useRouter()

  const loginWithGoogle = async () => {
    try {
      await signInWithPopup(auth, new GoogleAuthProvider())
    } catch (error) {
      console.error('Erro no login com Google:', error)
      throw error
    }
  }

  const registerWithEmail = async (email, password, nomeBarbearia, nomeProprietario) => {
    try {
      console.log('[REGISTER] Iniciando cadastro:', email)

      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      const firebaseUser = userCredential.user
      console.log('[REGISTER] FirebaseUser criado:', firebaseUser.uid)

      const newBarbeariaId = await createNewBarbearia(nomeBarbearia)
      console.log('[REGISTER] Nova barbearia criada:', newBarbeariaId)

      await createUserProfile(firebaseUser, {
        barbeariaId: newBarbeariaId,
        nome: nomeProprietario,
      })
      console.log('[REGISTER] Perfil do usuário salvo:', firebaseUser.uid)

      await createInitialTenantData(db, newBarbeariaId)
      console.log('[REGISTER] Dados iniciais populados para barbearia:', newBarbeariaId)

      const userDoc = await getDoc(doc(db, 'usuarios', firebaseUser.uid))
      if (userDoc.exists()) {
        console.log('[REGISTER] Documento final do usuário:', userDoc.data())
        userData.value = userDoc.data()
        barbeariaInfo.value = await loadBarbeariaInfo(userDoc.data().barbeariaId)
      }
    } catch (error) {
      console.error('Erro no cadastro:', error)
      throw error
    }
  }

  const loginWithEmail = async (email, password) => {
    try {
      await signInWithEmailAndPassword(auth, email, password)
    } catch (error) {
      console.error('Erro no login com E-mail:', error)
      throw error
    }
  }

  const logout = async () => {
    await signOut(auth)
    router.push('/login')
  }

  const sendPasswordReset = async (email) => {
    try {
      await sendPasswordResetEmail(auth, email)
    } catch (error) {
      console.error('Erro ao enviar e-mail de recuperação:', error)
      throw error
    }
  }

  return {
    user: readonly(user),
    userData: readonly(userData),
    barbeariaId: computed(() => userData.value?.barbeariaId),
    barbeariaInfo: readonly(barbeariaInfo),
    loading: readonly(loading),
    isAuthenticated: computed(() => !!user.value),
    loginWithGoogle,
    registerWithEmail,
    loginWithEmail,
    logout,
    sendPasswordReset,
  }
}

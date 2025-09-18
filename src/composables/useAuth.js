// ARQUIVO: src/composables/useAuth.js (VERSÃO FINAL E CORRIGIDA)

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

// --- LISTENER GLOBAL ---
const auth = getAuth()
onAuthStateChanged(auth, async (firebaseUser) => {
  loading.value = true
  try {
    if (firebaseUser) {
      const userDocRef = doc(db, 'usuarios', firebaseUser.uid)
      const userDoc = await getDoc(userDocRef)
      if (userDoc.exists()) {
        const uData = userDoc.data()
        userData.value = uData
        if (uData.barbeariaId) {
          const barbeariaDoc = await getDoc(doc(db, 'barbearias', uData.barbeariaId))
          if (barbeariaDoc.exists()) {
            barbeariaInfo.value = { id: barbeariaDoc.id, ...barbeariaDoc.data() }
          }
        }
      } else {
        const newUserDoc = await checkAndCreateUserOnFirstLogin(firebaseUser)
        if (newUserDoc) {
          userData.value = newUserDoc
          if (newUserDoc.barbeariaId) {
            const barbeariaDoc = await getDoc(doc(db, 'barbearias', newUserDoc.barbeariaId))
            if (barbeariaDoc.exists()) {
              barbeariaInfo.value = { id: barbeariaDoc.id, ...barbeariaDoc.data() }
            }
          }
        }
      }
      user.value = firebaseUser
    } else {
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
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      const firebaseUser = userCredential.user

      const newBarbeariaId = await createNewBarbearia(nomeBarbearia)

      await createUserProfile(firebaseUser, {
        barbeariaId: newBarbeariaId,
        nome: nomeProprietario,
      })

      await createInitialTenantData(db, newBarbeariaId)
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

// --- FUNÇÕES DE APOIO ---

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

  // **ORDEM CORRIGIDA**
  // 1. Primeiro, cria o perfil do usuário para que as regras de segurança funcionem.
  const newUserDoc = await createUserProfile(firebaseUser, {
    barbeariaId: targetBarbeariaId,
    nome: firebaseUser.displayName || 'Novo Usuário',
  })

  // 2. Depois, popula a barbearia com os dados iniciais.
  await createInitialTenantData(db, targetBarbeariaId)

  return newUserDoc
}

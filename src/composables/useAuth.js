// ARQUIVO: src/composables/useAuth.js (VERSÃO CORRIGIDA)

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
import { doc, getDoc, setDoc, collection, Timestamp, query, where, getDocs } from 'firebase/firestore'
import { db } from '@/firebase'
import { useRouter } from 'vue-router'
import { createInitialTenantData } from '@/firebase/tenantSetup'
import { slugify } from '@/utils/slugify'

// --- ESTADO REATIVO GLOBAL ---
export const user = ref(null)
export const userData = ref(null)
export const barbeariaInfo = ref(null)
export const loading = ref(true)
export const error = ref(null) // NOVO: Para capturar erros

// --- FUNÇÕES DE APOIO (HELPER) ---

async function loadBarbeariaInfo(barbeariaId) {
  if (!barbeariaId) return null
  try {
    const snap = await getDoc(doc(db, 'barbearias', barbeariaId))
    return snap.exists() ? { id: snap.id, ...snap.data() } : null
  } catch (err) {
    console.error('Erro ao carregar barbearia:', err)
    throw err
  }
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
  const newBarbeariaRef = doc(collection(db, 'barbearias'));
  const newBarbeariaId = newBarbeariaRef.id;

  // --- Geração de Slug Único ---
  const baseSlug = slugify(nomeBarbearia);
  let finalSlug = baseSlug;
  let counter = 1;
  while (true) {
    const slugQuery = query(collection(db, 'barbearias'), where('slug', '==', finalSlug));
    const slugSnapshot = await getDocs(slugQuery);
    if (slugSnapshot.empty) {
      break; // Slug é único
    }
    // Se não for único, tenta um novo com um número
    counter++;
    finalSlug = `${baseSlug}-${counter}`;
  }
  console.log(`[SLUG] Slug final definido como: ${finalSlug}`);
  // --------------------------

  // Calcula as datas do trial
  const trialInicio = Timestamp.now();
  const trialFimDate = new Date();
  trialFimDate.setDate(trialFimDate.getDate() + 30); // Adiciona 30 dias
  const trialFim = Timestamp.fromDate(trialFimDate);

  await setDoc(newBarbeariaRef, {
    nome: nomeBarbearia,
    slug: finalSlug, // <-- SALVA O SLUG
    criadoEm: new Date(),
    ownerId: getAuth().currentUser.uid, // Guarda quem é o dono

    // --- NOVOS CAMPOS DE ASSINATURA ---
    statusAssinatura: 'trialing', 
    trialInicio: trialInicio,
    trialFim: trialFim,
    stripeCustomerId: null, 
    stripeSubscriptionId: null, 
    // ------------------------------------

    configuracoes: {
      permitirAgendamentoOnline: true,
      intervaloAgendamento: 30
    }
  });
  return newBarbeariaId;
}

async function checkAndCreateUserOnFirstLogin(firebaseUser) {
  let targetBarbeariaId

  const barbeariaPrincipalRef = doc(db, 'barbearias', '01')
  const barbeariaPrincipalSnap = await getDoc(barbeariaPrincipalRef)

  if (!barbeariaPrincipalSnap.exists()) {
    targetBarbeariaId = '01'

    // Calcula as datas do trial
    const trialInicio = Timestamp.now();
    const trialFimDate = new Date();
    trialFimDate.setDate(trialFimDate.getDate() + 30); // Adiciona 30 dias
    const trialFim = Timestamp.fromDate(trialFimDate);

    await setDoc(barbeariaPrincipalRef, { 
      nome: 'Barbearia Principal', 
      criadoEm: new Date(),
      ownerId: getAuth().currentUser.uid, // Guarda quem é o dono

      // --- NOVOS CAMPOS DE ASSINATURA ---
      statusAssinatura: 'trialing', // 'trialing', 'active', 'canceled'
      trialInicio: trialInicio,
      trialFim: trialFim,
      stripeCustomerId: null, // Será preenchido após o primeiro pagamento
      stripeSubscriptionId: null, // ID da assinatura recorrente
      // ------------------------------------

      configuracoes: {
        permitirAgendamentoOnline: true,
        intervaloAgendamento: 30
      }
    })
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
  error.value = null // Reset error state

  try {
    console.log('[AUTH STATE CHANGED] Usuário Firebase:', firebaseUser?.uid || 'nenhum')

    if (firebaseUser) {
      const userDocRef = doc(db, 'usuarios', firebaseUser.uid)
      const userDoc = await getDoc(userDocRef)

      if (userDoc.exists()) {
        console.log('[USER DOC ENCONTRADO]', userDoc.data())
        const uData = userDoc.data()
        userData.value = uData

        // CORREÇÃO: Aguardar carregar barbearia antes de definir como carregado
        if (uData.barbeariaId) {
          const barbearia = await loadBarbeariaInfo(uData.barbeariaId)
          console.log('[BARBEARIA CARREGADA]', barbearia)
          barbeariaInfo.value = barbearia

          // VALIDAÇÃO: Se barbearia não existe, limpar dados
          if (!barbearia) {
            console.error('[BARBEARIA NÃO ENCONTRADA] ID:', uData.barbeariaId)
            error.value = 'Barbearia não encontrada'
          }
        } else {
          console.error('[USER SEM BARBEARIA ID]')
          error.value = 'Usuário sem barbearia associada'
        }
      } else {
        console.log('[USER DOC NÃO EXISTE] UID:', firebaseUser.uid)

        // Adicionado para evitar erro de perfil não encontrado em novos cadastros
        const isRecentCreation = (new Date().getTime() - new Date(firebaseUser.metadata.creationTime).getTime()) < 10000; // 10 segundos

        if (isRecentCreation && firebaseUser.providerData[0]?.providerId !== 'google.com') {
            console.warn('[AUTH] Documento do usuário não encontrado para um usuário recém-criado. O estado local deve ser preenchido pelo registerWithEmail. Ignorando o erro por enquanto.');
            // Intencionalmente não faz nada, confia no estado local populado pelo registerWithEmail
        } else if (firebaseUser.providerData[0]?.providerId === 'google.com') {
          console.log('[CRIANDO PERFIL GOOGLE LOGIN]')
          const newUserDoc = await checkAndCreateUserOnFirstLogin(firebaseUser)
          console.log('[NOVO USER DOC CRIADO]', newUserDoc)

          userData.value = newUserDoc
          barbeariaInfo.value = await loadBarbeariaInfo(newUserDoc.barbeariaId)
        } else {
          error.value = 'Perfil de usuário não encontrado'
        }
      }

      user.value = firebaseUser
    } else {
      console.log('[LOGOUT] Usuário saiu')
      user.value = null
      userData.value = null
      barbeariaInfo.value = null
      error.value = null
    }
  } catch (e) {
    console.error('Erro crítico no onAuthStateChanged:', e)
    error.value = 'Erro ao carregar dados do usuário'

    // Em caso de erro, limpar estados para evitar inconsistência
    user.value = firebaseUser // Manter usuário Firebase
    userData.value = null
    barbeariaInfo.value = null
    // loading.value = false // Definir loading como false em caso de erro - REMOVIDO DAQUI
  } finally { // ADICIONADO FINALLY
    loading.value = false // Definir loading como false sempre
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

      const newUserProfileData = await createUserProfile(firebaseUser, {
        barbeariaId: newBarbeariaId,
        nome: nomeProprietario,
      })
      console.log('[REGISTER] Perfil do usuário salvo:', firebaseUser.uid)

      await createInitialTenantData(db, newBarbeariaId)
      console.log('[REGISTER] Dados iniciais populados para barbearia:', newBarbeariaId)

      // CORREÇÃO CRÍTICA: Atualiza o estado manualmente para evitar race condition
      // O onAuthStateChanged pode demorar ou rodar antes do BD ser escrito.
      console.log('[REGISTER] Atualizando estado local manualmente.')
      user.value = firebaseUser
      userData.value = newUserProfileData
      barbeariaInfo.value = await loadBarbeariaInfo(newBarbeariaId)
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

  // NOVO: Computed para verificar se todos os dados estão prontos
  const isReady = computed(() => {
    return (
      !loading.value && !!user.value && !!userData.value && !!barbeariaInfo.value && !error.value
    )
  })

  return {
    user: readonly(user),
    userData: readonly(userData),
    barbeariaId: computed(() => userData.value?.barbeariaId),
    barbeariaInfo: readonly(barbeariaInfo),
    loading: readonly(loading),
    error: readonly(error), // NOVO
    isAuthenticated: computed(() => !!user.value),
    isReady, // NOVO: Estado completo pronto
    loginWithGoogle,
    registerWithEmail,
    loginWithEmail,
    logout,
    sendPasswordReset,
  }
}
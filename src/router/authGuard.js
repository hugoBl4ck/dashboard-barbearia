// router/authGuard.js
import { watch } from 'vue'
import { useAuth } from '@/composables/useAuth'
 
/**
 * Aguarda a conclusão da verificação inicial de autenticação.
 * @returns {Promise<void>}
 */
const awaitAuthLoaded = () => {
  const { loading } = useAuth()
  if (!loading.value) {
    return Promise.resolve()
  }
  return new Promise(resolve => {
    const unwatch = watch(loading, (newLoading) => {
      if (!newLoading) {
        unwatch()
        resolve()
      }
    })
  })
}

export const authGuard = async (to, from, next) => {
  await awaitAuthLoaded()
  const { user, barbeariaId } = useAuth()

  // Verificar se usuário está autenticado
  if (!user.value) {
    // Redireciona para o login, guardando a página que o usuário tentou acessar
    next({ name: 'Login', query: { redirect: to.fullPath } })
    return
  }

  // Verificar se tem barbearia associada
  if (!barbeariaId.value) {
    console.error('Usuário autenticado mas sem barbearia associada.')
    // TODO: Redirecionar para uma página de "criar barbearia" ou mostrar um erro.
    next('/login') // Por enquanto, volta para o login
    return
  }

  next()
}

export const guestGuard = async (to, from, next) => {
  await awaitAuthLoaded()
  const { user } = useAuth()

  if (user.value) {
    next('/dashboard')
  } else {
    next()
  }
}
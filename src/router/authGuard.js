// router/authGuard.js
import { watch } from 'vue'
import { useAuth } from '@/composables/useAuth'

export const authGuard = async (to, from, next) => {
  const { user, loading, barbeariaId } = useAuth()
  
  // Aguardar carregamento da autenticação
  if (loading.value) {
    // Aguardar um pouco para o loading terminar
    await new Promise(resolve => {
      const unwatch = watch(loading, (newLoading) => {
        if (!newLoading) {
          unwatch()
          resolve()
        }
      })
    })
  }

  // Verificar se usuário está autenticado
  if (!user.value) {
    next('/login')
    return
  }

  // Verificar se tem barbearia associada
  if (!barbeariaId.value) {
    console.error('Usuário sem barbearia associada')
    next('/login')
    return
  }

  next()
}

export const guestGuard = (to, from, next) => {
  const { user } = useAuth()
  
  if (user.value) {
    next('/dashboard')
    return
  }
  
  next()
}
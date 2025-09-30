<template>
  <div class="billing-container">
    <h1>Assinatura</h1>
    <p>Seu período de teste acabou. Escolha um plano para continuar a usar todos os recursos.</p>

    <div class="plan">
      <h2>Plano Profissional</h2>
      <p class="price">R$ 49,90/mês</p>
      <ul>
        <li>✅ Agendamentos Ilimitados</li>
        <li>✅ Gestão de Clientes</li>
        <li>✅ Relatórios e Analytics</li>
        <li>✅ Suporte Prioritário</li>
      </ul>
      <button @click="redirectToCheckout" :disabled="loading">
        {{ loading ? 'Carregando...' : 'Assinar Agora' }}
      </button>
    </div>

    <div v-if="error" class="error-message">
      <p>Ocorreu um erro:</p>
      <p>{{ error }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { loadStripe } from '@stripe/stripe-js'
import { useAuth } from '@/composables/useAuth'

// Esta linha carrega o Stripe com a sua chave publicável do arquivo .env
// O ESLint reclamava porque a variável não era usada. Agora será.
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY)

const { barbeariaId } = useAuth()
const loading = ref(false)
const error = ref(null)

const redirectToCheckout = async () => {
  loading.value = true
  error.value = null

  if (!barbeariaId.value) {
    error.value = 'ID da barbearia não encontrado. Faça login novamente para continuar.'
    loading.value = false
    return
  }

  try {
    // 1. Chamar nossa API para criar a sessão de checkout no Stripe
    const response = await fetch('/api/create-checkout-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        // ⚠️ MUITO IMPORTANTE: Substitua pelo ID do Preço real do seu produto no Stripe.
        priceId: 'price_1Ppgx3G1hJ4n2deFBg5dJ1eE',
        barbeariaId: barbeariaId.value,
      }),
    })

    const session = await response.json()

    if (!response.ok) {
      throw new Error(session.error?.message || 'Falha ao comunicar com o servidor de pagamento.')
    }

    // 2. Usar a 'stripePromise' para redirecionar o cliente para o pagamento
    const stripe = await stripePromise
    const { error: stripeError } = await stripe.redirectToCheckout({ sessionId: session.sessionId })

    // Se o redirecionamento falhar, captura o erro
    if (stripeError) {
      throw stripeError
    }
  } catch (e) {
    console.error('Erro ao redirecionar para o checkout:', e)
    error.value = e.message
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.billing-container {
  max-width: 600px;
  margin: 40px auto;
  padding: 2rem;
  background-color: #f9f9f9;
  border-radius: 8px;
  text-align: center;
}

.plan {
  border: 1px solid #e0e0e0;
  padding: 1.5rem;
  border-radius: 8px;
  margin-top: 2rem;
  background-color: white;
}

.price {
  font-size: 2rem;
  font-weight: bold;
  color: #333;
  margin: 0.5rem 0;
}

ul {
  list-style: none;
  padding: 0;
  margin: 1.5rem 0;
}

li {
  margin-bottom: 0.5rem;
}

button {
  background-color: #007bff;
  color: white;
  border: none;
  padding: 1rem 2rem;
  border-radius: 5px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.3s;
}

button:disabled {
  background-color: #a0a0a0;
  cursor: not-allowed;
}

button:hover:not(:disabled) {
  background-color: #0056b3;
}

.error-message {
  margin-top: 1.5rem;
  color: #d93025;
  background-color: #fbe9e7;
  padding: 1rem;
  border-radius: 8px;
}
</style>

<template>
  <v-container class="fill-height">
    <v-row justify="center" align="center">
      <v-col cols="12" md="8" lg="6">
        <v-card class="pa-md-4" elevation="2">
          <v-card-title class="text-center pt-6">
            <v-icon size="48" color="primary" class="mb-4">mdi-rocket-launch</v-icon>
            <h1 class="text-h4 font-weight-bold">Plano Profissional</h1>
          </v-card-title>
          <v-card-subtitle class="text-center text-h6 font-weight-regular text-medium-emphasis">
            Acesse todos os recursos para levar sua barbearia ao próximo nível.
          </v-card-subtitle>

          <v-card-text class="py-6">
            <v-list lines="one">
              <v-list-item
                v-for="feature in features"
                :key="feature.text"
                :prepend-icon="feature.icon"
                :title="feature.text"
              ></v-list-item>
            </v-list>
          </v-card-text>

          <v-divider></v-divider>

          <div class="text-center pa-6">
            <p class="text-h4 font-weight-bold">
              R$ 49,90
              <span class="text-h6 font-weight-light text-medium-emphasis">/mês</span>
            </p>
          </div>

          <v-card-actions class="pa-6 pt-0">
            <v-btn
              color="primary"
              size="large"
              block
              variant="flat"
              @click="redirectToCheckout"
              :loading="loading"
            >
              Assinar Agora e Desbloquear Tudo
            </v-btn>
          </v-card-actions>

          <v-alert v-if="error" type="error" variant="tonal" class="ma-4">
            <strong>Ocorreu um erro:</strong> {{ error }}
          </v-alert>
        </v-card>

        <div class="text-center mt-4">
          <p class="text-caption text-medium-emphasis">
            Pagamentos seguros processados pela Stripe.
          </p>
        </div>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref } from 'vue'
import { loadStripe } from '@stripe/stripe-js'
import { useAuth } from '@/composables/useAuth'

// Lista de benefícios do plano
const features = [
  { text: 'Agendamentos Online Ilimitados', icon: 'mdi-check-circle-outline' },
  { text: 'Cadastro de Clientes e Serviços', icon: 'mdi-check-circle-outline' },
  { text: 'Relatórios de Faturamento', icon: 'mdi-check-circle-outline' },
  { text: 'Sua Própria Landing Page', icon: 'mdi-check-circle-outline' },
  { text: 'Suporte Prioritário', icon: 'mdi-check-circle-outline' },
]

// Carrega a instância do Stripe com a chave publicável
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
    // 1. Chamar a API para criar a sessão de checkout no Stripe
    const response = await fetch('/api/create-checkout-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        // ⚠️ MUITO IMPORTANTE: Substitua pelo ID do Preço real do seu produto no Stripe.
        priceId: 'price_1SAWXe0EW5UDH4CWX7Krt61i',
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
/* Estilos podem ser adicionados aqui se necessário */
</style>

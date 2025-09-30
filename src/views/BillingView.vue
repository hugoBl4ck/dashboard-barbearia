<template>
  <v-container class="fill-height">
    <v-row justify="center" align="center">
      <v-col cols="12" md="8" lg="6">
        <!-- Skeleton Loader para o estado de carregamento -->
        <v-skeleton-loader v-if="planLoading" type="card-avatar, article, actions"></v-skeleton-loader>

        <!-- Card do Plano (mostrado após o carregamento) -->
        <v-card v-else-if="plan" class="pa-md-4" elevation="2">
          <v-card-title class="text-center pt-6">
            <v-icon size="48" color="primary" class="mb-4">mdi-rocket-launch</v-icon>
            <h1 class="text-h4 font-weight-bold">{{ plan.productName }}</h1>
          </v-card-title>
          <v-card-subtitle class="text-center text-h6 font-weight-regular text-medium-emphasis">
            {{ plan.productDescription || 'Acesse todos os recursos para levar sua barbearia ao próximo nível.' }}
          </v-card-subtitle>

          <v-card-text class="py-6">
            <v-list lines="one">
              <v-list-item
                v-for="feature in plan.features"
                :key="feature"
                prepend-icon="mdi-check-circle-outline"
                :title="feature"
              ></v-list-item>
            </v-list>
          </v-card-text>

          <v-divider></v-divider>

          <div class="text-center pa-6">
            <p class="text-h4 font-weight-bold">
              {{ formatCurrency(plan.priceAmount, plan.priceCurrency) }}
              <span class="text-h6 font-weight-light text-medium-emphasis">/{{ plan.priceInterval === 'month' ? 'mês' : 'ano' }}</span>
            </p>
          </div>

          <v-card-actions class="pa-6 pt-0">
            <v-btn
              color="primary"
              size="large"
              block
              variant="flat"
              @click="redirectToCheckout"
              :loading="checkoutLoading"
            >
              Assinar Agora e Desbloquear Tudo
            </v-btn>
          </v-card-actions>
        </v-card>

        <!-- Alerta de Erro -->
        <v-alert v-if="error" type="error" variant="tonal" class="mt-4">
          <strong>Ocorreu um erro:</strong> {{ error }}
        </v-alert>

        <div class="text-center mt-4">
          <p class="text-caption text-medium-emphasis">Pagamentos seguros processados pela Stripe.</p>
        </div>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { loadStripe } from '@stripe/stripe-js';
import { useAuth } from '@/composables/useAuth';

// --- CONFIGURAÇÃO --- 
// Este é o ID do preço que queremos exibir e vender.
// Ele é usado para buscar os detalhes do plano e para iniciar o checkout.
const PRICE_ID = 'price_1Ppgx3G1hJ4n2deFBg5dJ1eE'; // ⚠️ Substitua pelo seu Price ID real

// --- ESTADO --- 
const plan = ref(null);
const planLoading = ref(true);
const checkoutLoading = ref(false);
const error = ref(null);

const { barbeariaId } = useAuth();
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

// --- FUNÇÕES --- 

// Formata o valor para a moeda correta (ex: R$ 49,90)
const formatCurrency = (amount, currency) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: currency,
  }).format(amount);
};

// Busca as informações do plano da nossa API
const fetchPlanInfo = async () => {
  planLoading.value = true;
  error.value = null;
  try {
    const response = await fetch(`/api/get-plan-info?priceId=${PRICE_ID}`);
    if (!response.ok) {
      const errData = await response.json();
      throw new Error(errData.error || 'Não foi possível carregar os detalhes do plano.');
    }
    plan.value = await response.json();
  } catch (e) {
    console.error('Erro ao buscar informações do plano:', e);
    error.value = e.message;
  } finally {
    planLoading.value = false;
  }
};

// Redireciona para o checkout do Stripe
const redirectToCheckout = async () => {
  checkoutLoading.value = true;
  error.value = null;

  if (!barbeariaId.value) {
    error.value = 'ID da barbearia não encontrado. Faça login novamente para continuar.';
    checkoutLoading.value = false;
    return;
  }

  try {
    const response = await fetch('/api/create-checkout-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        priceId: PRICE_ID,
        barbeariaId: barbeariaId.value,
      }),
    });

    const session = await response.json();
    if (!response.ok) {
      throw new Error(session.error?.message || 'Falha ao comunicar com o servidor de pagamento.');
    }

    const stripe = await stripePromise;
    const { error: stripeError } = await stripe.redirectToCheckout({ sessionId: session.sessionId });

    if (stripeError) {
      throw stripeError;
    }
  } catch (e) {
    console.error('Erro ao redirecionar para o checkout:', e);
    error.value = e.message;
  } finally {
    checkoutLoading.value = false;
  }
};

// --- LIFECYCLE HOOK ---
// Ao montar o componente, busca as informações do plano
onMounted(() => {
  fetchPlanInfo();
});
</script>

<style scoped>
/* Estilos podem ser adicionados aqui se necessário */
</style>
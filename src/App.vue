<template>
  <v-app>
    <!-- Barra de Navegação Principal -->
    <v-app-bar app color="primary" dark>
      <v-toolbar-title>Dashboard Barbearia</v-toolbar-title>
      <v-spacer></v-spacer>
      <NotificationBell />
    </v-app-bar>

    <!-- Banner do Período de Teste -->
    <v-app-bar
      v-if="showTrialBanner"
      color="warning"
      density="compact"
      class="text-center"
    >
      <v-container class="d-flex align-center justify-center py-0">
        <span class="text-body-2">
          <template v-if="trialDaysRemaining > 0">
            Você tem <strong>{{ trialDaysRemaining }} {{ trialDaysRemaining === 1 ? 'dia restante' : 'dias restantes' }}</strong> de teste.
          </template>
          <template v-else>
            Seu período de teste expirou!
          </template>
        </span>
        <v-btn to="/billing" color="white" variant="outlined" size="small" class="ml-4">Fazer Upgrade</v-btn>
      </v-container>
    </v-app-bar>

    <v-main class="d-flex justify-center align-center">
      <!-- Se estiver carregando, mostra um spinner -->
      <div v-if="loading" class="text-center">
        <v-progress-circular
          indeterminate
          color="primary"
          size="64"
        ></v-progress-circular>
        <p class="mt-4">Carregando...</p>
      </div>
      
      <!-- Se não estiver carregando, mostra o conteúdo da rota -->
      <router-view v-else />
    </v-main>

    <!-- Botão Voltar Flutuante para Mobile -->
    <v-btn
      v-if="showBackButton"
      icon
      color="primary"
      position="fixed"
      location="bottom left"
      class="ma-4"
      elevation="8"
      @click="goBack"
    >
      <v-icon>mdi-arrow-left</v-icon>
    </v-btn>
  </v-app>
</template>

<script setup>
import { computed, watch } from 'vue';
import { useAuth } from '@/composables/useAuth';
import { useDisplay } from 'vuetify';
import { useRoute, useRouter } from 'vue-router';
import NotificationBell from '@/components/NotificationBell.vue';
import { getFirestore, collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';

// Pega o estado de loading do nosso composable de autenticação
const { loading, barbeariaInfo, isReady } = useAuth();

// Hooks para responsividade e roteamento
const { mobile } = useDisplay();
const route = useRoute();
const router = useRouter();

// --- LÓGICA DE NOTIFICAÇÃO EM TEMPO REAL ---

// Função para disparar a notificação visual e sonora
const triggerNotification = (notification) => {
  // Toca o som (a função vem do script em index.html)
  if (typeof generateAndPlaySound === 'function') {
    generateAndPlaySound();
  } else {
    console.warn('Função generateAndPlaySound não encontrada.');
  }

  // Exibe a notificação do navegador
  if (!('Notification' in window)) {
    alert('Este navegador não suporta notificações de desktop');
    return;
  }

  const showNotification = () => {
    new Notification('Novo Agendamento!', {
      body: notification.message,
      icon: '/favicon.ico'
    });
  };

  if (Notification.permission === 'granted') {
    showNotification();
  } else if (Notification.permission !== 'denied') {
    Notification.requestPermission().then((permission) => {
      if (permission === 'granted') {
        showNotification();
      }
    });
  }
};

// Observa quando a autenticação está pronta e o ID da barbearia está disponível
watch(isReady, (ready) => {
  if (ready && barbeariaInfo.value?.uid) {
    const db = getFirestore();
    const notificationsRef = collection(db, 'barbearias', barbeariaInfo.value.uid, 'notifications');
    
    // Query para pegar apenas notificações criadas a partir do momento que o app carrega
    const q = query(
      notificationsRef,
      where('timestamp', '>', new Date().toISOString()),
      orderBy('timestamp', 'desc')
    );

    onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          console.log('Nova notificação recebida: ', change.doc.data());
          triggerNotification(change.doc.data());
        }
      });
    }, (error) => {
      console.error('Erro ao escutar por notificações:', error);
    });
  }
}, { immediate: true });


// --- LÓGICA EXISTENTE DO COMPONENTE ---

// Lógica para o banner de trial
const trialDaysRemaining = computed(() => {
  if (!isReady.value || barbeariaInfo.value?.statusAssinatura !== 'trialing') {
    return null;
  }
  const trialEndDate = barbeariaInfo.value.trialFim?.toDate();
  if (!trialEndDate) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const diffTime = trialEndDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays < 0 ? 0 : diffDays;
});

const showTrialBanner = computed(() => {
  return trialDaysRemaining.value !== null && route.name !== 'Login';
});

// Condições para exibir o botão de voltar
const showBackButton = computed(() => {
  const nonBackButtonRoutes = ['home', 'Login', 'ClientLandingPage'];
  return mobile.value && !nonBackButtonRoutes.includes(route.name);
});

const goBack = () => {
  router.back();
};
</script>

<style>
/* Estilos globais da aplicação */
* {
  box-sizing: border-box;
}

html, body {
  margin: 0;
  padding: 0;
  font-family: 'Poppins', 'Roboto', sans-serif;
}

/* Remover scroll horizontal indesejado */
html, body, #app {
  overflow-x: hidden;
}

/* Estilos para o Vuetify */
.v-application {
  font-family: 'Poppins', 'Roboto', sans-serif !important;
}

/* Scrollbar personalizada */
::-webkit-scrollbar {
  width: 8px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
}

::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

/* Tema escuro - scrollbar */
.v-theme--dark ::-webkit-scrollbar-track {
  background: #2c2c2c;
}

.v-theme--dark ::-webkit-scrollbar-thumb {
  background: #555;
}

.v-theme--dark ::-webkit-scrollbar-thumb:hover {
  background: #777;
}

/* Transições suaves para mudanças de tema */
* {
  transition: background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease;
}

/* Fix para inputs em Safari */
input, textarea {
  -webkit-appearance: none;
  appearance: none;
  border-radius: 0;
}

/* Melhorar legibilidade de textos pequenos */
.text-caption, .v-card-subtitle {
  line-height: 1.4 !important;
}

/* Espaçamento consistente para cards */
.v-card {
  overflow: hidden;
}

/* Loading states mais suaves */
.v-progress-circular {
  transition: all 0.3s ease;
}

/* Botões com melhor feedback visual */
.v-btn {
  transition: all 0.2s ease !important;
}

.v-btn:hover:not(.v-btn--disabled) {
  transform: translateY(-1px);
}

.v-btn:active:not(.v-btn--disabled) {
  transform: translateY(0);
}

/* Melhorar contraste dos placeholders */
::placeholder {
  opacity: 0.6;
}

/* Estilos para impressão */
@media print {
  .v-app-bar,
  .v-navigation-drawer,
  .v-btn,
  .no-print {
    display: none !important;
  }
  
  .v-main {
    padding: 0 !important;
  }
  
  .v-card {
    box-shadow: none !important;
    border: 1px solid #ddd !important;
  }
}

/* Responsividade global */
@media (max-width: 600px) {
  .v-card-title {
    font-size: 1.1rem !important;
  }
  
  .v-btn {
    min-width: auto !important;
  }
}

/* Acessibilidade - melhorar focus */
.v-btn:focus-visible,
.v-text-field:focus-within,
.v-select:focus-within {
  outline: 2px solid #1976d2;
  outline-offset: 2px;
}

/* Animações de entrada para elementos */
.fade-in {
  animation: fadeIn 0.5s ease-out;
}

.slide-up {
  animation: slideUp 0.6s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Estilos para o TypebotChat */
.typebot-container {
  z-index: 1000;
}

/* Fix para overflow em dispositivos móveis */
.v-overlay__content {
  max-height: 90vh;
  overflow-y: auto;
}
</style>
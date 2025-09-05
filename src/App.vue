<template>
  <v-app :theme="isDark ? 'dark' : 'light'">
    <!-- NAVEGAÇÃO LATERAL (Seu código, está perfeito) -->
    <v-navigation-drawer v-model="drawer">
      <v-list nav density="compact">
        <v-list-item 
          prepend-icon="mdi-view-dashboard-outline" 
          title="Agenda" 
          value="agenda" 
          to="/"
          exact
        ></v-list-item>
        
        <v-list-item 
          prepend-icon="mdi-account-group-outline" 
          title="Clientes" 
          value="clientes" 
          to="/clientes"
          exact
        ></v-list-item>

        <v-list-item 
          prepend-icon="mdi-chart-bar" 
          title="Análises" 
          value="analytics" 
          to="/analytics"
          exact
        ></v-list-item>
      </v-list>
    </v-navigation-drawer>

    <!-- BARRA SUPERIOR (Seu código, está perfeito) -->
    <v-app-bar flat class="border-b">
      <v-app-bar-nav-icon @click="drawer = !drawer"></v-app-bar-nav-icon>
      <v-toolbar-title class="font-weight-bold">Gestão Barbearia</v-toolbar-title>
      <v-spacer></v-spacer>
      <v-btn-toggle v-model="isDark" variant="outlined" divided density="compact">
        <v-btn :value="false" icon="mdi-white-balance-sunny"></v-btn>
        <v-btn :value="true" icon="mdi-weather-night"></v-btn>
      </v-btn-toggle>
    </v-app-bar>

    <!-- CONTEÚDO PRINCIPAL DA PÁGINA -->
    <v-main style="min-height: 100vh;" class="bg-surface-variant">
      <!-- O router-view agora "escuta" por um evento chamado 'toggle-chat'
           Quando a HomeView emitir esse evento, a função 'toggleChat' será chamada -->
      <router-view @toggle-chat="toggleChat" />
    </v-main>

    <!-- A ÚNICA instância do Typebot vive aqui, invisível por padrão -->
    <TypebotChat
      ref="typebotChatRef"
      typebot-id="my-typebot-lk5rehg" 
      @on-open="handleChatState(true)"
      @on-close="handleChatState(false)"
    />

    <!-- Snackbar para notificações (opcional, mas bom para UX) -->
    <v-snackbar v-model="showNotification" :timeout="3000" color="info" location="top right">
      <v-icon class="mr-2">mdi-robot-happy</v-icon>
      {{ notificationMessage }}
    </v-snackbar>
  </v-app>
</template>

<script setup>
import { ref } from 'vue';
import TypebotChat from '@/components/TypebotChat.vue';

// Estado do Layout
const drawer = ref(true); 
const isDark = ref(false);

// Estado e Referência para o Chat
const typebotChatRef = ref(null); // Uma "referência" para o nosso componente TypebotChat
const isChatOpen = ref(false);    // Guarda o estado atual do chat (aberto/fechado)

// Estado das Notificações
const showNotification = ref(false);
const notificationMessage = ref('');

// Função que é chamada pelo evento 'toggle-chat' da HomeView
// Ela usa a referência para chamar o método 'open' ou 'close' do componente filho
const toggleChat = () => {
  if (isChatOpen.value) {
    typebotChatRef.value?.close();
  } else {
    typebotChatRef.value?.open();
  }
};

// Função que é chamada pelos eventos 'onOpen' e 'onClose' do TypebotChat
// Ela atualiza nosso estado interno e mostra uma notificação
const handleChatState = (isOpen) => {
  isChatOpen.value = isOpen;
  notificationMessage.value = isOpen ? 'Assistente virtual iniciado! 🤖' : 'Chat finalizado 👋';
  showNotification.value = true;
};
</script>
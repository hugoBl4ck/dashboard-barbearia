<template>
  <v-app :theme="isDarkTheme ? 'dark' : 'light'">
    <!-- Banner do Período de Teste -->
    <v-app-bar
      v-if="showTrialBanner"
      color="warning"
      density="compact"
      class="text-center"
      app
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

    <!-- MENU LATERAL (DRAWER) -->
    <v-navigation-drawer v-if="showLayout" v-model="drawer" :rail="rail" @click="rail = false" app>
      <v-list-item
        :prepend-avatar="user?.photoURL"
        :title="user?.displayName || user?.email"
        :subtitle="barbeariaInfo?.nome"
        nav
      >
        <template v-slot:append>
          <v-btn variant="text" icon="mdi-chevron-left" @click.stop="rail = !rail"></v-btn>
        </template>
      </v-list-item>

      <v-divider></v-divider>

      <v-list density="compact" nav>
        <v-list-item
          prepend-icon="mdi-view-dashboard"
          title="Dashboard"
          value="dashboard"
          @click="navigateTo('home')"
        ></v-list-item>

        <v-list-item
          prepend-icon="mdi-calendar-check"
          title="Agendamentos"
          value="agendamentos"
          @click="navigateTo('agendamentos')"
        ></v-list-item>

        <v-list-item
          prepend-icon="mdi-account-group"
          title="Clientes"
          value="clientes"
          @click="navigateTo('clientes')"
        ></v-list-item>

        <v-list-item
          prepend-icon="mdi-scissors-cutting"
          title="Serviços"
          value="servicos"
          @click="navigateTo('servicos')"
        ></v-list-item>

        <v-list-item
          prepend-icon="mdi-clock-outline"
          title="Horários"
          value="horarios"
          @click="navigateTo('horarios')"
        ></v-list-item>

        <v-list-item
          prepend-icon="mdi-chart-line"
          title="Relatórios"
          value="relatorios"
          @click="navigateTo('relatorios')"
        ></v-list-item>

        <v-divider class="my-2"></v-divider>

        <v-list-item
          prepend-icon="mdi-web"
          title="Minha Landing Page"
          value="landing"
          @click="abrirLandingPage"
        ></v-list-item>

        <v-list-item
          prepend-icon="mdi-cog"
          title="Configurações"
          value="configuracoes"
          @click="navigateTo('configuracoes')"
        ></v-list-item>
      </v-list>

      <template v-slot:append>
        <div class="pa-2">
          <v-btn color="red" variant="outlined" block @click="logout" prepend-icon="mdi-logout">
            Sair
          </v-btn>
        </div>
      </template>
    </v-navigation-drawer>

    <!-- APP BAR -->
    <v-app-bar v-if="showLayout" color="primary" elevation="2" app>
      <v-app-bar-nav-icon
        @click="drawer = !drawer"
        v-if="!mdAndUp"
      ></v-app-bar-nav-icon>

      <v-toolbar-title>BarberApp</v-toolbar-title>

      <v-spacer></v-spacer>

      <v-btn icon @click="toggleTheme" class="mr-2">
        <v-icon>{{ isDarkTheme ? 'mdi-weather-night' : 'mdi-weather-sunny' }}</v-icon>
      </v-btn>

      <NotificationBell class="mr-2" />

      <v-menu>
        <template v-slot:activator="{ props }">
          <v-btn icon v-bind="props">
            <v-avatar size="36">
              <v-img v-if="user?.photoURL" :src="user.photoURL"></v-img>
              <v-icon v-else>mdi-account</v-icon>
            </v-avatar>
          </v-btn>
        </template>

        <v-list>
          <v-list-item>
            <v-list-item-title>{{ user?.displayName || user?.email }}</v-list-item-title>
            <v-list-item-subtitle>{{ barbeariaInfo?.nome }}</v-list-item-subtitle>
          </v-list-item>
          <v-divider></v-divider>
          <v-list-item @click="navigateTo('perfil')" prepend-icon="mdi-account-edit">
            <v-list-item-title>Meu Perfil</v-list-item-title>
          </v-list-item>
          <v-list-item @click="navigateTo('configuracoes')" prepend-icon="mdi-cog">
            <v-list-item-title>Configurações</v-list-item-title>
          </v-list-item>
          <v-list-item to="/billing" prepend-icon="mdi-credit-card-outline">
            <v-list-item-title>Assinatura</v-list-item-title>
          </v-list-item>
          <v-divider></v-divider>
          <v-list-item @click="logout" prepend-icon="mdi-logout">
            <v-list-item-title>Sair</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
    </v-app-bar>

    <v-main class="d-flex justify-center align-center">
      <div v-if="loading" class="text-center">
        <v-progress-circular
          indeterminate
          color="primary"
          size="64"
        ></v-progress-circular>
        <p class="mt-4">Carregando...</p>
      </div>
      <router-view v-else />
    </v-main>

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
import { ref, computed, onMounted } from 'vue';
import { useAuth } from '@/composables/useAuth';
import { useTheme, useDisplay } from 'vuetify';
import { useRoute, useRouter } from 'vue-router';
import NotificationBell from '@/components/NotificationBell.vue';

const { loading, barbeariaInfo, isReady, user, logout } = useAuth();
const { mobile, mdAndUp } = useDisplay();
const route = useRoute();
const router = useRouter();
const theme = useTheme();

const drawer = ref(mdAndUp.value);
const rail = ref(false);
const isDarkTheme = ref(false);

const showLayout = computed(() => route.name !== 'Login');

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

const showBackButton = computed(() => {
  const nonBackButtonRoutes = ['home', 'Login', 'ClientLandingPage'];
  return mobile.value && !nonBackButtonRoutes.includes(route.name);
});

const goBack = () => {
  router.back();
};

const toggleTheme = () => {
  isDarkTheme.value = !isDarkTheme.value;
  const newTheme = isDarkTheme.value ? 'dark' : 'light';
  theme.global.name.value = newTheme;
  localStorage.setItem('barberapp-theme', newTheme);
};

const navigateTo = (routeName) => {
  router.push({ name: routeName });
};

const abrirLandingPage = () => {
  const slug = barbeariaInfo.value?.slug;
  if (slug) {
    window.open(`/b/${slug}`, '_blank');
  } else {
    alert('Apelido da barbearia (slug) não encontrado.');
  }
};

onMounted(() => {
  const savedTheme = localStorage.getItem('barberapp-theme');
  if (savedTheme) {
    isDarkTheme.value = savedTheme === 'dark';
    theme.global.name.value = savedTheme;
  }
});
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
<template>
  <v-app :theme="isDark ? 'dark' : 'light'">
    <!-- NAVEGAÇÃO LATERAL -->
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

    <!-- BARRA SUPERIOR -->
    <v-app-bar flat class="border-b">
      <!-- O botão "hambúrguer" para abrir/fechar em telas pequenas -->
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
      <router-view />
    </v-main>
  </v-app>
</template>

<script setup>
import { ref } from 'vue';
// Controla a visibilidade da navegação lateral
const drawer = ref(true); 
// Controla o tema dark/light
const isDark = ref(false);
</script>
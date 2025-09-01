<!-- ARQUIVO: src/App.vue -->
<template>
  <v-app :theme="isDark ? 'dark' : 'light'">
    <v-navigation-drawer v-model="drawer" app>
      <v-list nav>
        <v-list-item 
          prepend-icon="mdi-calendar-clock" 
          title="Agenda" 
          value="agenda" 
          to="/"
        ></v-list-item>
        
        <v-list-item 
          prepend-icon="mdi-account-group" 
          title="Clientes" 
          value="clientes" 
          to="/clientes"
        ></v-list-item>

        <!-- ADICIONE ESTE BLOCO -->
        <v-list-item 
          prepend-icon="mdi-chart-bar" 
          title="Análises" 
          value="analytics" 
          to="/analytics"
        ></v-list-item>
        <!-- FIM DO BLOCO ADICIONADO -->

      </v-list>
    </v-navigation-drawer>

    <!-- O resto do seu App.vue -->
    <v-app-bar app>
      <!-- ... -->
    </v-app-bar>

    <v-main>
      <router-view />
    </v-main>
  </v-app>
</template>

<script setup>
// ... seu script setup ...
</script>
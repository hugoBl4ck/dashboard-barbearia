<template>
  <router-view />
</template>

<script setup>
// App.vue simplificado - apenas renderiza as rotas
// Toda lógica foi movida para os composables e views específicas
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
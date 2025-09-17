<template>
  <v-container fluid class="fill-height d-flex justify-center align-center bg-grey-lighten-4">
    <v-card class="pa-8 text-center" max-width="400" elevation="4">
      <v-avatar image="/logo-barbearia.png" size="64" class="mb-4"></v-avatar>
      <h1 class="text-h5 font-weight-bold mb-2">Acesse seu Dashboard</h1>
      <p class="text-body-2 text-medium-emphasis mb-6">
        Faça o login com sua conta do Google para gerenciar seus agendamentos.
      </p>
      <v-btn
        @click="handleLogin"
        color="primary"
        size="large"
        block
        prepend-icon="mdi-google"
      >
        Entrar com Google
      </v-btn>
    </v-card>
  </v-container>
</template>

<script setup>
import { useAuth } from '@/composables/useAuth';
import { useRouter } from 'vue-router';
import { watch } from 'vue';

const { user, login } = useAuth();
const router = useRouter();

const handleLogin = () => {
  login();
};

// Observa a variável 'user'. Assim que ela for preenchida (após o login),
// redireciona o usuário para a página principal.
watch(user, (currentUser) => {
  if (currentUser) {
    router.push('/');
  }
});
</script>
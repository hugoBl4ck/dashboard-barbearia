<template>
  <v-container class="pa-md-6">
    <v-row justify="center">
      <v-col cols="12" md="10" lg="8">
        <!-- Card de Informações do Perfil -->
        <v-card class="mb-6">
          <v-card-title class="d-flex align-center">
            <v-icon start>mdi-account-circle</v-icon>
            <span class="text-h6">Meu Perfil</span>
          </v-card-title>
          <v-divider></v-divider>
          <v-list>
            <v-list-item>
              <v-list-item-title class="font-weight-bold">E-mail</v-list-item-title>
              <v-list-item-subtitle>{{ user?.email || 'Carregando...' }}</v-list-item-subtitle>
            </v-list-item>
            <v-list-item>
              <v-list-item-title class="font-weight-bold">ID de Usuário</v-list-item-title>
              <v-list-item-subtitle class="text-caption">{{ user?.uid || 'Carregando...' }}</v-list-item-subtitle>
            </v-list-item>
          </v-list>
        </v-card>

        <!-- Card da Zona de Perigo -->
        <v-card border color="error" variant="outlined">
          <v-card-title class="d-flex align-center">
            <v-icon start color="error">mdi-alert-octagon</v-icon>
            <span class="text-h6">Zona de Perigo</span>
          </v-card-title>
          <v-divider></v-divider>
          <v-card-text class="text-body-1">
            A exclusão da sua conta é uma ação **permanente e irreversível**. Todos os seus dados, incluindo informações da barbearia, clientes, agendamentos e serviços, serão apagados para sempre.
          </v-card-text>
          <v-card-actions class="pa-4">
            <v-spacer></v-spacer>
            <v-btn color="error" variant="flat" @click="dialogDelete = true">
              Excluir minha conta
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>

    <!-- Dialog de Confirmação de Exclusão -->
    <v-dialog v-model="dialogDelete" max-width="500px" persistent>
      <v-card>
        <v-card-title class="text-h5 text-center pa-4">Você tem certeza absoluta?</v-card-title>
        <v-card-text>
          <p class="mb-4">Esta ação não pode ser desfeita. Isso excluirá permanentemente sua conta e todos os dados associados.</p>
          <p>Para confirmar, digite <strong>EXCLUIR</strong> no campo abaixo:</p>
          <v-text-field
            v-model="deleteConfirmationText"
            label="Confirmar exclusão"
            variant="outlined"
            class="mt-4"
            autofocus
          ></v-text-field>
        </v-card-text>
        <v-card-actions class="pa-4">
          <v-btn text @click="dialogDelete = false" :disabled="loadingDelete">Cancelar</v-btn>
          <v-spacer></v-spacer>
          <v-btn
            color="error"
            variant="flat"
            @click="confirmDeleteAccount"
            :loading="loadingDelete"
            :disabled="!isDeleteConfirmed"
          >
            Eu entendo, excluir minha conta
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Snackbar para feedback -->
    <v-snackbar v-model="snackbar.show" :color="snackbar.color" location="top" :timeout="6000">
      {{ snackbar.message }}
      <template v-slot:actions>
        <v-btn variant="text" @click="snackbar.show = false">Fechar</v-btn>
      </template>
    </v-snackbar>
  </v-container>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useAuth } from '@/composables/useAuth';

// Composables
const { user, logout } = useAuth();

// Estado do Dialog
const dialogDelete = ref(false);
const deleteConfirmationText = ref('');
const loadingDelete = ref(false);

// Estado do Snackbar
const snackbar = ref({
  show: false,
  message: '',
  color: 'success',
});

// Computada para habilitar o botão de exclusão
const isDeleteConfirmed = computed(() => deleteConfirmationText.value === 'EXCLUIR');

// Função para confirmar e executar a exclusão
const confirmDeleteAccount = async () => {
  if (!isDeleteConfirmed.value) return;

  loadingDelete.value = true;

  try {
    // 1. Obter o token de ID do usuário atual
    const token = await user.value.getIdToken(true);

    // 2. Chamar a API de exclusão
    const response = await fetch('/api/delete-account', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Falha ao excluir a conta.');
    }

    // 3. Se a exclusão for bem-sucedida, mostrar mensagem e fazer logout
    snackbar.value = {
      show: true,
      message: 'Sua conta foi excluída com sucesso. Você será desconectado.',
      color: 'success',
    };

    // Aguarda um pouco para o usuário ler a mensagem e então faz o logout
    setTimeout(() => {
      logout();
    }, 4000);

  } catch (error) {
    console.error('Erro ao excluir conta:', error);
    snackbar.value = {
      show: true,
      message: error.message || 'Ocorreu um erro inesperado.',
      color: 'error',
    };
  } finally {
    loadingDelete.value = false;
    dialogDelete.value = false;
  }
};
</script>

<style scoped>
/* Estilos específicos do Perfil */
</style>
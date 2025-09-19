<template>
  <v-container class="pa-6">
    <v-row justify="center">
      <v-col cols="12" md="8">
        <v-card class="pa-8">
          <v-card-title class="text-h4 text-center font-weight-bold mb-6">Configurações da Barbearia</v-card-title>
          <v-form @submit.prevent="salvarConfiguracoes">
            <v-row>
              <!-- Coluna da Esquerda: Contatos e Endereço -->
              <v-col cols="12" md="6">
                <h3 class="text-h6 font-weight-medium mb-4">Informações de Contato</h3>
                <v-text-field
                  v-model="configuracoes.instagram"
                  label="Instagram"
                  prepend-inner-icon="mdi-instagram"
                  variant="outlined"
                  class="mb-4"
                  placeholder="@seuinstagram"
                ></v-text-field>
                <v-text-field
                  v-model="configuracoes.whatsapp"
                  label="WhatsApp"
                  prepend-inner-icon="mdi-whatsapp"
                  variant="outlined"
                  class="mb-4"
                  placeholder="(99) 99999-9999"
                ></v-text-field>
                <v-text-field
                  v-model="configuracoes.telefone"
                  label="Telefone Fixo (Opcional)"
                  prepend-inner-icon="mdi-phone"
                  variant="outlined"
                  class="mb-4"
                  placeholder="(99) 9999-9999"
                ></v-text-field>
                
                <h3 class="text-h6 font-weight-medium mb-4 mt-6">Endereço</h3>
                <v-text-field
                  v-model="configuracoes.endereco"
                  label="Endereço Completo"
                  prepend-inner-icon="mdi-map-marker"
                  variant="outlined"
                  placeholder="Rua, Número, Bairro, Cidade - Estado"
                ></v-text-field>
              </v-col>

              <!-- Coluna da Direita: Upload de Imagens -->
              <v-col cols="12" md="6">
                <h3 class="text-h6 font-weight-medium mb-4">Imagens</h3>
                <v-file-input
                  v-model="configuracoes.logo"
                  label="Logo da Barbearia"
                  prepend-icon="mdi-image-area"
                  variant="outlined"
                  accept="image/*"
                  class="mb-4"
                  show-size
                ></v-file-input>
                
                <v-file-input
                  v-model="configuracoes.gallery"
                  label="Fotos da Galeria"
                  prepend-icon="mdi-image-multiple"
                  variant="outlined"
                  accept="image/*"
                  multiple
                  chips
                  show-size
                ></v-file-input>
              </v-col>
            </v-row>

            <!-- Ações -->
            <v-row>
              <v-col cols="12" class="d-flex justify-space-between align-center mt-6">
                <v-btn variant="text" @click="voltar">
                  Voltar
                </v-btn>
                <v-btn color="primary" size="large" type="submit" :loading="salvando">
                  <v-icon left>mdi-content-save</v-icon>
                  Salvar Alterações
                </v-btn>
              </v-col>
            </v-row>
          </v-form>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const salvando = ref(false);

const configuracoes = ref({
  instagram: '',
  whatsapp: '',
  telefone: '',
  endereco: '',
  logo: [],
  gallery: [],
});

const salvarConfiguracoes = () => {
  salvando.value = true;
  console.log('Salvando configurações:', configuracoes.value);
  // Aqui viria a lógica para fazer o upload das imagens e salvar os dados no Firebase
  setTimeout(() => {
    salvando.value = false;
    // Exibir snackbar/notificação de sucesso
  }, 2000);
};

const voltar = () => {
  router.back();
};
</script>

<style scoped>
.v-card-title {
  color: #333;
}

.v-btn {
  text-transform: none;
  font-weight: 600;
}
</style>
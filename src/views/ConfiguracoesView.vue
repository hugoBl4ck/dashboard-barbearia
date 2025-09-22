<template>
  <v-container class="pa-6">
    <v-row justify="center">
      <v-col cols="12" md="10" lg="8">
        <v-card class="pa-4 pa-md-8">
          <v-card-title class="text-h4 text-center font-weight-bold mb-8">Configurações da Barbearia</v-card-title>
          
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
                <!-- Seção da Logo -->
                <h3 class="text-h6 font-weight-medium mb-4">Logo</h3>
                <div v-if="configuracoes.logoUrl" class="mb-4 text-center">
                  <v-img :src="configuracoes.logoUrl" aspect-ratio="1" class="mx-auto" width="150px" cover></v-img>
                </div>
                <v-file-input
                  v-model="newLogoFile"
                  label="Trocar logo"
                  prepend-icon="mdi-image-area"
                  variant="outlined"
                  accept="image/*"
                  class="mb-6"
                  show-size
                  clearable
                ></v-file-input>

                <!-- Seção da Galeria -->
                <h3 class="text-h6 font-weight-medium mb-4">Galeria de Fotos</h3>
                <v-row v-if="configuracoes.galleryUrls && configuracoes.galleryUrls.length > 0">
                  <v-col v-for="(url, index) in configuracoes.galleryUrls" :key="index" cols="6" sm="4">
                    <v-card class="image-container">
                      <v-img :src="url" aspect-ratio="1" cover></v-img>
                      <v-btn
                        icon="mdi-close-circle"
                        color="error"
                        size="x-small"
                        class="delete-btn"
                        @click="handleDeleteGalleryImage(url, index)"
                      ></v-btn>
                    </v-card>
                  </v-col>
                </v-row>
                <v-alert v-else type="info" variant="tonal" class="mb-4">Nenhuma foto na galeria.</v-alert>
                
                <v-file-input
                  v-model="newGalleryFiles"
                  label="Adicionar fotos à galeria"
                  prepend-icon="mdi-image-multiple"
                  variant="outlined"
                  accept="image/*"
                  multiple
                  chips
                  show-size
                  clearable
                ></v-file-input>
              </v-col>
            </v-row>

            <!-- Ações -->
            <v-row>
              <v-col cols="12" class="d-flex justify-end align-center mt-8">
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

    <!-- Snackbar para feedback -->
    <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="3000">
      {{ snackbar.message }}
    </v-snackbar>
  </v-container>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useAuth } from '@/composables/useAuth';
import { useTenant } from '@/composables/useTenant';

// Composables
const { barbeariaInfo } = useAuth();
const { uploadFile, deleteFileByUrl, updateBarbeariaConfig } = useTenant();

// Estado do componente
const salvando = ref(false);
const configuracoes = ref({
  instagram: '',
  whatsapp: '',
  telefone: '',
  endereco: '',
  logoUrl: '',       // Armazena a URL da logo existente
  galleryUrls: [],  // Armazena as URLs da galeria existente
});

// Estado para novos arquivos
const newLogoFile = ref([]); // v-file-input retorna um array
const newGalleryFiles = ref([]);

// Estado do Snackbar
const snackbar = ref({ show: false, message: '', color: 'success' });

// Carregar dados iniciais
onMounted(() => {
  if (barbeariaInfo.value && barbeariaInfo.value.configuracoes) {
    const existingConfig = barbeariaInfo.value.configuracoes;
    configuracoes.value = {
      ...configuracoes.value, // Mantém a estrutura
      ...existingConfig,      // Sobrescreve com dados do Firebase
      logoUrl: existingConfig.logoUrl || '',
      galleryUrls: existingConfig.galleryUrls || [],
    };
  }
});

// Função para mostrar feedback
const showSnackbar = (message, color = 'success') => {
  snackbar.value = { show: true, message, color };
};

// Função para salvar tudo
const salvarConfiguracoes = async () => {
  salvando.value = true;
  try {
    let finalLogoUrl = configuracoes.value.logoUrl;
    let finalGalleryUrls = [...configuracoes.value.galleryUrls];

    // 1. Upload da nova logo (se houver)
    if (newLogoFile.value.length > 0) {
      const file = newLogoFile.value[0];
      // Deleta a logo antiga antes de enviar a nova
      if (configuracoes.value.logoUrl) {
        await deleteFileByUrl(configuracoes.value.logoUrl);
      }
      finalLogoUrl = await uploadFile(file, 'logo');
    }

    // 2. Upload das novas imagens da galeria (se houver)
    if (newGalleryFiles.value.length > 0) {
      const uploadPromises = newGalleryFiles.value.map(file => uploadFile(file, 'gallery'));
      const newUrls = await Promise.all(uploadPromises);
      finalGalleryUrls.push(...newUrls);
    }

    // 3. Monta o objeto final de configurações
    const dataToSave = {
      instagram: configuracoes.value.instagram,
      whatsapp: configuracoes.value.whatsapp,
      telefone: configuracoes.value.telefone,
      endereco: configuracoes.value.endereco,
      logoUrl: finalLogoUrl,
      galleryUrls: finalGalleryUrls,
    };

    // 4. Atualiza o documento no Firestore
    await updateBarbeariaConfig(dataToSave);

    // 5. Atualiza o estado local
    configuracoes.value.logoUrl = finalLogoUrl;
    configuracoes.value.galleryUrls = finalGalleryUrls;
    newLogoFile.value = [];
    newGalleryFiles.value = [];

    showSnackbar('Configurações salvas com sucesso!');
  } catch (error) {
    console.error("Erro ao salvar configurações:", error);
    showSnackbar('Erro ao salvar: ' + error.message, 'error');
  } finally {
    salvando.value = false;
  }
};

// Função para deletar imagem da galeria
const handleDeleteGalleryImage = async (url, index) => {
  if (!confirm('Tem certeza que deseja excluir esta imagem?')) return;

  try {
    // 1. Deleta do Storage
    await deleteFileByUrl(url);

    // 2. Remove do array local
    const updatedGallery = [...configuracoes.value.galleryUrls];
    updatedGallery.splice(index, 1);
    
    // 3. Atualiza o Firestore
    await updateBarbeariaConfig({ galleryUrls: updatedGallery });

    // 4. Atualiza o estado local
    configuracoes.value.galleryUrls = updatedGallery;

    showSnackbar('Imagem excluída com sucesso!');
  } catch (error) {
    console.error("Erro ao excluir imagem:", error);
    showSnackbar('Erro ao excluir imagem: ' + error.message, 'error');
  }
};

</script>

<style scoped>
.image-container {
  position: relative;
}

.delete-btn {
  position: absolute;
  top: -8px;
  right: -8px;
  z-index: 10;
}

.v-card-title {
  color: #333;
}

.v-btn {
  text-transform: none;
  font-weight: 600;
}
</style>
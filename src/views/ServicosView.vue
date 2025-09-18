<script setup>
import { ref, onMounted, computed } from 'vue'
import { useTenant } from '@/composables/useTenant'

const tenant = useTenant()

// Estado do componente
const loading = ref(true)
const servicos = ref([])
const dialog = ref(false)
const saving = ref(false)
const snackbar = ref(false)
const snackbarMessage = ref('')

// Modelo para um serviço novo ou em edição
const editedItem = ref({
  id: null,
  nome: '',
  preco: 0,
  ativo: true,
})

const defaultItem = {
  id: null,
  nome: '',
  preco: 0,
  ativo: true,
}

// Título do diálogo (Novo ou Editar)
const formTitle = computed(() => (editedItem.value.id ? 'Editar Serviço' : 'Novo Serviço'))

// Cabeçalhos da tabela
const headers = [
  { title: 'Nome do Serviço', key: 'nome', sortable: true },
  {
    title: 'Preço',
    key: 'preco',
    sortable: true,
    align: 'end',
    formatter: (value) => tenant.formatCurrency(value),
  },
  { title: 'Ações', key: 'actions', sortable: false, align: 'end' },
]

// Funções
const loadServicos = async () => {
  loading.value = true
  try {
    // Passar `false` para incluir serviços inativos (soft-deleted)
    servicos.value = await tenant.fetchServicos(false)
  } catch (error) {
    console.error('Erro ao carregar serviços:', error)
    snackbarMessage.value = 'Erro ao carregar serviços.'
    snackbar.value = true
  } finally {
    loading.value = false
  }
}

const openEditDialog = (item) => {
  editedItem.value = { ...item }
  dialog.value = true
}

const openNewDialog = () => {
  editedItem.value = { ...defaultItem }
  dialog.value = true
}

const closeDialog = () => {
  dialog.value = false
}

const saveServico = async () => {
  saving.value = true
  try {
    if (editedItem.value.id) {
      // Editando um serviço existente
      const { id, ...dados } = editedItem.value
      await tenant.updateServico(id, dados)
      snackbarMessage.value = 'Serviço atualizado com sucesso!'
    } else {
      // Criando um novo serviço
      const { id, ...dados } = editedItem.value
      await tenant.createServico(dados)
      snackbarMessage.value = 'Serviço criado com sucesso!'
    }
    snackbar.value = true
    await loadServicos() // Recarrega a lista
    closeDialog()
  } catch (error) {
    console.error('Erro ao salvar serviço:', error)
    snackbarMessage.value = 'Erro ao salvar o serviço.'
    snackbar.value = true
  } finally {
    saving.value = false
  }
}

const deleteServico = async (item) => {
  // Confirmação antes de deletar
  if (confirm(`Tem certeza que deseja desativar o serviço "${item.nome}"?`)) {
    try {
      await tenant.deleteServico(item.id) // Soft delete
      snackbarMessage.value = 'Serviço desativado com sucesso!'
      snackbar.value = true
      await loadServicos()
    } catch (error) {
      console.error('Erro ao desativar serviço:', error)
      snackbarMessage.value = 'Erro ao desativar o serviço.'
      snackbar.value = true
    }
  }
}

// Carregar dados ao montar o componente
onMounted(loadServicos)
</script>

<template>
  <v-container>
    <v-card>
      <v-card-title class="d-flex align-center">
        <v-icon start>mdi-scissors-cutting</v-icon>
        Gerenciar Serviços
        <v-spacer></v-spacer>
        <v-btn color="primary" @click="openNewDialog" prepend-icon="mdi-plus">
          Novo Serviço
        </v-btn>
      </v-card-title>

      <v-data-table
        :headers="headers"
        :items="servicos"
        :loading="loading"
        loading-text="Carregando serviços..."
        no-data-text="Nenhum serviço encontrado."
        class="elevation-1"
      >
        <template v-slot:item.preco="{ item }">
          {{ tenant.formatCurrency(item.preco) }}
        </template>

        <template v-slot:item.actions="{ item }">
          <v-icon small class="mr-2" @click="openEditDialog(item)" title="Editar">
            mdi-pencil
          </v-icon>
          <v-icon v-if="item.ativo" small @click="deleteServico(item)" title="Desativar">
            mdi-delete
          </v-icon>
        </template>

        <template v-slot:item.nome="{ item }">
            <span :class="{ 'text-disabled': !item.ativo }">{{ item.nome }}</span>
            <v-chip v-if="!item.ativo" size="small" class="ml-2">Inativo</v-chip>
        </template>

      </v-data-table>
    </v-card>

    <!-- Diálogo para Novo/Editar Serviço -->
    <v-dialog v-model="dialog" max-width="500px" persistent>
      <v-card>
        <v-card-title>
          <span class="text-h5">{{ formTitle }}</span>
        </v-card-title>

        <v-card-text>
          <v-container>
            <v-row>
              <v-col cols="12">
                <v-text-field
                  v-model="editedItem.nome"
                  label="Nome do Serviço"
                  variant="outlined"
                  autofocus
                ></v-text-field>
              </v-col>
              <v-col cols="12">
                <v-text-field
                  v-model.number="editedItem.preco"
                  label="Preço"
                  type="number"
                  prefix="R$"
                  variant="outlined"
                ></v-text-field>
              </v-col>
            </v-row>
          </v-container>
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text @click="closeDialog"> Cancelar </v-btn>
          <v-btn color="primary" variant="flat" @click="saveServico" :loading="saving">
            Salvar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snackbar" :timeout="3000" location="top">
      {{ snackbarMessage }}
    </v-snackbar>
  </v-container>
</template>

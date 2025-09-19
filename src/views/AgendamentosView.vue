<template>
  <v-container fluid class="pa-6 page-container">
    <!-- CABEÇALHO -->
    <v-row>
      <v-col>
        <h1 class="text-h4 font-weight-bold">Agendamentos</h1>
        <p class="text-subtitle-1 text-medium-emphasis">Gerencie todos os agendamentos da barbearia</p>
      </v-col>
    </v-row>

    <!-- TABELA DE DADOS -->
    <v-row>
      <v-col>
        <v-card elevation="2" class="data-table-card">
          <v-card-title class="d-flex align-center pa-4">
            <v-icon class="mr-2">mdi-calendar-clock</v-icon>
            Lista de Agendamentos
            <v-spacer></v-spacer>
            <v-text-field
              v-model="search"
              label="Buscar agendamento..."
              variant="outlined"
              density="compact"
              hide-details
              prepend-inner-icon="mdi-magnify"
              style="max-width: 300px"
            ></v-text-field>
          </v-card-title>

          <v-divider></v-divider>

          <v-data-table
            :headers="headers"
            :items="allAppointments"
            :loading="loading"
            :search="search"
            item-value="id"
            class="elevation-0"
          >
            <!-- Slot para formatação da data/hora -->
            <template v-slot:item.DataHoraISO="{ item }">
              {{ new Date(item.DataHoraISO).toLocaleString('pt-BR') }}
            </template>

            <!-- Slot para formatação do status -->
            <template v-slot:item.Status="{ item }">
              <v-chip :color="getStatusColor(item.Status)" size="small" label>
                {{ item.Status }}
              </v-chip>
            </template>

            <!-- Slot para formatação do preço -->
            <template v-slot:item.preco="{ item }">
              <span class="font-weight-medium">{{
                item.preco.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
              }}</span>
            </template>

            <!-- Slot para ações (ex: editar/excluir) - Opcional, pode ser adicionado depois -->
            <template v-slot:item.actions="{ item }">
              <v-icon
                size="small"
                class="me-2"
                @click="editItem(item)"
              >
                mdi-pencil
              </v-icon>
              <v-icon
                size="small"
                @click="deleteItem(item)"
              >
                mdi-delete
              </v-icon>
            </template>
          </v-data-table>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<style scoped>
.page-container {
  font-family: 'Poppins', sans-serif;
}
.data-table-card {
  border-radius: 12px;
}
</style>

<script setup>
import { ref, watchEffect } from 'vue'
import { useTenant } from '@/composables/useTenant'

const loading = ref(true)
const allAppointments = ref([])
const search = ref('')

const { fetchAgendamentos, isTenantReady } = useTenant()

const headers = [
  { title: 'Data e Hora', key: 'DataHoraISO', align: 'start' },
  { title: 'Cliente', key: 'NomeCliente', align: 'start' },
  { title: 'Serviço', key: 'servicoNome', align: 'start' },
  { title: 'Preço', key: 'preco', align: 'end' },
  { title: 'Status', key: 'Status', align: 'center' },
  { title: 'Ações', key: 'actions', sortable: false, align: 'center' },
]

watchEffect(async () => {
  if (isTenantReady.value) {
    loading.value = true
    try {
      const agendamentos = await fetchAgendamentos()
      allAppointments.value = agendamentos
    } catch (error) {
      console.error('Erro ao carregar agendamentos na AgendamentosView:', error)
    } finally {
      loading.value = false
    }
  }
})

const getStatusColor = (status) => {
  if (status === 'Agendado') return 'blue'
  if (status === 'Concluído') return 'success'
  if (status === 'Cancelado') return 'red'
  return 'grey'
}

// Funções placeholder para ações, podem ser implementadas depois
const editItem = (item) => {
  console.log('Editar item:', item)
  alert('Funcionalidade de edição em desenvolvimento!')
}

const deleteItem = (item) => {
  console.log('Excluir item:', item)
  alert('Funcionalidade de exclusão em desenvolvimento!')
}
</script>
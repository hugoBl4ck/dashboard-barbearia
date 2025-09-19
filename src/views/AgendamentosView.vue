<template>
  <v-container fluid class="pa-6 page-container">
    <!-- CABEÇALHO E AÇÃO PRINCIPAL -->
    <v-row align="center">
      <v-col>
        <h1 class="text-h4 font-weight-bold">Agenda</h1>
        <p class="text-subtitle-1 text-medium-emphasis">Gestão de horários e serviços</p>
      </v-col>
      <v-col class="text-right">
        <v-btn
          color="primary"
          @click="dialogNovoAgendamento = true"
          prepend-icon="mdi-plus-circle"
          size="large"
          elevation="2"
        >
          Novo Agendamento
        </v-btn>
      </v-col>
    </v-row>

    <!-- FILTROS DE VISUALIZAÇÃO -->
    <v-row>
      <v-col>
        <v-tabs v-model="activeTab" color="primary" grow>
          <v-tab value="hoje">Hoje</v-tab>
          <v-tab value="amanha">Amanhã</v-tab>
          <v-tab value="proximos">Próximos 7 Dias</v-tab>
          <v-tab value="todos">Todos</v-tab>
        </v-tabs>
      </v-col>
    </v-row>

    <!-- LISTA DE AGENDAMENTOS -->
    <div v-if="loading" class="text-center pa-16">
      <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
    </div>
    <div v-else>
      <v-row v-if="agendamentosFiltrados.length > 0">
        <v-col v-for="apt in agendamentosFiltrados" :key="apt.id" cols="12" md="6" lg="4">
          <v-card class="appointment-card" elevation="2">
            <v-card-title class="d-flex justify-space-between align-center">
              <div>
                <span class="font-weight-bold">{{ apt.NomeCliente }}</span>
                <div class="text-caption text-medium-emphasis">{{ apt.servicoNome }}</div>
              </div>
              <v-chip :color="getStatusInfo(apt.Status).color" label size="small">{{
                apt.Status
              }}</v-chip>
            </v-card-title>
            <v-divider></v-divider>
            <v-card-text class="d-flex align-center">
              <v-icon class="mr-3" color="primary">mdi-calendar-clock</v-icon>
              <div>
                <div class="font-weight-medium">{{ apt.DataHoraFormatada }}</div>
                <div class="text-caption">Duração: {{ apt.duracaoMinutos || '30' }} min</div>
              </div>
              <v-spacer></v-spacer>
              <div class="text-h6 font-weight-bold text-success">
                {{
                  (apt.preco || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                }}
              </div>
            </v-card-text>
            <v-card-actions class="pa-3">
              <v-spacer></v-spacer>
              <v-menu offset-y>
                <template v-slot:activator="{ props }">
                  <v-btn
                    color="grey-darken-1"
                    variant="tonal"
                    v-bind="props"
                    :disabled="isPast(apt.DataHoraISO)"
                  >
                    Mudar Status
                    <v-icon right>mdi-chevron-down</v-icon>
                  </v-btn>
                </template>
                <v-list dense>
                  <v-list-item link @click="mudarStatus(apt, 'Concluído')">
                    <v-list-item-title>Concluído</v-list-item-title>
                  </v-list-item>
                  <v-list-item link @click="mudarStatus(apt, 'Cancelado')">
                    <v-list-item-title>Cancelado</v-list-item-title>
                  </v-list-item>
                </v-list>
              </v-menu>
            </v-card-actions>
          </v-card>
        </v-col>
      </v-row>
      <v-row v-else class="text-center pa-16">
        <v-col>
          <v-icon size="64" color="grey-lighten-1">mdi-calendar-check</v-icon>
          <h3 class="text-h6 mt-4 text-medium-emphasis">Nenhum agendamento para este período.</h3>
        </v-col>
      </v-row>
    </div>

    <!-- DIALOG PARA NOVO AGENDAMENTO -->
    <v-dialog v-model="dialogNovoAgendamento" max-width="500px">
      <v-card>
        <v-card-title>
          <span class="text-h5">Criar Novo Agendamento</span>
        </v-card-title>
        <v-card-text>
          <!-- Formulário para novo agendamento -->
          <p class="text-center pa-8">Formulário de criação em desenvolvimento.</p>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text @click="dialogNovoAgendamento = false">Cancelar</v-btn>
          <v-btn color="primary" @click="salvarNovoAgendamento">Salvar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<style scoped>
.page-container {
  font-family: 'Poppins', sans-serif;
}
.appointment-card {
  border-radius: 12px;
  border-left: 5px solid;
  border-left-color: rgb(var(--v-theme-primary));
  transition:
    transform 0.2s ease-in-out,
    box-shadow 0.2s ease-in-out;
}
.appointment-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1) !important;
}
</style>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useTenant } from '@/composables/useTenant'
import dayjs from 'dayjs'
import 'dayjs/locale/pt-br'
dayjs.locale('pt-br')

// --- ESTADO REATIVO ---
const allAppointments = ref([])
const loading = ref(true)
const activeTab = ref('hoje')
const dialogNovoAgendamento = ref(false)

const { fetchAgendamentos, updateAgendamento, isTenantReady } = useTenant()

// --- BUSCA DE DADOS ---
onMounted(async () => {
  if (isTenantReady.value) {
    try {
      const agendamentos = await fetchAgendamentos()
      allAppointments.value = agendamentos.sort(
        (a, b) => new Date(a.DataHoraISO) - new Date(b.DataHoraISO),
      )
    } catch (error) {
      console.error('Erro ao buscar agendamentos:', error)
    } finally {
      loading.value = false
    }
  }
})

// --- LÓGICA DE FILTRAGEM E VISUALIZAÇÃO ---

const agendamentosFiltrados = computed(() => {
  const agora = dayjs()
  switch (activeTab.value) {
    case 'hoje':
      return allAppointments.value.filter((apt) => dayjs(apt.DataHoraISO).isSame(agora, 'day'))
    case 'amanha':
      return allAppointments.value.filter((apt) =>
        dayjs(apt.DataHoraISO).isSame(agora.add(1, 'day'), 'day'),
      )
    case 'proximos':
      const seteDiasDepois = agora.add(7, 'day')
      return allAppointments.value.filter(
        (apt) =>
          dayjs(apt.DataHoraISO).isAfter(agora) && dayjs(apt.DataHoraISO).isBefore(seteDiasDepois),
      )
    case 'todos':
    default:
      return allAppointments.value
  }
})

const getStatusInfo = (status) => {
  switch (status) {
    case 'Agendado':
      return { color: 'blue' }
    case 'Concluído':
      return { color: 'success' }
    case 'Cancelado':
      return { color: 'error' }
    default:
      return { color: 'grey' }
  }
}

const isPast = (isoDate) => {
  return dayjs(isoDate).isBefore(dayjs())
}

const mudarStatus = async (agendamento, novoStatus) => {
  try {
    await updateAgendamento(agendamento.id, { Status: novoStatus })
    const index = allAppointments.value.findIndex((a) => a.id === agendamento.id)
    if (index !== -1) {
      allAppointments.value[index].Status = novoStatus
    }
  } catch (error) {
    console.error(`Erro ao atualizar status para ${novoStatus}:`, error)
  }
}

const salvarNovoAgendamento = () => {
  // Lógica para salvar um novo agendamento virá aqui
  dialogNovoAgendamento.value = false
}
</script>

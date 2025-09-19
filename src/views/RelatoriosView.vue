<template>
  <v-container fluid class="pa-6 page-container">
    <!-- CABEÇALHO E FILTRO DE DATA -->
    <v-row align="center">
      <v-col>
        <h1 class="text-h4 font-weight-bold">Relatórios</h1>
        <p class="text-subtitle-1 text-medium-emphasis">Inteligência de negócio e performance</p>
      </v-col>
      <v-col class="d-flex justify-end">
        <v-menu :close-on-content-click="false" location="bottom">
          <template v-slot:activator="{ props }">
            <v-btn v-bind="props" prepend-icon="mdi-calendar" size="large">
              {{ formattedDateRange }}
            </v-btn>
          </template>
          <v-date-picker v-model="dateRange" range></v-date-picker>
        </v-menu>
      </v-col>
    </v-row>

    <div v-if="loading" class="text-center pa-16">
      <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
    </div>
    <div v-else>
      <!-- MÉTRICAS PRINCIPAIS DO PERÍODO -->
      <v-row>
        <v-col cols="12" sm="6" lg="3">
          <v-card elevation="2" class="kpi-card">
            <div class="d-flex justify-space-between align-center">
              <div>
                <p class="text-caption">FATURAMENTO NO PERÍODO</p>
                <p class="text-h4 font-weight-bold">
                  {{
                    faturamentoPeriodo.toLocaleString('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    })
                  }}
                </p>
              </div>
              <v-icon size="48" class="icon-opacity">mdi-cash-multiple</v-icon>
            </div>
          </v-card>
        </v-col>
        <v-col cols="12" sm="6" lg="3">
          <v-card elevation="2" class="kpi-card">
            <div class="d-flex justify-space-between align-center">
              <div>
                <p class="text-caption">NOVOS CLIENTES</p>
                <p class="text-h4 font-weight-bold">{{ novosClientesPeriodo }}</p>
              </div>
              <v-icon size="48" class="icon-opacity">mdi-account-plus</v-icon>
            </div>
          </v-card>
        </v-col>
        <v-col cols="12" sm="6" lg="3">
          <v-card elevation="2" class="kpi-card">
            <div class="d-flex justify-space-between align-center">
              <div>
                <p class="text-caption">TICKET MÉDIO</p>
                <p class="text-h4 font-weight-bold">
                  {{ ticketMedio.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) }}
                </p>
              </div>
              <v-icon size="48" class="icon-opacity">mdi-receipt-text-arrow-right</v-icon>
            </div>
          </v-card>
        </v-col>
        <v-col cols="12" sm="6" lg="3">
          <v-card elevation="2" class="kpi-card">
            <div class="d-flex justify-space-between align-center">
              <div>
                <p class="text-caption">AGENDAMENTOS CONCLUÍDOS</p>
                <p class="text-h4 font-weight-bold">{{ agendamentosConcluidosPeriodo }}</p>
              </div>
              <v-icon size="48" class="icon-opacity">mdi-check-decagram</v-icon>
            </div>
          </v-card>
        </v-col>
      </v-row>

      <!-- GRÁFICOS DETALHADOS -->
      <v-row class="mt-4">
        <v-col cols="12" lg="8">
          <v-card elevation="2" class="pa-4 chart-card">
            <h3 class="text-h6 mb-2">Faturamento Diário</h3>
            <apexchart
              type="area"
              height="300"
              :options="dailyRevenueChart.options"
              :series="dailyRevenueChart.series"
            ></apexchart>
          </v-card>
        </v-col>
        <v-col cols="12" lg="4">
          <v-card elevation="2" class="pa-4 chart-card">
            <h3 class="text-h6 mb-2">Novos vs. Recorrentes</h3>
            <apexchart
              type="donut"
              height="300"
              :options="clientTypeChart.options"
              :series="clientTypeChart.series"
            ></apexchart>
          </v-card>
        </v-col>
      </v-row>
    </div>
  </v-container>
</template>

<style scoped>
.page-container {
  font-family: 'Poppins', sans-serif;
}
.kpi-card {
  border-radius: 12px;
  padding: 24px !important;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.1);
}
.icon-opacity {
  opacity: 0.3;
}
.chart-card {
  border-radius: 12px;
}
</style>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useTenant } from '@/composables/useTenant'
import Apexchart from 'vue3-apexcharts'
import dayjs from 'dayjs'

// --- ESTADO REATIVO ---
const allAppointments = ref([])
const loading = ref(true)
const { fetchAgendamentos, isTenantReady } = useTenant()

// Estado para o filtro de data (inicia com os últimos 30 dias)
const dateRange = ref([dayjs().subtract(29, 'day').toDate(), dayjs().toDate()])

// --- BUSCA DE DADOS ---
onMounted(async () => {
  if (isTenantReady.value) {
    try {
      allAppointments.value = await fetchAgendamentos()
    } catch (error) {
      console.error('Erro ao buscar dados:', error)
    } finally {
      loading.value = false
    }
  }
})

// --- PROPRIEDADES COMPUTADAS PARA FILTRAGEM ---

const formattedDateRange = computed(() => {
  const [start, end] = dateRange.value
  if (!start) return 'Selecione um período'
  const endDate = end || start // Se só uma data for selecionada
  return `${dayjs(start).format('DD/MM/YY')} - ${dayjs(endDate).format('DD/MM/YY')}`
})

const filteredAppointments = computed(() => {
  const [start, end] = dateRange.value
  if (!start) return []
  const startDate = dayjs(start).startOf('day')
  const endDate = dayjs(end || start).endOf('day')

  return allAppointments.value.filter((apt) => {
    const aptDate = dayjs(apt.DataHoraISO)
    return aptDate.isAfter(startDate) && aptDate.isBefore(endDate)
  })
})

// --- CÁLCULOS E MÉTRICAS DO PERÍODO ---

const faturamentoPeriodo = computed(() => {
  return filteredAppointments.value
    .filter((apt) => apt.Status === 'Concluído' && apt.preco)
    .reduce((sum, apt) => sum + apt.preco, 0)
})

const agendamentosConcluidosPeriodo = computed(() => {
  return filteredAppointments.value.filter((apt) => apt.Status === 'Concluído').length
})

const ticketMedio = computed(() => {
  if (agendamentosConcluidosPeriodo.value === 0) return 0
  return faturamentoPeriodo.value / agendamentosConcluidosPeriodo.value
})

const novosClientesPeriodo = computed(() => {
  const firstAppointmentMap = new Map()
  // Encontra a primeira visita de cada cliente em toda a base
  allAppointments.value.forEach((apt) => {
    if (
      !firstAppointmentMap.has(apt.TelefoneCliente) ||
      dayjs(apt.DataHoraISO).isBefore(firstAppointmentMap.get(apt.TelefoneCliente))
    ) {
      firstAppointmentMap.set(apt.TelefoneCliente, dayjs(apt.DataHoraISO))
    }
  })

  const [start, end] = dateRange.value
  const startDate = dayjs(start).startOf('day')
  const endDate = dayjs(end || start).endOf('day')

  let newClients = 0
  firstAppointmentMap.forEach((firstDate) => {
    if (firstDate.isAfter(startDate) && firstDate.isBefore(endDate)) {
      newClients++
    }
  })
  return newClients
})

// --- DADOS PARA OS GRÁFICOS ---
const dailyRevenueChart = computed(() => {
  const dailyData = filteredAppointments.value
    .filter((apt) => apt.Status === 'Concluído' && apt.preco)
    .reduce((acc, apt) => {
      const day = dayjs(apt.DataHoraISO).format('YYYY-MM-DD')
      acc[day] = (acc[day] || 0) + apt.preco
      return acc
    }, {})

  const sortedDays = Object.keys(dailyData).sort()
  return {
    series: [{ name: 'Faturamento', data: sortedDays.map((day) => dailyData[day]) }],
    options: {
      chart: { type: 'area', toolbar: { show: false } },
      xaxis: { type: 'datetime', categories: sortedDays },
      dataLabels: { enabled: false },
      stroke: { curve: 'smooth' },
    },
  }
})

const clientTypeChart = computed(() => {
  const totalUniqueClients = new Set(filteredAppointments.value.map((c) => c.TelefoneCliente)).size
  const recurrentClients = totalUniqueClients - novosClientesPeriodo.value

  return {
    series: [novosClientesPeriodo.value, recurrentClients > 0 ? recurrentClients : 0],
    options: {
      chart: { type: 'donut' },
      labels: ['Novos Clientes', 'Clientes Recorrentes'],
      legend: { position: 'bottom' },
    },
  }
})
</script>

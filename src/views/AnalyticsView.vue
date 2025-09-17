<template>
  <v-container fluid class="pa-6">
    <!-- CABEÇALHO -->
    <v-row>
      <v-col>
        <h1 class="text-h4 font-weight-bold">Análises</h1>
        <p class="text-subtitle-1 text-medium-emphasis">Métricas de performance da barbearia</p>
      </v-col>
    </v-row>
    
    <div v-if="loading" class="text-center pa-16">
      <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
    </div>

    <div v-else>
      <!-- CARDS DE INDICADORES (KPIs) -->
      <v-row>
        <v-col cols="12" sm="6" lg="3">
          <v-card elevation="4" class="kpi-card kpi-card-clients">
            <div class="d-flex justify-space-between align-center">
              <div>
                <p class="text-caption text-white">CLIENTES TOTAIS (ÚNICOS)</p>
                <p class="text-h4 font-weight-black text-white">{{ totalClients }}</p>
              </div>
              <Users :size="48" class="icon-glow" />
            </div>
          </v-card>
        </v-col>
        <v-col cols="12" sm="6" lg="3">
          <v-card elevation="4" class="kpi-card kpi-card-revenue">
            <div class="d-flex justify-space-between align-center">
              <div>
                <p class="text-caption text-white">RECEITA TOTAL (CONCLUÍDOS)</p>
                <p class="text-h4 font-weight-black text-white">{{ totalRevenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) }}</p>
              </div>
              <DollarSign :size="48" class="icon-glow" />
            </div>
          </v-card>
        </v-col>
        <v-col cols="12" sm="6" lg="3">
          <v-card elevation="4" class="kpi-card kpi-card-appointments">
            <div class="d-flex justify-space-between align-center">
              <div>
                <p class="text-caption text-white">AGENDAMENTOS (MÊS)</p>
                <p class="text-h4 font-weight-black text-white">{{ monthlyAppointments }}</p>
              </div>
              <Calendar :size="48" class="icon-glow" />
            </div>
          </v-card>
        </v-col>
        <v-col cols="12" sm="6" lg="3">
          <v-card elevation="4" class="kpi-card kpi-card-completed">
            <div class="d-flex justify-space-between align-center">
              <div>
                <p class="text-caption text-white">TAXA DE CONCLUSÃO (MÊS)</p>
                <p class="text-h4 font-weight-black text-white">{{ completionRate }}%</p>
              </div>
              <TrendingUp :size="48" class="icon-glow" />
            </div>
          </v-card>
        </v-col>
      </v-row>
      
      <!-- GRÁFICOS -->
      <v-row class="mt-4">
        <v-col cols="12" lg="8">
          <v-card elevation="2" class="pa-4 chart-card">
            <h3 class="text-h6 mb-2">Ocupação por Horário (Últimos 30 dias)</h3>
            <apexchart type="bar" height="300" :options="hourlyChart.options" :series="hourlyChart.series"></apexchart>
          </v-card>
        </v-col>
        <v-col cols="12" lg="4">
          <v-card elevation="2" class="pa-4 chart-card">
            <h3 class="text-h6 mb-2">Serviços Mais Populares</h3>
            <apexchart type="donut" height="300" :options="servicesChart.options" :series="servicesChart.series"></apexchart>
          </v-card>
        </v-col>
      </v-row>
    </div>
  </v-container>
</template>

<style scoped>
/* Importa a fonte que você queria */
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800;900&display=swap');

/* Aplica a fonte e um fundo base */
.v-container {
  font-family: 'Poppins', sans-serif;
}

.kpi-card {
  color: white;
  border-radius: 16px;
  padding: 24px !important;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}
.kpi-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 20px rgba(0,0,0,0.2);
}
.kpi-card-clients { background: linear-gradient(45deg, #1e88e5, #42a5f5); }
.kpi-card-revenue { background: linear-gradient(45deg, #43a047, #66bb6a); }
.kpi-card-appointments { background: linear-gradient(45deg, #fb8c00, #ffb74d); }
.kpi-card-completed { background: linear-gradient(45deg, #8e24aa, #ab47bc); }
.icon-glow { filter: drop-shadow(0 0 10px rgba(255,255,255,0.3)); opacity: 0.7; }

.chart-card {
  border-radius: 16px;
}
</style>

<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { useTenant } from '@/composables/useTenant';
import { Users, DollarSign, Calendar, TrendingUp } from 'lucide-vue-next';
import Apexchart from 'vue3-apexcharts';

// --- ESTADO REATIVO ---
const allAppointments = ref([]);
const loading = ref(true);
const isDark = ref(false); // Esta variável precisa vir do App.vue no futuro para ser reativa
const { fetchAgendamentos } = useTenant();

// --- BUSCA DE DADOS ---
onMounted(async () => {
  try {
    // Busca os agendamentos usando a função segura do useTenant
    allAppointments.value = await fetchAgendamentos();
  } catch (error) {
    console.error("Erro ao buscar dados:", error);
  } finally {
    loading.value = false;
  }
});

// --- CÁLCULOS (PROPRIEDADES COMPUTADAS) ---

const totalClients = computed(() => new Set(allAppointments.value.map(apt => apt.TelefoneCliente)).size);

const totalRevenue = computed(() => {
  return allAppointments.value
    .filter(apt => (apt.Status === 'Concluído' || apt.Status === 'Agendado') && apt.preco)
    .reduce((sum, apt) => sum + apt.preco, 0);
});

const monthlyAppointments = computed(() => {
  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
  return allAppointments.value.filter(apt => new Date(apt.DataHoraISO) >= oneMonthAgo).length;
});

const completionRate = computed(() => {
  const monthlyApts = allAppointments.value.filter(apt => new Date(apt.DataHoraISO) >= new Date(new Date().setMonth(new Date().getMonth() - 1)));
  if (monthlyApts.length === 0) return 0;
  const completed = monthlyApts.filter(apt => apt.Status === 'Concluído' || apt.Status === 'Agendado').length;
  return Math.round((completed / monthlyApts.length) * 100);
});

// --- DADOS PARA OS GRÁFICOS ---

const servicesChart = computed(() => {
  const servicesCount = allAppointments.value
    .filter(apt => apt.servicoNome)
    .reduce((acc, apt) => { acc[apt.servicoNome] = (acc[apt.servicoNome] || 0) + 1; return acc; }, {});
  
  return {
    series: Object.values(servicesCount),
    options: {
      chart: { type: 'donut' },
      labels: Object.keys(servicesCount),
      legend: { position: 'bottom' },
      theme: { mode: isDark.value ? 'dark' : 'light' }
    },
  };
});

const hourlyChart = computed(() => {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const hourlyCount = allAppointments.value
    .filter(apt => new Date(apt.DataHoraISO) >= thirtyDaysAgo)
    .reduce((acc, apt) => { const hour = new Date(apt.DataHoraISO).getHours(); acc[hour] = (acc[hour] || 0) + 1; return acc; }, {});
  const categories = Array.from({ length: 11 }, (_, i) => `${i + 9}:00`); // 9h to 19h
  const seriesData = categories.map((_, index) => hourlyCount[index + 9] || 0);

  return {
    series: [{ name: 'Agendamentos', data: seriesData }],
    options: {
      chart: { type: 'bar', toolbar: { show: false } },
      xaxis: { categories, labels: { style: { colors: isDark.value ? '#90A4AE' : '#333' } } },
      yaxis: { labels: { style: { colors: isDark.value ? '#90A4AE' : '#333' } } },
      grid: { borderColor: isDark.value ? '#4A4A4A' : '#E0E0E0' },
      theme: { mode: isDark.value ? 'dark' : 'light' },
      plotOptions: { bar: { borderRadius: 4, horizontal: false } },
      dataLabels: { enabled: false },
      colors: ['#42a5f5']
    },
  };
});
</script>
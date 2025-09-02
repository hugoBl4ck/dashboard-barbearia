<template>
  <v-container fluid class="pa-6 page-container">
    <!-- CABEÇALHO DA PÁGINA -->
    <v-row>
      <v-col>
        <h1 class="text-h4 font-weight-bold">Clientes</h1>
        <p class="text-subtitle-1 text-medium-emphasis">Gerencie e visualize o histórico dos seus clientes</p>
      </v-col>
    </v-row>

    <!-- TABELA DE DADOS DE CLIENTES -->
    <v-row>
      <v-col>
        <v-card elevation="2" class="data-table-card">
          <v-card-title class="d-flex align-center pa-4">
            <v-icon class="mr-2">mdi-account-search</v-icon>
            Lista de Clientes
            <v-spacer></v-spacer>
            <v-text-field
              v-model="search"
              label="Buscar cliente..."
              variant="outlined"
              density="compact"
              hide-details
              prepend-inner-icon="mdi-magnify"
              style="max-width: 300px;"
            ></v-text-field>
          </v-card-title>
          
          <v-divider></v-divider>

          <v-data-table
            :headers="headers"
            :items="clientData"
            :loading="loading"
            :search="search"
            item-value="telefone"
            class="elevation-0"
            no-data-text="Nenhum cliente encontrado"
            loading-text="Carregando dados dos clientes..."
          >
            <template v-slot:item.nome="{ item }">
              <div class="font-weight-bold">{{ item.nome }}</div>
            </template>

            <template v-slot:item.totalGasto="{ item }">
              <span class="text-green font-weight-medium">
                {{ item.totalGasto.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) }}
              </span>
            </template>
            
            <template v-slot:item.ultimoServico="{ item }">
              <v-chip size="small" variant="tonal">{{ item.ultimoServico }}</v-chip>
            </template>

          </v-data-table>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<style scoped>
.page-container { font-family: 'Poppins', sans-serif; }
.data-table-card { border-radius: 12px; }
</style>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { db } from '@/firebase';
import { collection, query, getDocs } from 'firebase/firestore';

// --- ESTADO REATIVO ---
const loading = ref(true);
const allAppointments = ref([]);
const search = ref('');

// --- CABEÇALHOS DA TABELA ---
const headers = [
  { title: 'Nome do Cliente', key: 'nome', align: 'start', sortable: true },
  { title: 'Telefone', key: 'telefone', align: 'start', sortable: true },
  { title: 'Total de Visitas', key: 'visitas', align: 'center', sortable: true },
  { title: 'Total Gasto', key: 'totalGasto', align: 'end', sortable: true },
  { title: 'Último Serviço', key: 'ultimoServico', align: 'start', sortable: false },
  { title: 'Última Visita', key: 'ultimaVisita', align: 'end', sortable: true },
];

// --- BUSCA DE DADOS ---
onMounted(async () => {
  loading.value = true;
  try {
    const q = query(collection(db, "Agendamentos"));
    const querySnapshot = await getDocs(q);
    allAppointments.value = querySnapshot.docs.map(doc => doc.data());
  } catch (error) {
    console.error("Erro ao buscar agendamentos para a lista de clientes:", error);
  } finally {
    loading.value = false;
  }
});

// --- PROCESSAMENTO DE DADOS (PROPRIEDADE COMPUTADA) ---
const clientData = computed(() => {
  if (allAppointments.value.length === 0) return [];

  // Agrupa todos os agendamentos por número de telefone
  const clientsByPhone = allAppointments.value.reduce((acc, apt) => {
    const phone = apt.TelefoneCliente;
    if (!phone) return acc; // Ignora agendamentos sem telefone

    if (!acc[phone]) {
      acc[phone] = {
        nome: apt.NomeCliente,
        telefone: phone,
        agendamentos: []
      };
    }
    
    // Garante que o nome mais recente seja usado
    acc[phone].nome = apt.NomeCliente; 
    acc[phone].agendamentos.push(apt);

    return acc;
  }, {});

  // Mapeia os dados agrupados para o formato final da tabela
  return Object.values(clientsByPhone).map(client => {
    // Ordena os agendamentos do mais recente para o mais antigo
    const agendamentosOrdenados = client.agendamentos.sort((a, b) => 
      new Date(b.DataHoraISO) - new Date(a.DataHoraISO)
    );

    const ultimoAgendamento = agendamentosOrdenados[0];

    const totalGasto = agendamentosOrdenados.reduce((sum, apt) => {
      // Considera apenas os concluídos para o faturamento
      if (apt.Status === 'Concluído' && apt.preco) {
        return sum + apt.preco;
      }
      return sum;
    }, 0);
    
    return {
      nome: client.nome,
      telefone: client.telefone,
      visitas: agendamentosOrdenados.length,
      totalGasto: totalGasto,
      ultimoServico: ultimoAgendamento?.servicoNome || 'N/A',
      ultimaVisita: new Date(ultimoAgendamento.DataHoraISO).toLocaleDateString('pt-BR')
    };
  });
});
</script>
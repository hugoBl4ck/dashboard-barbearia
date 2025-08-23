<template>
  <v-app :theme="isDark ? 'dark' : 'light'" class="modern-app">
    <!-- BARRA DE NAVEGAÇÃO SUPERIOR -->
    <v-app-bar app flat class="app-bar-style" :elevation="2">
      <v-container fluid class="d-flex align-center pa-0">
        <v-avatar image="/logo-barbearia.png" size="36" class="ml-4 mr-3"></v-avatar>
        <v-toolbar-title class="font-weight-bold text-h6">Navalha de Ouro</v-toolbar-title>
        <v-spacer></v-spacer>
        <div class="d-none d-md-flex align-center">
          <v-btn variant="text" icon="mdi-chevron-left" @click="diaAnterior"></v-btn>
          <v-btn variant="text" @click="irParaHoje" class="mx-2">Hoje</v-btn>
          <v-btn variant="text" icon="mdi-chevron-right" @click="proximoDia"></v-btn>
        </div>
        <v-btn-toggle v-model="isDark" variant="outlined" divided class="ml-4 toggle-theme">
          <v-btn :value="false" icon="mdi-white-balance-sunny" size="small"></v-btn>
          <v-btn :value="true" icon="mdi-weather-night" size="small"></v-btn>
        </v-btn-toggle>
      </v-container>
    </v-app-bar>

    <v-main class="bg-surface">
      <v-container fluid>
        <v-row align="center" class="mb-3">
          <v-col>
            <h1 class="text-h4 font-weight-bold">Agenda</h1>
            <p class="text-subtitle-1 text-medium-emphasis">{{ dataFormatada }}</p>
          </v-col>
        </v-row>

        <!-- CONTEÚDO DA AGENDA -->
        <v-slide-y-transition mode="out-in">
          <div v-if="loading" class="text-center pa-16"><v-progress-circular indeterminate color="primary" size="64"></v-progress-circular></div>
          <div v-else-if="estaFechado">
            <v-card variant="tonal" class="text-center pa-16 d-flex flex-column justify-center align-center">
              <v-icon size="80" color="grey-lighten-1">mdi-door-closed-lock</v-icon>
              <h2 class="text-h5 mt-6">Barbearia Fechada</h2>
              <p class="text-body-1 text-medium-emphasis">Sem horário de funcionamento para este dia.</p>
            </v-card>
          </div>
          <v-card v-else elevation="2">
            <v-list class="py-0">
              <template v-for="(slot, index) in timeSlots" :key="slot.timestamp">
                <v-list-item
                  class="list-item-hover"
                  :class="{ 'border-bottom': index < timeSlots.length - 1 }"
                  @click="handleSlotClick(slot)"
                >
                  <template v-slot:prepend>
                    <div class="mr-6 text-center" style="width: 70px;">
                      <span class="text-h6 font-weight-bold" :class="{'text-medium-emphasis': slot.status === 'passado'}">{{ slot.horarioFormatado }}</span>
                    </div>
                  </template>
                  <v-chip :color="getChipColor(slot)" variant="flat" class="font-weight-bold" label>
                    <v-icon start :icon="getChipIcon(slot)"></v-icon>
                    {{ getStatusText(slot) }}
                  </v-chip>
                  <div v-if="slot.agendamento" class="text-caption text-medium-emphasis mt-1 ml-1">
                    {{ slot.agendamento.servicoNome }} - {{ slot.agendamento.duracaoMinutos }} min
                  </div>
                </v-list-item>
              </template>
            </v-list>
          </v-card>
        </v-slide-y-transition>

        <!-- FAB -->
        <v-fab icon="mdi-plus" class="fab-gradient" location="bottom end" size="large" fixed app appear @click="abrirModalParaNovoVazio"></v-fab>

        <!-- MODAL DE AGENDAMENTO -->
        <v-dialog v-model="modalAberto" max-width="500px" persistent>
          <v-card class="pa-4">
            <v-card-title class="text-h5">{{ editando ? 'Editar' : 'Novo' }} Agendamento</v-card-title>
            <v-card-subtitle>{{ dataFormatada }} às {{ slotSelecionado?.horarioFormatado }}</v-card-subtitle>
            <v-card-text>
              <v-select
                v-model="servicoSelecionado"
                :items="listaServicos"
                item-title="nome"
                item-value="id"
                label="Serviço"
                variant="outlined"
                density="compact"
                return-object
                :disabled="editando"
              ></v-select>
              <v-text-field v-model="nomeCliente" label="Nome do Cliente" variant="outlined" density="compact" class="mt-4"></v-text-field>
              <v-text-field v-model="telefoneCliente" label="Telefone" variant="outlined" density="compact"></v-text-field>
            </v-card-text>
            <v-card-actions class="justify-end">
              <v-btn text @click="fecharModal">Cancelar</v-btn>
              <v-btn v-if="editando" color="red" text @click="excluirAgendamento">Excluir</v-btn>
              <v-btn color="primary" variant="flat" @click="salvarAgendamento">{{ editando ? 'Salvar' : 'Adicionar' }}</v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>
      </v-container>
    </v-main>
  </v-app>
</template>

<style scoped>
/* SEU CSS PODE PERMANECER O MESMO, APENAS GARANTA QUE TEM ESTAS CLASSES */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
.modern-app { font-family: 'Inter', sans-serif; }
.bg-surface { background-color: rgb(var(--v-theme-surface)); }
.app-bar-style { background-color: rgba(var(--v-theme-surface), 0.8) !important; backdrop-filter: blur(10px); }
.list-item-hover { transition: background-color 0.2s ease-in-out; }
.list-item-hover:hover { background-color: rgba(var(--v-theme-on-surface), 0.04); cursor: pointer; }
.border-bottom { border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.08); }
.fab-gradient { background: linear-gradient(45deg, #42a5f5 30%, #66bb6a 90%); color: white; }
</style>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { db } from '@/firebase';
import { collection, query, where, getDocs, orderBy, doc, getDoc, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';

const loading = ref(true);
const agendamentosDoDia = ref([]);
const dataExibida = ref(new Date());
const configHorarios = ref(null);
const isDark = ref(false);
const listaServicos = ref([]);

// Modal State
const modalAberto = ref(false);
const slotSelecionado = ref(null);
const nomeCliente = ref('');
const telefoneCliente = ref('');
const servicoSelecionado = ref(null);
const editando = ref(false);
const idAgendamentoEditando = ref(null);

// ---- PROPRIEDADES COMPUTADAS ----
const dataFormatada = computed(() => dataExibida.value.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' }));
const estaFechado = computed(() => !loading.value && !configHorarios.value);

const timeSlots = computed(() => {
  if (!configHorarios.value || !configHorarios.value.InicioManha) {
    return []; // Condição de guarda mais forte
  }

  const slots = [];
  const agora = new Date();

  const parseTime = (timeStr) => {
    if (!timeStr || typeof timeStr !== 'string') return 0;
    const [h, m] = timeStr.split(':').map(Number);
    return (h || 0) * 60 + (m || 0);
  };

  const formatTime = (totalMinutes) => {
    const hours = String(Math.floor(totalMinutes / 60)).padStart(2, '0');
    const minutes = String(totalMinutes % 60).padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  let minutoAtual = parseTime(configHorarios.value.InicioManha);
  const fimManha = parseTime(configHorarios.value.FimManha);
  const inicioTarde = parseTime(configHorarios.value.InicioTarde);
  const fimTarde = parseTime(configHorarios.value.FimTarde);
  const fimDoDia = fimTarde > 0 ? fimTarde : fimManha;

  const agendamentosOrdenados = [...agendamentosDoDia.value].sort((a, b) => new Date(a.DataHoraISO) - new Date(b.DataHoraISO));
  let agendamentoIndex = 0;

  // Loop de segurança para evitar travamentos
  let iteracoes = 0;
  const maxIteracoes = 200;

  while (minutoAtual < fimDoDia && iteracoes < maxIteracoes) {
    iteracoes++;
    
    // Pula o horário de almoço
    if (inicioTarde && minutoAtual >= fimManha && minutoAtual < inicioTarde) {
      minutoAtual = inicioTarde;
      continue;
    }

    const slotDate = new Date(dataExibida.value);
    slotDate.setHours(Math.floor(minutoAtual / 60), minutoAtual % 60, 0, 0);

    const proximoAgendamento = agendamentosOrdenados[agendamentoIndex];
    let agendamentoNesteSlot = null;

    if (proximoAgendamento && parseTime(new Date(proximoAgendamento.DataHoraISO).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})) === minutoAtual) {
      agendamentoNesteSlot = proximoAgendamento;
    }

    let status = 'livre';
    if (agendamentoNesteSlot) {
      status = 'ocupado';
    } else if (slotDate < agora && dataExibida.value.toDateString() === agora.toDateString()) {
      status = 'passado';
    }
    
    // Adiciona o slot APENAS se não for um horário já ocupado (para não duplicar)
    if (status !== 'ocupado') {
      slots.push({
        timestamp: slotDate.getTime(),
        horarioFormatado: formatTime(minutoAtual),
        agendamento: null,
        status
      });
    }
    
    // Adiciona o agendamento real como um slot
    if (agendamentoNesteSlot) {
      slots.push({
        timestamp: slotDate.getTime(),
        horarioFormatado: formatTime(minutoAtual),
        agendamento: agendamentoNesteSlot,
        status: 'ocupado'
      });
      minutoAtual += agendamentoNesteSlot.duracaoMinutos;
      agendamentoIndex++;
    } else {
      minutoAtual += 15; // Intervalo para mostrar próximos horários livres
    }
  }
  
  if (iteracoes >= maxIteracoes) {
    console.error("Loop infinito detectado na geração de timeSlots!");
  }

  return slots;
});


// ---- LÓGICA PRINCIPAL ----
const fetchData = async (data) => {
  loading.value = true;
  agendamentosDoDia.value = [];
  configHorarios.value = null;

  const diaDaSemana = data.getDay();
  const docRef = doc(db, 'Horarios', String(diaDaSemana));
  const docSnap = await getDoc(docRef);

  if (docSnap.exists() && docSnap.data().InicioManha) {
    configHorarios.value = docSnap.data();

    const inicioDia = new Date(data); inicioDia.setHours(0, 0, 0, 0);
    const fimDia = new Date(data); fimDia.setHours(23, 59, 59, 999);

    const q = query(collection(db, 'Agendamentos'),
      where('DataHoraISO', '>=', inicioDia.toISOString()),
      where('DataHoraISO', '<=', fimDia.toISOString()),
      where('Status', '==', 'Agendado'),
      orderBy('DataHoraISO')
    );
    const querySnapshot = await getDocs(q);
    const agendamentos = [];
    querySnapshot.forEach(docItem => agendamentos.push({ id: docItem.id, ...docItem.data() }));
    agendamentosDoDia.value = agendamentos;
  }
  loading.value = false;
};

const fetchServicos = async () => {
  const q = query(collection(db, "Servicos"), where("ativo", "==", true));
  const querySnapshot = await getDocs(q);
  const servicos = [];
  querySnapshot.forEach(doc => servicos.push({ id: doc.id, ...doc.data() }));
  listaServicos.value = servicos;
};

onMounted(() => {
  fetchData(dataExibida.value);
  fetchServicos();
});

// ---- NAVEGAÇÃO ----
const diaAnterior = () => { const novaData = new Date(dataExibida.value); novaData.setDate(novaData.getDate() - 1); dataExibida.value = novaData; fetchData(dataExibida.value); };
const proximoDia = () => { const novaData = new Date(dataExibida.value); novaData.setDate(novaData.getDate() + 1); dataExibida.value = novaData; fetchData(dataExibida.value); };
const irParaHoje = () => { dataExibida.value = new Date(); fetchData(dataExibida.value); };

// ---- INTERAÇÃO (CRUD) ----
const fecharModal = () => {
  modalAberto.value = false;
  editando.value = false;
  idAgendamentoEditando.value = null;
  slotSelecionado.value = null;
  nomeCliente.value = '';
  telefoneCliente.value = '';
  servicoSelecionado.value = null;
};

const handleSlotClick = (slot) => {
  if (slot.status === 'passado') return;
  slotSelecionado.value = slot;

  if (slot.agendamento) {
    editando.value = true;
    idAgendamentoEditando.value = slot.agendamento.id;
    nomeCliente.value = slot.agendamento.NomeCliente;
    telefoneCliente.value = slot.agendamento.TelefoneCliente;
    servicoSelecionado.value = listaServicos.value.find(s => s.id === slot.agendamento.servicoId) || null;
  } else {
    editando.value = false;
    idAgendamentoEditando.value = null;
    nomeCliente.value = '';
    telefoneCliente.value = '';
    servicoSelecionado.value = null;
  }
  modalAberto.value = true;
};

const abrirModalParaNovoVazio = () => {
  const primeiroSlotLivre = timeSlots.value.find(s => s.status === 'livre');
  if (primeiroSlotLivre) {
    handleSlotClick(primeiroSlotLivre);
  } else {
    alert("Não há horários livres hoje para um novo agendamento.");
  }
};

const salvarAgendamento = async () => {
  if (!nomeCliente.value || !servicoSelecionado.value) {
    alert('Nome do cliente e serviço são obrigatórios.');
    return;
  }
  
  try {
    if (editando.value && idAgendamentoEditando.value) {
      const agendamentoRef = doc(db, 'Agendamentos', idAgendamentoEditando.value);
      await updateDoc(agendamentoRef, {
        NomeCliente: nomeCliente.value,
        TelefoneCliente: telefoneCliente.value,
      });
    } else {
      const dataDoAgendamento = new Date(slotSelecionado.value.timestamp);
      const novoAgendamento = {
        NomeCliente: nomeCliente.value,
        TelefoneCliente: telefoneCliente.value,
        DataHoraISO: dataDoAgendamento.toISOString(),
        DataHoraFormatada: new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'America/Sao_Paulo' }).format(dataDoAgendamento),
        Status: 'Agendado',
        TimestampAgendamento: new Date().toISOString(),
        servicoId: servicoSelecionado.value.id,
        servicoNome: servicoSelecionado.value.nome,
        duracaoMinutos: servicoSelecionado.value.duracaoMinutos,
      };
      await addDoc(collection(db, 'Agendamentos'), novoAgendamento);
    }
  } catch (error) {
    console.error("Erro ao salvar agendamento:", error);
    alert("Ocorreu um erro ao salvar o agendamento.");
  } finally {
    fecharModal();
    fetchData(dataExibida.value);
  }
};

const excluirAgendamento = async () => {
  if (!idAgendamentoEditando.value) return;
  if (confirm(`Tem certeza que deseja excluir o agendamento de ${nomeCliente.value}?`)) {
    try {
      await deleteDoc(doc(db, 'Agendamentos', idAgendamentoEditando.value));
    } finally {
      fecharModal();
      fetchData(dataExibida.value);
    }
  }
};

// ---- ESTILO ----
const getChipColor = (slot) => (slot.agendamento ? 'primary' : (slot.status === 'livre' ? 'success' : 'grey'));
const getChipIcon = (slot) => (slot.agendamento ? 'mdi-account-check' : (slot.status === 'livre' ? 'mdi-check-circle-outline' : 'mdi-cancel'));
const getStatusText = (slot) => (slot.agendamento ? slot.agendamento.NomeCliente : (slot.status === 'livre' ? 'Disponível' : 'Encerrado'));
</script>
<template>
  <v-app :theme="isDark ? 'dark' : 'light'" class="modern-app">
    <v-main :class="isDark ? 'dark-bg' : 'light-bg'">
      <v-container fluid>

        <!-- HEADER -->
        <v-row align="center" class="mb-3 header">
          <v-col cols="12" md="4">
            <h1 class="page-title">Agenda</h1>
            <p class="subtitle">{{ dataFormatada }}</p>
          </v-col>
          <v-col cols="12" md="8" class="d-flex justify-md-end align-center">
            <v-btn-toggle v-model="isDark" variant="outlined" divided class="mr-3 toggle-theme">
              <v-btn :value="false" icon="mdi-white-balance-sunny"></v-btn>
              <v-btn :value="true" icon="mdi-weather-night"></v-btn>
            </v-btn-toggle>
            <v-btn variant="tonal" icon="mdi-chevron-left" @click="diaAnterior" class="btn-nav"></v-btn>
            <v-btn variant="tonal" @click="irParaHoje" class="btn-nav mx-1">Hoje</v-btn>
            <v-btn variant="tonal" icon="mdi-chevron-right" @click="proximoDia" class="btn-nav"></v-btn>
          </v-col>
        </v-row>

        <!-- TRANSIÇÃO -->
        <v-slide-y-transition mode="out-in">

          <!-- LOADING -->
          <div v-if="loading" class="text-center pa-10">
            <v-progress-circular indeterminate color="primary" size="48"></v-progress-circular>
          </div>

          <!-- FECHADO -->
          <div v-else-if="estaFechado">
            <v-card class="glass-card text-center pa-12">
              <v-icon size="60" color="grey-lighten-1">mdi-door-closed-lock</v-icon>
              <h2 class="text-h6 mt-4">Barbearia Fechada</h2>
              <p class="text-body-2 text-medium-emphasis">Sem horário de funcionamento.</p>
            </v-card>
          </div>

          <!-- LISTA -->
          <v-card v-else class="glass-card">
            <v-list class="py-0">
              <v-slide-y-transition group>
                <v-list-item
                  v-for="(slot, index) in timeSlots"
                  :key="slot.hora"
                  class="list-item-hover"
                  :class="{ 'border-bottom': index < timeSlots.length - 1 }"
                  @click="handleSlotClick(slot)"
                >
                  <template v-slot:prepend>
                    <div class="mr-4 text-center hour-box">
                      <span class="hour-text" :class="{'text-medium-emphasis': slot.status === 'passado'}">
                        {{ slot.horarioFormatado }}
                      </span>
                    </div>
                  </template>

                  <v-chip
                    label
                    :class="['status-chip', slot.status]"
                  >
                    <v-icon start :icon="getChipIcon(slot.status)" />
                    {{ getStatusText(slot) }}
                  </v-chip>

                  <div v-if="slot.agendamento" class="text-caption text-medium-emphasis ml-1">
                    {{ slot.agendamento.TelefoneCliente }}
                  </div>
                </v-list-item>
              </v-slide-y-transition>
            </v-list>
          </v-card>
        </v-slide-y-transition>

        <!-- FAB -->
        <v-fab
          icon="mdi-plus"
          class="fab-button"
          location="bottom end"
          size="medium"
          fixed
          app
          appear
          @click="abrirModalParaNovoVazio"
        ></v-fab>

        <!-- MODAL -->
        <v-dialog v-model="modalAberto" max-width="400px" persistent>
          <v-card class="glass-card pa-4">
            <h3 class="text-h6 mb-3">{{ editando ? 'Editar' : 'Novo' }} Agendamento para as {{ slotSelecionado?.horarioFormatado }}</h3>
            <v-text-field v-model="nomeCliente" label="Nome do Cliente" variant="outlined" density="compact"></v-text-field>
            <v-text-field v-model="telefoneCliente" label="Telefone" variant="outlined" density="compact"></v-text-field>
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
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

.modern-app { font-family: 'Inter', sans-serif; font-size: 0.9rem; }
.dark-bg { background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%); color: #f5f5f5; }
.light-bg { background: linear-gradient(135deg, #fafafa 0%, #e8e8e8 100%); color: #222; }

.header { backdrop-filter: blur(10px); background: rgba(255,255,255,0.05); border-radius: 16px; padding: 12px; }
.page-title { font-size: 1.6rem; font-weight: 700; background: linear-gradient(90deg,#42a5f5,#66bb6a); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; margin:0; }
.subtitle { font-size:0.85rem; opacity:0.7; }

.glass-card { backdrop-filter: blur(12px); background: rgba(255,255,255,0.04); border-radius:16px; border:1px solid rgba(var(--v-theme-on-surface), 0.08); box-shadow:0 4px 16px rgba(0,0,0,0.25); overflow:hidden; }

.list-item-hover { transition: all 0.2s ease-in-out; padding: 10px 16px !important; min-height: 48px; }
.list-item-hover:hover { background: rgba(var(--v-theme-on-surface), 0.04); cursor: pointer; }
.border-bottom { border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.08); }
.hour-box { width: 60px; }
.hour-text { font-size:1rem; font-weight:600; }
.status-chip { font-size:0.75rem; font-weight:600; height:28px; border-radius:12px; }
.status-chip.livre { background:#00c853; color:white; }
.status-chip.ocupado { background:#2979ff; color:white; }
.status-chip.passado { background:#555; color:#ccc; }

.btn-nav { border:1px solid rgba(var(--v-theme-on-surface), 0.2); backdrop-filter:blur(6px); font-size:0.8rem; padding:4px 8px; }
.btn-nav:hover { border-color:#42a5f5; transform: translateY(-1px); }
.fab-button { background: linear-gradient(45deg,#42a5f5,#66bb6a); box-shadow:0 4px 18px rgba(0,0,0,0.4); transition: transform 0.3s ease; }
.fab-button:hover { transform: scale(1.08); }
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

// Estado do Modal
const modalAberto = ref(false);
const slotSelecionado = ref(null);
const nomeCliente = ref('');
const telefoneCliente = ref('');
const editando = ref(false);
const idAgendamentoEditando = ref(null);

// ---- PROPRIEDADES COMPUTADAS ----
const dataFormatada = computed(() =>
  dataExibida.value.toLocaleDateString('pt-BR', { weekday:'long', day:'numeric', month:'long' })
);

const estaFechado = computed(() => !loading.value && !configHorarios.value);

const timeSlots = computed(() => {
  if (!configHorarios.value) return [];
  const slots = [];
  const agora = new Date();
  const timeToDecimal = str => str ? parseInt(str.split(':')[0]) : null;

  const HORA_INICIO = timeToDecimal(configHorarios.value.InicioManha);
  const HORA_FIM = timeToDecimal(configHorarios.value.FimTarde || configHorarios.value.FimManha);
  if (HORA_INICIO === null || HORA_FIM === null) return [];

  for (let hora = HORA_INICIO; hora < HORA_FIM; hora++) {
    const horaAlmocoInicio = timeToDecimal(configHorarios.value.FimManha);
    const horaAlmocoFim = timeToDecimal(configHorarios.value.InicioTarde);
    if (horaAlmocoInicio && horaAlmocoFim && hora >= horaAlmocoInicio && hora < horaAlmocoFim) continue;

    const agendamento = agendamentosDoDia.value.find(a => a.hora === hora);
    const slotDate = new Date(dataExibida.value); slotDate.setHours(hora, 0, 0, 0);

    let status = 'livre';
    if (agendamento) status = 'ocupado';
    else if (slotDate < agora && dataExibida.value.toDateString() === agora.toDateString()) status = 'passado';

    slots.push({ hora, horarioFormatado: `${String(hora).padStart(2, '0')}:00`, agendamento: agendamento || null, status });
  }
  return slots;
});

// ---- FUNÇÕES DE LÓGICA PRINCIPAL ----
const fetchDataParaDia = async (data) => {
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
    querySnapshot.forEach(docItem => {
      const dados = docItem.data();
      agendamentos.push({ ...dados, id: docItem.id, hora: new Date(dados.DataHoraISO).getHours() });
    });
    agendamentosDoDia.value = agendamentos;
  }
  loading.value = false;
};

onMounted(() => { fetchDataParaDia(dataExibida.value); });

// ---- FUNÇÕES DE NAVEGAÇÃO ----
const diaAnterior = () => { const novaData = new Date(dataExibida.value); novaData.setDate(novaData.getDate() - 1); dataExibida.value = novaData; fetchDataParaDia(dataExibida.value); };
const proximoDia = () => { const novaData = new Date(dataExibida.value); novaData.setDate(novaData.getDate() + 1); dataExibida.value = novaData; fetchDataParaDia(dataExibida.value); };
const irParaHoje = () => { dataExibida.value = new Date(); fetchDataParaDia(dataExibida.value); };

// ---- FUNÇÕES DE INTERAÇÃO (CRUD) ----
const handleSlotClick = (slot) => {
  if (slot.status === 'passado') return;
  slotSelecionado.value = slot;

  if (slot.agendamento) {
    // MODO EDIÇÃO
    editando.value = true;
    idAgendamentoEditando.value = slot.agendamento.id;
    nomeCliente.value = slot.agendamento.NomeCliente;
    telefoneCliente.value = slot.agendamento.TelefoneCliente;
  } else {
    // MODO CRIAÇÃO
    editando.value = false;
    idAgendamentoEditando.value = null;
    nomeCliente.value = '';
    telefoneCliente.value = '';
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
  if (!nomeCliente.value || !slotSelecionado.value) {
    alert('O nome do cliente é obrigatório.');
    return;
  }
  
  try {
    if (editando.value && idAgendamentoEditando.value) {
      // --- LÓGICA DE UPDATE ---
      const agendamentoRef = doc(db, 'Agendamentos', idAgendamentoEditando.value);
      await updateDoc(agendamentoRef, {
        NomeCliente: nomeCliente.value,
        TelefoneCliente: telefoneCliente.value,
      });
    } else {
      // --- LÓGICA DE CRIAÇÃO ---
      const dataDoAgendamento = new Date(dataExibida.value);
      dataDoAgendamento.setHours(slotSelecionado.value.hora, 0, 0, 0);
      const novoAgendamento = {
        NomeCliente: nomeCliente.value,
        TelefoneCliente: telefoneCliente.value,
        DataHoraISO: dataDoAgendamento.toISOString(),
        DataHoraFormatada: new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'America/Sao_Paulo' }).format(dataDoAgendamento),
        Status: 'Agendado',
        TimestampAgendamento: new Date().toISOString()
      };
      await addDoc(collection(db, 'Agendamentos'), novoAgendamento);
    }
  } catch (error) {
    console.error("Erro ao salvar agendamento:", error);
    alert("Ocorreu um erro ao salvar o agendamento. Tente novamente.");
  } finally {
    fecharModal();
    fetchDataParaDia(dataExibida.value);
  }
};

const excluirAgendamento = async () => {
  if (!idAgendamentoEditando.value) return;
  if (confirm(`Tem certeza que deseja excluir o agendamento de ${nomeCliente.value}?`)) {
    try {
      await deleteDoc(doc(db, 'Agendamentos', idAgendamentoEditando.value));
    } catch (error) {
      console.error("Erro ao excluir agendamento:", error);
      alert("Ocorreu um erro ao excluir. Tente novamente.");
    } finally {
      fecharModal();
      fetchDataParaDia(dataExibida.value);
    }
  }
};

const fecharModal = () => {
  modalAberto.value = false;
  editando.value = false;
  idAgendamentoEditando.value = null;
  slotSelecionado.value = null;
  nomeCliente.value = '';
  telefoneCliente.value = '';
};

// ---- FUNÇÕES AUXILIARES DE ESTILO ----
const getChipColor = status => ({ ocupado: 'primary', livre: 'success', passado: 'grey' }[status]);
const getChipIcon = status => ({ ocupado: 'mdi-account-check', livre: 'mdi-check-circle-outline', passado: 'mdi-cancel' }[status]);
const getStatusText = slot => slot.agendamento ? slot.agendamento.NomeCliente : { livre: 'Disponível', passado: 'Encerrado' }[slot.status];
</script>
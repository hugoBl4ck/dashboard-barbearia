<template>
  <v-app :theme="isDark ? 'dark' : 'light'" class="modern-app">
    <v-app-bar app flat class="app-bar-style" :elevation="2">
      <v-container fluid class="d-flex align-center pa-0">
        <v-avatar image="/logo-barbearia.png" size="36" class="ml-4 mr-3"></v-avatar>
        <v-toolbar-title class="font-weight-bold text-h6">Gestão Barbearia</v-toolbar-title>
        <v-spacer></v-spacer>
        <div class="d-none d-md-flex align-center">
          <v-btn variant="text" icon="mdi-chevron-left" @click="mudarDia(-1)"></v-btn>
          <v-btn variant="text" @click="irParaHoje" class="mx-2">Hoje</v-btn>
          <v-btn variant="text" icon="mdi-chevron-right" @click="mudarDia(1)"></v-btn>
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
          <v-col><h1 class="text-h4 font-weight-bold">Agenda</h1><p class="text-subtitle-1 text-medium-emphasis">{{ dataFormatada }}</p></v-col>
        </v-row>

        <v-slide-y-transition mode="out-in">
          <div v-if="loading" class="text-center pa-16"><v-progress-circular indeterminate color="primary" size="64"></v-progress-circular></div>
          <div v-else-if="estaFechado">
            <v-card variant="tonal" class="text-center pa-16 d-flex flex-column justify-center align-center">
              <v-icon size="80" color="grey-lighten-1">mdi-door-closed-lock</v-icon>
              <h2 class="text-h5 mt-6">Barbearia Fechada</h2>
            </v-card>
          </div>
          <v-card v-else elevation="2">
            <v-list class="py-0">
              <v-list-item
                v-for="slot in agendaDoDia"
                :key="slot.timestamp"
                class="list-item-hover"
                :class="{ 'border-bottom': index < agendaDoDia.length - 1 }"
                @click="handleSlotClick(slot)"
                :disabled="slot.status === 'ocupado' || slot.status === 'passado'"
              >
                <template v-slot:prepend>
                  <div class="mr-6 text-center" style="width: 70px;">
                    <span class="text-h6 font-weight-bold" :class="{'text-medium-emphasis': slot.status !== 'livre'}">{{ slot.horarioFormatado }}</span>
                  </div>
                </template>
                <v-chip :color="getChipColor(slot.status)" variant="flat" label>
                  <v-icon start :icon="getChipIcon(slot.status)"></v-icon>
                  {{ getStatusText(slot) }}
                </v-chip>
                <div v-if="slot.agendamento" class="text-caption text-medium-emphasis mt-1 ml-1">{{ slot.agendamento.servicoNome }} - {{ slot.agendamento.duracaoMinutos }} min</div>
              </v-list-item>
            </v-list>
          </v-card>
        </v-slide-y-transition>
        
        <v-dialog v-model="modalAberto" max-width="500px" persistent>
          <v-card class="pa-4">
            <v-card-title class="text-h5">{{ editando ? 'Editar' : 'Novo' }} Agendamento</v-card-title>
            <v-card-subtitle>{{ dataFormatada }} às {{ horarioModal }}</v-card-subtitle>
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
/* SEU CSS AQUI, NENHUMA MUDANÇA NECESSÁRIA */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
.modern-app { font-family: 'Inter', sans-serif; }
.bg-surface { background-color: rgb(var(--v-theme-surface)); }
.app-bar-style { background-color: rgba(var(--v-theme-surface), 0.8) !important; backdrop-filter: blur(10px); }
.list-item-hover { transition: background-color 0.2s ease-in-out; }
.list-item-hover:hover:not([disabled]) { background-color: rgba(var(--v-theme-on-surface), 0.04); cursor: pointer; }
.border-bottom { border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.08); }
</style>

<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { db } from '@/firebase';
import { collection, query, where, getDocs, orderBy, doc, getDoc, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';

const loading = ref(true);
const agendamentosDoDia = ref([]);
const dataExibida = ref(new Date());
const configHorarios = ref(null);
const isDark = ref(false);
const listaServicos = ref([]);
const modalAberto = ref(false);
const nomeCliente = ref('');
const telefoneCliente = ref('');
const servicoSelecionado = ref(null);
const editando = ref(false);
const idAgendamentoEditando = ref(null);
const horarioModal = ref('');
const timestampModal = ref(null);

const dataFormatada = computed(() => dataExibida.value.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' }));
const estaFechado = computed(() => !loading.value && !configHorarios.value);

const agendaDoDia = computed(() => {
    if (!configHorarios.value) return [];
    
    const agenda = [];
    const parseTime = str => str ? parseInt(str.split(':')[0]) * 60 + parseInt(str.split(':')[1]) : 0;
    const formatTime = totalMinutes => `${String(Math.floor(totalMinutes / 60)).padStart(2, '0')}:${String(totalMinutes % 60).padStart(2, '0')}`;
    
    const INTERVALO_MINUTOS = 30;
    const minutoInicio = parseTime(configHorarios.value.InicioManha);
    const minutoFim = parseTime(configHorarios.value.FimTarde || configHorarios.value.FimManha);

    // Cria um mapa de todos os minutos ocupados
    const minutosOcupados = new Set();
    agendamentosDoDia.value.forEach(ag => {
        const inicio = parseTime(new Date(ag.DataHoraISO).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
        for (let i = 0; i < ag.duracaoMinutos; i++) {
            minutosOcupados.add(inicio + i);
        }
    });

    for (let minuto = minutoInicio; minuto < minutoFim; minuto += INTERVALO_MINUTOS) {
        const horaAlmocoInicio = parseTime(configHorarios.value.FimManha);
        const horaAlmocoFim = parseTime(configHorarios.value.InicioTarde);
        if (horaAlmocoInicio && horaAlmocoFim && minuto >= horaAlmocoInicio && minuto < horaAlmocoFim) {
            continue;
        }

        const dataSlot = new Date(dataExibida.value);
        dataSlot.setHours(Math.floor(minuto/60), minuto%60, 0, 0);
        
        const agendamento = agendamentosDoDia.value.find(ag => parseTime(new Date(ag.DataHoraISO).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })) === minuto);
        const estaOcupado = minutosOcupados.has(minuto);

        let status = 'livre';
        if (agendamento) status = 'ocupado'; // Prioriza mostrar o agendamento no início do slot
        else if (estaOcupado) status = 'ocupado';
        else if (dataSlot < new Date() && dataExibida.value.toDateString() === new Date().toDateString()) status = 'passado';
        
        // Adiciona à agenda apenas o início de cada agendamento ou os slots livres
        if (agendamento) {
            agenda.push({ tipo: 'agendamento', ...agendamento, horarioFormatado: formatTime(minuto), titulo: agendamento.NomeCliente, detalhes: `${agendamento.servicoNome} - ${agendamento.duracaoMinutos} min`, timestamp: dataSlot.getTime(), status });
        } else if (!estaOcupado) {
            agenda.push({ tipo: 'livre', horarioFormatado: formatTime(minuto), titulo: 'Horário Vago', timestamp: dataSlot.getTime(), status });
        }
    }
    return agenda;
});

const fetchData = async (data) => {
    loading.value = true;
    await Promise.all([fetchConfigHorarios(data), fetchAgendamentos(data)]);
    loading.value = false;
};

const fetchConfigHorarios = async (data) => {
    configHorarios.value = null;
    const diaDaSemana = data.getDay();
    const docRef = doc(db, 'Horarios', String(diaDaSemana));
    const docSnap = await getDoc(docRef);
    if (docSnap.exists() && docSnap.data().InicioManha) {
        configHorarios.value = docSnap.data();
    }
};

const fetchAgendamentos = async (data) => {
    agendamentosDoDia.value = [];
    const inicioDia = new Date(data); inicioDia.setHours(0, 0, 0, 0);
    const fimDia = new Date(data); fimDia.setHours(23, 59, 59, 999);
    const q = query(collection(db, 'Agendamentos'), where('DataHoraISO', '>=', inicioDia.toISOString()), where('DataHoraISO', '<=', fimDia.toISOString()), where('Status', '==', 'Agendado'), orderBy('DataHoraISO'));
    const querySnapshot = await getDocs(q);
    agendamentosDoDia.value = querySnapshot.docs.map(docItem => ({ id: docItem.id, ...docItem.data() }));
};

const fetchServicos = async () => {
    try {
        const q = query(collection(db, "Servicos"), where("ativo", "==", true));
        const querySnapshot = await getDocs(q);
        listaServicos.value = querySnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (error) {
        console.error("Erro ao buscar serviços:", error);
    }
};

onMounted(() => {
    fetchServicos();
    fetchDataParaDia(dataExibida.value);
});

const mudarDia = (dias) => {
  const novaData = new Date(dataExibida.value);
  novaData.setDate(novaData.getDate() + dias);
  dataExibida.value = novaData;
};
const irParaHoje = () => { dataExibida.value = new Date(); };

watch(dataExibida, (novaData) => {
  fetchDataParaDia(novaData);
});

const fecharModal = () => {
    modalAberto.value = false;
    editando.value = false; idAgendamentoEditando.value = null; nomeCliente.value = ''; telefoneCliente.value = ''; servicoSelecionado.value = null; horarioModal.value = ''; timestampModal.value = null;
};

const handleItemClick = (item) => {
    if (item.status === 'passado') return;
    horarioModal.value = item.horarioFormatado;
    timestampModal.value = item.timestamp;
    if (item.tipo === 'agendamento') {
        editando.value = true; idAgendamentoEditando.value = item.id; nomeCliente.value = item.NomeCliente; telefoneCliente.value = item.TelefoneCliente;
        servicoSelecionado.value = listaServicos.value.find(s => s.id === item.servicoId) || null;
    } else {
        editando.value = false; idAgendamentoEditando.value = null; nomeCliente.value = ''; telefoneCliente.value = ''; servicoSelecionado.value = null;
    }
    modalAberto.value = true;
};

/* Removido: declaração duplicada de salvarAgendamento */

// Adicione estas duas funções que estavam faltando no final
const getChipColor = status => ({ ocupado: 'primary', livre: 'success', passado: 'grey' }[status]);
const getChipIcon = status => ({ ocupado: 'mdi-account-check', livre: 'mdi-plus-box-outline', passado: 'mdi-cancel' }[status]);
const getStatusText = slot => slot.agendamento ? slot.agendamento.NomeCliente : { livre: 'Horário Vago', passado: 'Encerrado' }[slot.status];

// Cole as funções de salvar/excluir aqui para garantir
const salvarAgendamento = async () => {
    if (!nomeCliente.value || !servicoSelecionado.value) return alert('Nome e serviço são obrigatórios.');
    try {
        if (editando.value && idAgendamentoEditando.value) {
            await updateDoc(doc(db, 'Agendamentos', idAgendamentoEditando.value), { NomeCliente: nomeCliente.value, TelefoneCliente: telefoneCliente.value });
        } else {
            const dataDoAgendamento = new Date(timestampModal.value);
            await addDoc(collection(db, 'Agendamentos'), {
                NomeCliente: nomeCliente.value, TelefoneCliente: telefoneCliente.value, DataHoraISO: dataDoAgendamento.toISOString(),
                DataHoraFormatada: new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'America/Sao_Paulo' }).format(dataDoAgendamento),
                Status: 'Agendado', TimestampAgendamento: new Date().toISOString(),
                servicoId: servicoSelecionado.value.id, servicoNome: servicoSelecionado.value.nome, duracaoMinutos: servicoSelecionado.value.duracaoMinutos,
            });
        }
    } catch (error) { console.error("Erro ao salvar:", error); alert("Ocorreu um erro ao salvar."); }
    finally { fecharModal(); fetchDataParaDia(dataExibida.value); }
};
const excluirAgendamento = async () => {
    if (!idAgendamentoEditando.value || !confirm(`Excluir agendamento de ${nomeCliente.value}?`)) return;
    try { await deleteDoc(doc(db, 'Agendamentos', idAgendamentoEditando.value)); }
    finally { fecharModal(); fetchDataParaDia(dataExibida.value); }
};
</script>
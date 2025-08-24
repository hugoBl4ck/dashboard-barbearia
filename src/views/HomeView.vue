<template>
  <v-app :theme="isDark ? 'dark' : 'light'" class="modern-app">
    <v-app-bar app flat class="app-bar-style" :elevation="2">
      <v-container fluid class="d-flex align-center pa-0">
        <v-avatar image="/logo-barbearia.png" size="36" class="ml-4 mr-3"></v-avatar>
        <v-toolbar-title class="font-weight-bold text-h6">Gestão Barbearia</v-toolbar-title>
        <v-spacer></v-spacer>
        <div class="d-none d-md-flex align-center">
          <v-btn variant="text" @click="mudarDia(-1)"><ChevronLeft :size="20" /></v-btn>
          <v-btn variant="text" @click="irParaHoje" class="mx-2">Hoje</v-btn>
          <v-btn variant="text" @click="mudarDia(1)"><ChevronRight :size="20" /></v-btn>
        </div>
        <v-btn-toggle v-model="isDark" variant="outlined" divided class="ml-4 toggle-theme">
          <v-btn :value="false"><Sun :size="18" /></v-btn>
          <v-btn :value="true"><Moon :size="18" /></v-btn>
        </v-btn-toggle>
      </v-container>
    </v-app-bar>

    <v-main class="bg-surface">
      <v-container fluid>
        <v-row align="center" class="mb-4">
          <v-col><h1 class="text-h4 font-weight-bold">Agenda</h1><p class="text-subtitle-1 text-medium-emphasis">{{ dataFormatada }}</p></v-col>
        </v-row>
        
        <v-row>
          <v-col cols="12" sm="6" md="3">
            <v-card elevation="2" class="pa-4 kpi-card">
              <div class="d-flex align-center">
                <v-avatar color="blue-lighten-4" class="mr-4"><CalendarCheck2 :size="24" class="text-primary" /></v-avatar>
                <div>
                  <div class="text-h5 font-weight-bold">{{ agendamentosDoDia.length }}</div>
                  <div class="text-caption text-medium-emphasis">AGENDAMENTOS</div>
                </div>
              </div>
            </v-card>
          </v-col>
          <v-col cols="12" sm="6" md="3">
            <v-card elevation="2" class="pa-4 kpi-card">
              <div class="d-flex align-center">
                <v-avatar color="green-lighten-4" class="mr-4"><Percent :size="24" class="text-success" /></v-avatar>
                <div>
                  <div class="text-h5 font-weight-bold">{{ taxaOcupacao }}%</div>
                  <div class="text-caption text-medium-emphasis">OCUPAÇÃO</div>
                </div>
              </div>
            </v-card>
          </v-col>
           <v-col cols="12" sm="12" md="6">
            <v-card elevation="2" class="pa-4 kpi-card">
               <div v-if="proximoAgendamento" class="d-flex align-center">
                <v-avatar color="purple-lighten-4" class="mr-4"><UserCheck :size="24" color="#7E57C2" /></v-avatar>
                <div>
                  <p class="text-body-1 font-weight-bold">{{ proximoAgendamento.NomeCliente }}</p>
                  <p class="text-caption text-medium-emphasis">PRÓXIMO CLIENTE ÀS {{ proximoAgendamento.horarioFormatado }}</p>
                </div>
              </div>
              <div v-else class="d-flex align-center">
                <v-avatar color="grey-lighten-4" class="mr-4"><Coffee :size="24" class="text-grey-darken-1" /></v-avatar>
                <div>
                  <p class="text-body-1 font-weight-bold">Sem mais clientes</p>
                  <p class="text-caption text-medium-emphasis">HORA DO CAFÉ!</p>
                </div>
              </div>
            </v-card>
          </v-col>
        </v-row>

        <v-slide-y-transition mode="out-in">
          <div v-if="loading" class="text-center pa-16"><v-progress-circular indeterminate color="primary" size="64"></v-progress-circular></div>
          <div v-else-if="estaFechado">
            <v-card variant="tonal" class="text-center pa-16 d-flex flex-column justify-center align-center">
              <v-icon size="80" color="grey-lighten-1">mdi-door-closed-lock</v-icon>
              <h2 class="text-h5 mt-6">Barbearia Fechada</h2>
            </v-card>
          </div>
          <v-card v-else elevation="2" class="mt-6">
            <v-list class="py-0">
              <v-list-item
                v-for="(item, index) in agendaDoDia"
                :key="item.timestamp"
                class="list-item-hover"
                :class="{ 'border-bottom': index < agendaDoDia.length - 1 }"
                @click="handleItemClick(item)"
                :disabled="item.tipo === 'passado'"
              >
                <template v-slot:prepend>
                  <div class="mr-6 text-center" style="width: 70px;">
                    <span class="text-h6 font-weight-bold" :class="{'text-medium-emphasis': item.tipo !== 'livre'}">{{ item.horarioFormatado }}</span>
                  </div>
                </template>
                <v-chip :color="getChipColor(item.tipo)" :variant="item.tipo === 'livre' ? 'outlined' : 'flat'" label>
                  <component :is="getChipIcon(item.tipo)" :size="16" class="mr-2" />
                  {{ item.titulo }}
                </v-chip>
                <div v-if="item.tipo === 'agendamento'" class="text-caption text-medium-emphasis mt-1 ml-1">{{ item.detalhes }}</div>
              </v-list-item>
            </v-list>
          </v-card>
        </v-slide-y-transition>
        
        <v-dialog v-model="modalAberto" max-width="500px" persistent>
            <v-card class="pa-4">
              <v-card-title class="text-h5">{{ editando ? 'Editar' : 'Novo' }} Agendamento</v-card-title>
              <v-card-subtitle>{{ dataFormatada }} às {{ horarioModal }}</v-card-subtitle>
              <v-card-text>
                <v-select v-model="servicoSelecionado" :items="listaServicos" item-title="nome" item-value="id" label="Serviço" variant="outlined" density="compact" return-object :disabled="editando"></v-select>
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
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
.modern-app { font-family: 'Inter', sans-serif; }
.bg-surface { background-color: rgb(var(--v-theme-surface)); }
.app-bar-style { background-color: rgba(var(--v-theme-surface), 0.8) !important; backdrop-filter: blur(10px); }
.list-item-hover { transition: background-color 0.2s ease-in-out; }
.list-item-hover:hover:not([disabled]) { background-color: rgba(var(--v-theme-on-surface), 0.04); cursor: pointer; }
.border-bottom { border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.08); }
.kpi-card { height: 100%; }
</style>

<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { db } from '@/firebase';
import { collection, query, where, getDocs, orderBy, doc, getDoc, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { ChevronLeft, ChevronRight, Sun, Moon, CalendarCheck2, Percent, UserCheck, Coffee, ClipboardPlus, Scissors, User } from 'lucide-vue-next';

// --- ESTADO REATIVO ---
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

// --- PROPRIEDADES COMPUTADAS ---
const dataFormatada = computed(() => dataExibida.value.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' }));
const estaFechado = computed(() => !loading.value && !configHorarios.value);

const totalSlotsDisponiveis = computed(() => {
    if (!configHorarios.value) return 0;
    const parseTime = str => str ? parseInt(str.split(':')[0]) * 60 + parseInt(str.split(':')[1]) : 0;
    const inicio = parseTime(configHorarios.value.InicioManha);
    const fim = parseTime(configHorarios.value.FimTarde || configHorarios.value.FimManha);
    const almoco = parseTime(configHorarios.value.InicioTarde) - parseTime(configHorarios.value.FimManha);
    return (fim - inicio - (almoco > 0 ? almoco : 0)) / 30; // Slots de 30 minutos
});

const taxaOcupacao = computed(() => {
    if (totalSlotsDisponiveis.value === 0) return 0;
    const slotsOcupados = agendamentosDoDia.value.length;
    return Math.round((slotsOcupados / totalSlotsDisponiveis.value) * 100);
});

const proximoAgendamento = computed(() => {
    const agora = new Date();
    const proximo = agendamentosDoDia.value
        .filter(a => new Date(a.DataHoraISO) > agora)
        .sort((a, b) => new Date(a.DataHoraISO) - new Date(b.DataHoraISO))[0];
    if (proximo) {
        proximo.horarioFormatado = new Date(proximo.DataHoraISO).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    }
    return proximo;
});

const agendaDoDia = computed(() => {
    if (!configHorarios.value) return [];
    
    const agenda = [];
    const parseTime = str => str ? parseInt(str.split(':')[0]) * 60 + parseInt(str.split(':')[1]) : 0;
    const formatTime = totalMinutes => `${String(Math.floor(totalMinutes / 60)).padStart(2, '0')}:${String(totalMinutes % 60).padStart(2, '0')}`;
    
    const minutoInicio = parseTime(configHorarios.value.InicioManha);
    const minutoFim = parseTime(configHorarios.value.FimTarde || configHorarios.value.FimManha);
    const minutoAlmocoInicio = parseTime(configHorarios.value.FimManha);
    const minutoAlmocoFim = parseTime(configHorarios.value.InicioTarde);
    const INTERVALO_MINUTOS = 30;

    const agendamentosMap = new Map();
    agendamentosDoDia.value.forEach(ag => {
        const minutoAgendamento = parseTime(new Date(ag.DataHoraISO).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
        agendamentosMap.set(minutoAgendamento, ag);
    });

    for (let minuto = minutoInicio; minuto < minutoFim; minuto += INTERVALO_MINUTOS) {
        if (minutoAlmocoInicio && minutoAlmocoFim && minuto >= minutoAlmocoInicio && minuto < minutoAlmocoFim) {
            continue;
        }
        
        const dataSlot = new Date(dataExibida.value);
        dataSlot.setHours(Math.floor(minuto/60), minuto%60, 0, 0);

        const agendamento = agendamentosMap.get(minuto);
        
        if (agendamento) {
            agenda.push({
                tipo: 'agendamento', ...agendamento, horarioFormatado: formatTime(minuto),
                titulo: agendamento.NomeCliente, detalhes: `${agendamento.servicoNome} - ${agendamento.duracaoMinutos} min`,
                timestamp: dataSlot.getTime()
            });
        } else {
             const estaNoPassado = dataSlot < new Date() && dataExibida.value.toDateString() === new Date().toDateString();
            agenda.push({
                tipo: estaNoPassado ? 'passado' : 'livre',
                horarioFormatado: formatTime(minuto),
                titulo: estaNoPassado ? 'Encerrado' : 'Horário Vago',
                timestamp: dataSlot.getTime()
            });
        }
    }
    return agenda;
});

// --- BUSCA DE DADOS ---
const fetchAgendamentosEHorarios = async (data) => {
    loading.value = true;
    configHorarios.value = null;
    agendamentosDoDia.value = [];
    try {
        const diaDaSemana = data.getDay();
        const docRef = doc(db, 'Horarios', String(diaDaSemana));
        const docSnap = await getDoc(docRef);

        if (docSnap.exists() && docSnap.data().InicioManha) {
            configHorarios.value = docSnap.data();
            const inicioDia = new Date(data); inicioDia.setHours(0, 0, 0, 0);
            const fimDia = new Date(data); fimDia.setHours(23, 59, 59, 999);
            const q = query(collection(db, 'Agendamentos'), where('DataHoraISO', '>=', inicioDia.toISOString()), where('DataHoraISO', '<=', fimDia.toISOString()), where('Status', '==', 'Agendado'), orderBy('DataHoraISO'));
            const querySnapshot = await getDocs(q);
            agendamentosDoDia.value = querySnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        }
    } catch (error) {
        console.error("Erro ao buscar dados do dia:", error);
    } finally {
        loading.value = false;
    }
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
    fetchAgendamentosEHorarios(dataExibida.value);
});

// ---- NAVEGAÇÃO ----
const mudarDia = (dias) => {
  const novaData = new Date(dataExibida.value);
  novaData.setDate(novaData.getDate() + dias);
  dataExibida.value = novaData;
};
const irParaHoje = () => { dataExibida.value = new Date(); };

watch(dataExibida, (novaData) => {
  fetchAgendamentosEHorarios(novaData);
});

// ---- LÓGICA DO MODAL (CRUD) ----
const fecharModal = () => {
    modalAberto.value = false; editando.value = false; idAgendamentoEditando.value = null; nomeCliente.value = ''; telefoneCliente.value = ''; servicoSelecionado.value = null; horarioModal.value = ''; timestampModal.value = null;
};
const handleItemClick = (item) => {
    if (item.tipo === 'passado') return;
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
    finally { fecharModal(); fetchAgendamentosEHorarios(dataExibida.value); }
};
const excluirAgendamento = async () => {
    if (!idAgendamentoEditando.value || !confirm(`Excluir agendamento de ${nomeCliente.value}?`)) return;
    try { await deleteDoc(doc(db, 'Agendamentos', idAgendamentoEditando.value)); }
    finally { fecharModal(); fetchAgendamentosEHorarios(dataExibida.value); }
};

// ---- FUNÇÕES AUXILIARES DE ESTILO ----
const getChipColor = (tipo) => ({ agendamento: 'primary', livre: 'success', ocupado: 'grey-darken-1', passado: 'grey-lighten-1' }[tipo]);
const getChipIcon = (tipo) => ({ agendamento: User, livre: ClipboardPlus, ocupado: Scissors, passado: Scissors }[tipo]);
const getStatusText = (item) => {
    if (item.tipo === 'agendamento') return item.titulo;
    return item.titulo;
};
</script>
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
          <v-col>
            <h1 class="text-h4 font-weight-bold">Agenda</h1>
            <p class="text-subtitle-1 text-medium-emphasis">{{ dataFormatada }}</p>
          </v-col>
        </v-row>

        <v-slide-y-transition mode="out-in">
          <div v-if="loading" class="text-center pa-16">
            <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
          </div>
          <div v-else-if="estaFechado">
            <v-card variant="tonal" class="text-center pa-16 d-flex flex-column justify-center align-center">
              <v-icon size="80" color="grey-lighten-1">mdi-door-closed-lock</v-icon>
              <h2 class="text-h5 mt-6">Barbearia Fechada</h2>
            </v-card>
          </div>
          <v-card v-else elevation="2">
            <v-list class="py-0">
              <v-list-item
                v-for="(item, index) in agendaDoDia"
                :key="item.timestamp"
                class="list-item-hover"
                :class="{ 'border-bottom': index < agendaDoDia.length - 1 }"
                @click="handleItemClick(item)"
              >
                <template v-slot:prepend>
                  <div class="mr-6 text-center" style="width: 70px;">
                    <span class="text-h6 font-weight-bold">{{ item.horarioFormatado }}</span>
                  </div>
                </template>
                <v-chip :color="item.tipo === 'agendamento' ? 'primary' : 'success'" variant="flat" label>
                  <v-icon start :icon="item.tipo === 'agendamento' ? 'mdi-account-check' : 'mdi-plus-box-outline'"></v-icon>
                  {{ item.titulo }}
                </v-chip>
                <div v-if="item.tipo === 'agendamento'" class="text-caption text-medium-emphasis mt-1 ml-1">{{ item.detalhes }}</div>
                <div v-else class="text-caption text-medium-emphasis mt-1 ml-1">Clique para adicionar um novo agendamento</div>
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
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
.modern-app { font-family: 'Inter', sans-serif; }
.bg-surface { background-color: rgb(var(--v-theme-surface)); }
.app-bar-style { background-color: rgba(var(--v-theme-surface), 0.8) !important; backdrop-filter: blur(10px); }
.list-item-hover { transition: background-color 0.2s ease-in-out; }
.list-item-hover:hover { background-color: rgba(var(--v-theme-on-surface), 0.04); cursor: pointer; }
.border-bottom { border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.08); }
</style>

<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { db } from '@/firebase';
import { collection, query, where, getDocs, orderBy, doc, getDoc, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';

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

const agendaDoDia = computed(() => {
    if (!configHorarios.value) return [];
    const agenda = [];
    const parseTime = str => {
        if (!str) return 0;
        // Trata string ISO ou formato hora local
        if (str.includes('T')) {
            const date = new Date(str);
            return date.getHours() * 60 + date.getMinutes();
        }
        return parseInt(str.split(':')[0]) * 60 + parseInt(str.split(':')[1]);
    };
    const formatTime = totalMinutes => 
        `${String(Math.floor(totalMinutes / 60)).padStart(2, '0')}:${String(totalMinutes % 60).padStart(2, '0')}`;

    let minutoAtual = parseTime(configHorarios.value.InicioManha);
    const fimManha = parseTime(configHorarios.value.FimManha);
    const inicioTarde = parseTime(configHorarios.value.InicioTarde);
    const fimDoDia = parseTime(configHorarios.value.FimTarde);
    
    const intervaloMinutos = 30;
    console.log('Agendamentos do dia:', agendamentosDoDia.value); // Debug

    while (minutoAtual <= fimDoDia) {
        if (minutoAtual === fimManha) {
            minutoAtual = inicioTarde;
            continue;
        }

        const dataSlot = new Date(dataExibida.value);
        dataSlot.setHours(Math.floor(minutoAtual/60), minutoAtual%60, 0, 0);
        
        const agendamentoExistente = agendamentosDoDia.value.find(ag => {
            const horaAgendamento = parseTime(ag.DataHoraISO);
            return horaAgendamento === minutoAtual;
        });

        if (agendamentoExistente) {
            agenda.push({
                tipo: 'agendamento',
                ...agendamentoExistente,
                horarioFormatado: formatTime(minutoAtual),
                titulo: agendamentoExistente.NomeCliente,
                detalhes: `${agendamentoExistente.servicoNome} - ${agendamentoExistente.duracaoMinutos} min`,
                timestamp: dataSlot.getTime()
            });
            minutoAtual += parseInt(agendamentoExistente.duracaoMinutos) || intervaloMinutos;
        } else {
            agenda.push({
                tipo: 'livre',
                horarioFormatado: formatTime(minutoAtual),
                titulo: 'Horário Vago',
                timestamp: dataSlot.getTime()
            });
            minutoAtual += intervaloMinutos;
        }
    }
    return agenda;
});

const fetchServicos = async () => {
    try {
        const servicosRef = collection(db, "Servicos");
        const q = query(servicosRef, where("ativo", "==", true));
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
            console.warn('Nenhum serviço encontrado');
            return;
        }

        listaServicos.value = querySnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                nome: data.nome || data.Nome,
                duracaoMinutos: data.duracaoMinutos || data.duracao || 30,
                ativo: true
            };
        });
        
        console.log('Serviços carregados:', listaServicos.value);
    } catch (error) {
        console.error('Erro ao carregar serviços:', error);
    }
};

const fetchDataParaDia = async (data) => {
    try {
        loading.value = true;
        const diaDaSemana = data.getDay();
        const horariosRef = doc(db, 'Horarios', String(diaDaSemana));
        const horariosSnap = await getDoc(horariosRef);

        if (!horariosSnap.exists()) {
            console.warn('Horários não encontrados para este dia');
            configHorarios.value = null;
            return;
        }

        configHorarios.value = horariosSnap.data();
        console.log('Horários configurados:', configHorarios.value); // Debug

        const inicioDia = new Date(data);
        inicioDia.setHours(0, 0, 0, 0);
        
        const fimDia = new Date(data);
        fimDia.setHours(23, 59, 59, 999);

        const agendamentosRef = collection(db, 'Agendamentos');
        const q = query(
            agendamentosRef,
            where('DataHoraISO', '>=', inicioDia.toISOString()),
            where('DataHoraISO', '<=', fimDia.toISOString()),
            where('Status', '==', 'Agendado'),
            orderBy('DataHoraISO')
        );

        const querySnapshot = await getDocs(q);
        agendamentosDoDia.value = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        
        console.log('Agendamentos encontrados:', agendamentosDoDia.value);
    } catch (error) {
        console.error('Erro ao buscar dados:', error);
    } finally {
        loading.value = false;
    }
};

onMounted(() => {
    fetchServicos();
    fetchDataParaDia(dataExibida.value);
});

// ---- NAVEGAÇÃO ----
const mudarDia = (dias) => {
  const novaData = new Date(dataExibida.value);
  novaData.setDate(novaData.getDate() + dias);
  dataExibida.value = novaData;
};
const irParaHoje = () => { dataExibida.value = new Date(); };

watch(dataExibida, (novaData) => {
  fetchDataParaDia(novaData);
});

// ---- LÓGICA DO MODAL (CRUD) ----
const fecharModal = () => {
    modalAberto.value = false;
    editando.value = false; idAgendamentoEditando.value = null; nomeCliente.value = ''; telefoneCliente.value = ''; servicoSelecionado.value = null; horarioModal.value = ''; timestampModal.value = null;
};

const handleItemClick = (item) => {
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

const abrirModalParaNovoVazio = () => {
    const primeiroSlotLivre = agendaDoDia.value.find(item => item.tipo === 'livre');
    if (primeiroSlotLivre) handleItemClick(primeiroSlotLivre); else alert("Não há horários vagos hoje.");
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
    finally { fecharModal(); fetchDataParaDia(dataExibida.value); }
};

const excluirAgendamento = async () => {
    if (!idAgendamentoEditando.value || !confirm(`Excluir agendamento de ${nomeCliente.value}?`)) return;
    try { await deleteDoc(doc(db, 'Agendamentos', idAgendamentoEditando.value)); }
    finally { fecharModal(); fetchDataParaDia(dataExibida.value); }
};
</script>
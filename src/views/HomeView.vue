<template>
  <v-app :theme="isDark ? 'dark' : 'light'" class="modern-app">
    <v-app-bar app flat class="app-bar-style" :elevation="2">
      <v-container fluid class="d-flex align-center pa-0">
        <v-avatar image="/logo-barbearia.png" size="36" class="ml-4 mr-3"></v-avatar>
        <v-toolbar-title class="font-weight-bold text-h6">Gestão Barbearia</v-toolbar-title>
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
              <template v-for="(item, index) in agendaDoDia" :key="item.timestamp">
                <v-list-item class="list-item-hover" :class="{ 'border-bottom': index < agendaDoDia.length - 1 }" @click="handleItemClick(item)">
                  <template v-slot:prepend>
                    <div class="mr-6 text-center" style="width: 70px;">
                      <span class="text-h6 font-weight-bold">{{ item.horarioFormatado }}</span>
                    </div>
                  </template>
                  <v-chip :color="item.tipo === 'agendamento' ? 'primary' : 'success'" variant="flat" label>
                    <v-icon start :icon="item.tipo === 'agendamento' ? 'mdi-account-check' : 'mdi-clock-outline'"></v-icon>
                    {{ item.titulo }}
                  </v-chip>
                  <div v-if="item.tipo === 'agendamento'" class="text-caption text-medium-emphasis mt-1 ml-1">{{ item.detalhes }}</div>
                </v-list-item>
              </template>
            </v-list>
          </v-card>
        </v-slide-y-transition>

        <v-fab icon="mdi-plus" class="fab-gradient" location="bottom end" size="large" fixed app appear @click="abrirModalParaNovoVazio"></v-fab>

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

    const parseTime = str => str ? parseInt(str.split(':')[0]) * 60 + parseInt(str.split(':')[1]) : null;
    const formatTime = totalMinutes => `${String(Math.floor(totalMinutes / 60)).padStart(2, '0')}:${String(totalMinutes % 60).padStart(2, '0')}`;

    let minutoAtual = parseTime(configHorarios.value.InicioManha);
    const fimDoDia = parseTime(configHorarios.value.FimTarde || configHorarios.value.FimManha);
    const agenda = [];

    const agendamentosOrdenados = [...agendamentosDoDia.value].sort((a, b) => new Date(a.DataHoraISO) - new Date(b.DataHoraISO));

    agendamentosOrdenados.forEach(ag => {
        const inicioAgendamentoMinutos = parseTime(new Date(ag.DataHoraISO).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));

        if (minutoAtual < inicioAgendamentoMinutos) {
            const dataSlotLivre = new Date(dataExibida.value);
            dataSlotLivre.setHours(Math.floor(minutoAtual / 60), minutoAtual % 60, 0, 0);
            agenda.push({
                tipo: 'livre',
                horarioFormatado: formatTime(minutoAtual),
                titulo: 'Horário Vago',
                timestamp: dataSlotLivre.getTime()
            });
        }
        agenda.push({
            tipo: 'agendamento',
            ...ag,
            horarioFormatado: formatTime(inicioAgendamentoMinutos),
            titulo: ag.NomeCliente,
            detalhes: `${ag.servicoNome} - ${ag.duracaoMinutos} min`
        });
        minutoAtual = inicioAgendamentoMinutos + (ag.duracaoMinutos || 60);
    });

    if (minutoAtual < fimDoDia) {
        const dataSlotLivreFinal = new Date(dataExibida.value);
        dataSlotLivreFinal.setHours(Math.floor(minutoAtual / 60), minutoAtual % 60, 0, 0);
        agenda.push({
            tipo: 'livre',
            horarioFormatado: formatTime(minutoAtual),
            titulo: 'Horário Vago',
            timestamp: dataSlotLivreFinal.getTime()
        });
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
};

const fetchServicos = async () => {
    try {
        const q = query(collection(db, "Servicos"), where("ativo", "==", true));
        const querySnapshot = await getDocs(q);
        listaServicos.value = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        console.log("Serviços carregados:", listaServicos.value);
    } catch (error) {
        console.error("Erro ao buscar serviços:", error);
    }
};

onMounted(() => {
    fetchData(dataExibida.value);
    fetchServicos();
});

const diaAnterior = () => { const novaData = new Date(dataExibida.value); novaData.setDate(novaData.getDate() - 1); dataExibida.value = novaData; fetchData(dataExibida.value); };
const proximoDia = () => { const novaData = new Date(dataExibida.value); novaData.setDate(novaData.getDate() + 1); dataExibida.value = novaData; fetchData(dataExibida.value); };
const irParaHoje = () => { dataExibida.value = new Date(); fetchData(dataExibida.value); };

const fecharModal = () => {
    modalAberto.value = false;
    editando.value = false; idAgendamentoEditando.value = null; nomeCliente.value = ''; telefoneCliente.value = ''; servicoSelecionado.value = null; horarioModal.value = ''; timestampModal.value = null;
};

const handleItemClick = (item) => {
    horarioModal.value = item.horarioFormatado;
    timestampModal.value = item.timestamp;
    if (item.tipo === 'agendamento') {
        editando.value = true;
        idAgendamentoEditando.value = item.id;
        nomeCliente.value = item.NomeCliente;
        telefoneCliente.value = item.TelefoneCliente;
        servicoSelecionado.value = listaServicos.value.find(s => s.id === item.servicoId) || null;
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
    const primeiroSlotLivre = agendaDoDia.value.find(item => item.tipo === 'livre');
    if (primeiroSlotLivre) {
        handleItemClick(primeiroSlotLivre);
    } else {
        alert("Não há horários vagos hoje.");
    }
};

const salvarAgendamento = async () => {
    if (!nomeCliente.value || !servicoSelecionado.value) return alert('Nome e serviço são obrigatórios.');
    try {
        if (editando.value && idAgendamentoEditando.value) {
            await updateDoc(doc(db, 'Agendamentos', idAgendamentoEditando.value), {
                NomeCliente: nomeCliente.value,
                TelefoneCliente: telefoneCliente.value,
            });
        } else {
            const dataDoAgendamento = new Date(timestampModal.value);
            await addDoc(collection(db, 'Agendamentos'), {
                NomeCliente: nomeCliente.value,
                TelefoneCliente: telefoneCliente.value,
                DataHoraISO: dataDoAgendamento.toISOString(),
                DataHoraFormatada: new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'America/Sao_Paulo' }).format(dataDoAgendamento),
                Status: 'Agendado',
                TimestampAgendamento: new Date().toISOString(),
                servicoId: servicoSelecionado.value.id,
                servicoNome: servicoSelecionado.value.nome,
                duracaoMinutos: servicoSelecionado.value.duracaoMinutos,
            });
        }
    } catch (error) {
        console.error("Erro ao salvar:", error);
        alert("Ocorreu um erro ao salvar.");
    } finally {
        fecharModal();
        fetchData(dataExibida.value);
    }
};

const excluirAgendamento = async () => {
    if (!idAgendamentoEditando.value || !confirm(`Excluir agendamento de ${nomeCliente.value}?`)) return;
    try {
        await deleteDoc(doc(db, 'Agendamentos', idAgendamentoEditando.value));
    } finally {
        fecharModal();
        fetchData(dataExibida.value);
    }
};
</script>
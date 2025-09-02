<template>
  <v-container fluid class="pa-6 page-container">
    <!-- NAVEGAÇÃO DE DATA -->
    <v-card flat class="d-flex align-center pa-2 mb-6 date-nav-card" color="surface">
      <v-btn variant="text" icon="mdi-chevron-left" @click="mudarDia(-1)"></v-btn>
      <v-spacer></v-spacer>
      <div class="text-center">
        <h2 class="text-h6 font-weight-medium">{{ dataFormatada.diaDaSemana }}</h2>
        <p class="text-caption text-medium-emphasis">{{ dataFormatada.restoDaData }}</p>
      </div>
      <v-spacer></v-spacer>
      <v-btn variant="text" icon="mdi-chevron-right" @click="mudarDia(1)"></v-btn>
    </v-card>
    
    <!-- CARDS DE INDICADORES (KPIs) -->
    <v-row>
      <v-col cols="12" sm="6" lg="3">
        <v-card elevation="0" class="kpi-card" color="blue">
          <div class="d-flex justify-space-between align-center">
            <div><p class="kpi-label">AGENDAMENTOS (DIA)</p><p class="kpi-number">{{ todayAppointments.length }}</p></div>
            <v-icon size="48" class="kpi-icon">mdi-calendar-check</v-icon>
          </div>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6" lg="3">
        <v-card elevation="0" class="kpi-card" color="green">
          <div class="d-flex justify-space-between align-center">
            <div><p class="kpi-label">FATURAMENTO (DIA)</p><p class="kpi-number">{{ totalRevenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) }}</p></div>
            <v-icon size="48" class="kpi-icon">mdi-currency-usd</v-icon>
          </div>
        </v-card>
      </v-col>
      <v-col cols="12" sm="12" lg="6">
        <v-card elevation="0" class="kpi-card pa-4" color="deep-purple-darken-1">
          <div v-if="proximoAgendamento" class="d-flex align-center fill-height">
            <v-avatar color="white" class="mr-4"><v-icon color="deep-purple-darken-1">mdi-account-clock</v-icon></v-avatar>
            <div>
              <p class="kpi-label">PRÓXIMO CLIENTE</p>
              <p class="text-h6 font-weight-bold">{{ proximoAgendamento.NomeCliente }} às {{ proximoAgendamento.horarioFormatado }}</p>
            </div>
          </div>
          <div v-else class="d-flex align-center fill-height">
            <v-icon class="mr-4">mdi-coffee</v-icon>
            <p>Sem mais clientes por hoje.</p>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <!-- AGENDA DO DIA (GRID) -->
    <v-card elevation="0" class="mt-6">
      <v-card-title class="d-flex align-center">
        <v-icon class="mr-2">mdi-clock-outline</v-icon>Agenda do Dia
        <v-spacer></v-spacer>
        <v-btn color="primary" @click="abrirModalParaNovoVazio" prepend-icon="mdi-plus">Novo Agendamento</v-btn>
      </v-card-title>
      <v-divider></v-divider>
      
      <div v-if="loading" class="text-center pa-16"><v-progress-circular indeterminate color="primary" size="64"></v-progress-circular></div>
      <div v-else-if="estaFechado" class="text-center pa-16"><v-icon size="64" color="grey">mdi-door-closed-lock</v-icon><p class="mt-4 text-medium-emphasis">Barbearia Fechada</p></div>
      <v-container v-else fluid>
        <v-row dense>
          <v-col v-for="slot in agendaDoDia" :key="slot.timestamp" cols="12" sm="6" md="4" lg="3">
            <v-card class="slot-card" :variant="slot.tipo === 'livre' ? 'outlined' : 'flat'" :color="getSlotColor(slot)" @click="handleItemClick(slot)" :disabled="slot.tipo === 'passado'">
              <v-card-text class="text-center">
                <div class="font-weight-bold">{{ slot.horarioFormatado }}</div>
                <div class="text-subtitle-2 truncate-text" v-if="slot.tipo === 'agendamento'">{{ slot.titulo }}</div>
                <div class="text-caption" v-else>{{ slot.titulo }}</div>
                <div class="text-body-2 font-weight-medium" v-if="slot.tipo === 'agendamento'" style="color: rgba(255, 255, 255, 0.9)">{{ slot.detalhes }}</div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </v-card>

    <v-dialog v-model="modalAberto" max-width="500px" persistent>
      <v-card class="pa-4">
        <v-card-title class="text-h5">{{ editando ? 'Editar' : 'Novo' }} Agendamento</v-card-title>
        <v-card-subtitle>{{ dataFormatada.diaDaSemana }}, {{ dataFormatada.restoDaData }} às {{ horarioModal }}</v-card-subtitle>
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
</template>

<style scoped>
.page-container { font-family: 'Poppins', sans-serif; }
.date-nav-card { border-radius: 12px; }
.kpi-card { color: white !important; border-radius: 12px; padding: 24px !important; }
.kpi-label { text-transform: uppercase; font-size: 0.75rem; opacity: 0.8; }
.kpi-number { font-size: 2.25rem; font-weight: 700; line-height: 1; }
.kpi-icon { opacity: 0.5; }
.slot-card { transition: all 0.2s ease-in-out; cursor: pointer; height: 100px; display: flex; flex-direction: column; justify-content: center; border-radius: 12px; }
.slot-card:hover:not([disabled]) { transform: translateY(-4px); box-shadow: 0 8px 16px rgba(0,0,0,0.1); }
.truncate-text { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
</style>

<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { db } from '@/firebase';
import { collection, query, where, getDocs, orderBy, doc, getDoc, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';

const loading = ref(true);
const allAppointments = ref([]);
const dataExibida = ref(new Date());
const configHorarios = ref(null);
const listaServicos = ref([]);
const modalAberto = ref(false);
const nomeCliente = ref('');
const telefoneCliente = ref('');
const servicoSelecionado = ref(null);
const editando = ref(false);
const idAgendamentoEditando = ref(null);
const horarioModal = ref('');
const timestampModal = ref(null);

const dataFormatada = computed(() => {
    const d = dataExibida.value;
    return {
        diaDaSemana: d.toLocaleDateString('pt-BR', { weekday: 'long' }),
        restoDaData: d.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' })
    };
});
const estaFechado = computed(() => !loading.value && !configHorarios.value);
const todayAppointments = computed(() => {
  const selectedDateStr = dataExibida.value.toISOString().split('T')[0];
  return allAppointments.value.filter(apt => new Date(apt.DataHoraISO).toISOString().split('T')[0] === selectedDateStr);
});
const totalClients = computed(() => new Set(allAppointments.value.map(apt => apt.TelefoneCliente)).size);
const completedToday = computed(() => todayAppointments.value.filter(apt => apt.Status === 'Concluído'));
const totalRevenue = computed(() => completedToday.value.reduce((sum, apt) => sum + (apt.preco || 0), 0));
const proximoAgendamento = computed(() => {
  const agora = new Date();
  const proximo = todayAppointments.value
    .filter(a => new Date(a.DataHoraISO) > agora && a.Status === 'Agendado')
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
    todayAppointments.value.forEach(ag => {
        const inicio = parseTime(new Date(ag.DataHoraISO).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
        agendamentosMap.set(inicio, ag);
    });

    for (let minuto = minutoInicio; minuto < minutoFim; minuto += INTERVALO_MINUTOS) {
        if (minutoAlmocoInicio && minutoAlmocoFim && minuto >= minutoAlmocoInicio && minuto < minutoAlmocoFim) {
            continue;
        }
        
        const dataSlot = new Date(dataExibida.value);
        dataSlot.setHours(Math.floor(minuto/60), minuto%60, 0, 0);
        const agendamento = agendamentosMap.get(minuto);
        const estaNoPassado = dataSlot < new Date() && dataExibida.value.toDateString() === new Date().toDateString();
        
        if (agendamento) {
            agenda.push({
                tipo: estaNoPassado ? 'passado' : 'agendamento',
                ...agendamento,
                horarioFormatado: formatTime(minuto),
                titulo: agendamento.NomeCliente,
                detalhes: agendamento.servicoNome,
                timestamp: dataSlot.getTime()
            });
        } else {
            agenda.push({
                tipo: estaNoPassado ? 'passado' : 'livre',
                horarioFormatado: formatTime(minuto),
                titulo: estaNoPassado ? 'Encerrado' : 'Disponível',
                timestamp: dataSlot.getTime()
            });
        }
    }
    return agenda;
});
const fetchData = async () => {
  loading.value = true;
  try {
    const agendamentosQuery = query(collection(db, "Agendamentos"));
    const servicosQuery = query(collection(db, "Servicos"), where("ativo", "==", true));
    const [agendamentosSnapshot, servicosSnapshot] = await Promise.all([
      getDocs(agendamentosQuery),
      getDocs(servicosQuery)
    ]);
    allAppointments.value = agendamentosSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    listaServicos.value = servicosSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    await fetchConfigHorarios(dataExibida.value);
  } catch (error) { console.error("Erro ao buscar dados:", error); } 
  finally { loading.value = false; }
};
const fetchConfigHorarios = async (data) => {
  const diaDaSemana = data.getDay();
  const docRef = doc(db, 'Horarios', String(diaDaSemana));
  const docSnap = await getDoc(docRef);
  configHorarios.value = (docSnap.exists() && docSnap.data().InicioManha) ? docSnap.data() : null;
};
watch(dataExibida, async (novaData) => {
  loading.value = true;
  await fetchConfigHorarios(novaData);
  loading.value = false;
});
onMounted(() => { fetchData(); });
const mudarDia = (dias) => { const novaData = new Date(dataExibida.value); novaData.setDate(novaData.getDate() + dias); dataExibida.value = novaData; };
const irParaHoje = () => { dataExibida.value = new Date(); };
const fecharModal = () => {
    modalAberto.value = false;
    editando.value = false; idAgendamentoEditando.value = null; nomeCliente.value = ''; telefoneCliente.value = ''; servicoSelecionado.value = null; horarioModal.value = ''; timestampModal.value = null;
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
                servicoId: servicoSelecionado.value.id, servicoNome: servicoSelecionado.value.nome, preco: servicoSelecionado.value.preco, duracaoMinutos: servicoSelecionado.value.duracaoMinutos,
            });
        }
    } catch (error) { console.error("Erro ao salvar:", error); alert("Ocorreu um erro ao salvar."); }
    finally { fecharModal(); fetchData(); }
};
const excluirAgendamento = async () => {
    if (!idAgendamentoEditando.value || !confirm(`Excluir agendamento de ${nomeCliente.value}?`)) return;
    try { await deleteDoc(doc(db, 'Agendamentos', idAgendamentoEditando.value)); }
    finally { fecharModal(); fetchData(); }
};
const getSlotColor = (slot) => {
  if (slot.tipo === 'agendamento') return 'primary';
  if (slot.tipo === 'passado') return 'grey-lighten-2';
  return undefined;
};
</script>
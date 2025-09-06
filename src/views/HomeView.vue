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

    <!-- ÁREA PRINCIPAL COM LAYOUT CONDICIONAL -->
<v-card elevation="0" class="mt-6">
  <v-card-title class="d-flex align-center">
    <v-icon class="mr-2">mdi-clock-outline</v-icon>Agenda do Dia
    <v-spacer></v-spacer>
    <v-btn color="primary" @click="abrirModalParaNovoVazio" prepend-icon="mdi-plus">Novo Agendamento</v-btn>
  </v-card-title>
  <v-divider></v-divider>
  
  <div class="d-flex">
    <div class="flex-grow-1">
      <div v-if="loading" class="text-center pa-16">
        <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
      </div>
      <div v-else-if="estaFechado" class="text-center pa-16">
        <v-icon size="64" color="grey">mdi-door-closed-lock</v-icon>
        <p class="mt-4 text-medium-emphasis">Barbearia Fechada</p>
      </div>
      <v-container v-else fluid>
        <v-row dense>
          <v-col v-for="slot in agendaDoDia" :key="slot.timestamp" cols="12" sm="6" md="4" lg="3">
            <v-card 
              class="slot-card" 
              :variant="getSlotVariant(slot)"
              :color="getSlotColor(slot)" 
              @click="handleItemClick(slot)" 
              :disabled="slot.tipo === 'passado'">
              <v-card-text class="pa-3 text-center">
                <div class="font-weight-bold mb-1" :class="getTimeTextColor(slot)">{{ slot.horarioFormatado }}</div>
                <v-chip size="small" :color="getChipColor(slot.status)" class="mb-1">
                  <v-icon start size="16" :color="getChipIconColor(slot.status)">{{ getChipIcon(slot.status) }}</v-icon>
                  <span :class="getChipTextColor(slot.status)">{{ slot.titulo }}</span>
                </v-chip>
                <div class="text-caption truncate-text mb-1" :class="getDetailsTextColor(slot)" v-if="slot.tipo === 'agendamento' || slot.tipo === 'cancelado'">{{ slot.detalhes }}</div>
                <div class="text-caption font-weight-bold" :class="getPriceTextColor(slot)" v-if="(slot.tipo === 'agendamento' || slot.tipo === 'cancelado') && slot.preco">
                  {{ (slot.preco || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) }}
                </div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </div>

    <div v-if="$vuetify.display.mdAndUp && showChatPanel" class="chat-sidebar">
      <v-card flat height="100%" class="chat-container">
        <v-card-title class="d-flex align-center bg-primary text-white">
          <v-icon class="mr-2">mdi-robot-excited</v-icon>Assistente Virtual
          <v-spacer></v-spacer>
          <v-btn icon variant="text" @click="toggleChatPanel" size="small">
            <v-icon color="white">mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <div class="typebot-wrapper">
          <TypebotChat :typebot-id="typebotId" @on-open="onChatOpen" />
        </div>
      </v-card>
    </div>
  </div>
</v-card>

<TypebotChat v-if="!showChatPanel || $vuetify.display.smAndDown" :typebot-id="typebotId" :show-floating-button="true" :theme="chatTheme" button-text="Ajuda" @on-open="onChatOpen" />

<v-dialog v-model="modalAberto" max-width="500px" persistent>
  <v-card class="pa-4">
    <v-card-title class="text-h5">{{ editando ? 'Editar' : 'Novo' }} Agendamento</v-card-title>
    <v-card-subtitle>{{ dataFormatada.diaDaSemana }}, {{ dataFormatada.restoDaData }} às {{ horarioModal }}</v-card-subtitle>
    <v-card-text>
      <v-select v-model="servicoSelecionado" :items="listaServicos" item-title="nome" item-value="id" label="Serviço" variant="outlined" density="compact" return-object :disabled="editando"></v-select>
      <v-text-field v-model="nomeCliente" label="Nome do Cliente" variant="outlined" density="compact" class="mt-4" color="red-darken-3"></v-text-field>
      <v-text-field v-model="telefoneCliente" label="Telefone" variant="outlined" density="compact"></v-text-field>
      <v-text-field v-model.number="precoServico" label="Valor Final (R$)" variant="outlined" density="compact" type="number" prefix="R$"></v-text-field>
    </v-card-text>
    <v-card-actions class="justify-end">
      <v-btn text @click="fecharModal">Cancelar</v-btn>
      <v-btn v-if="editando" color="red" text @click="excluirAgendamento">Excluir</v-btn>
      <v-btn color="primary" variant="flat" @click="salvarAgendamento">{{ editando ? 'Salvar' : 'Adicionar' }}</v-btn>
    </v-card-actions>
  </v-card>
</v-dialog>

<v-snackbar v-model="showNotification" :timeout="3000" color="success" location="top">
  <v-icon class="mr-2">mdi-check-circle</v-icon> {{ notificationMessage }}
</v-snackbar>
  </v-container>
</template>

<style scoped>
.page-container { font-family: 'Poppins', sans-serif; }
.date-nav-card { border-radius: 12px; }
.kpi-card { color: white !important; border-radius: 12px; padding: 24px !important; }
.kpi-label { text-transform: uppercase; font-size: 0.75rem; opacity: 0.8; }
.kpi-number { font-size: 2.25rem; font-weight: 700; line-height: 1; }
.kpi-icon { opacity: 0.5; }
.slot-card { transition: all 0.2s ease-in-out; cursor: pointer; height: 110px; display: flex; flex-direction: column; justify-content: center; border-radius: 12px; }
.slot-card:hover:not([disabled]) { transform: translateY(-4px); box-shadow: 0 8px 16px rgba(0,0,0,0.1); }
.truncate-text { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%; }
.chat-sidebar { width: 400px; min-width: 400px; border-left: 1px solid rgba(0,0,0,0.12); }
.v-theme--dark .chat-sidebar { border-left: 1px solid rgba(255,255,255,0.12); }
.chat-container { border-radius: 0; height: 100%; }
.typebot-wrapper { height: calc(100vh - 280px); }
</style>

<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { db } from '@/firebase';
import { collection, query, where, getDocs, orderBy, doc, getDoc, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import TypebotChat from '@/components/TypebotChat.vue';

const loading = ref(true);
const allAppointments = ref([]);
const dataExibida = ref(new Date());
const configHorarios = ref(null);
const listaServicos = ref([]);
const modalAberto = ref(false);
const nomeCliente = ref('');
const telefoneCliente = ref('');
const servicoSelecionado = ref(null);
const precoServico = ref(0);
const editando = ref(false);
const idAgendamentoEditando = ref(null);
const horarioModal = ref('');
const timestampModal = ref(null);
const showChatPanel = ref(false);
const showNotification = ref(false);
const notificationMessage = ref('');
const typebotId = 'my-typebot-lk5rehg'; // ⚠️ SUBSTITUA PELO SEU ID REAL
const chatTheme = { button: { backgroundColor: '#1976d2' }, chatWindow: { backgroundColor: '#FFFFFF' }};

const dataFormatada = computed(() => {
    const d = dataExibida.value;
    return { diaDaSemana: d.toLocaleDateString('pt-BR', { weekday: 'long' }), restoDaData: d.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' }) };
});
const estaFechado = computed(() => !loading.value && !configHorarios.value);
const todayAppointments = computed(() => {
  const selectedDateStr = dataExibida.value.toISOString().split('T')[0];
  return allAppointments.value.filter(apt => new Date(apt.DataHoraISO).toISOString().split('T')[0] === selectedDateStr);
});
const totalRevenue = computed(() => todayAppointments.value.filter(apt => apt.Status === 'Agendado').reduce((sum, apt) => sum + (apt.preco || 0), 0));
const proximoAgendamento = computed(() => {
  const agora = new Date();
  const proximo = todayAppointments.value.filter(a => new Date(a.DataHoraISO) > agora && a.Status === 'Agendado').sort((a, b) => new Date(a.DataHoraISO) - new Date(b.DataHoraISO))[0];
  if (proximo) proximo.horarioFormatado = new Date(proximo.DataHoraISO).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
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
        if (minutoAlmocoInicio && minutoAlmocoFim && minuto >= minutoAlmocoInicio && minuto < minutoAlmocoFim) continue;
        const dataSlot = new Date(dataExibida.value);
        dataSlot.setHours(Math.floor(minuto/60), minuto%60, 0, 0);
        const agendamento = agendamentosMap.get(minuto);
        const estaNoPassado = dataSlot < new Date() && dataExibida.value.toDateString() === new Date().toDateString();
        
        let status, titulo;
        
        if (agendamento) {
          if (agendamento.Status === 'Cancelado') {
            status = 'cancelado';
            titulo = `${agendamento.NomeCliente} (Cancelado)`;
          } else if (estaNoPassado) {
            status = 'passado';
            titulo = agendamento.NomeCliente;
          } else {
            status = 'agendamento';
            titulo = agendamento.NomeCliente;
          }
        } else {
          status = estaNoPassado ? 'passado' : 'livre';
          titulo = estaNoPassado ? 'Encerrado' : 'Disponível';
        }
        
        agenda.push({
            tipo: status, status: status, 
            ...(agendamento && { ...agendamento }),
            horarioFormatado: formatTime(minuto),
            titulo: titulo,
            detalhes: agendamento ? agendamento.servicoNome : '',
            timestamp: dataSlot.getTime()
        });
    }
    return agenda;
});

const fetchData = async () => {
  loading.value = true;
  try {
    // Buscar todos os agendamentos (incluindo cancelados)
    const agendamentosQuery = query(collection(db, "Agendamentos"));
    const servicosQuery = query(collection(db, "Servicos"), where("ativo", "==", true));
    const [agendamentosSnapshot, servicosSnapshot] = await Promise.all([ getDocs(agendamentosQuery), getDocs(servicosQuery) ]);
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

watch(dataExibida, (novaData) => {
  fetchConfigHorarios(novaData);
});

onMounted(() => { fetchData(); });

const mudarDia = (dias) => { const novaData = new Date(dataExibida.value); novaData.setDate(novaData.getDate() + dias); dataExibida.value = novaData; };
const irParaHoje = () => { dataExibida.value = new Date(); };

const fecharModal = () => {
    modalAberto.value = false; editando.value = false; idAgendamentoEditando.value = null; nomeCliente.value = ''; telefoneCliente.value = ''; servicoSelecionado.value = null; horarioModal.value = ''; timestampModal.value = null; precoServico.value = 0;
};

const handleItemClick = (item) => {
    if (item.tipo === 'passado') return;
    
    horarioModal.value = item.horarioFormatado;
    timestampModal.value = item.timestamp;
    
    if (item.tipo === 'agendamento') {
        editando.value = true; 
        idAgendamentoEditando.value = item.id; 
        nomeCliente.value = item.NomeCliente; 
        telefoneCliente.value = item.TelefoneCliente;
        servicoSelecionado.value = listaServicos.value.find(s => s.id === item.servicoId) || null;
        precoServico.value = item.preco || servicoSelecionado.value?.preco || 0;
    } else if (item.tipo === 'cancelado') {
        // Tratar cancelados como horários disponíveis para novo agendamento
        editando.value = false; 
        idAgendamentoEditando.value = null; 
        nomeCliente.value = ''; 
        telefoneCliente.value = ''; 
        servicoSelecionado.value = null; 
        precoServico.value = 0;
    } else {
        // Slot livre
        editando.value = false; 
        idAgendamentoEditando.value = null; 
        nomeCliente.value = ''; 
        telefoneCliente.value = ''; 
        servicoSelecionado.value = null; 
        precoServico.value = 0;
    }
    
    modalAberto.value = true;
};

watch(servicoSelecionado, (novoServico) => {
  if (!editando.value && novoServico) {
    precoServico.value = novoServico.preco || 0;
  }
});

const abrirModalParaNovoVazio = () => {
    const primeiroSlotLivre = agendaDoDia.value.find(item => item.tipo === 'livre' || item.tipo === 'cancelado');
    if (primeiroSlotLivre) handleItemClick(primeiroSlotLivre); else alert("Não há horários vagos hoje.");
};

const salvarAgendamento = async () => {
    if (!nomeCliente.value || !servicoSelecionado.value) return alert('Nome e serviço são obrigatórios.');
    try {
        if (editando.value && idAgendamentoEditando.value) {
            await updateDoc(doc(db, 'Agendamentos', idAgendamentoEditando.value), { 
                NomeCliente: nomeCliente.value, 
                TelefoneCliente: telefoneCliente.value, 
                preco: precoServico.value 
            });
        } else {
            const dataDoAgendamento = new Date(timestampModal.value);
            
            // NOVA LÓGICA: Verificar se existe agendamento cancelado no mesmo horário
            const horarioAlvo = dataDoAgendamento.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
            const agendamentoCancelado = todayAppointments.value.find(apt => {
                const horarioApt = new Date(apt.DataHoraISO).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                return horarioApt === horarioAlvo && apt.Status === 'Cancelado';
            });
            
            if (agendamentoCancelado) {
                // Atualizar o agendamento cancelado existente
                await updateDoc(doc(db, 'Agendamentos', agendamentoCancelado.id), {
                    NomeCliente: nomeCliente.value, 
                    TelefoneCliente: telefoneCliente.value, 
                    DataHoraISO: dataDoAgendamento.toISOString(),
                    DataHoraFormatada: new Intl.DateTimeFormat('pt-BR', { 
                        dateStyle: 'medium', 
                        timeStyle: 'short', 
                        timeZone: 'America/Sao_Paulo' 
                    }).format(dataDoAgendamento),
                    Status: 'Agendado', 
                    TimestampAgendamento: new Date().toISOString(),
                    servicoId: servicoSelecionado.value.id, 
                    servicoNome: servicoSelecionado.value.nome, 
                    preco: precoServico.value, 
                    duracaoMinutos: servicoSelecionado.value.duracaoMinutos,
                });
            } else {
                // Criar novo agendamento (lógica original)
                await addDoc(collection(db, 'Agendamentos'), {
                    NomeCliente: nomeCliente.value, 
                    TelefoneCliente: telefoneCliente.value, 
                    DataHoraISO: dataDoAgendamento.toISOString(),
                    DataHoraFormatada: new Intl.DateTimeFormat('pt-BR', { 
                        dateStyle: 'medium', 
                        timeStyle: 'short', 
                        timeZone: 'America/Sao_Paulo' 
                    }).format(dataDoAgendamento),
                    Status: 'Agendado', 
                    TimestampAgendamento: new Date().toISOString(),
                    servicoId: servicoSelecionado.value.id, 
                    servicoNome: servicoSelecionado.value.nome, 
                    preco: precoServico.value, 
                    duracaoMinutos: servicoSelecionado.value.duracaoMinutos,
                });
            }
        }
    } catch (error) { 
        console.error("Erro ao salvar:", error); 
        alert("Ocorreu um erro ao salvar."); 
    }
    finally { 
        fecharModal(); 
        fetchData(); 
    }
};

const excluirAgendamento = async () => {
    if (!idAgendamentoEditando.value || !confirm(`Excluir agendamento de ${nomeCliente.value}?`)) return;
    try { await deleteDoc(doc(db, 'Agendamentos', idAgendamentoEditando.value)); }
    finally { fecharModal(); fetchData(); }
};

// SISTEMA DE CORES REORGANIZADO COM SUPORTE A CANCELADO

// Variante do card (flat/outlined)
const getSlotVariant = (slot) => {
  return (slot.tipo === 'livre' || slot.tipo === 'cancelado') ? 'outlined' : 'flat';
};

// Cor de fundo do card
const getSlotColor = (slot) => {
  switch (slot.tipo) {
    case 'agendamento': return 'primary';
    case 'passado': return 'grey-lighten-3';
    case 'cancelado': return 'orange-lighten-4';
    case 'livre': return 'surface';
    default: return 'surface';
  }
};

// Cor do texto do horário
const getTimeTextColor = (slot) => {
  switch (slot.tipo) {
    case 'agendamento': return 'text-white';
    case 'passado': return 'text-grey-darken-2';
    case 'cancelado': return 'text-orange-darken-2';
    case 'livre': return 'text-primary';
    default: return '';
  }
};

// Cor de fundo do chip
const getChipColor = (status) => {
  switch (status) {
    case 'agendamento': return 'white';
    case 'livre': return 'success';
    case 'passado': return 'grey-darken-1';
    case 'cancelado': return 'orange';
    default: return 'grey';
  }
};

// Cor do ícone do chip
const getChipIconColor = (status) => {
  switch (status) {
    case 'agendamento': return 'primary';
    case 'livre': return 'white';
    case 'passado': return 'white';
    case 'cancelado': return 'white';
    default: return 'white';
  }
};

// Cor do texto do chip (nome do cliente)
const getChipTextColor = (status) => {
  switch (status) {
    case 'agendamento': return 'text-primary';
    case 'livre': return 'text-white';
    case 'passado': return 'text-white';
    case 'cancelado': return 'text-white';
    default: return 'text-white';
  }
};

// Ícone do chip
const getChipIcon = (status) => {
  switch (status) {
    case 'agendamento': return 'mdi-account-check';
    case 'livre': return 'mdi-plus-box-outline';
    case 'passado': return 'mdi-check-circle';
    case 'cancelado': return 'mdi-cancel';
    default: return 'mdi-help-circle';
  }
};

// Cor do texto dos detalhes (serviço)
const getDetailsTextColor = (slot) => {
  switch (slot.tipo) {
    case 'agendamento': return 'text-white';
    case 'passado': return 'text-grey-darken-2';
    case 'cancelado': return 'text-orange-darken-2';
    default: return '';
  }
};

// Cor do texto do preço
const getPriceTextColor = (slot) => {
  switch (slot.tipo) {
    case 'agendamento': return 'text-green-lighten-2';
    case 'passado': return 'text-green-darken-2';
    case 'cancelado': return 'text-orange-darken-1';
    default: return 'text-green';
  }
};

const toggleChatPanel = () => { showChatPanel.value = !showChatPanel.value; };
const onChatOpen = () => { notificationMessage.value = 'Assistente virtual iniciado! 🤖'; showNotification.value = true; };
</script>
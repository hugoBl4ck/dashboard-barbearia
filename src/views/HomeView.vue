<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useAuth } from '@/composables/useAuth'
import { useTenant } from '@/composables/useTenant'
import { useRoute } from 'vue-router'
import HorariosView from './HorariosView.vue'
import ServicosView from './ServicosView.vue'
import ClientesView from './ClientesView.vue'
import PerfilView from './PerfilView.vue'
import ConfiguracoesView from './ConfiguracoesView.vue'
import AgendamentosView from './AgendamentosView.vue'
import RelatoriosView from './RelatoriosView.vue'

// --- HOOKS ---
const auth = useAuth()
const tenant = useTenant()
const route = useRoute()

// --- REFS COMPUTADOS PARA FACILIDADE ---
const barbeariaInfo = computed(() => auth.barbeariaInfo)
const currentRoute = computed(() => route.name)

// --- ESTADO GLOBAL ---
const loadingData = ref(false)

// --- ESTADO DA AGENDA ---
const dataSelecionada = ref(new Date())
const agendaDoDia = ref([])
const estatisticasDia = ref({ agendados: 0, faturamentoFormatado: 'R$ 0,00' })
const proximoAgendamento = ref(null)
const estaFechado = ref(false)
let unsubscribeAgendamentos = null

// --- ESTADO DO MODAL ---
const modalAberto = ref(false)
const editando = ref(false)
const horarioModal = ref('')
const agendamentoEditando = ref(null)
const servicoSelecionado = ref(null)
const listaServicos = ref([])
const nomeCliente = ref('')
const telefoneCliente = ref('')
const precoServico = ref(0)
const savingLoading = ref(false)
const deletingLoading = ref(false)

// --- NOTIFICAÇÕES ---
const showNotification = ref(false)
const notificationMessage = ref('')
const notificationType = ref('success')

// --- PROPRIEDADES COMPUTADAS ---
const dataFormatada = computed(() => {
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }
  const [diaDaSemana, resto] = new Date(dataSelecionada.value)
    .toLocaleDateString('pt-BR', options)
    .split(', ')
  return {
    diaDaSemana: diaDaSemana.charAt(0).toUpperCase() + diaDaSemana.slice(1),
    restoDaData: resto,
  }
})

// --- FUNÇÕES ---
const carregarDadosIniciais = async () => {
  if (!auth.isReady.value) return

  try {
    console.log('[CARREGANDO DADOS INICIAIS]')
    listaServicos.value = await tenant.fetchServicos()
    await carregarDadosAgenda()
    console.log('[DADOS INICIAIS CARREGADOS]')
  } catch (error) {
    console.error('Erro ao carregar dados iniciais:', error)
  }
}

const carregarDadosAgenda = async () => {
  if (!auth.isReady.value) return

  if (unsubscribeAgendamentos) {
    unsubscribeAgendamentos()
    unsubscribeAgendamentos = null
  }

  loadingData.value = true

  try {
    const diaDaSemana = dataSelecionada.value.getDay()
    const configHorarios = await tenant.fetchHorario(diaDaSemana)

    if (!configHorarios || !configHorarios.InicioManha) {
      estaFechado.value = true
      agendaDoDia.value = []
      estatisticasDia.value = { agendados: 0, faturamentoFormatado: 'R$ 0,00' }
      proximoAgendamento.value = null
      loadingData.value = false
      return
    }

    estaFechado.value = false
    const inicioDia = new Date(dataSelecionada.value)
    inicioDia.setHours(0, 0, 0, 0)
    const fimDia = new Date(dataSelecionada.value)
    fimDia.setHours(23, 59, 59, 999)

    unsubscribeAgendamentos = tenant.listenToAgendamentos(
      (agendamentos) => {
        const stats = tenant.calcularEstatisticasDia(agendamentos, dataSelecionada.value)
        estatisticasDia.value = {
          agendados: stats.agendados,
          faturamentoFormatado: stats.faturamentoFormatado,
        }

        proximoAgendamento.value =
          agendamentos
            .filter((a) => new Date(a.DataHoraISO) > new Date() && a.Status === 'Agendado')
            .sort(
              (a, b) => new Date(a.DataHoraISO).getTime() - new Date(b.DataHoraISO).getTime(),
            )[0] || null

        const slots = []
        const agendamentosMap = new Map(
          agendamentos.map((a) => [new Date(a.DataHoraISO).getTime(), a]),
        )
        const intervalo = barbeariaInfo.value?.configuracoes?.intervaloAgendamento || 30

        const parseTime = (str) =>
          str ? parseInt(str.split(':')[0]) * 60 + parseInt(str.split(':')[1]) : 0
        const minutoInicio = parseTime(configHorarios.InicioManha)
        const minutoFim = parseTime(configHorarios.FimTarde || configHorarios.FimManha)
        const minutoAlmocoInicio = parseTime(
          configHorarios.InicioTarde ? configHorarios.FimManha : '',
        )
        const minutoAlmocoFim = parseTime(configHorarios.InicioTarde)

        for (let minuto = minutoInicio; minuto < minutoFim; minuto += intervalo) {
          if (
            minutoAlmocoInicio &&
            minutoAlmocoFim &&
            minuto >= minutoAlmocoInicio &&
            minuto < minutoAlmocoFim
          )
            continue

          const dataSlot = new Date(dataSelecionada.value)
          dataSlot.setHours(Math.floor(minuto / 60), minuto % 60, 0, 0)
          const timestamp = dataSlot.getTime()
          const agendamento = agendamentosMap.get(timestamp)
          const estaNoPassado =
            timestamp < new Date().getTime() &&
            dataSelecionada.value.toDateString() === new Date().toDateString()

          if (agendamento) {
            slots.push({
              timestamp,
              horarioFormatado: new Date(agendamento.DataHoraISO).toLocaleTimeString('pt-BR', {
                hour: '2-digit',
                minute: '2-digit',
              }),
              tipo: estaNoPassado ? 'passado' : 'agendamento',
              titulo: agendamento.NomeCliente,
              detalhes: agendamento.servicoNome,
              preco: agendamento.preco,
              status: agendamento.Status,
              agendamento,
            })
          } else {
            slots.push({
              timestamp,
              horarioFormatado: dataSlot.toLocaleTimeString('pt-BR', {
                hour: '2-digit',
                minute: '2-digit',
              }),
              tipo: estaNoPassado ? 'passado' : 'livre',
              titulo: estaNoPassado ? 'Encerrado' : 'Disponível',
              status: estaNoPassado ? 'Encerrado' : 'Livre',
            })
          }
        }
        agendaDoDia.value = slots
        loadingData.value = false
      },
      {
        dataInicio: inicioDia.toISOString(),
        dataFim: fimDia.toISOString(),
      },
    )
  } catch (error) {
    console.error('Erro ao carregar agenda:', error)
    loadingData.value = false
  }
}

// --- WATCHERS ---
watch(
  auth.isReady,
  (ready) => {
    if (ready) {
      carregarDadosIniciais()
    }
  },
  { immediate: true },
)

watch(dataSelecionada, () => {
  if (auth.isReady.value) {
    carregarDadosAgenda()
  }
})

watch(servicoSelecionado, (novoServico) => {
  if (novoServico && !editando.value) {
    precoServico.value = novoServico.preco
  }
})

const mudarDia = (dias) => {
  const novaData = new Date(dataSelecionada.value)
  novaData.setDate(novaData.getDate() + dias)
  dataSelecionada.value = novaData
}

const irParaHoje = () => (dataSelecionada.value = new Date())

const abrirModalParaNovoVazio = () => {
  editando.value = false
  horarioModal.value = '12:00'
  modalAberto.value = true
}

const handleItemClick = (slot) => {
  if (slot.tipo === 'agendamento') {
    editando.value = true
    agendamentoEditando.value = slot.agendamento
    nomeCliente.value = slot.agendamento.NomeCliente
    telefoneCliente.value = slot.agendamento.TelefoneCliente
    servicoSelecionado.value =
      listaServicos.value.find((s) => s.id === slot.agendamento.servicoId) || null
    precoServico.value = slot.agendamento.preco
  } else {
    editando.value = false
    agendamentoEditando.value = null
    nomeCliente.value = ''
    telefoneCliente.value = ''
    servicoSelecionado.value = null
    precoServico.value = 0
  }
  horarioModal.value = slot.horarioFormatado
  modalAberto.value = true
}

const fecharModal = () => (modalAberto.value = false)

const salvarAgendamento = async () => {
  if (!servicoSelecionado.value || !nomeCliente.value) {
    notificationMessage.value = 'Preencha o serviço e o nome do cliente.'
    notificationType.value = 'error'
    showNotification.value = true
    return
  }

  savingLoading.value = true
  try {
    const [horas, minutos] = horarioModal.value.split(':')
    const dataAgendamento = new Date(dataSelecionada.value)
    dataAgendamento.setHours(horas, minutos, 0, 0)

    const dados = {
      DataHoraISO: dataAgendamento.toISOString(),
      NomeCliente: nomeCliente.value,
      TelefoneCliente: telefoneCliente.value,
      servicoId: servicoSelecionado.value.id,
      servicoNome: servicoSelecionado.value.nome,
      preco: precoServico.value,
      Status: 'Agendado',
    }

    if (editando.value) {
      await tenant.updateAgendamento(agendamentoEditando.value.id, dados)
      notificationMessage.value = 'Agendamento atualizado com sucesso!'
    } else {
      await tenant.createAgendamento(dados)
      notificationMessage.value = 'Agendamento criado com sucesso!'
    }

    notificationType.value = 'success'
    showNotification.value = true
    fecharModal()
  } catch (error) {
    console.error('Erro ao salvar agendamento:', error)
    notificationMessage.value = 'Erro ao salvar agendamento.'
    notificationType.value = 'error'
    showNotification.value = true
  } finally {
    savingLoading.value = false
  }
}

const excluirAgendamento = async () => {
  if (!agendamentoEditando.value) return

  if (confirm('Tem certeza que deseja excluir este agendamento?')) {
    deletingLoading.value = true
    try {
      await tenant.deleteAgendamento(agendamentoEditando.value.id)
      notificationMessage.value = 'Agendamento excluído com sucesso!'
      notificationType.value = 'success'
      showNotification.value = true
      fecharModal()
    } catch (error) {
      console.error('Erro ao excluir agendamento:', error)
      notificationMessage.value = 'Erro ao excluir agendamento.'
      notificationType.value = 'error'
      showNotification.value = true
    } finally {
      deletingLoading.value = false
    }
  }
}

const formatCurrency = (value) =>
  (value ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

// Funções de estilo (placeholders)
const getSlotVariant = (slot) => (slot.tipo === 'livre' ? 'tonal' : 'elevated')
const getSlotColor = (slot) => (slot.tipo === 'agendamento' ? 'primary' : undefined)
const getTimeTextColor = (slot) => (slot.tipo === 'agendamento' ? 'text-white' : '')
const getDetailsTextColor = (slot) => (slot.tipo === 'agendamento' ? 'text-white' : '')
const getPriceTextColor = (slot) => (slot.tipo === 'agendamento' ? 'text-white' : 'text-green')
const getChipColor = (status) => (status === 'Agendado' ? 'blue-lighten-5' : 'green-lighten-5')
const getChipIcon = (status) => (status === 'Livre' ? 'mdi-check' : 'mdi-account')
const getChipIconColor = (status) => (status === 'Livre' ? 'green' : 'blue')
const getChipTextColor = (status) => (status === 'Livre' ? 'text-green' : 'text-blue')

onMounted(() => {
  console.log('[HOME MOUNTED] Auth state:', {
    loading: auth.loading.value,
    user: !!auth.user.value,
    isReady: auth.isReady.value,
    error: auth.error.value,
  })
})

onUnmounted(() => {
  if (unsubscribeAgendamentos) {
    console.log('[UNMOUNT] Cancelando listener de agendamentos.')
    unsubscribeAgendamentos()
  }
})
</script>

<template>
  <div>
    <!-- TELA DE CARREGAMENTO GLOBAL -->
    <div
      v-if="auth.loading.value"
      class="d-flex justify-center align-center fill-height"
      style="background-color: rgb(var(--v-theme-surface))"
    >
      <div class="text-center">
        <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
        <p class="mt-4">Verificando autenticação...</p>
      </div>
    </div>

    <!-- TELA DE ERRO GLOBAL -->
    <div
      v-else-if="auth.error.value"
      class="d-flex justify-center align-center fill-height"
      style="background-color: rgb(var(--v-theme-surface))"
    >
      <v-card class="pa-8 text-center" max-width="500" elevation="2">
        <v-icon size="64" color="error">mdi-alert-circle-outline</v-icon>
        <h2 class="text-h5 mt-4 mb-2">Ops! Algo deu errado</h2>
        <p class="text-body-2 text-medium-emphasis mb-6">
          {{ auth.error.value }}
        </p>
        <v-btn variant="outlined" @click="logout"> Fazer Logout </v-btn>
      </v-card>
    </div>

    <!-- DASHBOARD PRINCIPAL -->
    <template v-else-if="auth.isReady.value">
        <!-- CONTEÚDO BASEADO NA ROTA ATUAL -->
        <div v-if="currentRoute === 'home' || currentRoute === 'dashboard'">
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
              <v-btn variant="text" @click="irParaHoje" class="ml-2">Hoje</v-btn>
            </v-card>

            <!-- CARDS DE INDICADORES (KPIs) -->
            <v-row>
              <v-col cols="12" sm="6" md="6" lg="3">
                <v-card elevation="0" class="kpi-card" color="blue">
                  <div class="d-flex justify-space-between align-center">
                    <div>
                      <p class="kpi-label">AGENDAMENTOS (DIA)</p>
                      <p class="kpi-number">{{ estatisticasDia.agendados }}</p>
                    </div>
                    <v-icon size="48" class="kpi-icon">mdi-calendar-check</v-icon>
                  </div>
                </v-card>
              </v-col>
              <v-col cols="12" sm="6" md="6" lg="3">
                <v-card elevation="0" class="kpi-card" color="green">
                  <div class="d-flex justify-space-between align-center">
                    <div>
                      <p class="kpi-label">FATURAMENTO (DIA)</p>
                      <p class="kpi-number">{{ estatisticasDia.faturamentoFormatado }}</p>
                    </div>
                    <v-icon size="48" class="kpi-icon">mdi-currency-usd</v-icon>
                  </div>
                </v-card>
              </v-col>
              <v-col cols="12" sm="12" md="12" lg="6">
                <v-card elevation="0" class="kpi-card pa-4" color="deep-purple-darken-1">
                  <div v-if="proximoAgendamento" class="d-flex align-center fill-height">
                    <v-avatar color="white" class="mr-4">
                      <v-icon color="deep-purple-darken-1">mdi-account-clock</v-icon>
                    </v-avatar>
                    <div>
                      <p class="kpi-label">PRÓXIMO CLIENTE</p>
                      <p class="text-h6 font-weight-bold">
                        {{ proximoAgendamento.NomeCliente }} às
                        {{
                          new Date(proximoAgendamento.DataHoraISO).toLocaleTimeString('pt-BR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        }}
                      </p>
                    </div>
                  </div>
                  <div v-else class="d-flex align-center fill-height">
                    <v-icon class="mr-4">mdi-coffee</v-icon>
                    <p>Sem mais clientes por hoje.</p>
                  </div>
                </v-card>
              </v-col>
            </v-row>

            <!-- ÁREA PRINCIPAL -->
            <v-card elevation="0" class="mt-6">
              <v-card-title class="d-flex align-center">
                <v-icon class="mr-2">mdi-clock-outline</v-icon>Agenda do Dia
                <v-spacer></v-spacer>
                <v-btn color="primary" @click="abrirModalParaNovoVazio" prepend-icon="mdi-plus">
                  Novo Agendamento
                </v-btn>
              </v-card-title>
              <v-divider></v-divider>

              <!-- CONTEÚDO DA AGENDA -->
              <div v-if="loadingData" class="text-center pa-16">
                <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
                <p class="mt-4">Carregando agenda...</p>
              </div>

              <div v-else-if="!loadingData && estaFechado" class="text-center pa-16">
                <v-icon size="64" color="grey">mdi-door-closed-lock</v-icon>
                <p class="mt-4 text-medium-emphasis">Barbearia Fechada</p>
                <p class="text-caption text-medium-emphasis">
                  Configure os horários de funcionamento
                </p>
              </div>

              <v-container v-else fluid>
                <v-row dense>
                  <v-col
                    v-for="slot in agendaDoDia"
                    :key="slot.timestamp"
                    cols="12"
                    sm="6"
                    md="4"
                    lg="3"
                  >
                    <v-card
                      class="slot-card"
                      :variant="getSlotVariant(slot)"
                      :color="getSlotColor(slot)"
                      @click="handleItemClick(slot)"
                      :disabled="slot.tipo === 'passado'"
                    >
                      <v-card-text class="pa-3 text-center">
                        <div class="font-weight-bold mb-1" :class="getTimeTextColor(slot)">
                          {{ slot.horarioFormatado }}
                        </div>
                        <v-chip size="small" :color="getChipColor(slot.status)" class="mb-1">
                          <v-icon start size="16" :color="getChipIconColor(slot.status)">
                            {{ getChipIcon(slot.status) }}
                          </v-icon>
                          <span :class="getChipTextColor(slot.status)">{{ slot.titulo }}</span>
                        </v-chip>
                        <div
                          class="text-caption truncate-text mb-1"
                          :class="getDetailsTextColor(slot)"
                          v-if="slot.tipo === 'agendamento' || slot.tipo === 'cancelado'"
                        >
                          {{ slot.detalhes }}
                        </div>
                        <div
                          class="text-caption font-weight-bold"
                          :class="getPriceTextColor(slot)"
                          v-if="
                            (slot.tipo === 'agendamento' || slot.tipo === 'cancelado') && slot.preco
                          "
                        >
                          {{ formatCurrency(slot.preco) }}
                        </div>
                      </v-card-text>
                    </v-card>
                  </v-col>
                </v-row>
              </v-container>
            </v-card>
          </v-container>
        </div>

        <!-- PÁGINA DE HORÁRIOS -->
        <HorariosView v-else-if="currentRoute === 'horarios'" />

        <!-- PÁGINA DE SERVIÇOS -->
        <ServicosView v-else-if="currentRoute === 'servicos'" />

        <!-- PÁGINA DE CLIENTES -->
        <ClientesView v-else-if="currentRoute === 'clientes'" />

        <!-- PÁGINA DE AGENDAMENTOS -->
        <AgendamentosView v-else-if="currentRoute === 'agendamentos'" />

        <!-- PÁGINA DE RELATÓRIOS -->
        <RelatoriosView v-else-if="currentRoute === 'relatorios'" />

        <!-- PÁGINA DE PERFIL -->
        <PerfilView v-else-if="currentRoute === 'perfil'" />

        <!-- PÁGINA DE CONFIGURAÇÕES -->
        <ConfiguracoesView v-else-if="currentRoute === 'configuracoes'" />

        <!-- OUTRAS SEÇÕES (PLACEHOLDER) -->
        <div v-else>
          <v-container class="pa-6">
            <v-card class="pa-8 text-center">
              <v-icon size="64" color="grey">mdi-construction</v-icon>
              <h2 class="text-h4 mt-4 mb-2">Em Desenvolvimento</h2>
              <p class="text-body-1 text-medium-emphasis mb-4">
                A seção "{{ currentRoute }}" está sendo desenvolvida.
              </p>
              <v-btn color="primary" to="/"> Voltar ao Dashboard </v-btn>
            </v-card>
          </v-container>
        </div>

        <!-- MODAL DE AGENDAMENTO -->
        <v-dialog v-model="modalAberto" max-width="500px" persistent>
          <v-card class="pa-4">
            <v-card-title class="text-h5">
              {{ editando ? 'Editar' : 'Novo' }} Agendamento
            </v-card-title>
            <v-card-subtitle>
              {{ dataFormatada.diaDaSemana }}, {{ dataFormatada.restoDaData }} às {{ horarioModal }}
            </v-card-subtitle>

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
                class="mb-4"
              ></v-select>

              <v-text-field
                v-model="nomeCliente"
                label="Nome do Cliente"
                variant="outlined"
                density="compact"
                class="mb-4"
              ></v-text-field>

              <v-text-field
                v-model="telefoneCliente"
                label="Telefone"
                variant="outlined"
                density="compact"
                class="mb-4"
              ></v-text-field>

              <v-text-field
                v-model.number="precoServico"
                label="Valor Final (R$)"
                variant="outlined"
                density="compact"
                type="number"
                prefix="R$"
              ></v-text-field>
            </v-card-text>

            <v-card-actions class="justify-end">
              <v-btn text @click="fecharModal">Cancelar</v-btn>
              <v-btn
                v-if="editando"
                color="red"
                text
                @click="excluirAgendamento"
                :loading="deletingLoading"
              >
                Excluir
              </v-btn>
              <v-btn
                color="primary"
                variant="flat"
                @click="salvarAgendamento"
                :loading="savingLoading"
              >
                {{ editando ? 'Salvar' : 'Adicionar' }}
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>

        <!-- SNACKBAR -->
        <v-snackbar
          v-model="showNotification"
          :timeout="3000"
          :color="notificationType"
          location="top"
        >
          <v-icon class="mr-2">mdi-check-circle</v-icon>
          {{ notificationMessage }}
        </v-snackbar>
    </template>

    <!-- FALLBACK: Se não estiver carregando, nem com erro, nem pronto (estado inesperado) -->
    <div
      v-else
      class="d-flex justify-center align-center fill-height"
      style="background-color: rgb(var(--v-theme-surface))"
    >
      <v-card class="pa-8 text-center" max-width="500" elevation="2">
        <v-icon size="64" color="warning">mdi-help-circle-outline</v-icon>
        <h2 class="text-h5 mt-4 mb-2">Estado Inesperado</h2>
        <p class="text-body-2 text-medium-emphasis mb-6">
          A aplicação encontrou um estado inesperado. Por favor, tente recarregar a página ou fazer
          logout.
        </p>
        <v-btn variant="outlined" @click="logout"> Fazer Logout </v-btn>
      </v-card>
    </div>
  </div>
</template>
<style>
/* Estilos globais para a aplicação */
.page-container {
  font-family: 'Poppins', sans-serif;
}

.date-nav-card {
  border-radius: 12px;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.1);
}

.kpi-card {
  border-radius: 16px;
  padding: 16px !important;
  color: white;
  transition:
    transform 0.2s ease-in-out,
    box-shadow 0.2s ease-in-out;
}
.kpi-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
}
.kpi-label {
  font-size: 0.75rem;
  font-weight: 500;
  opacity: 0.8;
}
.kpi-number {
  font-size: 2rem;
  font-weight: 700;
}
.kpi-icon {
  opacity: 0.3;
}

.slot-card {
  border: 1px solid rgba(var(--v-theme-on-surface), 0.1);
  transition: all 0.2s ease-in-out;
}
.slot-card:hover:not(:disabled) {
  border-color: rgba(var(--v-theme-primary), 0.8);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}
.truncate-text {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}
</style>

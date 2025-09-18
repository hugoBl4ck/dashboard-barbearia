<script setup>
import { ref, computed, watch } from 'vue'
import { useAuth } from '@/composables/useAuth'
import { useTenant } from '@/composables/useTenant'

// --- HOOKS ---
const auth = useAuth() // Mantém a reatividade
const tenant = useTenant()

// --- REFS COMPUTADOS PARA FACILIDADE ---
const user = computed(() => auth.user)
const barbeariaInfo = computed(() => auth.barbeariaInfo)

// --- ESTADO GLOBAL ---
const loading = ref(true) // Carregamento inicial da página
const loadingData = ref(false) // Carregamento dos dados da agenda
const drawer = ref(true)
const rail = ref(false)
const currentRoute = ref('dashboard') // Simula a rota atual

// --- ESTADO DA AGENDA ---
const dataSelecionada = ref(new Date())
const agendaDoDia = ref([])
const estatisticasDia = ref({ agendados: 0, faturamentoFormatado: 'R$ 0,00' })
const proximoAgendamento = ref(null)
const estaFechado = ref(false)

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
const notificacoesCount = ref(3)

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

// --- WATCHERS ---
watch(
  tenant.isTenantReady,
  (ready) => {
    if (ready) carregarDadosIniciais()
  },
  { immediate: true },
)

watch(dataSelecionada, () => carregarDadosAgenda())

// --- FUNÇÕES ---
const carregarDadosIniciais = async () => {
  loading.value = true
  listaServicos.value = await tenant.fetchServicos()
  await carregarDadosAgenda()
  loading.value = false
}

const carregarDadosAgenda = async () => {
  loadingData.value = true
  const diaDaSemana = dataSelecionada.value.getDay()
  const configHorarios = await tenant.fetchHorario(diaDaSemana)

  if (!configHorarios || !configHorarios.InicioManha) {
    estaFechado.value = true
    agendaDoDia.value = []
    loadingData.value = false
    return
  }

  estaFechado.value = false
  const inicioDia = new Date(dataSelecionada.value)
  inicioDia.setHours(0, 0, 0, 0)
  const fimDia = new Date(dataSelecionada.value)
  fimDia.setHours(23, 59, 59, 999)

  const agendamentos = await tenant.fetchAgendamentos({
    dataInicio: inicioDia.toISOString(),
    dataFim: fimDia.toISOString(),
  })

  const stats = tenant.calcularEstatisticasDia(agendamentos, dataSelecionada.value)
  estatisticasDia.value = {
    agendados: stats.agendados,
    faturamentoFormatado: stats.faturamentoFormatado,
  }

  proximoAgendamento.value =
    agendamentos
      .filter((a) => new Date(a.DataHoraISO) > new Date() && a.Status === 'Agendado')
      .sort((a, b) => new Date(a.DataHoraISO).getTime() - new Date(b.DataHoraISO).getTime())[0] ||
    null

  // Gerar slots da agenda
  const slots = []
  const agendamentosMap = new Map(agendamentos.map((a) => [new Date(a.DataHoraISO).getTime(), a]))
  const intervalo = barbeariaInfo.value?.configuracoes.intervaloAgendamento || 30

  const parseTime = (str) =>
    str ? parseInt(str.split(':')[0]) * 60 + parseInt(str.split(':')[1]) : 0
  const minutoInicio = parseTime(configHorarios.InicioManha)
  const minutoFim = parseTime(configHorarios.FimTarde || configHorarios.FimManha)
  const minutoAlmocoInicio = parseTime(configHorarios.InicioTarde ? configHorarios.FimManha : '')
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
}

const navigateTo = (route) => (currentRoute.value = route)
const abrirLandingPage = () => window.open(`/cliente/minha-barbearia`, '_blank')
const logout = async () => await auth.logout()
const mudarDia = (dias) => {
  const novaData = new Date(dataSelecionada.value)
  novaData.setDate(novaData.getDate() + dias)
  dataSelecionada.value = novaData
  carregarDadosAgenda()
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
const salvarAgendamento = () => {
  fecharModal()
}
const excluirAgendamento = () => {
  fecharModal()
}
const formatCurrency = (value) =>
  (value ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const getCurrentRouteTitle = () =>
  currentRoute.value.charAt(0).toUpperCase() + currentRoute.value.slice(1)

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
</script>

<template>
  <v-app>
    <!-- TELA DE CARREGAMENTO GLOBAL -->
    <div v-if="loading" class="d-flex justify-center align-center fill-height">
      <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
    </div>

    <!-- SÓ RENDERIZA O DASHBOARD SE O USUÁRIO ESTIVER LOGADO E OS DADOS PRONTOS -->
    <!-- MENU LATERAL (DRAWER) -->
    <template v-if="!loading">
      <v-navigation-drawer
        v-if="user"
        v-model="drawer"
        :rail="rail"
        permanent
        @click="rail = false"
      >
        <v-list-item
          :prepend-avatar="user?.photoURL"
          :title="user?.displayName || user?.email"
          :subtitle="barbeariaInfo?.nome"
          nav
        >
          <template v-slot:append>
            <v-btn variant="text" icon="mdi-chevron-left" @click.stop="rail = !rail"></v-btn>
          </template>
        </v-list-item>

        <v-divider></v-divider>

        <v-list density="compact" nav>
          <v-list-item
            prepend-icon="mdi-view-dashboard"
            title="Dashboard"
            value="dashboard"
            :active="currentRoute === 'dashboard'"
            @click="navigateTo('dashboard')"
          ></v-list-item>

          <v-list-item
            prepend-icon="mdi-calendar-check"
            title="Agendamentos"
            value="agendamentos"
            :active="currentRoute === 'agendamentos'"
            @click="navigateTo('agendamentos')"
          ></v-list-item>

          <v-list-item
            prepend-icon="mdi-account-group"
            title="Clientes"
            value="clientes"
            :active="currentRoute === 'clientes'"
            @click="navigateTo('clientes')"
          ></v-list-item>

          <v-list-item
            prepend-icon="mdi-scissors-cutting"
            title="Serviços"
            value="servicos"
            :active="currentRoute === 'servicos'"
            @click="navigateTo('servicos')"
          ></v-list-item>

          <v-list-item
            prepend-icon="mdi-clock-outline"
            title="Horários"
            value="horarios"
            :active="currentRoute === 'horarios'"
            @click="navigateTo('horarios')"
          ></v-list-item>

          <v-list-item
            prepend-icon="mdi-chart-line"
            title="Relatórios"
            value="relatorios"
            :active="currentRoute === 'relatorios'"
            @click="navigateTo('relatorios')"
          ></v-list-item>

          <v-divider class="my-2"></v-divider>

          <v-list-item
            prepend-icon="mdi-web"
            title="Minha Landing Page"
            value="landing"
            @click="abrirLandingPage"
          ></v-list-item>

          <v-list-item
            prepend-icon="mdi-cog"
            title="Configurações"
            value="configuracoes"
            :active="currentRoute === 'configuracoes'"
            @click="navigateTo('configuracoes')"
          ></v-list-item>
        </v-list>

        <template v-slot:append>
          <div class="pa-2">
            <v-btn color="red" variant="outlined" block @click="logout" prepend-icon="mdi-logout">
              Sair
            </v-btn>
          </div>
        </template>
      </v-navigation-drawer>

      <!-- APP BAR -->
      <v-app-bar v-if="user" color="primary" elevation="2">
        <v-app-bar-nav-icon
          @click="drawer = !drawer"
          v-if="$vuetify.display.mobile.value"
        ></v-app-bar-nav-icon>

        <v-app-bar-title class="d-flex align-center">
          <v-icon class="mr-2">mdi-content-cut</v-icon>
          {{ barbeariaInfo?.nome || 'BarberApp' }}
        </v-app-bar-title>

        <v-spacer></v-spacer>

        <!-- NOTIFICAÇÕES -->
        <v-btn icon class="mr-2">
          <v-badge color="red" :content="notificacoesCount" v-if="notificacoesCount > 0">
            <v-icon>mdi-bell</v-icon>
          </v-badge>
          <v-icon v-else>mdi-bell-outline</v-icon>
        </v-btn>

        <!-- MENU USUÁRIO -->
        <v-menu>
          <template v-slot:activator="{ props }">
            <v-btn icon v-bind="props">
              <v-avatar size="36">
                <v-img v-if="user?.photoURL" :src="user.photoURL"></v-img>
                <v-icon v-else>mdi-account</v-icon>
              </v-avatar>
            </v-btn>
          </template>

          <v-list>
            <v-list-item>
              <v-list-item-title>{{ user?.displayName || user?.email }}</v-list-item-title>
              <v-list-item-subtitle>{{ barbeariaInfo?.nome }}</v-list-item-subtitle>
            </v-list-item>
            <v-divider></v-divider>
            <v-list-item @click="navigateTo('perfil')" prepend-icon="mdi-account-edit">
              <v-list-item-title>Meu Perfil</v-list-item-title>
            </v-list-item>
            <v-list-item @click="navigateTo('configuracoes')" prepend-icon="mdi-cog">
              <v-list-item-title>Configurações</v-list-item-title>
            </v-list-item>
            <v-divider></v-divider>
            <v-list-item @click="logout" prepend-icon="mdi-logout">
              <v-list-item-title>Sair</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>
      </v-app-bar>

      <v-main v-if="user">
        <!-- CONTEÚDO BASEADO NA ROTA ATUAL -->
        <div v-if="currentRoute === 'dashboard'">
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
              <v-col cols="12" sm="6" lg="3">
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
              <v-col cols="12" sm="6" lg="3">
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
              <v-col cols="12" sm="12" lg="6">
                <v-card elevation="0" class="kpi-card pa-4" color="deep-purple-darken-1">
                  <div v-if="proximoAgendamento" class="d-flex align-center fill-height">
                    <v-avatar color="white" class="mr-4">
                      <v-icon color="deep-purple-darken-1">mdi-account-clock</v-icon>
                    </v-avatar>
                    <div>
                      <p class="kpi-label">PRÓXIMO CLIENTE</p>
                      <p class="text-h6 font-weight-bold">
                        {{ proximoAgendamento.NomeCliente }} às
                        {{ proximoAgendamento.horarioFormatado }}
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

        <!-- OUTRAS SEÇÕES (PLACEHOLDER) -->
        <div v-else>
          <v-container class="pa-6">
            <v-card class="pa-8 text-center">
              <v-icon size="64" color="grey">mdi-construction</v-icon>
              <h2 class="text-h4 mt-4 mb-2">Em Desenvolvimento</h2>
              <p class="text-body-1 text-medium-emphasis mb-4">
                A seção "{{ getCurrentRouteTitle() }}" está sendo desenvolvida.
              </p>
              <v-btn color="primary" @click="navigateTo('dashboard')"> Voltar ao Dashboard </v-btn>
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
      </v-main>
    </template>
  </v-app>
</template>

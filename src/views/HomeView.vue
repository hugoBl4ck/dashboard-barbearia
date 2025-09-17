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
        v-if="user && barbeariaInfo"
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
            <v-btn
              variant="text"
              icon="mdi-chevron-left"
              @click.stop="rail = !rail"
            ></v-btn>
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
            <v-btn
              color="red"
              variant="outlined"
              block
              @click="logout"
              prepend-icon="mdi-logout"
            >
              Sair
            </v-btn>
          </div>
        </template>
      </v-navigation-drawer>

    <!-- APP BAR -->
    <v-app-bar v-if="user && barbeariaInfo" color="primary" elevation="2">
      <v-app-bar-nav-icon @click="drawer = !drawer" v-if="$vuetify.display.mobile"></v-app-bar-nav-icon>
      
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

    <v-main v-if="user && barbeariaInfo">
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
              <p class="text-caption text-medium-emphasis">Configure os horários de funcionamento</p>
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
                      <div class="font-weight-bold mb-1" :class="getTimeTextColor(slot)">
                        {{ slot.horarioFormatado }}
                      </div>
                      <v-chip size="small" :color="getChipColor(slot.status)" class="mb-1">
                        <v-icon start size="16" :color="getChipIconColor(slot.status)">
                          {{ getChipIcon(slot.status) }}
                        </v-icon>
                        <span :class="getChipTextColor(slot.status)">{{ slot.titulo }}</span>
                      </v-chip>
                      <div class="text-caption truncate-text mb-1" 
                           :class="getDetailsTextColor(slot)" 
                           v-if="slot.tipo === 'agendamento' || slot.tipo === 'cancelado'">
                        {{ slot.detalhes }}
                      </div>
                      <div class="text-caption font-weight-bold" 
                           :class="getPriceTextColor(slot)" 
                           v-if="(slot.tipo === 'agendamento' || slot.tipo === 'cancelado') && slot.preco">
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
            <v-btn color="primary" @click="navigateTo('dashboard')">
              Voltar ao Dashboard
            </v-btn>
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
            <v-btn v-if="editando" color="red" text @click="excluirAgendamento" :loading="deletingLoading">
              Excluir
            </v-btn>
            <v-btn color="primary" variant="flat" @click="salvarAgendamento" :loading="savingLoading">
              {{ editando ? 'Salvar' : 'Adicionar' }}
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <!-- SNACKBAR -->
      <v-snackbar v-model="showNotification" :timeout="3000" :color="notificationType" location="top">
        <v-icon class="mr-2">mdi-check-circle</v-icon> 
        {{ notificationMessage }}
      </v-snackbar>
    </v-main>
    </template>
  </v-app>
</template>

<!-- O bloco de script estava duplicado. Unifiquei os dois em um só. -->

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useAuth } from '@/composables/useAuth'
import { useTenant } from '@/composables/useTenant'

// Composables
const { user, barbeariaInfo, barbeariaId, logout, loading } = useAuth()
const { 
  fetchAgendamentos, 
  fetchServicos, 
  fetchHorario,
  createAgendamento,
  updateAgendamento,
  deleteAgendamento,
  formatCurrency,
  formatDateTime,
  calcularEstatisticasDia
} = useTenant()

// Estado do menu
const drawer = ref(true)
const rail = ref(false)
const currentRoute = ref('dashboard')
const notificacoesCount = ref(3) // Exemplo

// Estado da aplicação
const loadingData = ref(true) // Renomeado para não conflitar com o loading do useAuth
const allAppointments = ref([])
const dataExibida = ref(new Date())
const configHorarios = ref(null)
const listaServicos = ref([])
const modalAberto = ref(false)
const editando = ref(false)
const savingLoading = ref(false)
const deletingLoading = ref(false)
const showNotification = ref(false)
const notificationMessage = ref('')
const notificationType = ref('success')

// Dados do modal
const nomeCliente = ref('')
const telefoneCliente = ref('')
const servicoSelecionado = ref(null)
const precoServico = ref(0)
const idAgendamentoEditando = ref(null)
const horarioModal = ref('')
const timestampModal = ref(null)

// Métodos de navegação
const navigateTo = (route) => {
  currentRoute.value = route
  if (route === 'dashboard') {
    // Recarregar dados do dashboard se necessário
    fetchData()
  }
}

const getCurrentRouteTitle = () => {
  const routes = {
    dashboard: 'Dashboard',
    agendamentos: 'Agendamentos',
    clientes: 'Clientes',
    servicos: 'Serviços',
    horarios: 'Horários',
    relatorios: 'Relatórios',
    configuracoes: 'Configurações',
    perfil: 'Meu Perfil'
  }
  return routes[currentRoute.value] || 'Página'
}

const abrirLandingPage = () => {
  if (barbeariaId.value) {
    window.open(`/cliente/${barbeariaId.value}`, '_blank')
  }
}

// Computeds
const dataFormatada = computed(() => {
  const d = dataExibida.value
  return { 
    diaDaSemana: d.toLocaleDateString('pt-BR', { weekday: 'long' }), 
    restoDaData: d.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' })
  }
})

const estaFechado = computed(() => !configHorarios.value)

const todayAppointments = computed(() => {
  const selectedDateStr = dataExibida.value.toISOString().split('T')[0]
  return allAppointments.value.filter(apt => 
    new Date(apt.DataHoraISO).toISOString().split('T')[0] === selectedDateStr
  )
})

const estatisticasDia = computed(() => {
  return calcularEstatisticasDia(allAppointments.value, dataExibida.value)
})

const proximoAgendamento = computed(() => {
  const agora = new Date()
  const proximo = todayAppointments.value
    .filter(a => new Date(a.DataHoraISO) > agora && a.Status === 'Agendado')
    .sort((a, b) => new Date(a.DataHoraISO) - new Date(b.DataHoraISO))[0]
  
  if (proximo) {
    proximo.horarioFormatado = new Date(proximo.DataHoraISO).toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }
  return proximo
})

const agendaDoDia = computed(() => {
  if (!configHorarios.value) return []
  
  const agenda = []
  const parseTime = str => str ? parseInt(str.split(':')[0]) * 60 + parseInt(str.split(':')[1]) : 0
  const formatTime = totalMinutes => `${String(Math.floor(totalMinutes / 60)).padStart(2, '0')}:${String(totalMinutes % 60).padStart(2, '0')}`
  
  const minutoInicio = parseTime(configHorarios.value.InicioManha)
  const minutoFim = parseTime(configHorarios.value.FimTarde || configHorarios.value.FimManha)
  const minutoAlmocoInicio = parseTime(configHorarios.value.FimManha)
  const minutoAlmocoFim = parseTime(configHorarios.value.InicioTarde)
  const INTERVALO_MINUTOS = 30
  
  const agendamentosMap = new Map()
  todayAppointments.value.forEach(ag => {
    const inicio = parseTime(new Date(ag.DataHoraISO).toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    }))
    agendamentosMap.set(inicio, ag)
  })
  
  for (let minuto = minutoInicio; minuto < minutoFim; minuto += INTERVALO_MINUTOS) {
    if (minutoAlmocoInicio && minutoAlmocoFim && minuto >= minutoAlmocoInicio && minuto < minutoAlmocoFim) {
      continue
    }
    
    const dataSlot = new Date(dataExibida.value)
    dataSlot.setHours(Math.floor(minuto/60), minuto%60, 0, 0)
    
    const agendamento = agendamentosMap.get(minuto)
    const estaNoPassado = dataSlot < new Date() && dataExibida.value.toDateString() === new Date().toDateString()
    
    let status, titulo
    
    if (agendamento) {
      if (agendamento.Status === 'Cancelado') {
        status = 'cancelado'
        titulo = `${agendamento.NomeCliente} (Cancelado)`
      } else if (estaNoPassado) {
        status = 'passado'
        titulo = agendamento.NomeCliente
      } else {
        status = 'agendamento'
        titulo = agendamento.NomeCliente
      }
    } else {
      status = estaNoPassado ? 'passado' : 'livre'
      titulo = estaNoPassado ? 'Encerrado' : 'Disponível'
    }
    
    agenda.push({
      tipo: status, 
      status: status, 
      ...(agendamento && { ...agendamento }),
      horarioFormatado: formatTime(minuto),
      titulo: titulo,
      detalhes: agendamento ? agendamento.servicoNome : '',
      timestamp: dataSlot.getTime()
    })
  }
  
  return agenda
})

// Métodos
const fetchData = async () => {
  loadingData.value = true
  try {
    const [agendamentos, servicos] = await Promise.all([
      fetchAgendamentos(),
      fetchServicos()
    ])
    
    allAppointments.value = agendamentos
    listaServicos.value = servicos
    await fetchConfigHorarios(dataExibida.value)
  } catch (error) {
    console.error("Erro ao buscar dados:", error)
    showAlertMessage('Erro ao carregar dados', 'error')
  } finally {
    loadingData.value = false
  }
}

const fetchConfigHorarios = async (data) => {
  try {
    const diaDaSemana = data.getDay()
    const horario = await fetchHorario(diaDaSemana)
    configHorarios.value = (horario && horario.InicioManha) ? horario : null
  } catch (error) {
    console.error('Erro ao buscar horários:', error)
  }
}

const mudarDia = (dias) => { 
  const novaData = new Date(dataExibida.value)
  novaData.setDate(novaData.getDate() + dias)
  dataExibida.value = novaData
}

const irParaHoje = () => { 
  dataExibida.value = new Date()
}

const showAlertMessage = (message, type = 'success') => { // Renomeado para corresponder ao uso
  notificationMessage.value = message
  notificationType.value = type
  showNotification.value = true
}

// Modal methods
const fecharModal = () => {
  modalAberto.value = false
  editando.value = false
  idAgendamentoEditando.value = null
  nomeCliente.value = ''
  telefoneCliente.value = ''
  servicoSelecionado.value = null
  horarioModal.value = ''
  timestampModal.value = null
  precoServico.value = 0
}

const handleItemClick = (item) => {
  if (item.tipo === 'passado') return
  
  horarioModal.value = item.horarioFormatado
  timestampModal.value = item.timestamp
  
  if (item.tipo === 'agendamento') {
    editando.value = true
    idAgendamentoEditando.value = item.id
    nomeCliente.value = item.NomeCliente
    telefoneCliente.value = item.TelefoneCliente
    servicoSelecionado.value = listaServicos.value.find(s => s.id === item.servicoId) || null
    precoServico.value = item.preco || servicoSelecionado.value?.preco || 0
  } else {
    editando.value = false
    idAgendamentoEditando.value = null
    nomeCliente.value = ''
    telefoneCliente.value = ''
    servicoSelecionado.value = null
    precoServico.value = 0
  }
  
  modalAberto.value = true
}

const abrirModalParaNovoVazio = () => {
  const primeiroSlotLivre = agendaDoDia.value.find(item => 
    item.tipo === 'livre' || item.tipo === 'cancelado'
  )
  if (primeiroSlotLivre) {
    handleItemClick(primeiroSlotLivre)
  } else {
    showAlertMessage('Não há horários vagos hoje.', 'orange')
  }
}

const salvarAgendamento = async () => {
  if (!nomeCliente.value || !servicoSelecionado.value) {
    showAlertMessage('Nome e serviço são obrigatórios.', 'warning')
    return
  }
  
  savingLoading.value = true
  
  try {
    if (editando.value && idAgendamentoEditando.value) {
      // Atualizar agendamento existente
      const agendamentoAtualizado = await updateAgendamento(idAgendamentoEditando.value, {
        NomeCliente: nomeCliente.value,
        TelefoneCliente: telefoneCliente.value,
        preco: precoServico.value
      });
      // Atualiza o item no array local de forma reativa
      const index = allAppointments.value.findIndex(a => a.id === idAgendamentoEditando.value);
      if (index !== -1) {
        // Usar spread para garantir que a reatividade seja acionada
        allAppointments.value[index] = { ...allAppointments.value[index], ...agendamentoAtualizado };
      }
      showAlertMessage('Agendamento atualizado com sucesso!');

    } else {
      // Criar novo agendamento
      const dataDoAgendamento = new Date(timestampModal.value)
      
      // Verificar se existe agendamento cancelado no mesmo horário
      const horarioAlvo = dataDoAgendamento.toLocaleTimeString('pt-BR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
      const agendamentoCancelado = todayAppointments.value.find(apt => {
        const horarioApt = new Date(apt.DataHoraISO).toLocaleTimeString('pt-BR', { 
          hour: '2-digit', 
          minute: '2-digit' 
        })
        return horarioApt === horarioAlvo && apt.Status === 'Cancelado'
      })
      
      if (agendamentoCancelado) {
        // Atualizar agendamento cancelado
        const agendamentoReativado = await updateAgendamento(agendamentoCancelado.id, {
          NomeCliente: nomeCliente.value,
          TelefoneCliente: telefoneCliente.value,
          DataHoraISO: dataDoAgendamento.toISOString(),
          DataHoraFormatada: formatDateTime(dataDoAgendamento.toISOString()),
          Status: 'Agendado',
          TimestampAgendamento: new Date().toISOString(),
          servicoId: servicoSelecionado.value.id,
          servicoNome: servicoSelecionado.value.nome,
          preco: precoServico.value,
          duracaoMinutos: servicoSelecionado.value.duracaoMinutos || 30
        });
        // Atualiza o item no array local de forma reativa
        const index = allAppointments.value.findIndex(a => a.id === agendamentoCancelado.id);
        if (index !== -1) {
          allAppointments.value[index] = agendamentoReativado;
        }
      } else {
        // Criar novo agendamento
        const novoAgendamento = await createAgendamento({
          NomeCliente: nomeCliente.value,
          TelefoneCliente: telefoneCliente.value,
          DataHoraISO: dataDoAgendamento.toISOString(),
          DataHoraFormatada: formatDateTime(dataDoAgendamento.toISOString()),
          Status: 'Agendado',
          TimestampAgendamento: new Date().toISOString(),
          servicoId: servicoSelecionado.value.id,
          servicoNome: servicoSelecionado.value.nome,
          preco: precoServico.value,
          duracaoMinutos: servicoSelecionado.value.duracaoMinutos || 30
        });
        // Adiciona o novo item no array local de forma reativa
        allAppointments.value.push(novoAgendamento);
      }
      showAlertMessage('Agendamento criado com sucesso!')
    }
  } catch (error) {
    console.error("Erro ao salvar:", error)
    showAlertMessage('Erro ao salvar agendamento', 'error');
  } finally {
    savingLoading.value = false;
    fecharModal();
    // A chamada para fetchData() não é mais necessária aqui!
  }
}

const excluirAgendamento = async () => {
  if (!idAgendamentoEditando.value || !confirm(`Excluir agendamento de ${nomeCliente.value}?`)) {
    return
  }
  
  deletingLoading.value = true
  
  try {
    await deleteAgendamento(idAgendamentoEditando.value);
    // Remove o item do array local de forma reativa
    allAppointments.value = allAppointments.value.filter(a => a.id !== idAgendamentoEditando.value);
    showAlertMessage('Agendamento excluído com sucesso!');
  } catch (error) {
    console.error("Erro ao excluir:", error);
    showAlertMessage('Erro ao excluir agendamento', 'error');
  } finally {
    deletingLoading.value = false;
    fecharModal();
    // A chamada para fetchData() não é mais necessária aqui!
  }
}

// Watchers
watch(dataExibida, (novaData) => {
  fetchConfigHorarios(novaData)
})

watch(servicoSelecionado, (novoServico) => {
  if (!editando.value && novoServico) {
    precoServico.value = novoServico.preco || 0
  }
})

// Lifecycle
watch(loading, (isLoading) => {
  // Quando o loading da autenticação terminar E tivermos um barbeariaId, buscar os dados.
  if (!isLoading && barbeariaId.value) {
    fetchData()
  }
})

// SISTEMA DE CORES (mesmo do código original)
const getSlotVariant = (slot) => {
  return (slot.tipo === 'livre' || slot.tipo === 'cancelado') ? 'outlined' : 'flat'
}

const getSlotColor = (slot) => {
  switch (slot.tipo) {
    case 'agendamento': return 'primary'
    case 'passado': return 'grey-lighten-3'
    case 'cancelado': return 'orange-lighten-4'
    case 'livre': return 'surface'
    default: return 'surface'
  }
}

const getTimeTextColor = (slot) => {
  switch (slot.tipo) {
    case 'agendamento': return 'text-white'
    case 'passado': return 'text-grey-darken-2'
    case 'cancelado': return 'text-orange-darken-2'
    case 'livre': return 'text-primary'
    default: return ''
  }
}

const getChipColor = (status) => {
  switch (status) {
    case 'agendamento': return 'white'
    case 'livre': return 'success'
    case 'passado': return 'grey-darken-1'
    case 'cancelado': return 'orange'
    default: return 'grey'
  }
}

const getChipIconColor = (status) => {
  switch (status) {
    case 'agendamento': return 'primary'
    case 'livre': return 'white'
    case 'passado': return 'white'
    case 'cancelado': return 'white'
    default: return 'white'
  }
}

const getChipTextColor = (status) => {
  switch (status) {
    case 'agendamento': return 'text-primary'
    case 'livre': return 'text-white'
    case 'passado': return 'text-white'
    case 'cancelado': return 'text-white'
    default: return 'text-white'
  }
}

const getChipIcon = (status) => {
  switch (status) {
    case 'agendamento': return 'mdi-account-check'
    case 'livre': return 'mdi-plus-box-outline'
    case 'passado': return 'mdi-check-circle'
    case 'cancelado': return 'mdi-cancel'
    default: return 'mdi-help-circle'
  }
}

const getDetailsTextColor = (slot) => {
  switch (slot.tipo) {
    case 'agendamento': return 'text-white'
    case 'passado': return 'text-grey-darken-2'
    case 'cancelado': return 'text-orange-darken-2'
    default: return ''
  }
}

const getPriceTextColor = (slot) => {
  switch (slot.tipo) {
    case 'agendamento': return 'text-green-lighten-2'
    case 'passado': return 'text-green-darken-2'
    case 'cancelado': return 'text-orange-darken-1'
    default: return 'text-green'
  }
}
</script>

<style scoped>
.page-container { 
  font-family: 'Poppins', sans-serif; 
}

.date-nav-card { 
  border-radius: 12px; 
}

.kpi-card { 
  color: white !important; 
  border-radius: 12px; 
  padding: 24px !important; 
}

.kpi-label { 
  text-transform: uppercase; 
  font-size: 0.75rem; 
  opacity: 0.8; 
}

.kpi-number { 
  font-size: 2.25rem; 
  font-weight: 700; 
  line-height: 1; 
}

.kpi-icon { 
  opacity: 0.5; 
}

.slot-card { 
  transition: all 0.2s ease-in-out; 
  cursor: pointer; 
  height: 110px; 
  display: flex; 
  flex-direction: column; 
  justify-content: center; 
  border-radius: 12px; 
}

.slot-card:hover:not([disabled]) { 
  transform: translateY(-4px); 
  box-shadow: 0 8px 16px rgba(0,0,0,0.1); 
}

.truncate-text { 
  white-space: nowrap; 
  overflow: hidden; 
  text-overflow: ellipsis; 
  max-width: 100%; 
}

/* Estilos do menu lateral */
.v-navigation-drawer {
  transition: all 0.3s ease;
}

/* Customizar a lista do menu */
.v-list-item {
  border-radius: 8px;
  margin: 2px 8px;
}

.v-list-item:hover {
  background-color: rgba(25, 118, 210, 0.08);
}

.v-list-item--active {
  background-color: rgba(25, 118, 210, 0.12);
  color: #1976d2;
}

.v-list-item--active .v-icon {
  color: #1976d2;
}

/* Avatar do usuário no menu */
.v-list-item .v-avatar {
  border: 2px solid rgba(255, 255, 255, 0.1);
}

/* Botão de logout */
.v-navigation-drawer .v-btn {
  text-transform: none;
}

/* Responsividade */
@media (max-width: 960px) {
  .kpi-card {
    padding: 16px !important;
  }
  
  .kpi-number {
    font-size: 1.75rem;
  }
}

@media (max-width: 600px) {
  .page-container {
    padding: 16px !important;
  }
  
  .slot-card {
    height: 90px;
  }
  
  .kpi-number {
    font-size: 1.5rem;
  }
  
  /* Menu lateral em mobile */
  .v-navigation-drawer {
    z-index: 1005;
  }
}

/* Tema escuro */
.v-theme--dark .v-list-item:hover {
  background-color: rgba(144, 202, 249, 0.08);
}

.v-theme--dark .v-list-item--active {
  background-color: rgba(144, 202, 249, 0.12);
  color: #90caf9;
}

.v-theme--dark .v-list-item--active .v-icon {
  color: #90caf9;
}

/* Animações suaves */
.v-main {
  transition: all 0.3s ease;
}

/* Badge de notificação */
.v-badge .v-badge__badge {
  font-size: 10px;
  height: 16px;
  min-width: 16px;
}

/* Melhorar espaçamento no app bar */
.v-app-bar .v-btn {
  margin: 0 4px;
}

/* Cards com hover melhorado */
.v-card {
  transition: all 0.2s ease;
}

.v-card:hover {
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

/* Loading states */
.v-progress-circular {
  margin: 0 auto;
}

/* Modal improvements */
.v-dialog .v-card {
  overflow: visible;
}

/* Snackbar positioning */
.v-snackbar {
  z-index: 1010;
}

/* Melhorar legibilidade dos chips */
.v-chip {
  font-weight: 500;
}

/* Estados disabled */
.v-card[disabled] {
  opacity: 0.6;
  cursor: not-allowed;
}

.v-card[disabled]:hover {
  transform: none;
  box-shadow: none;
}
</style>
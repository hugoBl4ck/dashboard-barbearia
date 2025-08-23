<template>
  <v-app :theme="isDark ? 'dark' : 'light'" class="modern-app">
    <v-app-bar app flat class="app-bar-style" :elevation="2">
      <v-container fluid class="d-flex align-center pa-0">
        <v-avatar image="/logo-barbearia.png" size="36" class="ml-4 mr-3" />
        <v-toolbar-title class="font-weight-bold text-h6">Gestão Barbearia</v-toolbar-title>
        <v-spacer />
        <div class="d-none d-md-flex align-center">
          <v-btn variant="text" icon="mdi-chevron-left" @click="mudarDia(-1)" />
          <v-btn variant="text" @click="irParaHoje" class="mx-2">Hoje</v-btn>
          <v-btn variant="text" icon="mdi-chevron-right" @click="mudarDia(1)" />
        </div>
        <v-btn-toggle v-model="isDark" variant="outlined" divided class="ml-4 toggle-theme">
          <v-btn :value="false" icon="mdi-white-balance-sunny" size="small" />
          <v-btn :value="true" icon="mdi-weather-night" size="small" />
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
            <v-progress-circular indeterminate color="primary" size="64" />
          </div>

          <div v-else-if="estaFechado">
            <v-card variant="tonal" class="text-center pa-16 d-flex flex-column justify-center align-center">
              <v-icon size="80" color="grey-lighten-1">mdi-door-closed-lock</v-icon>
              <h2 class="text-h5 mt-6">Barbearia Fechada</h2>
              <div class="text-body-2 mt-2">Cadastre os horários do dia na coleção <b>Horarios</b> (documento pelo número do dia da semana).</div>
            </v-card>
          </div>

          <v-card v-else elevation="2">
            <v-list class="py-0">
              <v-list-item
                v-for="(item, index) in agendaDoDia"
                :key="item.key"
                class="list-item-hover"
                :class="{ 'border-bottom': index < agendaDoDia.length - 1 }"
                @click="handleItemClick(item)"
              >
                <template #prepend>
                  <div class="mr-6 text-center" style="width: 70px;">
                    <span class="text-h6 font-weight-bold">{{ item.horarioFormatado }}</span>
                  </div>
                </template>

                <v-chip
                  :color="item.tipo === 'agendamento' ? 'primary' : 'success'"
                  variant="flat"
                  label
                >
                  <v-icon start :icon="item.tipo === 'agendamento' ? 'mdi-account-check' : 'mdi-plus-box-outline'" />
                  {{ item.titulo }}
                </v-chip>

                <div
                  v-if="item.tipo === 'agendamento'"
                  class="text-caption text-medium-emphasis mt-1 ml-1"
                >
                  {{ item.detalhes }}
                </div>
                <div
                  v-else
                  class="text-caption text-medium-emphasis mt-1 ml-1"
                >
                  Clique para adicionar um novo agendamento
                </div>
              </v-list-item>
            </v-list>
          </v-card>
        </v-slide-y-transition>

        <!-- Modal -->
        <v-dialog v-model="modalAberto" max-width="520px" persistent>
          <v-card class="pa-4">
            <v-card-title class="text-h5">{{ editando ? 'Editar' : 'Novo' }} Agendamento</v-card-title>
            <v-card-subtitle>{{ dataFormatada }} — {{ horarioModal }}</v-card-subtitle>

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
              />
              <v-text-field
                v-model="nomeCliente"
                label="Nome do Cliente"
                variant="outlined"
                density="compact"
                class="mt-3"
              />
              <v-text-field
                v-model="telefoneCliente"
                label="Telefone"
                variant="outlined"
                density="compact"
              />
            </v-card-text>

            <v-card-actions class="justify-end">
              <v-btn text @click="fecharModal">Cancelar</v-btn>
              <v-btn v-if="editando" color="red" text @click="excluirAgendamento">Excluir</v-btn>
              <v-btn color="primary" variant="flat" @click="salvarAgendamento">
                {{ editando ? 'Salvar' : 'Adicionar' }}
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>
      </v-container>
    </v-main>
  </v-app>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { db } from '@/firebase'
import {
  collection, query, where, getDocs, orderBy, doc, getDoc,
  addDoc, updateDoc, deleteDoc, onSnapshot
} from 'firebase/firestore'

/** =========================
 *  Refs / State
 *  ========================= */
const loading = ref(true)
const agendamentosDoDia = ref([])
const dataExibida = ref(new Date())
const configHorarios = ref(null)
const isDark = ref(false)

const listaServicos = ref([])

const modalAberto = ref(false)
const editando = ref(false)
const idAgendamentoEditando = ref(null)
const nomeCliente = ref('')
const telefoneCliente = ref('')
const servicoSelecionado = ref(null)

const horarioModal = ref('')
const timestampModal = ref(null) // Date.getTime() do slot clicado

/** =========================
 *  Helpers de Data
 *  ========================= */
const ptBR = new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })
const pad2 = n => String(n).padStart(2, '0')
const hhmm = m => `${pad2(Math.floor(m / 60))}:${pad2(m % 60)}`
const minutesOf = (hhmmStr) => {
  if (!hhmmStr) return null
  const [h, m] = hhmmStr.split(':').map(x => parseInt(x, 10))
  if (Number.isNaN(h) || Number.isNaN(m)) return null
  return h * 60 + m
}
const minutesFromDate = (d) => d.getHours() * 60 + d.getMinutes()

const dataFormatada = computed(() => ptBR.format(dataExibida.value))
const estaFechado = computed(() => !loading.value && !configHorarios.value)

/** =========================
 *  Geração dos Slots
 *  ========================= */
const SLOT_MINUTOS = 30 // mude para 15/20/30 conforme desejar

function montarFaixas(config) {
  // Aceita manhã e tarde. Se faltar alguma, usa a outra.
  const faixas = []
  const im = minutesOf(config?.InicioManha)
  const fm = minutesOf(config?.FimManha)
  const it = minutesOf(config?.InicioTarde)
  const ft = minutesOf(config?.FimTarde)

  if (im !== null && fm !== null && im < fm) faixas.push([im, fm])
  if (it !== null && ft !== null && it < ft) faixas.push([it, ft])

  // Se somente uma faixa existir, ainda funciona.
  return faixas
}

const agendaDoDia = computed(() => {
  if (!configHorarios.value) return []

  // Indexa agendamentos pelo minuto de início
  const porMinuto = new Map()
  for (const a of agendamentosDoDia.value) {
    const d = new Date(a.DataHoraISO)
    porMinuto.set(minutesFromDate(d), a)
  }

  const faixas = montarFaixas(configHorarios.value)
  if (faixas.length === 0) return []

  const itens = []

  for (const [inicio, fim] of faixas) {
    let minuto = inicio
    while (minuto < fim) {
      const slotDate = new Date(dataExibida.value)
      slotDate.setHours(Math.floor(minuto / 60), (minuto % 60), 0, 0)

      const ag = porMinuto.get(minuto)
      if (ag) {
        const dur = ag.duracaoMinutos || SLOT_MINUTOS
        itens.push({
          key: `ag-${ag.id}`,
          tipo: 'agendamento',
          horarioFormatado: hhmm(minuto),
          titulo: ag.NomeCliente,
          detalhes: `${ag.servicoNome || 'Serviço'} — ${dur} min`,
          timestamp: slotDate.getTime(),
          ...ag
        })
        minuto += dur // salta pela duração do serviço
      } else {
        itens.push({
          key: `livre-${slotDate.getTime()}`,
          tipo: 'livre',
          horarioFormatado: hhmm(minuto),
          titulo: 'Horário Vago',
          timestamp: slotDate.getTime()
        })
        minuto += SLOT_MINUTOS
      }
    }
  }

  return itens
})

/** =========================
 *  Firestore: Serviços
 *  ========================= */
const fetchServicos = () => {
  // tempo real + fallback
  try {
    const q = query(collection(db, 'Servicos'), where('ativo', '==', true))
    return onSnapshot(q, (snap) => {
      listaServicos.value = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    }, (err) => {
      console.error('onSnapshot(Servicos) erro:', err)
    })
  } catch (e) {
    console.error('Erro ao iniciar listener de serviços:', e)
  }
}

/** =========================
 *  Firestore: Agendamentos + Horários
 *  ========================= */
async function fetchAgendamentosEHorarios(dia) {
  loading.value = true
  agendamentosDoDia.value = []
  configHorarios.value = null

  // Horários do dia da semana
  const diaSemana = dia.getDay() // 0=dom, 1=seg, ...
  const docRef = doc(db, 'Horarios', String(diaSemana))
  const docSnap = await getDoc(docRef)
  if (!docSnap.exists()) {
    loading.value = false
    return
  }
  const cfg = docSnap.data()
  // precisa ter pelo menos uma faixa válida
  if (!montarFaixas(cfg).length) {
    loading.value = false
    return
  }
  configHorarios.value = cfg

  // Limites do dia em UTC-safe usando ISO (para funcionar com comparação lexicográfica)
  const inicioDia = new Date(dia); inicioDia.setHours(0, 0, 0, 0)
  const fimDia = new Date(dia); fimDia.setHours(23, 59, 59, 999)
  const startISO = inicioDia.toISOString()
  const endISO = fimDia.toISOString()

  // Consulta com possível necessidade de índice composto
  try {
    const q = query(
      collection(db, 'Agendamentos'),
      where('DataHoraISO', '>=', startISO),
      where('DataHoraISO', '<=', endISO),
      where('Status', '==', 'Agendado'),
      orderBy('DataHoraISO')
    )
    const snap = await getDocs(q)
    agendamentosDoDia.value = snap.docs.map(d => ({ id: d.id, ...d.data() }))
  } catch (e) {
    // Fallback caso falte índice: busca por Status e ordena localmente
    console.warn('Usando fallback sem índice composto para Agendamentos:', e?.message || e)
    const q2 = query(
      collection(db, 'Agendamentos'),
      where('Status', '==', 'Agendado'),
      orderBy('DataHoraISO')
    )
    const snap2 = await getDocs(q2)
    const todos = snap2.docs.map(d => ({ id: d.id, ...d.data() }))
    agendamentosDoDia.value = todos.filter(a => a.DataHoraISO >= startISO && a.DataHoraISO <= endISO)
  }

  loading.value = false
}

/** =========================
 *  Ações UI
 *  ========================= */
function mudarDia(delta) {
  const nova = new Date(dataExibida.value)
  nova.setDate(nova.getDate() + delta)
  dataExibida.value = nova
}
function irParaHoje() { dataExibida.value = new Date() }

watch(dataExibida, (d) => {
  fetchAgendamentosEHorarios(d)
})

/** =========================
 *  Modal / CRUD
 *  ========================= */
function fecharModal() {
  modalAberto.value = false
  editando.value = false
  idAgendamentoEditando.value = null
  nomeCliente.value = ''
  telefoneCliente.value = ''
  servicoSelecionado.value = null
  horarioModal.value = ''
  timestampModal.value = null
}

function handleItemClick(item) {
  // garante serviços carregados ao abrir modal
  if (!listaServicos.value?.length) fetchServicos()

  horarioModal.value = item.horarioFormatado

  if (item.tipo === 'agendamento') {
    editando.value = true
    idAgendamentoEditando.value = item.id
    nomeCliente.value = item.NomeCliente
    telefoneCliente.value = item.TelefoneCliente || ''
    servicoSelecionado.value = listaServicos.value.find(s => s.id === item.servicoId) || null
    // usar timestamp do próprio agendamento (robusto)
    const d = new Date(item.DataHoraISO)
    timestampModal.value = d.getTime()
  } else {
    // slot livre
    editando.value = false
    idAgendamentoEditando.value = null
    nomeCliente.value = ''
    telefoneCliente.value = ''
    servicoSelecionado.value = null
    timestampModal.value = item.timestamp // vem do slot
  }

  modalAberto.value = true
}

function slotConflita(timestamp, duracaoMin) {
  // verifica se o início bate com algum agendamento existente ou se cai dentro da duração de outro
  const ini = new Date(timestamp)
  const iniM = minutesFromDate(ini)
  const fimM = iniM + duracaoMin

  for (const a of agendamentosDoDia.value) {
    const d = new Date(a.DataHoraISO)
    const aIni = minutesFromDate(d)
    const aFim = aIni + (a.duracaoMinutos || SLOT_MINUTOS)
    // overlap
    if (Math.max(iniM, aIni) < Math.min(fimM, aFim)) return true
  }
  return false
}

async function salvarAgendamento() {
  if (!nomeCliente.value || !servicoSelecionado.value) {
    alert('Nome e serviço são obrigatórios.')
    return
  }
  const dur = servicoSelecionado.value.duracaoMinutos || SLOT_MINUTOS

  try {
    if (editando.value && idAgendamentoEditando.value) {
      await updateDoc(doc(db, 'Agendamentos', idAgendamentoEditando.value), {
        NomeCliente: nomeCliente.value,
        TelefoneCliente: telefoneCliente.value
      })
    } else {
      if (!timestampModal.value) {
        alert('Selecione um horário válido.')
        return
      }
      // checa conflito local
      if (slotConflita(timestampModal.value, dur)) {
        alert('Este horário conflita com outro agendamento.')
        return
      }

      const dataDoAgendamento = new Date(timestampModal.value)

      await addDoc(collection(db, 'Agendamentos'), {
        NomeCliente: nomeCliente.value,
        TelefoneCliente: telefoneCliente.value || '',
        DataHoraISO: dataDoAgendamento.toISOString(), // mantém ISO para comparação
        DataHoraFormatada: new Intl.DateTimeFormat('pt-BR', {
          dateStyle: 'medium', timeStyle: 'short', timeZone: 'America/Sao_Paulo'
        }).format(dataDoAgendamento),
        Status: 'Agendado',
        TimestampAgendamento: new Date().toISOString(),
        servicoId: servicoSelecionado.value.id,
        servicoNome: servicoSelecionado.value.nome,
        duracaoMinutos: dur
      })
    }
  } catch (e) {
    console.error('Erro ao salvar agendamento:', e)
    alert('Ocorreu um erro ao salvar.')
  } finally {
    fecharModal()
    fetchAgendamentosEHorarios(dataExibida.value)
  }
}

async function excluirAgendamento() {
  if (!idAgendamentoEditando.value) return
  if (!confirm(`Excluir agendamento de ${nomeCliente.value}?`)) return
  try {
    await deleteDoc(doc(db, 'Agendamentos', idAgendamentoEditando.value))
  } catch (e) {
    console.error('Erro ao excluir:', e)
  } finally {
    fecharModal()
    fetchAgendamentosEHorarios(dataExibida.value)
  }
}

/** =========================
 *  Boot
 *  ========================= */
onMounted(() => {
  fetchServicos() // listener de serviços
  fetchAgendamentosEHorarios(dataExibida.value)
})
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
.modern-app { font-family: 'Inter', sans-serif; }
.bg-surface { background-color: rgb(var(--v-theme-surface)); }
.app-bar-style { background-color: rgba(var(--v-theme-surface), 0.8) !important; backdrop-filter: blur(10px); }
.list-item-hover { transition: background-color 0.2s ease-in-out; }
.list-item-hover:hover { background-color: rgba(var(--v-theme-on-surface), 0.04); cursor: pointer; }
.border-bottom { border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.08); }
</style>

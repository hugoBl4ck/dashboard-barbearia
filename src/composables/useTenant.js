// composables/useTenant.js
import { computed } from 'vue'
import { useAuth } from './useAuth'
import { 
  collection, 
  doc, 
  query, 
  where, 
  orderBy,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc
} from 'firebase/firestore'
import { db } from '@/firebase'

export const useTenant = () => {
  const { barbeariaId, barbeariaInfo } = useAuth()

  // Verificar se tenant está carregado
  const isTenantReady = computed(() => !!barbeariaId.value)

  // Construir path da coleção para o tenant atual
  const getCollection = (collectionName) => {
    if (!barbeariaId.value) {
      throw new Error('Barbearia ID não disponível')
    }
    return collection(db, `barbearias/${barbeariaId.value}/${collectionName}`)
  }

  // Construir path do documento para o tenant atual
  const getTenantDoc = (collectionName, docId) => {
    if (!barbeariaId.value) {
      throw new Error('Barbearia ID não disponível')
    }
    return doc(db, `barbearias/${barbeariaId.value}/${collectionName}`, docId)
  }

  // MÉTODOS PARA AGENDAMENTOS
  const agendamentosCollection = computed(() => getCollection('agendamentos'))

  const fetchAgendamentos = async (filters = {}) => {
    let q = query(agendamentosCollection.value)
    
    // Aplicar filtros se fornecidos
    if (filters.status) {
      q = query(q, where('Status', '==', filters.status))
    }
    if (filters.dataInicio && filters.dataFim) {
      q = query(q, 
        where('DataHoraISO', '>=', filters.dataInicio),
        where('DataHoraISO', '<=', filters.dataFim)
      )
    }
    
    q = query(q, orderBy('DataHoraISO', 'asc'))
    
    const snapshot = await getDocs(q)
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
  }

  const createAgendamento = async (dadosAgendamento) => {
    const docRef = await addDoc(agendamentosCollection.value, {
      ...dadosAgendamento,
      criadoEm: new Date().toISOString(),
      atualizadoEm: new Date().toISOString()
    })
    return docRef.id
  }

  const updateAgendamento = async (agendamentoId, dadosAtualizacao) => {
    const docRef = getTenantDoc('agendamentos', agendamentoId)
    await updateDoc(docRef, {
      ...dadosAtualizacao,
      atualizadoEm: new Date().toISOString()
    })
  }

  const deleteAgendamento = async (agendamentoId) => {
    const docRef = getTenantDoc('agendamentos', agendamentoId)
    await deleteDoc(docRef)
  }

  const getAgendamento = async (agendamentoId) => {
    const docRef = getTenantDoc('agendamentos', agendamentoId)
    const docSnap = await getDoc(docRef)
    return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null
  }

  // MÉTODOS PARA SERVIÇOS
  const servicosCollection = computed(() => getCollection('servicos'))

  const fetchServicos = async (apenasAtivos = true) => {
    let q = query(servicosCollection.value)
    
    if (apenasAtivos) {
      q = query(q, where('ativo', '==', true))
    }
    
    q = query(q, orderBy('nome', 'asc'))
    
    const snapshot = await getDocs(q)
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
  }

  const createServico = async (dadosServico) => {
    const docRef = await addDoc(servicosCollection.value, {
      ...dadosServico,
      ativo: true,
      criadoEm: new Date().toISOString()
    })
    return docRef.id
  }

  const updateServico = async (servicoId, dadosAtualizacao) => {
    const docRef = getDoc('servicos', servicoId)
    await updateDoc(docRef, {
      ...dadosAtualizacao,
      atualizadoEm: new Date().toISOString()
    })
  }

  const deleteServico = async (servicoId) => {
    // Soft delete - apenas marcar como inativo
    await updateServico(servicoId, { ativo: false })
  }

  // MÉTODOS PARA HORÁRIOS
  const fetchHorario = async (diaDaSemana) => {
    const docRef = getDoc('horarios', String(diaDaSemana))
    const docSnap = await getDoc(docRef)
    return docSnap.exists() ? docSnap.data() : null
  }

  const updateHorario = async (diaDaSemana, dadosHorario) => {
    const docRef = getDoc('horarios', String(diaDaSemana))
    await updateDoc(docRef, dadosHorario)
  }

  const fetchTodosHorarios = async () => {
    const horarios = {}
    for (let dia = 0; dia <= 6; dia++) {
      horarios[dia] = await fetchHorario(dia)
    }
    return horarios
  }

  // MÉTODOS PARA CONFIGURAÇÕES DA BARBEARIA
  const updateBarbeariaConfig = async (novasConfiguracoes) => {
    if (!barbeariaId.value) return
    
    const docRef = doc(db, 'barbearias', barbeariaId.value)
    await updateDoc(docRef, {
      configuracoes: novasConfiguracoes,
      atualizadoEm: new Date().toISOString()
    })
  }

  const updateBarbeariaNome = async (novoNome) => {
    if (!barbeariaId.value) return
    
    const docRef = doc(db, 'barbearias', barbeariaId.value)
    await updateDoc(docRef, {
      nome: novoNome,
      atualizadoEm: new Date().toISOString()
    })
  }

  // UTILITÁRIOS
  const formatCurrency = (valor) => {
    return (valor || 0).toLocaleString('pt-BR', { 
      style: 'currency', 
      currency: 'BRL' 
    })
  }

  const formatDateTime = (dataISO) => {
    if (!dataISO) return ''
    const data = new Date(dataISO)
    return new Intl.DateTimeFormat('pt-BR', { 
      dateStyle: 'medium', 
      timeStyle: 'short',
      timeZone: 'America/Sao_Paulo' 
    }).format(data)
  }

  const formatDate = (dataISO) => {
    if (!dataISO) return ''
    const data = new Date(dataISO)
    return data.toLocaleDateString('pt-BR')
  }

  const formatTime = (dataISO) => {
    if (!dataISO) return ''
    const data = new Date(dataISO)
    return data.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  // Calcular estatísticas do dia
  const calcularEstatisticasDia = (agendamentos, data) => {
    const dataStr = data.toISOString().split('T')[0]
    const agendamentosDoDia = agendamentos.filter(apt => 
      new Date(apt.DataHoraISO).toISOString().split('T')[0] === dataStr
    )

    const agendados = agendamentosDoDia.filter(apt => apt.Status === 'Agendado')
    const faturamento = agendados.reduce((sum, apt) => sum + (apt.preco || 0), 0)

    return {
      total: agendamentosDoDia.length,
      agendados: agendados.length,
      faturamento,
      faturamentoFormatado: formatCurrency(faturamento)
    }
  }

  return {
    // Estado
    barbeariaId: readonly(barbeariaId),
    barbeariaInfo: readonly(barbeariaInfo),
    isTenantReady,

    // Métodos de agendamentos
    fetchAgendamentos,
    createAgendamento,
    updateAgendamento,
    deleteAgendamento,
    getAgendamento,

    // Métodos de serviços
    fetchServicos,
    createServico,
    updateServico,
    deleteServico,

    // Métodos de horários
    fetchHorario,
    updateHorario,
    fetchTodosHorarios,

    // Configurações
    updateBarbeariaConfig,
    updateBarbeariaNome,

    // Utilitários
    formatCurrency,
    formatDateTime,
    formatDate,
    formatTime,
    calcularEstatisticasDia
  }
}
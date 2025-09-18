// composables/useTenant.js (VERSÃO CORRIGIDA)
import { computed, readonly } from 'vue'
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
  setDoc,
  updateDoc,
  deleteDoc,
} from 'firebase/firestore'
import { db } from '@/firebase'

export const useTenant = () => {
  const { barbeariaId, barbeariaInfo } = useAuth()

  // Verificar se tenant está carregado
  const isTenantReady = computed(() => !!barbeariaId.value)

  // CORREÇÃO: Validação mais robusta antes de acessar o Firebase
  const validateTenantAccess = () => {
    if (!barbeariaId.value) {
      throw new Error('Barbearia ID não disponível. Faça login novamente.')
    }
    return barbeariaId.value
  }

  // Construir path da coleção para o tenant atual
  const getCollection = (collectionName) => {
    const tenantId = validateTenantAccess()
    return collection(db, `barbearias/${tenantId}/${collectionName}`)
  }

  // Construir path do documento para o tenant atual
  const getTenantDoc = (collectionName, docId) => {
    const tenantId = validateTenantAccess()
    return doc(db, `barbearias/${tenantId}/${collectionName}`, docId)
  }

  // MÉTODOS PARA AGENDAMENTOS
  const agendamentosCollection = () => getCollection('agendamentos')

  const fetchAgendamentos = async (filters = {}) => {
    try {
      let q = query(agendamentosCollection())

      // Aplicar filtros se fornecidos
      if (filters.status) {
        q = query(q, where('Status', '==', filters.status))
      }
      if (filters.dataInicio && filters.dataFim) {
        q = query(
          q,
          where('DataHoraISO', '>=', filters.dataInicio),
          where('DataHoraISO', '<=', filters.dataFim),
        )
      }

      q = query(q, orderBy('DataHoraISO', 'asc'))

      const snapshot = await getDocs(q)
      const result = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))

      console.log(`[FETCH AGENDAMENTOS] ${result.length} agendamentos encontrados`)
      return result
    } catch (error) {
      console.error('Erro ao buscar agendamentos:', error)
      throw new Error(`Erro ao carregar agendamentos: ${error.message}`)
    }
  }

  const createAgendamento = async (dadosAgendamento) => {
    try {
      const docRef = await addDoc(agendamentosCollection(), {
        ...dadosAgendamento,
        criadoEm: new Date().toISOString(),
        atualizadoEm: new Date().toISOString(),
      })
      // Retorna o documento recém-criado para atualização reativa na UI
      const newDoc = await getDoc(docRef)
      return { id: newDoc.id, ...newDoc.data() }
    } catch (error) {
      console.error('Erro ao criar agendamento:', error)
      throw new Error(`Erro ao criar agendamento: ${error.message}`)
    }
  }

  const updateAgendamento = async (agendamentoId, dadosAtualizacao) => {
    try {
      const docRef = getTenantDoc('agendamentos', agendamentoId)
      await updateDoc(docRef, {
        ...dadosAtualizacao,
        atualizadoEm: new Date().toISOString(),
      })
      // Retorna o documento atualizado para atualização reativa na UI
      const updatedDoc = await getDoc(docRef)
      return { id: updatedDoc.id, ...updatedDoc.data() }
    } catch (error) {
      console.error('Erro ao atualizar agendamento:', error)
      throw new Error(`Erro ao atualizar agendamento: ${error.message}`)
    }
  }

  const deleteAgendamento = async (agendamentoId) => {
    try {
      const docRef = getTenantDoc('agendamentos', agendamentoId)
      await deleteDoc(docRef)
    } catch (error) {
      console.error('Erro ao deletar agendamento:', error)
      throw new Error(`Erro ao deletar agendamento: ${error.message}`)
    }
  }

  const getAgendamento = async (agendamentoId) => {
    try {
      const docRef = getTenantDoc('agendamentos', agendamentoId)
      const docSnap = await getDoc(docRef)
      return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null
    } catch (error) {
      console.error('Erro ao buscar agendamento:', error)
      throw new Error(`Erro ao buscar agendamento: ${error.message}`)
    }
  }

  // MÉTODOS PARA SERVIÇOS
  const servicosCollection = () => getCollection('servicos')

  const fetchServicos = async (apenasAtivos = true) => {
    try {
      let q = query(servicosCollection())

      if (apenasAtivos) {
        q = query(q, where('ativo', '==', true))
      }

      q = query(q, orderBy('nome', 'asc'))

      const snapshot = await getDocs(q)
      const result = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))

      console.log(`[FETCH SERVICOS] ${result.length} serviços encontrados`)
      return result
    } catch (error) {
      console.error('Erro ao buscar serviços:', error)

      // CORREÇÃO: Se não há serviços, retorna array vazio ao invés de erro
      if (error.code === 'permission-denied') {
        console.warn('Sem permissão para acessar serviços, retornando lista vazia')
        return []
      }

      throw new Error(`Erro ao carregar serviços: ${error.message}`)
    }
  }

  const createServico = async (dadosServico) => {
    try {
      const docRef = await addDoc(servicosCollection(), {
        ...dadosServico,
        ativo: true,
        criadoEm: new Date().toISOString(),
      })
      return docRef.id
    } catch (error) {
      console.error('Erro ao criar serviço:', error)
      throw new Error(`Erro ao criar serviço: ${error.message}`)
    }
  }

  const updateServico = async (servicoId, dadosAtualizacao) => {
    try {
      const docRef = getTenantDoc('servicos', servicoId)
      await updateDoc(docRef, {
        ...dadosAtualizacao,
        atualizadoEm: new Date().toISOString(),
      })
    } catch (error) {
      console.error('Erro ao atualizar serviço:', error)
      throw new Error(`Erro ao atualizar serviço: ${error.message}`)
    }
  }

  const deleteServico = async (servicoId) => {
    try {
      // Soft delete - apenas marcar como inativo
      await updateServico(servicoId, { ativo: false })
    } catch (error) {
      console.error('Erro ao deletar serviço:', error)
      throw new Error(`Erro ao deletar serviço: ${error.message}`)
    }
  }

  // MÉTODOS PARA HORÁRIOS
  const fetchHorario = async (diaDaSemana) => {
    try {
      const docRef = getTenantDoc('horarios', String(diaDaSemana))
      const docSnap = await getDoc(docRef)
      const result = docSnap.exists() ? docSnap.data() : null

      console.log(`[FETCH HORARIO] Dia ${diaDaSemana}:`, result ? 'encontrado' : 'não configurado')
      return result
    } catch (error) {
      console.error('Erro ao buscar horário:', error)

      // CORREÇÃO: Se não há horário configurado, retorna null ao invés de erro
      if (error.code === 'permission-denied') {
        console.warn('Sem permissão para acessar horários')
        return null
      }

      throw new Error(`Erro ao carregar horário: ${error.message}`)
    }
  }

  const updateHorario = async (diaDaSemana, dadosHorario) => {
    try {
      const docRef = getTenantDoc('horarios', String(diaDaSemana))
      await setDoc(docRef, dadosHorario, { merge: true })
    } catch (error) {
      console.error('Erro ao atualizar horário:', error)
      throw new Error(`Erro ao atualizar horário: ${error.message}`)
    }
  }

  const fetchTodosHorarios = async () => {
    try {
      const horarios = {}
      for (let dia = 0; dia <= 6; dia++) {
        horarios[dia] = await fetchHorario(dia)
      }
      return horarios
    } catch (error) {
      console.error('Erro ao buscar todos os horários:', error)
      throw new Error(`Erro ao carregar horários: ${error.message}`)
    }
  }

  // MÉTODOS PARA CONFIGURAÇÕES DA BARBEARIA
  const updateBarbeariaConfig = async (novasConfiguracoes) => {
    try {
      const tenantId = validateTenantAccess()
      const docRef = doc(db, 'barbearias', tenantId)
      await updateDoc(docRef, {
        configuracoes: novasConfiguracoes,
        atualizadoEm: new Date().toISOString(),
      })
    } catch (error) {
      console.error('Erro ao atualizar configurações:', error)
      throw new Error(`Erro ao atualizar configurações: ${error.message}`)
    }
  }

  const updateBarbeariaNome = async (novoNome) => {
    try {
      const tenantId = validateTenantAccess()
      const docRef = doc(db, 'barbearias', tenantId)
      await updateDoc(docRef, {
        nome: novoNome,
        atualizadoEm: new Date().toISOString(),
      })
    } catch (error) {
      console.error('Erro ao atualizar nome da barbearia:', error)
      throw new Error(`Erro ao atualizar nome: ${error.message}`)
    }
  }

  // UTILITÁRIOS
  const formatCurrency = (valor) => {
    return (valor || 0).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    })
  }

  // Calcular estatísticas do dia
  const calcularEstatisticasDia = (agendamentos, data) => {
    try {
      const dataStr = data.toISOString().split('T')[0]
      const agendamentosDoDia = agendamentos.filter(
        (apt) => new Date(apt.DataHoraISO).toISOString().split('T')[0] === dataStr,
      )

      const agendados = agendamentosDoDia.filter(
        (apt) => apt.Status === 'Agendado' || apt.Status === 'Concluído',
      )
      const faturamento = agendados.reduce((sum, apt) => sum + (apt.preco || 0), 0)

      return {
        total: agendamentosDoDia.length,
        agendados: agendados.length,
        faturamento,
        faturamentoFormatado: formatCurrency(faturamento),
      }
    } catch (error) {
      console.error('Erro ao calcular estatísticas:', error)
      return {
        total: 0,
        agendados: 0,
        faturamento: 0,
        faturamentoFormatado: formatCurrency(0),
      }
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
    calcularEstatisticasDia,
  }
}

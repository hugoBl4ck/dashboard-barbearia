// composables/useTenant.js (VERSÃO COM STORAGE)
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
  onSnapshot,
} from 'firebase/firestore'
import { db, storage } from '@/firebase' // Importa STORAGE
import {
  ref as storageRef,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage' // Importa funções do Storage

export const useTenant = () => {
  const { barbeariaId, barbeariaInfo } = useAuth()

  const isTenantReady = computed(() => !!barbeariaId.value)

  const validateTenantAccess = () => {
    if (!barbeariaId.value) {
      throw new Error('Barbearia ID não disponível. Faça login novamente.')
    }
    return barbeariaId.value
  }

  // ... (funções existentes de getCollection, getTenantDoc, etc., permanecem iguais)
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

  // --- NOVAS FUNÇÕES DE STORAGE ---

  /**
   * Faz upload de um arquivo para o Firebase Storage.
   * @param {File} file - O arquivo a ser enviado.
   * @param {string} path - O caminho de destino no Storage (ex: 'logos', 'gallery').
   * @returns {Promise<string>} - A URL de download do arquivo.
   */
  const uploadFile = async (file, path) => {
    const tenantId = validateTenantAccess()
    const uniqueName = `${Date.now()}-${file.name}`
    const fileRef = storageRef(storage, `barbearias/${tenantId}/${path}/${uniqueName}`)

    const uploadTask = uploadBytesResumable(fileRef, file)

    return new Promise((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          // Opcional: pode-se emitir o progresso aqui
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100
          console.log('Upload is ' + progress + '% done')
        },
        (error) => {
          console.error('Erro no upload:', error)
          reject(new Error(`Falha no upload do arquivo: ${error.message}`))
        },
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref)
          resolve(downloadURL)
        },
      )
    })
  }

  /**
   * Exclui um arquivo do Firebase Storage usando sua URL.
   * @param {string} fileUrl - A URL do arquivo a ser excluído.
   * @returns {Promise<void>}
   */
  const deleteFileByUrl = async (fileUrl) => {
    if (!fileUrl) return
    try {
      const fileRef = storageRef(storage, fileUrl)
      await deleteObject(fileRef)
      console.log('Arquivo excluído com sucesso:', fileUrl)
    } catch (error) {
      // Ignora erro de objeto não encontrado (pode já ter sido excluído)
      if (error.code === 'storage/object-not-found') {
        console.warn('Arquivo não encontrado no Storage (pode já ter sido excluído):', fileUrl)
        return
      }
      console.error('Erro ao excluir arquivo:', error)
      throw new Error(`Falha ao excluir arquivo: ${error.message}`)
    }
  }

  // --- FIM DAS NOVAS FUNÇÕES DE STORAGE ---

  // MÉTODOS PARA AGENDAMENTOS (sem alterações)
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

  const listenToAgendamentos = (callback, filters = {}) => {
    try {
      let q = query(agendamentosCollection())

      if (filters.dataInicio && filters.dataFim) {
        q = query(
          q,
          where('DataHoraISO', '>=', filters.dataInicio),
          where('DataHoraISO', '<=', filters.dataFim),
        )
      }

      q = query(q, orderBy('DataHoraISO', 'asc'))

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const result = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
        console.log(`[REALTIME UPDATE] ${result.length} agendamentos recebidos.`)
        callback(result)
      }, (error) => {
        console.error('Erro no listener de agendamentos:', error)
      });

      return unsubscribe;
    } catch (error) {
      console.error('Erro ao iniciar o listener de agendamentos:', error)
      throw error
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

  // MÉTODOS PARA SERVIÇOS (sem alterações)
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
      await updateServico(servicoId, { ativo: false })
    } catch (error) {
      console.error('Erro ao deletar serviço:', error)
      throw new Error(`Erro ao deletar serviço: ${error.message}`)
    }
  }

  // MÉTODOS PARA HORÁRIOS (sem alterações)
  const fetchHorario = async (diaDaSemana) => {
    try {
      const docRef = getTenantDoc('horarios', String(diaDaSemana))
      const docSnap = await getDoc(docRef)
      const result = docSnap.exists() ? docSnap.data() : null

      console.log(`[FETCH HORARIO] Dia ${diaDaSemana}:`, result ? 'encontrado' : 'não configurado')
      return result
    } catch (error) {
      console.error('Erro ao buscar horário:', error)

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

  // MÉTODOS PARA CONFIGURAÇÕES DA BARBEARIA (sem alterações)
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

  // ... (demais funções existentes permanecem iguais)
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

    // --- EXPORTA NOVAS FUNÇÕES ---
    uploadFile,
    deleteFileByUrl,

    // Métodos de agendamentos
    fetchAgendamentos,
    listenToAgendamentos,
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

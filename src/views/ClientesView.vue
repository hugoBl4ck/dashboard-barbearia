<template>
  <v-container fluid class="pa-6 page-container">
    <!-- CABEÇALHO -->
    <v-row>
      <v-col>
        <h1 class="text-h4 font-weight-bold">Clientes</h1>
        <p class="text-subtitle-1 text-medium-emphasis">Histórico de agendamentos e faturamento</p>
      </v-col>
    </v-row>

    <!-- ESTADO VAZIO -->
    <v-row v-if="!loading && clientData.length === 0" class="mt-4">
      <v-col>
        <EmptyState
          icon="mdi-account-off-outline"
          title="Nenhum Cliente Encontrado"
          message="Ainda não há clientes registados nesta barbearia ou não foram encontrados na sua busca."
        >
          <v-btn
            color="primary"
            @click="onAddClientClick"
            :loading="addingClient"
            prepend-icon="mdi-plus"
          >
            Adicionar Primeiro Cliente
          </v-btn>
        </EmptyState>
      </v-col>
    </v-row>

    <!-- TABELA DE DADOS EXPANSÍVEL -->
    <v-row v-if="!loading && clientData.length > 0">
      <v-col>
        <v-card class="data-table-card">
          <v-card-title class="d-flex align-center pa-4">
            <v-icon class="mr-2">mdi-account-search</v-icon>
            Lista de Clientes
            <v-spacer></v-spacer>
            <v-text-field
              v-model="search"
              label="Buscar cliente..."
              variant="outlined"
              density="compact"
              hide-details
              prepend-inner-icon="mdi-magnify"
              style="max-width: 300px"
            ></v-text-field>
          </v-card-title>

          <v-divider></v-divider>

          <!-- Nova VDataTableServer com expansão -->
          <v-data-table
            v-model:expanded="expanded"
            :headers="headers"
            :items="clientData"
            :loading="loading"
            :search="search"
            item-value="telefone"
            show-expand
            class="elevation-0"
          >
            <!-- Slot para a linha expandida -->
            <template v-slot:expanded-row="{ columns, item }">
              <tr>
                <td :colspan="columns.length" class="pa-0">
                  <v-list class="expanded-list">
                    <v-list-item
                      v-for="agendamento in item.agendamentos"
                      :key="agendamento.id"
                      class="expanded-item"
                    >
                      <v-list-item-title class="d-flex align-center">
                        <v-chip size="small" class="mr-4">{{
                          agendamento.DataHoraFormatada.split(' ')[0]
                        }}</v-chip>
                        <div>
                          <div>{{ agendamento.servicoNome }}</div>
                          <!-- CHIP DE STATUS VISUAL -->
                          <v-chip
                            :color="getStatusColor(agendamento.Status)"
                            size="x-small"
                            class="mt-1"
                            label
                          >
                            {{ agendamento.Status }}
                          </v-chip>
                        </div>
                      </v-list-item-title>

                      <template v-slot:append>
                        <div class="d-flex align-center">
                          <!-- Campo de Preço Editável -->
                          <v-text-field
                            v-model.number="agendamento.precoEditavel"
                            type="number"
                            variant="outlined"
                            density="compact"
                            hide-details
                            prefix="R$"
                            style="width: 120px"
                            class="mr-2"
                            @click.stop
                          ></v-text-field>
                          <v-btn
                            icon
                            size="small"
                            variant="text"
                            color="primary"
                            @click.stop="salvarPreco(agendamento)"
                            :disabled="agendamento.preco === agendamento.precoEditavel"
                          >
                            <v-icon>mdi-content-save</v-icon>
                          </v-btn>
                        </div>
                      </template>
                    </v-list-item>
                  </v-list>
                </td>
              </tr>
            </template>

            <!-- Slots para formatação (iguais ao anterior) -->
            <template v-slot:item.nome="{ item }">
              <div class="font-weight-bold">{{ item.nome }}</div>
            </template>
            <template v-slot:item.totalGasto="{ item }">
              <span class="text-green font-weight-medium">{{
                item.totalGasto.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
              }}</span>
            </template>
            <template v-slot:item.ultimoServico="{ item }">
              <v-chip size="small" variant="tonal">{{ item.ultimoServico }}</v-chip>
            </template>
          </v-data-table>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<style scoped>
.page-container {
  font-family: 'Poppins', sans-serif;
}
.data-table-card {
  border-radius: 12px;
}
.expanded-list {
  background-color: rgba(var(--v-theme-on-surface), 0.04);
}
.expanded-item {
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.08);
}
.expanded-item:last-child {
  border-bottom: none;
}
</style>

<script setup>
import { ref, computed, watchEffect } from 'vue'
import { useTenant } from '@/composables/useTenant'
import EmptyState from '@/components/EmptyState.vue'

const loading = ref(true)
const addingClient = ref(false)
const allAppointments = ref([])
const search = ref('')
const expanded = ref([]) // Controla quais linhas estão expandidas

// Usar o composable para acesso aos dados do tenant
const { fetchAgendamentos, updateAgendamento, isTenantReady } = useTenant()

const headers = [
  { title: 'Nome do Cliente', key: 'nome', align: 'start' },
  { title: 'Telefone', key: 'telefone', align: 'start' },
  { title: 'Total de Visitas', key: 'visitas', align: 'center' },
  { title: 'Total Gasto', key: 'totalGasto', align: 'end' },
  { title: 'Última Visita', key: 'ultimaVisita', align: 'end' },
  { title: 'Ações', key: 'data-table-expand', align: 'center' },
]

watchEffect(async () => {
  if (isTenantReady.value) {
    loading.value = true
    try {
      const agendamentos = await fetchAgendamentos()
      allAppointments.value = agendamentos.map((agendamento) => ({
        ...agendamento,
        precoEditavel: agendamento.preco || 0,
      }))
    } catch (error) {
      console.error('Erro ao carregar agendamentos na ClientesView:', error)
      // Tratar o erro, talvez exibir uma mensagem para o usuário
    } finally {
      loading.value = false
    }
  }
})

const clientData = computed(() => {
  if (allAppointments.value.length === 0) return []
  const clientsByPhone = allAppointments.value.reduce(
    (acc, apt) => {
      const phone = apt.TelefoneCliente
      if (!phone) return acc
      if (!acc[phone]) {
        acc[phone] = { nome: apt.NomeCliente, telefone: phone, agendamentos: [] }
      }
      acc[phone].nome = apt.NomeCliente
      acc[phone].agendamentos.push(apt)
      return acc
    },
    {},
  )

  return Object.values(clientsByPhone).map((client) => {
    const agendamentosOrdenados = client.agendamentos.sort((a, b) => {
      const dateA = a.DataHoraISO ? new Date(a.DataHoraISO).getTime() : 0
      const dateB = b.DataHoraISO ? new Date(b.DataHoraISO).getTime() : 0
      return dateB - dateA
    })
    const ultimoAgendamento = agendamentosOrdenados[0]
    const agendamentosValidos = agendamentosOrdenados.filter(
      (apt) => apt.Status === 'Concluído' || apt.Status === 'Agendado',
    )
    const totalGasto = agendamentosValidos.reduce((sum, apt) => sum + (apt.preco || 0), 0)

    return {
      nome: client.nome,
      telefone: client.telefone,
      visitas: agendamentosOrdenados.length,
      totalGasto: totalGasto,
      ultimoServico: ultimoAgendamento?.servicoNome || 'N/A',
      ultimaVisita: ultimoAgendamento?.DataHoraISO
        ? new Date(ultimoAgendamento.DataHoraISO).toLocaleDateString('pt-BR')
        : 'N/A',
      agendamentos: agendamentosOrdenados,
    }
  })
})

const onAddClientClick = () => {
  addingClient.value = true
  // Lógica para abrir um modal de adição de cliente deve ser implementada aqui
  console.log('Abrir modal para adicionar novo cliente...')

  // Simular uma operação assíncrona
  setTimeout(() => {
    addingClient.value = false
  }, 2000)
}

const salvarPreco = async (agendamento) => {
  try {
    await updateAgendamento(agendamento.id, {
      preco: agendamento.precoEditavel,
    })

    agendamento.preco = agendamento.precoEditavel

    alert('Preço atualizado com sucesso!')
  } catch (error) {
    console.error('Erro ao atualizar o preço:', error)
    alert('Ocorreu um erro ao salvar. Tente novamente.')
    agendamento.precoEditavel = agendamento.preco
  }
}
const getStatusColor = (status) => {
  if (status === 'Agendado') return 'blue'
  if (status === 'Concluído') return 'success'
  if (status === 'Cancelado') return 'red'
  return 'grey'
}
</script>

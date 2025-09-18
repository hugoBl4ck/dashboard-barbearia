<script setup>
import { ref, onMounted } from 'vue'
import { useTenant } from '@/composables/useTenant'

const tenant = useTenant()
const loading = ref(true)
const saving = ref(false)
const snackbar = ref(false)
const snackbarMessage = ref('')

// Estrutura de dados para os horários
const horarios = ref({})

const diasDaSemana = [
  { id: 0, nome: 'Domingo' },
  { id: 1, nome: 'Segunda-feira' },
  { id: 2, nome: 'Terça-feira' },
  { id: 3, nome: 'Quarta-feira' },
  { id: 4, nome: 'Quinta-feira' },
  { id: 5, nome: 'Sexta-feira' },
  { id: 6, nome: 'Sábado' },
]

// Modelo de horário padrão
const horarioPadrao = () => ({
  aberto: false,
  InicioManha: '09:00',
  FimManha: '12:00',
  InicioTarde: '14:00',
  FimTarde: '19:00',
})

onMounted(async () => {
  try {
    const horariosDoBanco = await tenant.fetchTodosHorarios()
    const tempHorarios = {}
    diasDaSemana.forEach(({ id }) => {
      // Se o dia existe no banco, usa os dados. Senão, usa o padrão.
      tempHorarios[id] = horariosDoBanco[id] ? { ...horarioPadrao(), ...horariosDoBanco[id] } : horarioPadrao()
    })
    horarios.value = tempHorarios
  } catch (error) {
    console.error("Erro ao buscar horários:", error)
    snackbarMessage.value = 'Erro ao carregar os horários.'
    snackbar.value = true
  } finally {
    loading.value = false
  }
})

const salvarHorarios = async () => {
  saving.value = true
  try {
    // Itera sobre cada dia da semana e salva no banco
    for (const dia of diasDaSemana) {
      const horarioDoDia = horarios.value[dia.id]
      await tenant.updateHorario(dia.id, horarioDoDia)
    }
    snackbarMessage.value = 'Horários salvos com sucesso!'
    snackbar.value = true
  } catch (error) {
    console.error("Erro ao salvar horários:", error)
    snackbarMessage.value = 'Ocorreu um erro ao salvar.'
    snackbar.value = true
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <v-container>
    <v-card>
      <v-card-title class="d-flex align-center">
        <v-icon start>mdi-clock-outline</v-icon>
        Horários de Funcionamento
      </v-card-title>
      <v-card-subtitle>
        Defina os dias e horários em que sua barbearia estará aberta para agendamentos.
      </v-card-subtitle>

      <v-divider class="mt-4"></v-divider>

      <div v-if="loading" class="text-center pa-8">
        <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
        <p class="mt-4">Carregando horários...</p>
      </div>

      <v-list v-else lines="three">
        <v-list-item v-for="dia in diasDaSemana" :key="dia.id">
          <v-row align="center">
            <!-- Dia da semana e Switch -->
            <v-col cols="12" md="3">
              <v-list-item-title class="font-weight-bold">{{ dia.nome }}</v-list-item-title>
              <v-switch
                v-model="horarios[dia.id].aberto"
                :label="horarios[dia.id].aberto ? 'Aberto' : 'Fechado'"
                color="primary"
                inset
                hide-details
              ></v-switch>
            </v-col>

            <!-- Inputs de Horário -->
            <v-col cols="12" md="9">
              <v-row v-if="horarios[dia.id].aberto">
                <v-col cols="6" sm="3">
                  <v-text-field
                    v-model="horarios[dia.id].InicioManha"
                    label="Início Manhã"
                    type="time"
                    density="compact"
                    variant="outlined"
                  ></v-text-field>
                </v-col>
                <v-col cols="6" sm="3">
                  <v-text-field
                    v-model="horarios[dia.id].FimManha"
                    label="Fim Manhã"
                    type="time"
                    density="compact"
                    variant="outlined"
                  ></v-text-field>
                </v-col>
                <v-col cols="6" sm="3">
                  <v-text-field
                    v-model="horarios[dia.id].InicioTarde"
                    label="Início Tarde"
                    type="time"
                    density="compact"
                    variant="outlined"
                  ></v-text-field>
                </v-col>
                <v-col cols="6" sm="3">
                  <v-text-field
                    v-model="horarios[dia.id].FimTarde"
                    label="Fim Tarde"
                    type="time"
                    density="compact"
                    variant="outlined"
                  ></v-text-field>
                </v-col>
              </v-row>
              <div v-else class="text-center text-medium-emphasis pa-4">
                Fechado o dia todo
              </div>
            </v-col>
          </v-row>
          <v-divider v-if="dia.id < 6" class="mt-2"></v-divider>
        </v-list-item>
      </v-list>

      <v-divider></v-divider>

      <v-card-actions class="pa-4">
        <v-spacer></v-spacer>
        <v-btn
          color="primary"
          variant="flat"
          @click="salvarHorarios"
          :loading="saving"
          size="large"
          prepend-icon="mdi-content-save"
        >
          Salvar Horários
        </v-btn>
      </v-card-actions>
    </v-card>

    <v-snackbar v-model="snackbar" :timeout="3000" location="top">
      {{ snackbarMessage }}
    </v-snackbar>
  </v-container>
</template>

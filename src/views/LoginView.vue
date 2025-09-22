<template>
  <v-app>
    <v-main>
      <v-container fluid class="fill-height login-container pa-0">
        <v-row align="center" justify="center" class="fill-height">
          <v-col cols="12" sm="8" md="6" lg="4" xl="3">
            <v-card class="login-card mx-auto" elevation="8" rounded="lg">
              <!-- HEADER -->
              <div class="login-header text-center pa-8">
                <img src="@/assets/GESTAO BARBEARIA APP LOGO.png" alt="Logo da Barbearia" style="width: 100px; height: auto; margin-bottom: 1rem;" />
                <h1 class="text-h4 font-weight-bold mb-2">BarberApp</h1>
                <p class="text-body-2 text-medium-emphasis">Sistema de Gestão para Barbearias</p>
              </div>

              <v-divider></v-divider>

              <!-- FORMULÁRIO -->
              <v-card-text class="pa-8">
                <v-form v-model="isFormValid" @submit.prevent="handleSubmit" ref="formRef">
                  <!-- TABS PARA LOGIN/CADASTRO -->
                  <v-tabs v-model="currentTab" class="mb-6" center-active>
                    <v-tab value="login">Entrar</v-tab>
                    <v-tab value="register">Cadastrar</v-tab>
                  </v-tabs>

                  <v-window v-model="currentTab">
                    <!-- ABA LOGIN -->
                    <v-window-item value="login">
                      <div class="mb-6">
                        <!-- CORREÇÃO: Adicionado ref ao campo de e-mail -->
                        <v-text-field
                          v-model="email"
                          label="E-mail"
                          type="email"
                          variant="outlined"
                          density="comfortable"
                          prepend-inner-icon="mdi-email"
                          :rules="emailRules"
                          :error-messages="emailError"
                          class="mb-4"
                          ref="emailFieldRef"
                          autocomplete="email"
                        ></v-text-field>

                        <v-text-field
                          v-model="password"
                          label="Senha"
                          :type="showPassword ? 'text' : 'password'"
                          variant="outlined"
                          density="comfortable"
                          prepend-inner-icon="mdi-lock"
                          :append-inner-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
                          @click:append-inner="showPassword = !showPassword"
                          :rules="passwordRules"
                          :error-messages="passwordError"
                          autocomplete="current-password"
                        ></v-text-field>

                        <!-- ESQUECI A SENHA -->
                        <div class="text-right">
                          <v-btn
                            variant="text"
                            size="small"
                            @click="esqueceuSenha"
                            class="text-primary"
                          >
                            Esqueceu a senha?
                          </v-btn>
                        </div>
                      </div>
                    </v-window-item>

                    <!-- ABA CADASTRO -->
                    <v-window-item value="register">
                      <div class="mb-6">
                        <v-text-field
                          v-model="nomeBarbearia"
                          label="Nome da Barbearia"
                          variant="outlined"
                          density="comfortable"
                          prepend-inner-icon="mdi-store"
                          :rules="nomeRules"
                          class="mb-4"
                          hint="Este será o nome que aparecerá para seus clientes"
                          persistent-hint
                        ></v-text-field>

                        <v-text-field
                          v-model="nomeProprietario"
                          label="Seu Nome"
                          variant="outlined"
                          density="comfortable"
                          prepend-inner-icon="mdi-account"
                          :rules="nomeProprietarioRules"
                          class="mb-4"
                          autocomplete="name"
                        ></v-text-field>

                        <v-text-field
                          v-model="email"
                          label="E-mail"
                          type="email"
                          variant="outlined"
                          density="comfortable"
                          prepend-inner-icon="mdi-email"
                          :rules="emailRules"
                          :error-messages="emailError"
                          class="mb-4"
                          autocomplete="email"
                        ></v-text-field>

                        <v-text-field
                          v-model="password"
                          label="Senha"
                          :type="showPassword ? 'text' : 'password'"
                          variant="outlined"
                          density="comfortable"
                          prepend-inner-icon="mdi-lock"
                          :append-inner-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
                          @click:append-inner="showPassword = !showPassword"
                          :rules="registerPasswordRules"
                          :error-messages="passwordError"
                          class="mb-4"
                          autocomplete="new-password"
                        ></v-text-field>

                        <v-text-field
                          v-model="confirmPassword"
                          label="Confirmar Senha"
                          :type="showConfirmPassword ? 'text' : 'password'"
                          variant="outlined"
                          density="comfortable"
                          prepend-inner-icon="mdi-lock-check"
                          :append-inner-icon="showConfirmPassword ? 'mdi-eye' : 'mdi-eye-off'"
                          @click:append-inner="showConfirmPassword = !showConfirmPassword"
                          :rules="confirmPasswordRules"
                          autocomplete="new-password"
                          class="mb-4"
                        ></v-text-field>

                        <!-- TERMOS DE USO -->
                        <div class="mb-4">
                          <v-checkbox
                            v-model="aceitaTermos"
                            density="compact"
                            color="primary"
                            :rules="[(v) => !!v || 'Você deve aceitar os termos para continuar']"
                          >
                            <template v-slot:label>
                              <div class="text-body-2">
                                Aceito os
                                <a
                                  href="#"
                                  @click.prevent="abrirTermos"
                                  class="text-primary text-decoration-none"
                                >
                                  Termos de Uso
                                </a>
                                e
                                <a
                                  href="#"
                                  @click.prevent="abrirPrivacidade"
                                  class="text-primary text-decoration-none"
                                >
                                  Política de Privacidade
                                </a>
                              </div>
                            </template>
                          </v-checkbox>
                        </div>
                      </div>
                    </v-window-item>
                  </v-window>

                  <!-- BOTÕES -->
                  <v-btn
                    type="submit"
                    color="primary"
                    size="large"
                    block
                    class="mb-4"
                    :loading="loading"
                    :disabled="!isFormValid || loading"
                  >
                    {{ currentTab === 'login' ? 'Entrar' : 'Criar Conta' }}
                  </v-btn>

                  <!-- DIVIDER -->
                  <v-row align="center" class="mb-4">
                    <v-col><v-divider></v-divider></v-col>
                    <v-col cols="auto" class="text-caption text-medium-emphasis px-4">ou</v-col>
                    <v-col><v-divider></v-divider></v-col>
                  </v-row>

                  <!-- LOGIN COM GOOGLE -->
                  <v-btn
                    variant="outlined"
                    size="large"
                    block
                    @click="handleGoogleLogin"
                    :loading="googleLoading"
                    class="text-none mb-4"
                  >
                    <template v-slot:prepend>
                      <v-icon color="#DB4437">mdi-google</v-icon>
                    </template>
                    Continuar com Google
                  </v-btn>

                  <!-- LINK PARA DEMO -->
                  <div class="text-center">
                    <v-btn
                      variant="text"
                      size="small"
                      @click="abrirDemo"
                      class="text-medium-emphasis"
                    >
                      <v-icon start size="16">mdi-play-circle-outline</v-icon>
                      Ver demonstração
                    </v-btn>
                  </div>
                </v-form>
              </v-card-text>
            </v-card>

            <!-- FOOTER INFO -->
            <div class="text-center mt-6">
              <div class="d-flex justify-center align-center mb-2">
                <v-icon size="16" class="mr-1">mdi-shield-check</v-icon>
                <span class="text-caption text-medium-emphasis"
                  >Seus dados estão seguros conosco</span
                >
              </div>
              <p class="text-caption text-medium-emphasis">
                © 2025 BarberApp - Todos os direitos reservados
              </p>
            </div>
          </v-col>
        </v-row>
      </v-container>
    </v-main>

    <!-- DIALOG ESQUECI A SENHA -->
    <v-dialog v-model="dialogEsqueceuSenha" max-width="400px">
      <v-card class="pa-4">
        <v-card-title class="text-h5">Recuperar Senha</v-card-title>
        <v-card-subtitle>Digite seu e-mail para receber um link de recuperação</v-card-subtitle>
        <v-card-text>
          <v-text-field
            v-model="emailRecuperacao"
            label="E-mail"
            type="email"
            variant="outlined"
            density="compact"
            prepend-inner-icon="mdi-email"
            :rules="emailRules"
          ></v-text-field>
        </v-card-text>
        <v-card-actions class="justify-end">
          <v-btn text @click="dialogEsqueceuSenha = false">Cancelar</v-btn>
          <v-btn color="primary" @click="enviarRecuperacaoSenha" :loading="loadingRecuperacao">
            Enviar Link
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- DIALOG TERMOS DE USO -->
    <v-dialog v-model="dialogTermos" max-width="600px" scrollable>
      <v-card>
        <v-card-title class="d-flex align-center">
          <v-icon class="mr-2">mdi-file-document-outline</v-icon>
          Termos de Uso
        </v-card-title>
        <v-divider></v-divider>
        <v-card-text class="pa-6" style="height: 400px">
          <div class="terms-content">
            <h3>1. Aceitação dos Termos</h3>
            <p>Ao utilizar o BarberApp, você concorda com estes termos de uso.</p>

            <h3>2. Descrição do Serviço</h3>
            <p>O BarberApp é um sistema de gestão para barbearias que permite:</p>
            <ul>
              <li>Gerenciamento de agendamentos</li>
              <li>Controle de clientes e serviços</li>
              <li>Landing page para seus clientes</li>
              <li>Relatórios e estatísticas</li>
            </ul>

            <h3>3. Responsabilidades do Usuário</h3>
            <p>Você é responsável por:</p>
            <ul>
              <li>Manter suas credenciais de acesso seguras</li>
              <li>Fornecer informações precisas e atualizadas</li>
              <li>Usar o serviço de forma adequada e legal</li>
            </ul>

            <h3>4. Privacidade dos Dados</h3>
            <p>Seus dados são tratados conforme nossa Política de Privacidade.</p>

            <h3>5. Limitação de Responsabilidade</h3>
            <p>O BarberApp não se responsabiliza por danos decorrentes do uso do sistema.</p>
          </div>
        </v-card-text>
        <v-divider></v-divider>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="primary" @click="dialogTermos = false">Fechar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- DIALOG POLÍTICA DE PRIVACIDADE -->
    <v-dialog v-model="dialogPrivacidade" max-width="600px" scrollable>
      <v-card>
        <v-card-title class="d-flex align-center">
          <v-icon class="mr-2">mdi-shield-account</v-icon>
          Política de Privacidade
        </v-card-title>
        <v-divider></v-divider>
        <v-card-text class="pa-6" style="height: 400px">
          <div class="privacy-content">
            <h3>1. Coleta de Dados</h3>
            <p>Coletamos apenas os dados necessários para o funcionamento do serviço:</p>
            <ul>
              <li>Nome e e-mail para identificação</li>
              <li>Dados de agendamentos e clientes</li>
              <li>Informações de uso do sistema</li>
            </ul>

            <h3>2. Uso dos Dados</h3>
            <p>Seus dados são utilizados para:</p>
            <ul>
              <li>Prover o serviço de gestão da barbearia</li>
              <li>Melhorar a experiência do usuário</li>
              <li>Comunicação sobre o serviço</li>
            </ul>

            <h3>3. Compartilhamento de Dados</h3>
            <p>Não compartilhamos seus dados pessoais com terceiros, exceto quando:</p>
            <ul>
              <li>Exigido por lei</li>
              <li>Necessário para prestação do serviço</li>
            </ul>

            <h3>4. Segurança</h3>
            <p>Utilizamos medidas de segurança adequadas para proteger seus dados.</p>

            <h3>5. Seus Direitos</h3>
            <p>
              Você pode solicitar acesso, correção ou exclusão de seus dados a qualquer momento.
            </p>
          </div>
        </v-card-text>
        <v-divider></v-divider>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="primary" @click="dialogPrivacidade = false">Fechar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- SNACKBAR PARA FEEDBACK -->
    <v-snackbar v-model="showAlert" :color="alertType" location="top" :timeout="4000">
      <div class="d-flex align-center">
        <v-icon class="mr-2">
          {{ alertType === 'error' ? 'mdi-alert-circle' : 'mdi-check-circle' }}
        </v-icon>
        {{ alertMessage }}
      </div>
      <template v-slot:actions>
        <v-btn variant="text" @click="showAlert = false" icon="mdi-close"></v-btn>
      </template>
    </v-snackbar>
  </v-app>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'

// Router
const router = useRouter()

// Composable de autenticação
const { loginWithGoogle, loginWithEmail, registerWithEmail, isAuthenticated, sendPasswordReset } =
  useAuth()

// Estado do formulário
const currentTab = ref('login')
const formRef = ref(null)
const emailFieldRef = ref(null)
const email = ref('')
const password = ref('')
const isFormValid = ref(false)
const confirmPassword = ref('')
const nomeBarbearia = ref('')
const nomeProprietario = ref('')
const aceitaTermos = ref(false)
const showPassword = ref(false)
const showConfirmPassword = ref(false)
const loading = ref(false)
const googleLoading = ref(false)

// Estados dos dialogs
const dialogEsqueceuSenha = ref(false)
const dialogTermos = ref(false)
const dialogPrivacidade = ref(false)
const emailRecuperacao = ref('')
const loadingRecuperacao = ref(false)

// Estado dos alertas
const showAlert = ref(false)
const alertMessage = ref('')
const alertType = ref('success')
const emailError = ref('')
const passwordError = ref('')

// Regras de validação
const emailRules = [
  (v) => !!v || 'E-mail é obrigatório',
  (v) => /.+@.+\..+/.test(v) || 'E-mail deve ser válido',
]

const passwordRules = [(v) => !!v || 'Senha é obrigatória']

const registerPasswordRules = [
  (v) => !!v || 'Senha é obrigatória',
  (v) => v.length >= 6 || 'Senha deve ter pelo menos 6 caracteres',
  (v) =>
    /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(v) ||
    'Senha deve conter ao menos: 1 minúscula, 1 maiúscula e 1 número',
]

const nomeRules = [
  (v) => !!v || 'Nome da barbearia é obrigatório',
  (v) => v.length >= 3 || 'Nome deve ter pelo menos 3 caracteres',
  (v) => v.length <= 50 || 'Nome deve ter no máximo 50 caracteres',
]

const nomeProprietarioRules = [
  (v) => !!v || 'Seu nome é obrigatório',
  (v) => v.length >= 2 || 'Nome deve ter pelo menos 2 caracteres',
  (v) => v.length <= 50 || 'Nome deve ter no máximo 50 caracteres',
]

// CORREÇÃO: Regra de validação agora é uma propriedade computada
const confirmPasswordRules = computed(() => [
  (v) => !!v || 'Confirmar senha é obrigatório',
  (v) => v === password.value || 'Senhas devem coincidir',
])

// Limpar erros quando trocar de aba
watch(currentTab, () => {
  emailError.value = ''
  passwordError.value = ''
  clearForm()
})

// Limpar formulário
const clearForm = () => {
  if (formRef.value) {
    formRef.value.resetValidation()
  }
  // Manter email para melhor UX
  if (currentTab.value === 'login') {
    password.value = ''
  } else {
    nomeBarbearia.value = ''
    nomeProprietario.value = ''
    password.value = ''
    confirmPassword.value = ''
    aceitaTermos.value = false
  }
}

// Mostrar alerta
const showAlertMessage = (message, type = 'success') => {
  alertMessage.value = message
  alertType.value = type
  showAlert.value = true
}

// Tratar erros do Firebase
const handleFirebaseError = (errorCode) => {
  const errorMap = {
    'auth/user-not-found': 'Usuário não encontrado',
    'auth/wrong-password': 'Senha incorreta',
    'auth/email-already-in-use': 'Este e-mail já está em uso',
    'auth/weak-password': 'Senha muito fraca',
    'auth/invalid-email': 'E-mail inválido',
    'auth/too-many-requests': 'Muitas tentativas. Tente novamente mais tarde',
    'auth/user-disabled': 'Usuário desabilitado',
    'auth/operation-not-allowed': 'Operação não permitida',
    'auth/popup-closed-by-user': 'Login cancelado pelo usuário',
    'auth/network-request-failed': 'Erro de conexão. Verifique sua internet',
    'auth/invalid-credential': 'Credenciais inválidas',
    'auth/user-token-expired': 'Sessão expirada. Faça login novamente',
  }

  return errorMap[errorCode] || 'Erro desconhecido. Tente novamente.'
}

// Submeter formulário
const handleSubmit = async () => {
  const { valid } = await formRef.value.validate()
  if (!valid) return

  loading.value = true
  emailError.value = ''
  passwordError.value = ''

  try {
    // Apenas inicia o processo de login/registro.
    // Não redireciona daqui. O watcher fará isso.
    if (currentTab.value === 'login') {
      await loginWithEmail(email.value, password.value)
    } else {
      await registerWithEmail(
        email.value,
        password.value,
        nomeBarbearia.value,
        nomeProprietario.value,
      )
    }
  } catch (error) {
    const errorMsg = handleFirebaseError(error.code)

    // Mostrar erros específicos nos campos
    if (error.code.includes('email')) {
      emailError.value = errorMsg
    } else if (error.code.includes('password')) {
      passwordError.value = errorMsg
    } else {
      showAlertMessage(errorMsg, 'error')
    }
  } finally {
    loading.value = false
  }
}

// Login com Google
const handleGoogleLogin = async () => {
  googleLoading.value = true
  try {
    await loginWithGoogle()
  } catch (error) {
    const errorMsg = handleFirebaseError(error.code)
    showAlertMessage(errorMsg, 'error')
  } finally {
    googleLoading.value = false
  }
}

// Esqueceu a senha
const esqueceuSenha = () => {
  emailRecuperacao.value = email.value
  dialogEsqueceuSenha.value = true
}

// Enviar recuperação de senha
const enviarRecuperacaoSenha = async () => {
  if (!emailRecuperacao.value || !/.+@.+\..+/.test(emailRecuperacao.value)) {
    showAlertMessage('Digite um e-mail válido', 'error')
    return
  }

  loadingRecuperacao.value = true

  try {
    await sendPasswordReset(emailRecuperacao.value)
    showAlertMessage('E-mail de recuperação enviado! Verifique sua caixa de entrada.', 'success')
    dialogEsqueceuSenha.value = false
    emailRecuperacao.value = ''
  } catch (error) {
    const errorMsg = handleFirebaseError(error.code)
    showAlertMessage(errorMsg, 'error')
  } finally {
    loadingRecuperacao.value = false
  }
}

// Abrir dialogs
const abrirTermos = () => {
  dialogTermos.value = true
}

const abrirPrivacidade = () => {
  dialogPrivacidade.value = true
}

const abrirDemo = () => {
  // Redirecionar para landing page demo
  window.open('/cliente/01', '_blank')
}

// --- CORREÇÃO PRINCIPAL ---
// Observa o estado de autenticação do useAuth.
// Quando o usuário é autenticado, redireciona.
watch(
  isAuthenticated,
  (isAuth) => {
    if (isAuth) {
      showAlertMessage(
        currentTab.value === 'login'
          ? 'Login realizado com sucesso!'
          : 'Conta criada com sucesso! Bem-vindo ao BarberApp!',
        'success',
      )
      setTimeout(() => {
        router.push('/dashboard')
      }, 1500)
    }
  },
  { immediate: true },
) // 'immediate' para verificar no carregamento inicial

// Auto-focus nos inputs
watch(currentTab, () => {
  setTimeout(() => {
    if (currentTab.value === 'login') {
      // Focus no email se estiver vazio
      // CORREÇÃO: Usando a ref do Vue em vez de querySelector
      if (!email.value) {
        emailFieldRef.value?.focus()
      }
    }
  }, 100)
})
</script>

<style scoped>
.login-container {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
}

.login-card {
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  max-width: 500px;
  max-width: 100%;
}

.login-header {
  background: rgba(255, 255, 255, 0.05);
}

/* Tema escuro */
.v-theme--dark .login-container {
  background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
}

.v-theme--dark .login-card {
  background: rgba(30, 30, 30, 0.95) !important;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.v-theme--dark .login-header {
  background: rgba(0, 0, 0, 0.2);
}

/* Animações */
.login-card {
  animation: slideUp 0.6s ease-out;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Estilização dos termos de uso */
.terms-content h3,
.privacy-content h3 {
  color: #1976d2;
  margin: 16px 0 8px 0;
  font-size: 1.1rem;
}

.terms-content p,
.privacy-content p {
  margin-bottom: 12px;
  line-height: 1.6;
}

.terms-content ul,
.privacy-content ul {
  margin-left: 16px;
  margin-bottom: 12px;
}

.terms-content li,
.privacy-content li {
  margin-bottom: 4px;
}

/* Responsividade */
@media (max-width: 600px) {
  .login-container {
    padding: 16px;
  }

  .pa-8 {
    padding: 24px !important;
  }

  .login-header {
    padding: 32px 24px !important;
  }
}

@media (max-width: 400px) {
  .pa-8 {
    padding: 16px !important;
  }

  .login-header {
    padding: 24px 16px !important;
  }
}

/* Melhorar aparência dos links */
a {
  text-decoration: none !important;
}

a:hover {
  text-decoration: underline !important;
}

/* Melhorar espaçamento dos checkboxes */
.v-selection-control {
  min-height: auto;
}

/* Estilização adicional para inputs */
.v-text-field .v-field {
  border-radius: 8px;
}

/* Loading states */
.v-btn.v-btn--loading {
  pointer-events: none;
}

/* Melhorar contraste dos placeholders */
.v-theme--dark .v-field input::placeholder {
  opacity: 0.7;
}
</style>

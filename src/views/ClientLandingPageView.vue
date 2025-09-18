<template>
  <v-app>
    <!-- HEADER -->
    <v-app-bar color="primary" elevation="4" height="80">
      <v-container class="d-flex align-center">
        <div class="d-flex align-center">
          <v-avatar size="50" class="mr-4" color="white">
            <v-icon size="30" color="primary">mdi-content-cut</v-icon>
          </v-avatar>
          <div>
            <h2 class="text-h5 font-weight-bold text-white">{{ barbeariaInfo?.nome || 'Barbearia' }}</h2>
            <p class="text-caption text-white opacity-80 ma-0">Profissional em cortes masculinos</p>
          </div>
        </div>
        <v-spacer></v-spacer>
        <v-btn color="white" variant="flat" @click="scrollToAgendamento" class="font-weight-bold">
          Agendar Agora
        </v-btn>
      </v-container>
    </v-app-bar>

    <v-main>
      <!-- SEÇÃO HERO -->
      <section class="hero-section">
        <v-container>
          <v-row align="center" class="min-height-section">
            <v-col cols="12" md="6">
              <div class="hero-content">
                <h1 class="hero-title">
                  O melhor corte para 
                  <span class="text-primary font-weight-black">seu estilo</span>
                </h1>
                <p class="hero-subtitle">
                  Experimente o atendimento profissional que você merece. 
                  Cortes modernos, barba bem feita e ambiente acolhedor.
                </p>
                <div class="hero-actions">
                  <v-btn size="x-large" color="primary" @click="scrollToAgendamento" class="mr-4 font-weight-bold">
                    <v-icon start>mdi-calendar-plus</v-icon>
                    Agendar Horário
                  </v-btn>
                  <v-btn size="x-large" variant="outlined" @click="scrollToServicos">
                    Ver Serviços
                  </v-btn>
                </div>
                <div class="hero-stats mt-8">
                  <div class="d-flex flex-wrap gap-6">
                    <div class="stat-item">
                      <div class="stat-number">500+</div>
                      <div class="stat-label">Clientes Satisfeitos</div>
                    </div>
                    <div class="stat-item">
                      <div class="stat-number">5★</div>
                      <div class="stat-label">Avaliação</div>
                    </div>
                    <div class="stat-item">
                      <div class="stat-number">3+</div>
                      <div class="stat-label">Anos de Experiência</div>
                    </div>
                  </div>
                </div>
              </div>
            </v-col>
            <v-col cols="12" md="6">
              <div class="hero-image">
                <div class="image-placeholder">
                  <v-icon size="120" color="primary" class="mb-4">mdi-content-cut</v-icon>
                  <p class="text-h6">Imagem da Barbearia</p>
                </div>
              </div>
            </v-col>
          </v-row>
        </v-container>
      </section>

      <!-- SEÇÃO SERVIÇOS -->
      <section id="servicos" class="services-section">
        <v-container>
          <div class="text-center mb-12">
            <h2 class="section-title">Nossos Serviços</h2>
            <p class="section-subtitle">Oferecemos uma gama completa de serviços para o homem moderno</p>
          </div>
          
          <v-row>
            <v-col v-for="(servico, index) in servicosDisponiveis" :key="servico.id" cols="12" sm="6" md="4">
              <v-card class="service-card h-100" elevation="4" :class="{ 'featured': index === 1 }">
                <div class="service-icon">
                  <v-icon size="48" :color="index === 1 ? 'white' : 'primary'">
                    {{ getServicoIcon(servico.nome) }}
                  </v-icon>
                </div>
                <v-card-title class="service-title">{{ servico.nome }}</v-card-title>
                <v-card-text>
                  <p class="service-description">{{ getServicoDescricao(servico.nome) }}</p>
                  <div class="service-details">
                    <div class="service-duration">
                      <v-icon size="16" class="mr-1">mdi-clock-outline</v-icon>
                      {{ servico.duracaoMinutos || 30 }}min
                    </div>
                    <div class="service-price">
                      {{ formatCurrency(servico.preco) }}
                    </div>
                  </div>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>
        </v-container>
      </section>

      <!-- SEÇÃO AGENDAMENTO -->
      <section id="agendamento" class="booking-section">
        <v-container>
          <div class="text-center mb-12">
            <h2 class="section-title text-white">Agende seu Horário</h2>
            <p class="section-subtitle text-white opacity-90">
              Entre em contato conosco e garante já seu horário
            </p>
          </div>
          
          <v-row justify="center">
            <v-col cols="12" md="8" lg="6">
              <v-card class="booking-card pa-8" elevation="12">
                <div class="text-center mb-6">
                  <v-avatar size="60" color="primary" class="mb-4">
                    <v-icon size="30" color="white">mdi-whatsapp</v-icon>
                  </v-avatar>
                  <h3 class="text-h5 font-weight-bold mb-2">WhatsApp</h3>
                  <p class="text-body-2 text-medium-emphasis">
                    Converse diretamente conosco pelo WhatsApp para agendar seu horário
                  </p>
                </div>
                
                <v-btn 
                  color="success" 
                  size="x-large" 
                  block 
                  @click="abrirWhatsApp"
                  class="mb-4 font-weight-bold"
                >
                  <v-icon start>mdi-whatsapp</v-icon>
                  Agendar pelo WhatsApp
                </v-btn>
                
                <v-divider class="my-6"></v-divider>
                
                <div class="contact-info">
                  <h4 class="text-h6 mb-4">Outras formas de contato:</h4>
                  
                  <div class="contact-item">
                    <v-icon color="primary" class="mr-3">mdi-phone</v-icon>
                    <div>
                      <div class="font-weight-medium">Telefone</div>
                      <div class="text-body-2">(77) 9999-9999</div>
                    </div>
                  </div>
                  
                  <div class="contact-item">
                    <v-icon color="primary" class="mr-3">mdi-instagram</v-icon>
                    <div>
                      <div class="font-weight-medium">Instagram</div>
                      <div class="text-body-2">@barbeariaexemplo</div>
                    </div>
                  </div>
                  
                  <div class="contact-item">
                    <v-icon color="primary" class="mr-3">mdi-map-marker</v-icon>
                    <div>
                      <div class="font-weight-medium">Endereço</div>
                      <div class="text-body-2">Rua Principal, 123 - Centro</div>
                    </div>
                  </div>
                </div>
              </v-card>
            </v-col>
          </v-row>
        </v-container>
      </section>

      <!-- SEÇÃO HORÁRIOS -->
      <section class="hours-section">
        <v-container>
          <div class="text-center mb-12">
            <h2 class="section-title">Horário de Funcionamento</h2>
            <p class="section-subtitle">Confira nossos horários de atendimento</p>
          </div>
          
          <v-row justify="center">
            <v-col cols="12" md="8">
              <v-card class="hours-card pa-6" elevation="4">
                <v-row>
                  <v-col v-for="(horario, dia) in horariosFormatados" :key="dia" cols="12" sm="6" md="4">
                    <div class="hour-item">
                      <div class="day-name">{{ getNomeDia(dia) }}</div>
                      <div class="day-hours" :class="{ 'closed': !horario }">
                        {{ horario || 'Fechado' }}
                      </div>
                    </div>
                  </v-col>
                </v-row>
              </v-card>
            </v-col>
          </v-row>
        </v-container>
      </section>

      <!-- FOOTER -->
      <footer class="footer-section">
        <v-container>
          <div class="text-center">
            <div class="footer-logo mb-4">
              <v-avatar size="60" color="primary">
                <v-icon size="30" color="white">mdi-content-cut</v-icon>
              </v-avatar>
              <h3 class="text-h5 mt-2">{{ barbeariaInfo?.nome || 'Barbearia' }}</h3>
            </div>
            
            <div class="footer-social mb-4">
              <v-btn icon variant="text" color="white" class="mx-2">
                <v-icon>mdi-whatsapp</v-icon>
              </v-btn>
              <v-btn icon variant="text" color="white" class="mx-2">
                <v-icon>mdi-instagram</v-icon>
              </v-btn>
              <v-btn icon variant="text" color="white" class="mx-2">
                <v-icon>mdi-facebook</v-icon>
              </v-btn>
            </div>
            
            <p class="text-body-2 opacity-80">
              © 2025 {{ barbeariaInfo?.nome || 'Barbearia' }}. Todos os direitos reservados.
            </p>
            
            <p class="text-caption opacity-60 mt-2">
              Powered by BarberApp
            </p>
          </div>
        </v-container>
      </footer>
    </v-main>

    <!-- CHAT FLUTUANTE -->
    <TypebotChat :typebot-id="typebotId" :prefilled-variables="{ barbeariaId: barbeariaId }" :show-floating-button="true" :theme="chatTheme" button-text="💬 Ajuda" />
  </v-app>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '@/firebase'
import TypebotChat from '@/components/TypebotChat.vue'

// Props da rota
const route = useRoute()
const barbeariaId = route.params.barbeariaId

// Estado
const loading = ref(true)
const barbeariaInfo = ref(null)
const servicosDisponiveis = ref([])
const horariosConfig = ref({})

// Configuração do chat
const typebotId = 'my-typebot-lk5rehg' // ID Fixo para todas as barbearias
const chatTheme = { 
  button: { backgroundColor: '#25D366' }, 
  chatWindow: { backgroundColor: '#FFFFFF' }
}

// Computeds
const horariosFormatados = computed(() => {
  const diasSemana = ['0', '1', '2', '3', '4', '5', '6'] // Domingo a Sábado
  const result = {}
  
  diasSemana.forEach(dia => {
    const config = horariosConfig.value[dia]
    if (!config || !config.InicioManha) {
      result[dia] = null
    } else {
      let horario = `${config.InicioManha} - ${config.FimManha || config.FimTarde}`
      if (config.InicioTarde && config.FimTarde) {
        horario = `${config.InicioManha}-${config.FimManha} | ${config.InicioTarde}-${config.FimTarde}`
      }
      result[dia] = horario
    }
  })
  
  return result
})

// Métodos
const fetchBarbeariaData = async () => {
  if (!barbeariaId) return
  
  loading.value = true
  try {
    // Buscar informações da barbearia
    const barbeariaDoc = await getDoc(doc(db, 'barbearias', barbeariaId))
    if (barbeariaDoc.exists()) {
      barbeariaInfo.value = { id: barbeariaId, ...barbeariaDoc.data() }
    }
    
    // Buscar serviços
    const servicosQuery = query(collection(db, `barbearias/${barbeariaId}/servicos`), where('ativo', '==', true))
    const servicosSnapshot = await getDocs(servicosQuery)
    servicosDisponiveis.value = servicosSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    
    // Buscar horários
    for (let dia = 0; dia <= 6; dia++) {
      const horarioDoc = await getDoc(doc(db, `barbearias/${barbeariaId}/horarios`, String(dia)))
      if (horarioDoc.exists()) {
        horariosConfig.value[dia] = horarioDoc.data()
      }
    }
    
  } catch (error) {
    console.error('Erro ao carregar dados da barbearia:', error)
  } finally {
    loading.value = false
  }
}

const formatCurrency = (valor) => {
  return (valor || 0).toLocaleString('pt-BR', { 
    style: 'currency', 
    currency: 'BRL' 
  })
}

const getNomeDia = (dia) => {
  const nomes = {
    '0': 'Domingo',
    '1': 'Segunda',
    '2': 'Terça', 
    '3': 'Quarta',
    '4': 'Quinta',
    '5': 'Sexta',
    '6': 'Sábado'
  }
  return nomes[dia] || ''
}

const getServicoIcon = (nomeServico) => {
  if (nomeServico.toLowerCase().includes('barba')) return 'mdi-mustache'
  if (nomeServico.toLowerCase().includes('corte')) return 'mdi-content-cut'
  return 'mdi-scissors-cutting'
}

const getServicoDescricao = (nomeServico) => {
  const descricoes = {
    'Corte Simples': 'Corte clássico e bem executado para o dia a dia',
    'Corte + Barba': 'Combo completo: corte moderno + barba bem feita',
    'Apenas Barba': 'Aparar e modelar a barba com precisão'
  }
  return descricoes[nomeServico] || 'Serviço profissional de qualidade'
}

const scrollToServicos = () => {
  document.getElementById('servicos').scrollIntoView({ behavior: 'smooth' })
}

const scrollToAgendamento = () => {
  document.getElementById('agendamento').scrollIntoView({ behavior: 'smooth' })
}

const abrirWhatsApp = () => {
  const numeroWhatsApp = '5577999999999' // Número da barbearia
  const mensagem = `Olá! Gostaria de agendar um horário na ${barbeariaInfo.value?.nome || 'barbearia'}.`
  const url = `https://wa.me/${numeroWhatsApp}?text=${encodeURIComponent(mensagem)}`
  window.open(url, '_blank')
}

// Lifecycle
onMounted(() => {
  fetchBarbeariaData()
})
</script>

<style scoped>
/* SEÇÕES GERAIS */
.min-height-section {
  min-height: calc(100vh - 80px);
}

.hero-section {
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  padding: 80px 0;
}

.services-section {
  padding: 80px 0;
  background: white;
}

.booking-section {
  padding: 80px 0;
  background: linear-gradient(135deg, #1976d2 0%, #1565c0 100%);
}

.hours-section {
  padding: 80px 0;
  background: #f8f9fa;
}

.footer-section {
  padding: 60px 0 40px;
  background: #2c3e50;
  color: white;
}

/* HERO */
.hero-title {
  font-size: 3.5rem;
  font-weight: 700;
  line-height: 1.1;
  margin-bottom: 24px;
}

.hero-subtitle {
  font-size: 1.25rem;
  line-height: 1.6;
  margin-bottom: 32px;
  color: rgba(0,0,0,0.7);
}

.hero-actions {
  margin-bottom: 48px;
}

.hero-stats {
  display: flex;
  gap: 48px;
  flex-wrap: wrap;
}

.stat-item {
  text-align: center;
}

.stat-number {
  font-size: 2.5rem;
  font-weight: 700;
  color: #1976d2;
  line-height: 1;
}

.stat-label {
  font-size: 0.875rem;
  color: rgba(0,0,0,0.6);
  margin-top: 4px;
}

.hero-image {
  height: 400px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.image-placeholder {
  width: 100%;
  height: 100%;
  background: rgba(25, 118, 210, 0.1);
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border: 2px dashed #1976d2;
}

/* SEÇÕES */
.section-title {
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 16px;
}

.section-subtitle {
  font-size: 1.125rem;
  color: rgba(0,0,0,0.6);
}

/* SERVIÇOS */
.service-card {
  padding: 32px 24px;
  text-align: center;
  border-radius: 16px;
  transition: all 0.3s ease;
  position: relative;
  overflow: visible;
}

.service-card.featured {
  background: linear-gradient(135deg, #1976d2, #1565c0);
  color: white;
  transform: scale(1.05);
  z-index: 2;
}

.service-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 16px 32px rgba(0,0,0,0.15);
}

.service-card.featured:hover {
  transform: scale(1.05) translateY(-8px);
}

.service-icon {
  margin-bottom: 24px;
}

.service-title {
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 16px;
}

.service-description {
  margin-bottom: 24px;
  line-height: 1.6;
}

.service-details {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 1px solid rgba(0,0,0,0.12);
  padding-top: 16px;
}

.service-card.featured .service-details {
  border-top-color: rgba(255,255,255,0.3);
}

.service-duration {
  display: flex;
  align-items: center;
  color: rgba(0,0,0,0.6);
}

.service-card.featured .service-duration {
  color: rgba(255,255,255,0.8);
}

.service-price {
  font-size: 1.25rem;
  font-weight: 700;
  color: #1976d2;
}

.service-card.featured .service-price {
  color: white;
}

/* AGENDAMENTO */
.booking-card {
  border-radius: 24px;
}

.contact-info {
  text-align: left;
}

.contact-item {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
  padding: 12px 0;
}

/* HORÁRIOS */
.hours-card {
  border-radius: 16px;
}

.hour-item {
  text-align: center;
  padding: 16px;
}

.day-name {
  font-weight: 600;
  font-size: 1rem;
  margin-bottom: 8px;
  color: #1976d2;
}

.day-hours {
  font-size: 0.875rem;
  color: rgba(0,0,0,0.8);
}

.day-hours.closed {
  color: rgba(0,0,0,0.4);
  font-style: italic;
}

/* RESPONSIVIDADE */
@media (max-width: 960px) {
  .hero-title {
    font-size: 2.5rem;
  }
  
  .hero-stats {
    justify-content: center;
    gap: 32px;
  }
  
  .service-card.featured {
    transform: none;
  }
  
  .service-card.featured:hover {
    transform: translateY(-8px);
  }
}

@media (max-width: 600px) {
  .hero-section {
    padding: 40px 0;
  }
  
  .services-section,
  .booking-section,
  .hours-section {
    padding: 60px 0;
  }
  
  .hero-title {
    font-size: 2rem;
  }
  
  .section-title {
    font-size: 2rem;
  }
  
  .hero-actions {
    flex-direction: column;
    gap: 16px;
  }
  
  .hero-actions .v-btn {
    margin: 0 !important;
  }
}

/* ANIMAÇÕES */
.service-card {
  animation: fadeInUp 0.6s ease-out forwards;
}

.service-card:nth-child(1) { animation-delay: 0.1s; }
.service-card:nth-child(2) { animation-delay: 0.2s; }
.service-card:nth-child(3) { animation-delay: 0.3s; }

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* SCROLL SUAVE */
html {
  scroll-behavior: smooth;
}

/* TEMA ESCURO */
.v-theme--dark .hero-section {
  background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
}

.v-theme--dark .services-section {
  background: #121212;
}

.v-theme--dark .hours-section {
  background: #1a1a1a;
}

.v-theme--dark .hero-subtitle {
  color: rgba(255,255,255,0.7);
}

.v-theme--dark .section-subtitle {
  color: rgba(255,255,255,0.6);
}

.v-theme--dark .image-placeholder {
  background: rgba(25, 118, 210, 0.2);
  border-color: #1976d2;
}
</style>
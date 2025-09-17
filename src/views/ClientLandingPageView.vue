<template>
  <v-app>
    <v-app-bar color="primary" elevation="4" height="80">
      <v-container class="d-flex align-center">
        <div class="d-flex align-center">
          <v-avatar size="50" class="mr-4" color="white"><v-icon size="30" color="primary">mdi-content-cut</v-icon></v-avatar>
          <div>
            <h2 class="text-h5 font-weight-bold text-white">{{ barbeariaInfo?.nome || 'Barbearia' }}</h2>
          </div>
        </div>
        <v-spacer></v-spacer>
        <v-btn color="white" variant="flat" @click="scrollToAgendamento" class="font-weight-bold">Agendar Agora</v-btn>
      </v-container>
    </v-app-bar>

    <v-main>
      <section class="hero-section">
        <v-container><v-row align="center" class="min-height-section"><v-col cols="12" md="6"><div class="hero-content">
          <h1 class="hero-title">O melhor corte para <span class="text-primary font-weight-black">seu estilo</span></h1>
          <p class="hero-subtitle">Experimente o atendimento profissional que você merece.</p>
          <div class="hero-actions"><v-btn size="x-large" color="primary" @click="scrollToAgendamento" class="mr-4 font-weight-bold"><v-icon start>mdi-calendar-plus</v-icon>Agendar Horário</v-btn></div>
        </div></v-col><v-col cols="12" md="6"><div class="hero-image"><div class="image-placeholder"><v-icon size="120" color="primary" class="mb-4">mdi-content-cut</v-icon><p class="text-h6">Imagem da Barbearia</p></div></div></v-col></v-row></v-container>
      </section>

      <section id="servicos" class="services-section">
        <v-container>
          <div class="text-center mb-12"><h2 class="section-title">Nossos Serviços</h2></div>
          <v-row>
            <v-col v-for="(servico, index) in listaServicos" :key="servico.id" cols="12" sm="6" md="4">
              <v-card class="service-card h-100" elevation="4" :class="{ 'featured': index === 1 }">
                <div class="service-icon"><v-icon size="48" :color="index === 1 ? 'white' : 'primary'">{{ getServicoIcon(servico.nome) }}</v-icon></div>
                <v-card-title class="service-title">{{ servico.nome }}</v-card-title>
                <v-card-text>
                  <div class="service-details">
                    <div class="service-duration"><v-icon size="16" class="mr-1">mdi-clock-outline</v-icon>{{ servico.duracaoMinutos || 30 }}min</div>
                    <div class="service-price">{{ (servico.preco || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) }}</div>
                  </div>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>
        </v-container>
      </section>

      <section id="agendamento" class="booking-section">
        <v-container>
          <div class="text-center mb-12"><h2 class="section-title text-white">Agende seu Horário</h2></div>
          <v-row justify="center"><v-col cols="12" md="8" lg="6">
            <v-card class="booking-card pa-8" elevation="12">
              <div class="text-center mb-6">
                <v-avatar size="60" color="primary" class="mb-4"><v-icon size="30" color="white">mdi-whatsapp</v-icon></v-avatar>
                <h3 class="text-h5 font-weight-bold mb-2">Agendamento via Assistente Virtual</h3>
                <p class="text-body-2 text-medium-emphasis">Clique no botão de chat no canto da tela para iniciar.</p>
              </div>
            </v-card>
          </v-col></v-row>
        </v-container>
      </section>
      
      <footer class="footer-section">
        <v-container><div class="text-center">
          <p class="text-body-2 opacity-80">© 2025 {{ barbeariaInfo?.nome || 'Barbearia' }}. Todos os direitos reservados.</p>
        </div></v-container>
      </footer>
    </v-main>

    <TypebotChat :typebot-id="typebotId" :show-floating-button="true" />
  </v-app>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { db } from '@/firebase';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import TypebotChat from '@/components/TypebotChat.vue';

const loading = ref(true);
const barbeariaInfo = ref({ nome: 'Gestão Barbearia' }); // Nome padrão
const listaServicos = ref([]);
const typebotId = 'my-typebot-lk5rehg'; // ⚠️ SEU ID DO TYPEBOT AQUI

const fetchPageData = async () => {
  loading.value = true;
  try {
    const servicosQuery = query(collection(db, `Servicos`), where('ativo', '==', true));
    const servicosSnapshot = await getDocs(servicosQuery);
    listaServicos.value = servicosSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Erro ao carregar dados da landing page:', error);
  } finally {
    loading.value = false;
  }
};

const getServicoIcon = (nomeServico) => {
  if (nomeServico.toLowerCase().includes('barba')) return 'mdi-mustache';
  if (nomeServico.toLowerCase().includes('corte')) return 'mdi-content-cut';
  return 'mdi-scissors-cutting';
};

const scrollToAgendamento = () => { document.getElementById('agendamento').scrollIntoView({ behavior: 'smooth' }); };
const scrollToServicos = () => { document.getElementById('servicos').scrollIntoView({ behavior: 'smooth' }); };

onMounted(() => { fetchPageData(); });
</script>

<style scoped>
/* ESTILOS DA LANDING PAGE (ADAPTADOS DO CLAUDE) */
.min-height-section { min-height: calc(80vh - 80px); }
.hero-section { background: #f8f9fa; padding: 60px 0; }
.services-section { padding: 80px 0; background: white; }
.booking-section { padding: 80px 0; background: linear-gradient(135deg, #1976d2 0%, #1565c0 100%); }
.footer-section { padding: 40px 0; background: #2c3e50; color: white; }
.hero-title { font-size: 3.5rem; font-weight: 700; line-height: 1.1; margin-bottom: 24px; }
.hero-subtitle { font-size: 1.25rem; line-height: 1.6; margin-bottom: 32px; color: rgba(0,0,0,0.7); }
.hero-actions { margin-bottom: 48px; }
.hero-image { height: 400px; display: flex; align-items: center; justify-content: center; }
.image-placeholder { width: 100%; height: 100%; background: rgba(25, 118, 210, 0.1); border-radius: 16px; display: flex; flex-direction: column; align-items: center; justify-content: center; border: 2px dashed #1976d2; }
.section-title { font-size: 2.5rem; font-weight: 700; margin-bottom: 16px; }
.section-subtitle { font-size: 1.125rem; color: rgba(0,0,0,0.6); }
.service-card { padding: 32px 24px; text-align: center; border-radius: 16px; transition: all 0.3s ease; }
.service-card.featured { background: linear-gradient(135deg, #1976d2, #1565c0); color: white; transform: scale(1.05); z-index: 2; }
.service-card:hover { transform: translateY(-8px); box-shadow: 0 16px 32px rgba(0,0,0,0.15); }
.service-icon { margin-bottom: 24px; }
.service-title { font-size: 1.5rem; font-weight: 600; margin-bottom: 16px; }
.service-details { display: flex; justify-content: space-between; align-items: center; border-top: 1px solid rgba(0,0,0,0.12); padding-top: 16px; }
.service-card.featured .service-details { border-top-color: rgba(255,255,255,0.3); }
.service-duration { display: flex; align-items: center; color: rgba(0,0,0,0.6); }
.service-card.featured .service-duration { color: rgba(255,255,255,0.8); }
.service-price { font-size: 1.25rem; font-weight: 700; color: #1976d2; }
.service-card.featured .service-price { color: white; }
.booking-card { border-radius: 24px; }
html { scroll-behavior: smooth; }
</style>
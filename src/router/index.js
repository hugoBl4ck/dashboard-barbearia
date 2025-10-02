import { createRouter, createWebHistory } from 'vue-router'
import { watch } from 'vue'
import { user, loading, barbeariaInfo } from '@/composables/useAuth'

import HomeView from '../views/HomeView.vue'
import LoginView from '../views/LoginView.vue'
import ClientesView from '../views/ClientesView.vue'
import AnalyticsView from '../views/AnalyticsView.vue'
import ChatView from '../views/ChatView.vue'
import BillingView from '../views/BillingView.vue';
import ServicosView from '../views/ServicosView.vue';
import RelatoriosView from '../views/RelatoriosView.vue';
import AgendamentosView from '../views/AgendamentosView.vue';
import PerfilView from '../views/PerfilView.vue';
import ConfiguracoesView from '../views/ConfiguracoesView.vue';
import { guestGuard } from './authGuard.js'

/**
 * Retorna uma Promise que resolve quando o estado inicial de autenticação do useAuth foi carregado.
 * Isso previne condições de corrida onde o guarda de rota executa antes dos dados do usuário estarem prontos.
 */
const awaitAuthLoaded = () => {
  if (!loading.value) {
    return Promise.resolve();
  }
  return new Promise(resolve => {
    const unwatch = watch(loading, (newLoading) => {
      if (!newLoading) {
        unwatch();
        resolve();
      }
    });
  });
};

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'Login',
      component: LoginView,
      beforeEnter: guestGuard
    },
    {
      path: '/',
      name: 'home',
      component: HomeView,
      meta: { requiresAuth: true }
    },
    {
      path: '/dashboard',
      redirect: '/'
    },
    {
      path: '/clientes',
      name: 'clientes',
      component: ClientesView,
      meta: { requiresAuth: true }
    },
    {
      path: '/servicos',
      name: 'servicos',
      component: ServicosView,
      meta: { requiresAuth: true }
    },
    {
      path: '/relatorios',
      name: 'relatorios',
      component: RelatoriosView,
      meta: { requiresAuth: true }
    },
    {
      path: '/agendamentos',
      name: 'agendamentos',
      component: AgendamentosView,
      meta: { requiresAuth: true }
    },
    {
      path: '/perfil',
      name: 'perfil',
      component: PerfilView,
      meta: { requiresAuth: true }
    },
    {
      path: '/configuracoes',
      name: 'configuracoes',
      component: ConfiguracoesView,
      meta: { requiresAuth: true }
    },
    {
      path: '/analytics',
      name: 'analytics',
      component: AnalyticsView,
      meta: { requiresAuth: true }
    },
    {
      path: '/chat',
      name: 'chat',
      component: ChatView,
      meta: { requiresAuth: true }
    },
    {
      path: '/b/:slug',
      name: 'PublicBarbershopPage',
      component: () => import('../views/ClientLandingPageView.vue')
    },
    {
      path: '/horarios',
      name: 'horarios',
      component: () => import('../views/HorariosView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/billing',
      name: 'billing',
      component: BillingView,
      meta: { requiresAuth: true }
    }
  ]
})

router.beforeEach(async (to, from, next) => {
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth);

  // Espera o onAuthStateChanged e o carregamento dos dados da barbearia terminarem.
  await awaitAuthLoaded();

  const isAuthenticated = !!user.value;

  if (requiresAuth && !isAuthenticated) {
    // Se a rota é protegida e não há usuário, vai para o login
    return next('/login');
  }
  
  if (requiresAuth && isAuthenticated) {
    // Se a rota é protegida e o usuário está logado, verificamos a assinatura.
    // Usamos o 'barbeariaInfo' que já foi carregado pelo useAuth.
    const info = barbeariaInfo.value;

    if (info && info.trialFim) {
      const isTrialExpired = info.trialFim.toDate() < new Date();
      const isActive = info.statusAssinatura === 'active';

      if (!isActive && isTrialExpired && to.name !== 'billing') {
        console.log('ASSINATURA EXPIRADA! Redirecionando para /billing...');
        // alert("Seu período de teste expirou! Por favor, escolha um plano.");
        return next('/billing');
      }
    } else if (!info) {
      console.error('CRITICAL: Usuário autenticado mas sem dados de barbearia no router guard.');
      // Opcional: redirecionar para uma página de erro ou login
    }
    
    // Se a assinatura está ativa, o trial não expirou, ou está indo para a pág. de billing, permite o acesso.
    return next();

  } else {
    // Se a rota não é protegida, permite o acesso.
    return next();
  }
});

export default router
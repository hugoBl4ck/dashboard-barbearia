import { createRouter, createWebHistory } from 'vue-router'
import { getAuth } from "firebase/auth";
import { getDoc, doc } from 'firebase/firestore';
import { db } from '@/firebase';

import HomeView from '../views/HomeView.vue'
import LoginView from '../views/LoginView.vue'
import ClientesView from '../views/ClientesView.vue'
import AnalyticsView from '../views/AnalyticsView.vue'
import ChatView from '../views/ChatView.vue'
import BillingView from '../views/BillingView.vue';
import { guestGuard } from './authGuard.js'

const getCurrentUser = () => {
  return new Promise((resolve, reject) => {
    const removeListener = getAuth().onAuthStateChanged(
      user => {
        removeListener();
        resolve(user);
      },
      reject
    );
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
      path: '/cliente/:barbeariaId',
      name: 'ClientLandingPage',
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
  const user = await getCurrentUser();

  if (requiresAuth && !user) {
    // Se a rota é protegida e não há usuário, vai para o login
    next('/login');
  } else if (requiresAuth && user) {
    // Se a rota é protegida E há um usuário, verificamos a assinatura
    const userDoc = await getDoc(doc(db, 'usuarios', user.uid));
    if (userDoc.exists()) {
      const barbeariaDoc = await getDoc(doc(db, 'barbearias', userDoc.data().barbeariaId));
      const barbeariaData = barbeariaDoc.data();
      
      const isTrialExpired = barbeariaData.trialFim.toDate() < new Date();
      const isActive = barbeariaData.statusAssinatura === 'active';

      if (!isActive && isTrialExpired && to.name !== 'billing') {
        // Se não for assinante, o trial expirou, E não está indo para a pág. de billing...
        alert("Seu período de teste expirou! Por favor, escolha um plano.");
        next('/billing'); // ...força o redirecionamento para a página de cobrança.
      } else {
        // Se for assinante ou o trial ainda estiver ativo, permite o acesso.
        next();
      }
    } else {
       next('/login'); // Usuário do Auth existe, mas não no nosso DB? Vai para o login.
    }
  } else {
    // Se a rota não é protegida, permite o acesso.
    next();
  }
});

export default router

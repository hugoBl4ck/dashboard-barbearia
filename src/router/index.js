import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import ClientesView from '../views/ClientesView.vue'
import AnalyticsView from '../views/AnalyticsView.vue'
import ChatView from '../views/ChatView.vue'
import ClientLandingPageView from '../views/ClientLandingPageView.vue'
import ClientLandingPageView2 from '../views/ClientLandingPageView2.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView
    },
    {
      path: '/clientes',
      name: 'clientes',
      component: ClientesView
    },
    {
      path: '/analytics',
      name: 'analytics',
      component: AnalyticsView
    },
    {
      path: '/chat',
      name: 'chat',
      component: ChatView
    },
    {
      path: '/agendar',
      name: 'agendar',
      component: ClientLandingPageView
    },
    {
      path: '/agendar2',
      name: 'agendar2',
      component: ClientLandingPageView2
    }
  ]
})

export default router
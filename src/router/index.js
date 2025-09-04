import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import ClientesView from '../views/ClientesView.vue'
import AnalyticsView from '../views/AnalyticsView.vue'
import ChatView from '../views/ChatView.vue'

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
    }
  ]
})

export default router
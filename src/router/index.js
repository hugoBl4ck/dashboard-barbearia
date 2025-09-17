import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import LoginView from '../views/LoginView.vue'
import ClientesView from '../views/ClientesView.vue'
import AnalyticsView from '../views/AnalyticsView.vue'
import ChatView from '../views/ChatView.vue'
import { authGuard, guestGuard } from './authGuard.js'

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
      beforeEnter: authGuard
    },
    {
      path: '/dashboard',
      redirect: '/'
    },
    {
      path: '/clientes',
      name: 'clientes',
      component: ClientesView,
      beforeEnter: authGuard
    },
    {
      path: '/analytics',
      name: 'analytics',
      component: AnalyticsView,
      beforeEnter: authGuard
    },
    {
      path: '/chat',
      name: 'chat',
      component: ChatView,
      beforeEnter: authGuard
    }
  ]
})

export default router
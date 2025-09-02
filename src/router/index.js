// ARQUIVO: src/router/index.js
import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import AnalyticsView from '../views/AnalyticsView.vue' // Importa a nova view

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView
    },
    {
      path: '/analytics', // Rota para a página de análises
      name: 'analytics',
      component: () => import('../views/AnalyticsView.vue')
    },
    {
      path: '/clientes', // <-- ADICIONA A NOVA ROTA
      name: 'clientes',
      component: ClientesView
    }
      ]
})
export default router
// main.js
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import vuetify from './plugins/vuetify'

// Importar fonte Poppins (opcional - também pode ser via CDN no index.html)
import '@fontsource/poppins/300.css'
import '@fontsource/poppins/400.css'
import '@fontsource/poppins/500.css'
import '@fontsource/poppins/600.css'
import '@fontsource/poppins/700.css'

// CSS global adicional se necessário
import './assets/global.css' // Opcional - para estilos adicionais

const app = createApp(App)

// Configurar plugins
app.use(router)
app.use(vuetify)

// Tratamento de erros globais
app.config.errorHandler = (err, vm, info) => {
  console.error('Erro global da aplicação:', err, info)
  
  // Aqui você pode enviar erros para um serviço como Sentry
  // Sentry.captureException(err)
}

// Tratamento de avisos em desenvolvimento
if (import.meta.env.DEV) {
  app.config.warnHandler = (msg, vm, trace) => {
    console.warn('Aviso Vue:', msg, trace)
  }
}

// Configurações globais
app.config.globalProperties.$appName = 'BarberApp'
app.config.globalProperties.$version = '2.0.0'

// Montar aplicação
app.mount('#app')

// Log de inicialização em desenvolvimento
if (import.meta.env.DEV) {
  console.log('🚀 BarberApp iniciado com sucesso!')
  console.log('📦 Versão:', app.config.globalProperties.$version)
  console.log('🛣️  Rota inicial:', router.currentRoute.value.path)
}
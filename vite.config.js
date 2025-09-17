// ARQUIVO: vite.config.js

import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  // ADICIONE ESTA SEÇÃO DE OTIMIZAÇÃO
  optimizeDeps: {
    include: [
      'firebase/app',
      'firebase/firestore'
    ],
    exclude: ['firebase'] // Exclui o pacote principal da otimização para forçar o uso dos submódulos
  }
})



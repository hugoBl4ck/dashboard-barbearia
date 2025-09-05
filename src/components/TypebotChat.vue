<!-- src/components/TypebotChat.vue -->
<template>
  <div class="typebot-wrapper">
    <!-- Container para chat embeddado -->
    <div 
      v-if="!showFloatingButton" 
      ref="typebotContainer" 
      class="typebot-container"
    ></div>
    
    <!-- Botão flutuante -->
    <button 
      v-if="showFloatingButton && !isTypebotOpen"
      @click="handleButtonClick"
      class="typebot-floating-button"
      :class="{ 'animate-pulse': shouldPulse }"
    >
      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
        <path d="M20 2H4C2.9 2 2 2.9 2 4V22L6 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2ZM20 16H5.17L4 17.17V4H20V16Z"/>
        <circle cx="7" cy="10" r="1"/>
        <circle cx="12" cy="10" r="1"/>
        <circle cx="17" cy="10" r="1"/>
      </svg>
      <span class="button-text">{{ buttonText }}</span>
    </button>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue'

const props = defineProps({
  typebotId: {
    type: String,
    required: true
  },
  showFloatingButton: {
    type: Boolean,
    default: false
  },
  autoOpen: {
    type: Boolean,
    default: true
  },
  buttonText: {
    type: String,
    default: 'Chat'
  },
  theme: {
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits(['onOpen', 'onClose'])

const typebotContainer = ref(null)
const shouldPulse = ref(false)
const isTypebotOpen = ref(false)
const scriptLoaded = ref(false)
let typebot = null

// Função para carregar script do Typebot
const loadTypebotScript = () => {
  return new Promise((resolve, reject) => {
    // Se já carregou, resolve imediatamente
    if (scriptLoaded.value && window.Typebot) {
      console.log('✅ Typebot script já carregado')
      resolve(window.Typebot)
      return
    }

    // Verificar se já existe um script carregando
    const existingScript = document.querySelector('script[src*="typebot.io"]')
    if (existingScript) {
      console.log('⏳ Script já está sendo carregado...')
      existingScript.onload = () => {
        scriptLoaded.value = true
        resolve(window.Typebot)
      }
      existingScript.onerror = reject
      return
    }

    console.log('🔄 Carregando script do Typebot...')
    const script = document.createElement('script')
    
    // Usar versão específica e estável
    script.src = 'https://cdn.jsdelivr.net/npm/@typebot.io/js@0.8.20/dist/web.js'
    script.type = 'text/javascript'
    script.async = true
    script.defer = true
    
    script.onload = () => {
      console.log('✅ Script carregado com sucesso')
      scriptLoaded.value = true
      
      // Aguardar um momento para o objeto ficar disponível
      setTimeout(() => {
        if (window.Typebot) {
          console.log('✅ Typebot disponível:', typeof window.Typebot)
          resolve(window.Typebot)
        } else {
          console.error('❌ Typebot não disponível no window')
          reject(new Error('Typebot não disponível'))
        }
      }, 500)
    }
    
    script.onerror = (error) => {
      console.error('❌ Erro ao carregar script:', error)
      reject(error)
    }
    
    document.head.appendChild(script)
  })
}

// Função para inicializar o Typebot
const initTypebot = async () => {
  try {
    console.log('🚀 Iniciando Typebot com ID:', props.typebotId)
    
    const Typebot = await loadTypebotScript()
    await nextTick()

    const config = {
      typebot: props.typebotId,
      theme: props.theme
    }

    console.log('⚙️ Configuração:', config)

    if (props.showFloatingButton) {
      console.log('🎈 Modo bubble')
      typebot = Typebot.initBubble(config)
    } else if (typebotContainer.value) {
      console.log('📦 Modo standard')
      typebot = Typebot.initStandard({
        ...config,
        container: typebotContainer.value
      })
    }

    console.log('✅ Typebot inicializado:', typebot)

    // Auto-open para modo embeddado
    if (props.autoOpen && !props.showFloatingButton) {
      setTimeout(() => {
        openTypebot()
      }, 1000)
    }

    // Animar botão depois de um tempo
    if (props.showFloatingButton) {
      setTimeout(() => {
        shouldPulse.value = true
        setTimeout(() => {
          shouldPulse.value = false
        }, 3000)
      }, 4000)
    }

  } catch (error) {
    console.error('❌ Erro na inicialização:', error)
  }
}

// Função para abrir o chat
const openTypebot = () => {
  try {
    if (typebot && typeof typebot.open === 'function') {
      console.log('🎯 Abrindo Typebot')
      typebot.open()
      isTypebotOpen.value = true
      emit('onOpen')
    } else {
      console.log('⚠️ Typebot não pronto, tentando inicializar...')
      initTypebot().then(() => {
        if (typebot && typeof typebot.open === 'function') {
          typebot.open()
          isTypebotOpen.value = true
          emit('onOpen')
        }
      })
    }
  } catch (error) {
    console.error('❌ Erro ao abrir Typebot:', error)
  }
}

// Função para fechar o chat
const closeTypebot = () => {
  try {
    if (typebot && typeof typebot.close === 'function') {
      console.log('🔒 Fechando Typebot')
      typebot.close()
      isTypebotOpen.value = false
      emit('onClose')
    }
  } catch (error) {
    console.error('❌ Erro ao fechar Typebot:', error)
  }
}

// Handler do botão
const handleButtonClick = () => {
  console.log('👆 Botão clicado')
  openTypebot()
}

// Lifecycle hooks
onMounted(async () => {
  console.log('🎬 TypebotChat montado')
  await nextTick()
  
  // Aguardar um pouco antes de inicializar
  setTimeout(() => {
    initTypebot()
  }, 100)
})

onUnmounted(() => {
  console.log('🔚 TypebotChat desmontado')
  if (typebot && typeof typebot.destroy === 'function') {
    try {
      typebot.destroy()
    } catch (error) {
      console.error('Erro ao destruir Typebot:', error)
    }
  }
})

// Expor funções
defineExpose({
  openTypebot,
  closeTypebot
})
</script>

<style scoped>
.typebot-wrapper {
  width: 100%;
  height: 100%;
}

.typebot-container {
  width: 100%;
  height: 100%;
  min-height: 400px;
  border-radius: 8px;
  background-color: #f9f9f9;
  border: 1px solid #e0e0e0;
}

.typebot-floating-button {
  position: fixed;
  bottom: 24px;
  right: 24px;
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: linear-gradient(135deg, #1976d2 0%, #1565c0 100%);
  border: none;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  font-size: 11px;
  font-weight: 600;
  box-shadow: 0 4px 16px rgba(25, 118, 210, 0.3);
  transition: all 0.3s ease;
  z-index: 1000;
  user-select: none;
}

.typebot-floating-button:hover {
  transform: scale(1.05);
  box-shadow: 0 6px 20px rgba(25, 118, 210, 0.4);
}

.typebot-floating-button:active {
  transform: scale(0.95);
}

.typebot-floating-button.animate-pulse {
  animation: pulse 2s infinite;
}

.button-text {
  margin-top: 4px;
  font-size: 10px;
  opacity: 0.9;
  text-align: center;
}

@keyframes pulse {
  0%, 100% {
    box-shadow: 0 4px 16px rgba(25, 118, 210, 0.3);
  }
  50% {
    box-shadow: 0 4px 16px rgba(25, 118, 210, 0.6), 0 0 0 8px rgba(25, 118, 210, 0.2);
  }
}

/* Responsivo */
@media (max-width: 768px) {
  .typebot-floating-button {
    bottom: 20px;
    right: 20px;
    width: 56px;
    height: 56px;
  }
  
  .button-text {
    font-size: 9px;
  }
}
</style>
<!-- src/components/TypebotChat.vue -->
<template>
  <div class="typebot-chat-wrapper">
    <!-- Container para o typebot embeddado -->
    <div ref="typebotContainer" class="typebot-container" v-if="!showFloatingButton"></div>
    
    <!-- Botão flutuante -->
    <button 
      v-if="showFloatingButton"
      @click="openTypebot"
      class="typebot-floating-button"
      :class="{ 'pulse': shouldPulse }"
    >
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M20 2H4C2.9 2 2 2.9 2 4V22L6 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2ZM20 16H5.17L4 17.17V4H20V16Z" fill="currentColor"/>
        <circle cx="7" cy="10" r="1" fill="currentColor"/>
        <circle cx="12" cy="10" r="1" fill="currentColor"/>
        <circle cx="17" cy="10" r="1" fill="currentColor"/>
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
  theme: {
    type: Object,
    default: () => ({
      button: { backgroundColor: '#1976d2' },
      chatWindow: { backgroundColor: '#ffffff' }
    })
  },
  buttonText: {
    type: String,
    default: 'Chat'
  }
})

const emit = defineEmits(['onOpen', 'onClose'])

const typebotContainer = ref(null)
const shouldPulse = ref(false)
let typebot = null
let isInitialized = ref(false)

const loadTypebotScript = () => {
  return new Promise((resolve, reject) => {
    // Verificar se já está carregado
    if (window.Typebot) {
      console.log('Typebot já carregado')
      resolve(window.Typebot)
      return
    }

    console.log('Carregando script do Typebot...')
    const script = document.createElement('script')
    script.src = 'https://cdn.jsdelivr.net/npm/@typebot.io/js@0.8/dist/web.js'
    script.async = true
    
    script.onload = () => {
      console.log('Script do Typebot carregado com sucesso')
      // Aguardar um pouco para garantir que está disponível
      setTimeout(() => {
        if (window.Typebot) {
          resolve(window.Typebot)
        } else {
          reject(new Error('Typebot não disponível após carregamento'))
        }
      }, 100)
    }
    
    script.onerror = (error) => {
      console.error('Erro ao carregar script do Typebot:', error)
      reject(error)
    }
    
    document.head.appendChild(script)
  })
}

const initTypebot = async () => {
  if (isInitialized.value) {
    console.log('Typebot já inicializado')
    return
  }

  try {
    console.log('Inicializando Typebot com ID:', props.typebotId)
    const Typebot = await loadTypebotScript()
    
    await nextTick() // Aguardar DOM estar pronto
    
    const config = {
      typebot: props.typebotId,
      theme: props.theme,
      onOpen: () => {
        console.log('Chat aberto')
        emit('onOpen')
      },
      onClose: () => {
        console.log('Chat fechado') 
        emit('onClose')
      }
    }

    console.log('Configuração do Typebot:', config)

    if (props.showFloatingButton) {
      console.log('Inicializando modo bubble')
      typebot = Typebot.initBubble(config)
    } else if (typebotContainer.value) {
      console.log('Inicializando modo standard no container')
      typebot = Typebot.initStandard({
        ...config,
        container: typebotContainer.value
      })
    } else {
      console.error('Container não encontrado para modo standard')
      return
    }

    isInitialized.value = true
    console.log('Typebot inicializado com sucesso')

    // Auto-open se configurado
    if (props.autoOpen && !props.showFloatingButton) {
      setTimeout(() => openTypebot(), 1000)
    }

    // Pulsar botão após um tempo
    if (props.showFloatingButton) {
      setTimeout(() => {
        shouldPulse.value = true
        setTimeout(() => {
          shouldPulse.value = false
        }, 3000)
      }, 5000)
    }

  } catch (error) {
    console.error('Erro ao inicializar Typebot:', error)
    
    // Fallback: tentar novamente após 2 segundos
    setTimeout(() => {
      console.log('Tentando inicializar novamente...')
      isInitialized.value = false
      initTypebot()
    }, 2000)
  }
}

const openTypebot = () => {
  console.log('Tentando abrir typebot...', typebot)
  if (typebot && typeof typebot.open === 'function') {
    typebot.open()
  } else if (!isInitialized.value) {
    console.log('Typebot não inicializado, inicializando...')
    initTypebot()
  } else {
    console.warn('Typebot não disponível para abertura')
  }
}

const closeTypebot = () => {
  if (typebot && typeof typebot.close === 'function') {
    typebot.close()
  }
}

// Lifecycle
onMounted(async () => {
  console.log('TypebotChat montado')
  await nextTick()
  initTypebot()
})

onUnmounted(() => {
  console.log('TypebotChat desmontado')
  if (typebot && typeof typebot.destroy === 'function') {
    typebot.destroy()
  }
})

// Expor métodos
defineExpose({
  openTypebot,
  closeTypebot,
  isInitialized
})
</script>

<style scoped>
.typebot-chat-wrapper {
  width: 100%;
  height: 100%;
}

.typebot-container {
  width: 100%;
  height: 100%;
  min-height: 400px;
  border-radius: 8px;
  overflow: hidden;
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
  box-shadow: 0 8px 24px rgba(25, 118, 210, 0.3);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 1000;
  user-select: none;
}

.typebot-floating-button:hover {
  transform: scale(1.1);
  box-shadow: 0 12px 32px rgba(25, 118, 210, 0.4);
}

.typebot-floating-button:active {
  transform: scale(0.95);
}

.typebot-floating-button.pulse {
  animation: pulse 2s infinite;
}

.button-text {
  margin-top: 2px;
  font-size: 10px;
  opacity: 0.9;
}

@keyframes pulse {
  0% {
    box-shadow: 0 8px 24px rgba(25, 118, 210, 0.3);
  }
  50% {
    box-shadow: 0 8px 24px rgba(25, 118, 210, 0.6), 0 0 0 8px rgba(25, 118, 210, 0.2);
  }
  100% {
    box-shadow: 0 8px 24px rgba(25, 118, 210, 0.3);
  }
}

/* Mobile */
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
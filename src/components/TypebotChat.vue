<!-- TypebotChat.vue - Versão otimizada para @typebot.io/js@0.8.20 -->
<template>
  <div>
    <!-- Container para o typebot embeddado -->
    <div ref="typebotContainer" class="typebot-container" v-if="!showFloatingButton"></div>
    
    <!-- Botão flutuante -->
    <button 
      v-if="showFloatingButton && !isOpen"
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
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'

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
  customDomain: {
    type: String,
    default: null
  },
  theme: {
    type: Object,
    default: () => ({
      button: { backgroundColor: '#667eea' },
      chatWindow: { backgroundColor: '#ffffff' },
      container: { borderRadius: '12px' }
    })
  },
  buttonText: {
    type: String,
    default: 'Chat'
  },
  previewMessage: {
    type: Object,
    default: () => ({
      message: 'Olá! Como posso te ajudar com seu agendamento?',
      delay: 3000
    })
  }
})

const emit = defineEmits(['onOpen', 'onClose', 'onMessageReceived'])

const typebotContainer = ref(null)
const isOpen = ref(false)
const shouldPulse = ref(false)
let typebot = null

// Computed para URL baseada na versão
const cdnUrl = computed(() => {
  return 'https://cdn.jsdelivr.net/npm/@typebot.io/js@0.8/dist/web.js'
})

const loadTypebotScript = () => {
  return new Promise((resolve, reject) => {
    if (window.Typebot) {
      resolve(window.Typebot)
      return
    }

    const script = document.createElement('script')
    script.src = cdnUrl.value
    script.onload = () => {
      console.log('Typebot script carregado com sucesso')
      resolve(window.Typebot)
    }
    script.onerror = (error) => {
      console.error('Erro ao carregar script do Typebot:', error)
      reject(error)
    }
    document.head.appendChild(script)
  })
}

const initTypebot = async () => {
  try {
    const Typebot = await loadTypebotScript()
    
    const config = {
      typebot: props.typebotId,
      theme: props.theme,
      onOpen: () => {
        console.log('Typebot aberto')
        isOpen.value = true
        emit('onOpen')
      },
      onClose: () => {
        console.log('Typebot fechado')
        isOpen.value = false
        emit('onClose')
      },
      onNewInputBlock: (block) => {
        console.log('Nova mensagem recebida:', block)
        emit('onMessageReceived', block)
      }
    }

    if (props.customDomain) {
      config.apiHost = props.customDomain
    }

    // Inicializar baseado no modo
    if (props.showFloatingButton) {
      typebot = Typebot.initBubble(config)
    } else {
      typebot = Typebot.initStandard({
        ...config,
        container: typebotContainer.value
      })
    }

    // Auto-open se configurado
    if (props.autoOpen && !props.showFloatingButton) {
      setTimeout(() => openTypebot(), 500)
    }

    // Preview message para botão flutuante
    if (props.showFloatingButton && props.previewMessage) {
      setTimeout(() => {
        shouldPulse.value = true
        setTimeout(() => {
          shouldPulse.value = false
        }, 2000)
      }, props.previewMessage.delay)
    }

  } catch (error) {
    console.error('Erro ao inicializar Typebot:', error)
  }
}

const openTypebot = () => {
  if (typebot) {
    typebot.open()
  }
}

const closeTypebot = () => {
  if (typebot) {
    typebot.close()
  }
}

const toggleTypebot = () => {
  if (isOpen.value) {
    closeTypebot()
  } else {
    openTypebot()
  }
}

// Métodos para controle programático
const sendMessage = (message) => {
  if (typebot && typeof typebot.sendMessage === 'function') {
    typebot.sendMessage(message)
  }
}

const setPrefilledVariables = (variables) => {
  if (typebot && typeof typebot.setPrefilledVariables === 'function') {
    typebot.setPrefilledVariables(variables)
  }
}

// Lifecycle
onMounted(() => {
  initTypebot()
})

onUnmounted(() => {
  if (typebot && typeof typebot.destroy === 'function') {
    typebot.destroy()
  }
})

// Watchers para mudanças de props
watch(() => props.typebotId, (newId) => {
  if (newId && typebot) {
    // Reinicializar com novo ID se necessário
    initTypebot()
  }
})

// Expor métodos para componente pai
defineExpose({
  openTypebot,
  closeTypebot,
  toggleTypebot,
  sendMessage,
  setPrefilledVariables,
  isOpen: computed(() => isOpen.value)
})
</script>

<style scoped>
.typebot-container {
  width: 100%;
  height: 100%;
  min-height: 400px;
  border-radius: 12px;
  overflow: hidden;
}

.typebot-floating-button {
  position: fixed;
  bottom: 24px;
  right: 24px;
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  font-size: 11px;
  font-weight: 600;
  box-shadow: 0 8px 24px rgba(102, 126, 234, 0.3);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 1000;
  overflow: hidden;
}

.typebot-floating-button:hover {
  transform: scale(1.1);
  box-shadow: 0 12px 32px rgba(102, 126, 234, 0.4);
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
    box-shadow: 0 8px 24px rgba(102, 126, 234, 0.3);
  }
  50% {
    box-shadow: 0 8px 24px rgba(102, 126, 234, 0.6), 0 0 0 8px rgba(102, 126, 234, 0.2);
  }
  100% {
    box-shadow: 0 8px 24px rgba(102, 126, 234, 0.3);
  }
}

/* Animação para mobile */
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

/* Tema escuro */
@media (prefers-color-scheme: dark) {
  .typebot-floating-button {
    background: linear-gradient(135deg, #4c51bf 0%, #553c9a 100%);
  }
}
</style>
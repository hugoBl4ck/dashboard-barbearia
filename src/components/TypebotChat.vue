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
import { ref, onMounted, onBeforeUnmount, nextTick, watch } from 'vue'

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
const isInitializing = ref(false)
const isMounted = ref(false)
let typebot = null
let scriptPromise = null

// Função para carregar script do Typebot
const loadTypebotScript = () => {
  // Se já existe uma promise, retorna ela
  if (scriptPromise) {
    return scriptPromise
  }

  // Se já carregou, resolve imediatamente
  if (scriptLoaded.value && window.Typebot) {
    console.log('✅ Typebot script já carregado')
    return Promise.resolve(window.Typebot)
  }

  // Criar nova promise
  scriptPromise = new Promise((resolve, reject) => {
    // Verificar se já existe um script carregando
    const existingScript = document.querySelector('script[src*="typebot"]')
    if (existingScript && !window.Typebot) {
      console.log('⏳ Script já existe, aguardando...')
      
      const checkTypebot = () => {
        if (window.Typebot) {
          scriptLoaded.value = true
          resolve(window.Typebot)
        } else {
          setTimeout(checkTypebot, 100)
        }
      }
      checkTypebot()
      return
    }

    if (existingScript && window.Typebot) {
      scriptLoaded.value = true
      resolve(window.Typebot)
      return
    }

    console.log('📄 Carregando script do Typebot...')
    const script = document.createElement('script')
    
    // URL corrigida e mais estável
    script.src = 'https://cdn.typebot.io/js/typebot@v0.3/dist/web.js'
    script.type = 'module'
    script.async = true
    
    script.onload = () => {
      console.log('✅ Script carregado')
      
      // Aguardar o objeto ficar disponível
      const waitForTypebot = () => {
        if (window.Typebot) {
          console.log('✅ Typebot disponível')
          scriptLoaded.value = true
          resolve(window.Typebot)
        } else if (window.Typebot === undefined) {
          console.log('⏳ Aguardando Typebot...')
          setTimeout(waitForTypebot, 100)
        } else {
          reject(new Error('Typebot não disponível'))
        }
      }
      
      setTimeout(waitForTypebot, 100)
    }
    
    script.onerror = (error) => {
      console.error('❌ Erro ao carregar script:', error)
      scriptPromise = null
      reject(error)
    }
    
    document.head.appendChild(script)
  })

  return scriptPromise
}

// Função para inicializar o Typebot
const initTypebot = async () => {
  if (!isMounted.value || isInitializing.value) {
    console.log('⚠️ Componente não montado ou já inicializando')
    return
  }

  try {
    isInitializing.value = true
    console.log('🚀 Iniciando Typebot com ID:', props.typebotId)
    
    const Typebot = await loadTypebotScript()
    
    // Verificar se ainda está montado
    if (!isMounted.value) {
      console.log('⚠️ Componente foi desmontado durante inicialização')
      return
    }

    await nextTick()

    const config = {
      typebot: props.typebotId,
      ...props.theme
    }

    console.log('⚙️ Configuração:', config)

    if (props.showFloatingButton) {
      console.log('🎈 Inicializando modo bubble')
      typebot = Typebot.initBubble(config)
    } else if (typebotContainer.value) {
      console.log('📦 Inicializando modo standard')
      typebot = Typebot.initStandard({
        ...config,
        container: typebotContainer.value
      })
    }

    console.log('✅ Typebot inicializado')

    // Auto-open para modo embeddado
    if (props.autoOpen && !props.showFloatingButton && isMounted.value) {
      setTimeout(() => {
        if (isMounted.value) {
          openTypebot()
        }
      }, 500)
    }

    // Animar botão depois de um tempo
    if (props.showFloatingButton && isMounted.value) {
      setTimeout(() => {
        if (isMounted.value) {
          shouldPulse.value = true
          setTimeout(() => {
            if (isMounted.value) {
              shouldPulse.value = false
            }
          }, 3000)
        }
      }, 2000)
    }

  } catch (error) {
    console.error('❌ Erro na inicialização:', error)
  } finally {
    isInitializing.value = false
  }
}

// Função para abrir o chat
const openTypebot = () => {
  if (!isMounted.value) return

  try {
    if (typebot && typeof typebot.open === 'function') {
      console.log('🎯 Abrindo Typebot')
      typebot.open()
      isTypebotOpen.value = true
      emit('onOpen')
    } else {
      console.log('⚠️ Typebot não pronto, tentando inicializar...')
      initTypebot().then(() => {
        if (typebot && typeof typebot.open === 'function' && isMounted.value) {
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

// Watch para detectar mudanças no typebotId
watch(() => props.typebotId, (newId) => {
  if (newId && isMounted.value && !isInitializing.value) {
    console.log('🔄 Typebot ID alterado, reinicializando...')
    if (typebot && typeof typebot.destroy === 'function') {
      typebot.destroy()
    }
    typebot = null
    setTimeout(() => {
      initTypebot()
    }, 100)
  }
})

// Lifecycle hooks
onMounted(async () => {
  console.log('🎬 TypebotChat montado')
  isMounted.value = true
  
  // Verificar se tem um ID válido
  if (!props.typebotId) {
    console.error('❌ Typebot ID não fornecido')
    return
  }
  
  await nextTick()
  
  // Para modo embeddado, aguardar o container estar pronto
  if (!props.showFloatingButton) {
    const waitForContainer = () => {
      if (typebotContainer.value && isMounted.value) {
        console.log('📦 Container pronto, inicializando...')
        initTypebot()
      } else if (isMounted.value) {
        console.log('⏳ Aguardando container...')
        setTimeout(waitForContainer, 100)
      }
    }
    
    setTimeout(waitForContainer, 200)
  } else {
    // Para modo floating, inicializar imediatamente
    setTimeout(() => {
      if (isMounted.value) {
        initTypebot()
      }
    }, 200)
  }
})

onBeforeUnmount(() => {
  console.log('🔚 TypebotChat sendo desmontado')
  isMounted.value = false
  isInitializing.value = false
  
  if (typebot) {
    try {
      if (typeof typebot.destroy === 'function') {
        typebot.destroy()
      } else if (typeof typebot.close === 'function') {
        typebot.close()
      }
    } catch (error) {
      console.error('Erro ao destruir Typebot:', error)
    }
    typebot = null
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
  position: relative;
}

.typebot-container {
  width: 100%;
  height: 100%;
  min-height: 400px;
  border-radius: 8px;
  background-color: #f9f9f9;
  border: 1px solid #e0e0e0;
  overflow: hidden;
}

.v-theme--dark .typebot-container {
  background-color: #1e1e1e;
  border-color: #333;
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
  line-height: 1;
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

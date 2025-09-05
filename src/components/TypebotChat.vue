<!-- ARQUIVO: src/components/TypebotChat.vue -->
<template>
  <!-- Este componente agora não renderiza nada visível por padrão -->
</template>

<script setup>
import { onMounted, onUnmounted } from 'vue';

const props = defineProps({ typebotId: { type: String, required: true } });
const emit = defineEmits(['onOpen', 'onClose']);

let typebotInstance = null;

const loadScript = () => new Promise((resolve, reject) => {
    if (window.Typebot) return resolve(window.Typebot);
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/@typebot.io/js/dist/web.js';
    script.onload = () => resolve(window.Typebot);
    script.onerror = reject;
    document.head.appendChild(script);
});

onMounted(async () => {
  try {
    const Typebot = await loadScript();
    typebotInstance = await Typebot.initBubble({
      typebot: props.typebotId,
      onOpen: () => emit('onOpen'),
      onClose: () => emit('onClose'),
    });
  } catch (e) {
    console.error("Erro ao inicializar o Typebot:", e);
  }
});

onUnmounted(() => typebotInstance?.destroy());

// Expõe os métodos de controle para o componente pai
defineExpose({
  open: () => typebotInstance?.open(),
  close: () => typebotInstance?.close(),
});
</script>
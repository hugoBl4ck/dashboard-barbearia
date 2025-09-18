<!-- ARQUIVO: src/components/TypebotChat.vue (COM DEBUG) -->
<template>
  <div v-if="error" class="typebot-error-overlay">
    <strong>Erro no Typebot:</strong> {{ error }}
    <p>Verifique o console para mais detalhes.</p>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, ref } from 'vue';

const props = defineProps({ typebotId: { type: String, required: true } });
const emit = defineEmits(['onOpen', 'onClose']);

let typebotInstance = null;
const error = ref(null);

const loadScript = () => new Promise((resolve, reject) => {
    if (window.Typebot) return resolve(window.Typebot);
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/@typebot.io/js/dist/web.js';
    script.onload = () => resolve(window.Typebot);
    script.onerror = (err) => {
        console.error("Falha ao carregar o script do Typebot:", err);
        reject(new Error("Não foi possível carregar o script do Typebot. Verifique a conexão ou bloqueadores de anúncio."));
    };
    document.head.appendChild(script);
});

onMounted(async () => {
  if (!props.typebotId) {
    error.value = "Nenhum ID de Typebot foi fornecido.";
    console.error(error.value);
    return;
  }

  console.log(`[Typebot] Tentando inicializar com o ID: "${props.typebotId}"`);

  try {
    const Typebot = await loadScript();
    console.log("[Typebot] Script carregado com sucesso.");

    typebotInstance = await Typebot.initBubble({
      typebot: props.typebotId,
      onOpen: () => emit('onOpen'),
      onClose: () => emit('onClose'),
    });

    console.log("[Typebot] Instância do balão inicializada com sucesso.");

  } catch (e) {
    console.error("Erro ao inicializar o Typebot:", e);
    error.value = e.message || "Ocorreu um erro desconhecido na inicialização.";
    
    if (e.message && e.message.includes('404')) {
        error.value = `Typebot com ID "${props.typebotId}" não encontrado. Verifique se o ID está correto e se o bot está publicado.`;
    }
  }
});

onUnmounted(() => {
    if (typebotInstance) {
        typebotInstance.destroy();
        console.log("[Typebot] Instância destruída.");
    }
});

// Expõe os métodos de controle para o componente pai
defineExpose({
  open: () => typebotInstance?.open(),
  close: () => typebotInstance?.close(),
});
</script>

<style scoped>
.typebot-error-overlay {
  position: fixed;
  bottom: 20px;
  left: 20px;
  background-color: #ff4d4f;
  color: white;
  padding: 12px 20px;
  border-radius: 8px;
  font-family: sans-serif;
  font-size: 14px;
  z-index: 999999;
  box-shadow: 0 4px 12px rgba(0,0,0,0.2);
}
</style>

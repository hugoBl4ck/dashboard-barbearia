<template>
  <div id="typebot-container" style="width: 100%; height: 100vh;"></div>
</template>

<script setup>
import { onMounted } from 'vue';
// Importa a biblioteca inteira como um objeto 'Typebot'
import * as Typebot from '@typebot.io/js';

// Função para extrair o ID do Typebot da URL de compartilhamento
const get_typebot_id_from_url = (url) => {
  if (!url || typeof url !== 'string') return null;
  const match = url.match(/([a-zA-Z0-9]+)$/);
  return match ? match[1] : null;
};

onMounted(() => {
  // INSTRUÇÃO: Cole a URL de compartilhamento do seu Typebot aqui
  const typebot_share_url = "https://typebot.co/my-typebot-lk5rehg";
  
  const typebot_id = get_typebot_id_from_url(typebot_share_url);

  if (typebot_id) {
    // Acessa a função 'initStandard' através do objeto 'Typebot'
    Typebot.initStandard({
      typebot: typebot_id,
      apiHost: "https://viewer.typebot.io",
      element: "#typebot-container"
    });
  } else {
    console.error("URL do Typebot inválida ou não fornecida. Verifique a variável 'typebot_share_url'.");
    const container = document.getElementById('typebot-container');
    if (container) {
      container.innerHTML = '<h1>Erro: Bot não configurado. Verifique a URL no código-fonte.</h1>';
    }
  }
});
</script>
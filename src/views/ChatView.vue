<template>
  <div id="typebot-container" style="width: 100%; height: 100vh;"></div>
</template>

<script setup>
import { onMounted } from 'vue';
// Importa a biblioteca inteira em vez de uma parte específica
import * as Typebot from '@typebot.io/js';

// Função para extrair o ID do Typebot da URL de compartilhamento
const get_typebot_id_from_url = (url) => {
  // Usa uma regex mais robusta para pegar o ID no final da URL
  const match = url.match(/([a-zA-Z0-9]+)$/);
  return match ? match[1] : null;
};

onMounted(() => {
  // INSTRUÇÃO IMPORTANTE: Cole a URL de compartilhamento aqui
  const typebot_share_url = "https://typebot.co/my-typebot-lk5rehg";
  
  const typebot_id = get_typebot_id_from_url(typebot_share_url);

  if (typebot_id) {
    // Acessa a função 'initStandard' através do objeto 'Typebot'
    Typebot.initStandard({
      typebot: typebot_id,
      apiHost: "https://viewer.typebot.io",
      // Adiciona o elemento alvo para garantir que o bot renderize no lugar certo
      element: "#typebot-container"
    });
  } else {
    console.error("URL do Typebot inválida! Não foi possível extrair o ID. Verifique a variável 'typebot_share_url'.");
    const container = document.getElementById('typebot-container');
    if (container) {
      container.innerHTML = '<h1>Erro: Bot não configurado. Verifique a URL no código.</h1>';
    }
  }
});
</script>
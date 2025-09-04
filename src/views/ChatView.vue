<template>
  <div id="typebot-container" style="width: 100%; height: 100vh;"></div>
</template>

<script setup>
import { onMounted } from 'vue';
import { standard } from '@typebot.io/js';

// Função para extrair o ID do Typebot da URL de compartilhamento
const get_typebot_id_from_url = (url) => {
  const match = url.match(/([a-zA-Z0-9]{24})$/);
  return match ? match[1] : null;
};

onMounted(() => {
  // INSTRUÇÃO IMPORTANTE:
  // 1. Vá para o seu bot no Typebot.io
  // 2. Clique na aba "Share"
  // 3. Copie o link que aparece em "Your typebot links"
  // 4. Cole o link completo na variável abaixo

  const typebot_share_url = "https://typebot.co/my-typebot-lk5rehg";
  
  const typebot_id = get_typebot_id_from_url(typebot_share_url);

  if (typebot_id) {
    standard.init({
      typebot: typebot_id,
      apiHost: "https://viewer.typebot.io",
    });
  } else {
    console.error("URL do Typebot inválida! Não foi possível extrair o ID.");
    // Opcional: mostrar uma mensagem de erro na tela
    const container = document.getElementById('typebot-container');
    if (container) {
      container.innerHTML = '<h1>Erro: Bot não configurado.</h1>';
    }
  }
});
</script>
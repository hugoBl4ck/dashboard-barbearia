<template>
  <div id="typebot" style="width: 100%; height: 100vh;"></div>
</template>

<script setup>
import { onMounted } from 'vue';

onMounted(() => {
  // INSTRUÇÃO: Cole a URL de compartilhamento do seu Typebot aqui.
  const typebotUrl = "https://typebot.co/my-typebot-lk5rehg";

  if (!typebotUrl || !typebotUrl.includes('typebot.co')) {
    console.error("URL do Typebot inválida.");
    return;
  }
  
  // Verifica se o script do Typebot carregou e a função está disponível
  if (window.Typebot && typeof window.Typebot.initStandard === 'function') {
    window.Typebot.initStandard({
      typebot: typebotUrl,
    });
  } else {
    console.error("A biblioteca do Typebot não carregou a tempo.");
    // Tenta novamente após um pequeno atraso, como último recurso
    setTimeout(() => {
      if (window.Typebot && typeof window.Typebot.initStandard === 'function') {
        window.Typebot.initStandard({ typebot: typebotUrl });
      } else {
        document.getElementById('typebot').innerHTML = '<h1>Erro ao carregar o chat. Tente atualizar a página.</h1>';
      }
    }, 1000);
  }
});
</script>
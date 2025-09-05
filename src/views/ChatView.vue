<template>
  <!-- O Typebot irá se anexar a este elemento. O ID é importante. -->
  <div id="typebot" style="width: 100%; height: 100vh;"></div>
</template>

<script setup>
import { onMounted } from 'vue';

// Importa o script da forma como a documentação recomenda.
// Isso adicionará o objeto 'Typebot' ao escopo global da janela (window).
import '@typebot.io/js/dist/web.js';

onMounted(() => {
  // INSTRUÇÃO: Cole a URL de compartilhamento do seu Typebot aqui.
  // Esta é a URL que você copia da aba "Share" do seu bot.
  const typebotUrl = "https://typebot.co/my-typebot-lk5rehg";

  if (!typebotUrl || !typebotUrl.includes('typebot.co')) {
    console.error("URL do Typebot inválida ou não fornecida. Verifique a variável 'typebotUrl'.");
    const container = document.getElementById('typebot');
    if (container) {
      container.innerHTML = '<h1>Erro: Bot não configurado. Verifique a URL no código-fonte.</h1>';
    }
    return;
  }

  // Acessa o Typebot através do objeto 'window', como é o padrão
  // para scripts importados desta maneira.
  window.Typebot.initStandard({
    typebot: typebotUrl, // A função aceita a URL completa diretamente
    apiHost: "https://viewer.typebot.io",
  });
});
</script>
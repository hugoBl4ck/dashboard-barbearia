// testWebhook.js
async function testWebhook() {
  const url = 'https://dashboard-barbearia.vercel.app/api/webhook'
  const data = {
    nome: 'João Silva',
    telefone: '5511987654321',
    data_hora_texto: 'agendar para amanhã às 10h',
    servicoId: 'corte',
    barbeariaId: '01',
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    // Adicione esta linha para ver a resposta bruta
    const responseText = await response.text()
    console.log('Resposta bruta do Webhook:', responseText)

    const result = JSON.parse(responseText) // Tente parsear o texto
    console.log('Resposta do Webhook (JSON):', result)
  } catch (error) {
    console.error('Erro ao chamar o webhook:', error)
  }
}

testWebhook()

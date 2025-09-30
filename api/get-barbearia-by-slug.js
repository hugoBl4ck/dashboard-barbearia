// api/get-barbearia-by-slug.js

import { db } from './_firebase-admin.js';

export default async function handler(request, response) {
  if (request.method !== 'GET') {
    return response.status(405).json({ error: 'Método não permitido. Use GET.' });
  }

  const { slug } = request.query;

  if (!slug) {
    return response.status(400).json({ error: 'O slug da barbearia é obrigatório.' });
  }

  try {
    // Busca na coleção 'barbearias' por um documento com o slug correspondente
    const barbeariasRef = db.collection('barbearias');
    const q = barbeariasRef.where('slug', '==', slug);
    const querySnapshot = await q.get();

    if (querySnapshot.empty) {
      return response.status(404).json({ error: 'Barbearia não encontrada.' });
    }

    // Assumimos que o slug é único, então pegamos o primeiro resultado
    const barbeariaDoc = querySnapshot.docs[0];
    const barbeariaData = barbeariaDoc.data();

    // Retorna apenas os dados públicos necessários para a landing page
    const publicData = {
      id: barbeariaDoc.id,
      nome: barbeariaData.nome,
      // Adicione outros campos públicos que a landing page possa precisar
      // Ex: endereco: barbeariaData.endereco, telefone: barbeariaData.telefone
    };

    return response.status(200).json(publicData);

  } catch (error) {
    console.error(`Erro ao buscar barbearia pelo slug '${slug}':`, error);
    return response.status(500).json({ error: 'Falha ao buscar dados da barbearia.', details: error.message });
  }
}

// api/delete.js

import { del } from '@vercel/blob';
import { auth, db } from './_firebase-admin.js';

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Método não permitido. Use POST.' });
  }

  try {
    // 1. Autenticar o usuário (mesmo processo do upload)
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return response.status(401).json({ error: 'Token de autorização ausente ou mal formatado.' });
    }
    const token = authHeader.split(' ')[1];
    const decodedToken = await auth.verifyIdToken(token);
    const userId = decodedToken.uid;

    // 2. Buscar o barbeariaId do usuário
    const userDoc = await db.collection('usuarios').doc(userId).get();
    if (!userDoc.exists) {
      return response.status(404).json({ error: 'Usuário não encontrado.' });
    }
    const { barbeariaId } = userDoc.data();
    if (!barbeariaId) {
      return response.status(403).json({ error: 'Usuário não associado a uma barbearia.' });
    }

    // 3. Obter a URL a ser deletada do corpo da requisição
    const { urlToDelete } = request.body;
    if (!urlToDelete) {
      return response.status(400).json({ error: 'URL do arquivo a ser deletado não foi fornecida.' });
    }

    // 4. Validação de segurança CRÍTICA
    const filePath = new URL(urlToDelete).pathname;
    const expectedPathPrefix = `/barbearias/${barbeariaId}/`;

    if (!filePath.startsWith(expectedPathPrefix)) {
        console.warn(`Tentativa de exclusão não autorizada: Usuário ${userId} tentou apagar ${urlToDelete}, que não pertence à sua barbearia ${barbeariaId}.`);
        return response.status(403).json({ error: 'Permissão negada. Você só pode apagar os seus próprios arquivos.' });
    }

    // 5. Deletar o arquivo do Vercel Blob
    await del(urlToDelete);

    return response.status(200).json({ success: true, message: 'Arquivo deletado com sucesso.' });

  } catch (error) {
    console.error('Erro na API de exclusão:', error);

    if (error.code === 'auth/id-token-expired' || error.code === 'auth/argument-error') {
      return response.status(401).json({ error: 'Token inválido ou expirado.' });
    }

    return response.status(500).json({ error: 'Erro interno do servidor.', details: error.message });
  }
}

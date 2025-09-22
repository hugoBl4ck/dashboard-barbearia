// api/upload.js

import { put } from '@vercel/blob';
import { auth, db } from './_firebase-admin.js';

export const config = {
  api: {
    bodyParser: false, // Desativa o parser padrão para podermos lidar com o stream do arquivo
  },
};

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Método não permitido. Use POST.' });
  }

  try {
    // 1. Autenticar o usuário
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return response.status(401).json({ error: 'Token de autorização ausente ou mal formatado.' });
    }
    const token = authHeader.split(' ')[1];
    const decodedToken = await auth.verifyIdToken(token);
    const userId = decodedToken.uid;

    // 2. Buscar o barbeariaId do usuário no Firestore
    const userDoc = await db.collection('usuarios').doc(userId).get();
    if (!userDoc.exists) {
      return response.status(404).json({ error: 'Usuário não encontrado no banco de dados.' });
    }
    const { barbeariaId } = userDoc.data();
    if (!barbeariaId) {
      return response.status(403).json({ error: 'Usuário não está associado a uma barbearia.' });
    }

    // 3. Fazer o upload para o Vercel Blob
    const filename = request.headers['x-vercel-filename'] || 'arquivo-sem-nome';
    const path = `barbearias/${barbeariaId}/${filename}`;

    const blob = await put(path, request, {
      access: 'public',
      // O Vercel se encarrega de passar o stream do request.body para o `put`
    });

    // 4. Retornar a URL do blob
    return response.status(200).json(blob);

  } catch (error) {
    console.error('Erro na API de upload:', error);

    if (error.code === 'auth/id-token-expired') {
      return response.status(401).json({ error: 'Token expirado. Faça login novamente.' });
    }
    if (error.code === 'auth/argument-error') {
      return response.status(401).json({ error: 'Token inválido.' });
    }

    return response.status(500).json({ error: 'Erro interno do servidor.', details: error.message });
  }
}

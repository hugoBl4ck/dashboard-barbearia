// api/delete-account.js

import { auth, db } from './_firebase-admin.js';

// --- FUNÇÃO AUXILIAR PARA DELETAR SUB-COLEÇÕES ---
// O Firestore não deleta sub-coleções automaticamente ao deletar um documento.
async function deleteCollection(collectionPath, batchSize = 50) {
  const collectionRef = db.collection(collectionPath);
  const query = collectionRef.orderBy('__name__').limit(batchSize);

  return new Promise((resolve, reject) => {
    deleteQueryBatch(query, resolve).catch(reject);
  });
}

async function deleteQueryBatch(query, resolve) {
  const snapshot = await query.get();

  if (snapshot.size === 0) {
    return resolve();
  }

  const batch = db.batch();
  snapshot.docs.forEach((doc) => {
    batch.delete(doc.ref);
  });
  await batch.commit();

  // Continua deletando o próximo lote
  process.nextTick(() => {
    deleteQueryBatch(query, resolve);
  });
}

// --- ROTA PRINCIPAL DA API ---
export default async function handler(request, response) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Método não permitido. Use POST.' });
  }

  let userId;
  try {
    // 1. Autenticar o usuário pelo token enviado no header
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return response.status(401).json({ error: 'Token de autorização ausente ou mal formatado.' });
    }
    const token = authHeader.split(' ')[1];
    const decodedToken = await auth.verifyIdToken(token);
    userId = decodedToken.uid;

    console.log(`[API Delete] Iniciando exclusão para o usuário: ${userId}`);

    // 2. Buscar o documento do usuário para encontrar o ID da barbearia
    const userDocRef = db.collection('usuarios').doc(userId);
    const userDoc = await userDocRef.get();
    if (!userDoc.exists) {
      // Se o documento do usuário não existe, algo está errado, mas podemos prosseguir para deletar a autenticação.
      console.warn(`[API Delete] Documento de usuário não encontrado para ${userId}, mas prosseguindo para deletar da autenticação.`);
    } else {
      const { barbeariaId } = userDoc.data();

      if (barbeariaId) {
        console.log(`[API Delete] Encontrada barbearia ${barbeariaId} para o usuário ${userId}.`);
        const barbeariaDocRef = db.collection('barbearias').doc(barbeariaId);

        // 3. Deletar todas as sub-coleções da barbearia (CRÍTICO!)
        console.log(`[API Delete] Deletando sub-coleções de ${barbeariaId}...`);
        const subcollections = ['clientes', 'servicos', 'agendamentos', 'horarios']; // Adicione outras se houver
        for (const subcollection of subcollections) {
          const subcollectionPath = `barbearias/${barbeariaId}/${subcollection}`;
          console.log(`[API Delete] ...deletando ${subcollectionPath}`);
          await deleteCollection(subcollectionPath);
        }

        // 4. Deletar o documento principal da barbearia
        console.log(`[API Delete] Deletando documento principal da barbearia ${barbeariaId}.`);
        await barbeariaDocRef.delete();
      } else {
        console.log(`[API Delete] Usuário ${userId} não possui barbearia associada.`);
      }

      // 5. Deletar o documento do usuário
      console.log(`[API Delete] Deletando documento do usuário ${userId}.`);
      await userDocRef.delete();
    }

    // 6. Deletar o usuário do Firebase Authentication (passo final)
    console.log(`[API Delete] Deletando usuário ${userId} do Firebase Authentication.`);
    await auth.deleteUser(userId);

    console.log(`[API Delete] Usuário ${userId} e todos os seus dados foram deletados com sucesso.`);
    return response.status(200).json({ success: true, message: 'Conta e dados associados foram excluídos com sucesso.' });

  } catch (error) {
    console.error(`[API Delete] Erro ao deletar conta para usuário ${userId}:`, error);

    if (error.code === 'auth/id-token-expired' || error.code === 'auth/argument-error') {
      return response.status(401).json({ error: 'Token inválido ou expirado. Faça login novamente.' });
    }

    return response.status(500).json({ error: 'Erro interno do servidor ao tentar excluir a conta.', details: error.message });
  }
}

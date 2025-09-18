// src/firebase/tenantSetup.js
import { collection, doc, writeBatch } from 'firebase/firestore';

/**
 * Cria os dados iniciais para uma nova barbearia (tenant), 
 * incluindo serviços e horários padrão.
 * @param {object} db - A instância do Firestore.
 * @param {string} barbeariaId - O ID da barbearia a ser populada.
 */
export const createInitialTenantData = async (db, barbeariaId) => {
  if (!db || !barbeariaId) {
    throw new Error('Instância do DB e barbeariaId são necessários.');
  }

  try {
    const batch = writeBatch(db);

    // 1. Criar Serviços Padrão
    const servicosRef = collection(db, `barbearias/${barbeariaId}/servicos`);
    const defaultServicos = [
      { nome: 'Corte Masculino', preco: 35, duracao: 30, ativo: true, criadoEm: new Date() },
      { nome: 'Barba', preco: 25, duracao: 20, ativo: true, criadoEm: new Date() },
      { nome: 'Corte e Barba', preco: 55, duracao: 50, ativo: true, criadoEm: new Date() },
    ];
    defaultServicos.forEach(servico => {
      const newServicoRef = doc(servicosRef);
      batch.set(newServicoRef, servico);
    });

    // 2. Criar Horários Padrão
    const horariosPath = `barbearias/${barbeariaId}/horarios`;
    const defaultHorario = {
      aberto: true,
      InicioManha: '09:00',
      FimManha: '12:00',
      InicioTarde: '14:00',
      FimTarde: '19:00',
    };
    // Segunda a Sexta
    for (let dia = 1; dia <= 5; dia++) {
      const horarioRef = doc(db, horariosPath, String(dia));
      batch.set(horarioRef, defaultHorario);
    }
    // Sábado
    const sabadoRef = doc(db, horariosPath, '6');
    batch.set(sabadoRef, { ...defaultHorario, FimTarde: '17:00' });
    // Domingo
    const domingoRef = doc(db, horariosPath, '0');
    batch.set(domingoRef, { aberto: false });

    // 3. Commit a transação em lote
    await batch.commit();
    console.log(`Dados iniciais criados com sucesso para a barbearia ${barbeariaId}`);

  } catch (error) {
    console.error(`Erro ao criar dados iniciais para a barbearia ${barbeariaId}:`, error);
    // Lançar o erro permite que a função que chamou saiba que algo deu errado.
    throw error;
  }
};

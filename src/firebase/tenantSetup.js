// src/firebase/tenantSetup.js
import { collection, doc, writeBatch } from 'firebase/firestore';

/**
 * Cria os dados iniciais para uma nova barbearia (tenant), 
 * incluindo serviços e horários padrão com IDs fixos.
 * @param {object} db - A instância do Firestore.
 * @param {string} barbeariaId - O ID da barbearia a ser populada.
 */
export const createInitialTenantData = async (db, barbeariaId) => {
  if (!db || !barbeariaId) {
    throw new Error('Instância do DB e barbeariaId são necessários.');
  }

  try {
    const batch = writeBatch(db);

    // 1. Criar Serviços Padrão com IDs fixos
    const servicosRef = collection(db, `barbearias/${barbeariaId}/servicos`);
    const defaultServicos = [
      { id: 'corte', nome: 'Corte (Tesoura ou Máquina)', preco: 35, duracaoMinutos: 30, ativo: true, criadoEm: new Date() },
      { id: 'barba', nome: 'Barba (Modelagem e Navalha)', preco: 30, duracaoMinutos: 30, ativo: true, criadoEm: new Date() },
      { id: 'combo', nome: 'Corte + Barba', preco: 60, duracaoMinutos: 60, ativo: true, criadoEm: new Date() },
      { id: 'sobrancelha', nome: 'Sobrancelha (Pinça ou Navalha)', preco: 20, duracaoMinutos: 15, ativo: true, criadoEm: new Date() },
      { id: 'pezinho', nome: 'Acabamento "Pezinho"', preco: 15, duracaoMinutos: 15, ativo: true, criadoEm: new Date() },
    ];
    
    defaultServicos.forEach(servico => {
      const { id, ...serviceData } = servico; // Separa o ID do resto dos dados
      const newServicoRef = doc(servicosRef, id); // Usa o ID predefinido para criar a referência
      batch.set(newServicoRef, serviceData);
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
    console.log(`Dados iniciais (com serviços padrão) criados com sucesso para a barbearia ${barbeariaId}`);

  } catch (error) {
    console.error(`Erro ao criar dados iniciais para a barbearia ${barbeariaId}:`, error);
    // Lançar o erro permite que a função que chamou saiba que algo deu errado.
    throw error;
  }
};

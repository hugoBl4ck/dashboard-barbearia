// api/get-plan-info.js

import Stripe from 'stripe';

// Inicializa o Stripe com a chave secreta (deve estar nas suas variáveis de ambiente)
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(request, response) {
  if (request.method !== 'GET') {
    return response.status(405).json({ error: 'Método não permitido. Use GET.' });
  }

  const { priceId } = request.query;

  if (!priceId) {
    return response.status(400).json({ error: 'O ID do Preço (priceId) é obrigatório.' });
  }

  try {
    // Busca as informações do Preço e expande para incluir os dados do Produto associado
    const price = await stripe.prices.retrieve(priceId, {
      expand: ['product'],
    });

    // Assegura que o produto foi expandido corretamente
    if (!price.product || typeof price.product !== 'object') {
        throw new Error('Produto associado ao preço não foi encontrado ou não é um objeto válido.');
    }

    // Monta um objeto de resposta limpo com as informações que o front-end precisa
    const planInfo = {
      productName: price.product.name,
      productDescription: price.product.description,
      // Os "features" do produto podem ser armazenados nos metadados do produto no Stripe
      features: price.product.metadata.features ? JSON.parse(price.product.metadata.features) : [],
      priceAmount: price.unit_amount / 100, // O valor vem em centavos
      priceCurrency: price.currency.toUpperCase(),
      priceInterval: price.recurring?.interval, // 'month' ou 'year'
    };

    return response.status(200).json(planInfo);

  } catch (error) {
    console.error('Erro ao buscar informações do plano no Stripe:', error);
    return response.status(500).json({ error: 'Falha ao buscar detalhes do plano.', details: error.message });
  }
}

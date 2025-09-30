// ARQUIVO: /api/stripe-webhook.js

import Stripe from 'stripe';
import { db } from './_firebase-admin.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

// Desativa o bodyParser padrão do Vercel para este endpoint
export const config = { api: { bodyParser: false } };

// Função para ler o corpo da requisição
async function getRawBody(readable) {
  const chunks = [];
  for await (const chunk of readable) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    return response.status(405).end();
  }
  
  const rawBody = await getRawBody(request);
  const sig = request.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err) {
    console.warn(`⚠️  Falha na verificação da assinatura do webhook: ${err.message}`);
    return response.status(400).send(`Webhook Error: ${err.message}`);
  }
  
  console.log('✅ Webhook do Stripe recebido:', event.type);

  // Lida com o evento
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      const barbeariaId = session.metadata.barbeariaId;
      const stripeCustomerId = session.customer;
      const stripeSubscriptionId = session.subscription;

      // Atualiza o documento da barbearia no Firestore
      const barbeariaRef = db.collection('barbearias').doc(barbeariaId);
      await barbeariaRef.update({
        statusAssinatura: 'active',
        stripeCustomerId: stripeCustomerId,
        stripeSubscriptionId: stripeSubscriptionId,
      });
      console.log(`✅ Assinatura ativada para a barbearia: ${barbeariaId}`);
      break;
    }
    // Adicione outros casos aqui (invoice.payment_failed, etc.)
  }

  response.status(200).json({ received: true });
}
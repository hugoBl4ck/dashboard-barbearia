// ARQUIVO: /api/create-checkout-session.js

import Stripe from 'stripe';
import { auth, db } from './_firebase-admin.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    return response.status(405).end();
  }
  
  try {
    // A inicialização do Firebase Admin agora é feita em _firebase-admin.js
    // Lógica para obter o ID do usuário logado (precisaremos de um token)
    // Por agora, vamos simplificar e receber o barbeariaId no corpo
    const { barbeariaId, priceId } = request.body;

    if (!barbeariaId || !priceId) {
      return response.status(400).json({ error: 'ID da barbearia e do preço são obrigatórios.' });
    }

    const barbeariaDoc = await db.collection('barbearias').doc(barbeariaId).get();
    if (!barbeariaDoc.exists) {
      return response.status(404).json({ error: 'Barbearia não encontrada.'});
    }
    
    const YOUR_DOMAIN = process.env.VERCEL_URL ? `https://{process.env.VERCEL_URL}` : 'http://localhost:5173';

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      success_url: `${YOUR_DOMAIN}/?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${YOUR_DOMAIN}/billing`,
      // Passa o ID da barbearia para o webhook do Stripe
      metadata: {
        barbeariaId: barbeariaId
      }
    });

    return response.status(200).json({ sessionId: session.id, url: session.url });

  } catch (err) {
    console.error('Erro ao criar sessão de checkout:', err);
    response.status(500).json({ error: { message: err.message } });
  }
}
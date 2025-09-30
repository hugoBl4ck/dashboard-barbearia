// ARQUIVO: src/server/lib/firebaseAdmin.js
import admin from 'firebase-admin';

export function initializeFirebaseAdmin() {
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_CREDENTIALS || '{}'))
    });
  }
  return admin;
}
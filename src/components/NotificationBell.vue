<template>
  <v-menu offset-y>
    <template v-slot:activator="{ on, attrs }">
      <v-btn icon v-bind="attrs" v-on="on">
        <v-badge :content="unreadCount" :value="unreadCount > 0" color="red" overlap>
          <v-icon>mdi-bell</v-icon>
        </v-badge>
      </v-btn>
    </template>
    <v-list>
      <v-list-item v-for="(notification, index) in notifications" :key="index" @click="markAsRead(notification)">
        <v-list-item-title>{{ notification.message }}</v-list-item-title>
      </v-list-item>
      <v-list-item v-if="notifications.length === 0">
        <v-list-item-title>Nenhuma notificação nova</v-list-item-title>
      </v-list-item>
    </v-list>
  </v-menu>
</template>

<script setup>
import { ref, watch } from 'vue';
import { getFirestore, collection, query, where, onSnapshot, updateDoc, doc, orderBy } from 'firebase/firestore';
import { useAuth } from '@/composables/useAuth';

const { barbeariaId } = useAuth();
const notifications = ref([]);
const unreadCount = ref(0);
let unsubscribe = null;

const db = getFirestore();

watch(barbeariaId, (newId) => {
  if (unsubscribe) {
    unsubscribe(); // Cancela o listener anterior para evitar duplicatas
  }

  if (newId) {
    const notificationsRef = collection(db, 'barbearias', newId, 'notifications');
    const q = query(
      notificationsRef, 
      where('read', '==', false),
      orderBy('timestamp', 'desc')
    );

    unsubscribe = onSnapshot(q, (snapshot) => {
      const newNotifications = [];
      snapshot.forEach((doc) => {
        newNotifications.push({ id: doc.id, ...doc.data() });
      });

      // Dispara o som/notificação apenas se um novo item for realmente adicionado
      const isNewAddition = snapshot.docChanges().some(change => change.type === 'added');
      if (isNewAddition && notifications.value.length < newNotifications.length) {
        const latestNotification = newNotifications[0]; // Já que está ordenado por timestamp desc
        playNotificationSound();
        showBrowserNotification(latestNotification.message);
      }

      notifications.value = newNotifications;
      unreadCount.value = newNotifications.length;
    });
  } else {
    // Limpa as notificações se o usuário fizer logout
    notifications.value = [];
    unreadCount.value = 0;
  }
}, { immediate: true });

function playNotificationSound() {
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  if (!audioContext) {
    console.error("Web Audio API is not supported in this browser.");
    return;
  }
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(440, audioContext.currentTime); // A4 note
  gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);

  oscillator.start();
  gainNode.gain.exponentialRampToValueAtTime(0.00001, audioContext.currentTime + 0.5);
  oscillator.stop(audioContext.currentTime + 0.5);
}

function showBrowserNotification(message) {
  if (Notification.permission === 'granted') {
    new Notification('Novo Agendamento!', {
      body: message,
      icon: '/favicon.ico'
    });
  } else if (Notification.permission !== 'denied') {
    Notification.requestPermission().then(permission => {
      if (permission === 'granted') {
        new Notification('Novo Agendamento!', {
          body: message,
          icon: '/favicon.ico'
        });
      }
    });
  }
}

async function markAsRead(notification) {
  const notificationRef = doc(db, 'barbearias', barbeariaId.value, 'notifications', notification.id);
  await updateDoc(notificationRef, { read: true });
}
</script>

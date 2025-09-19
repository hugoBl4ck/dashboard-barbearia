<template>
  <v-card flat class="d-flex flex-column align-center text-center pa-8">
    <v-icon :icon="icon" size="64" class="mb-4 text-grey"></v-icon>
    <h2 class="text-h5 mb-2">{{ title }}</h2>
    <p class="text-body-1 text-medium-emphasis">{{ message }}</p>
    <div v-if="$slots.default" class="mt-6">
      <slot></slot>
    </div>
  </v-card>
</template>

<script setup>
defineProps({
  icon: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
});
</script>

<style scoped>
.v-card {
  background-color: transparent;
}
</style>

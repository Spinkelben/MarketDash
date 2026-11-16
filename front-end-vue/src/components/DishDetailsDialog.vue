<script setup lang="ts">
import type { Dish } from '../types';
import BaseDialog from './BaseDialog.vue';

defineProps<{ dish: Dish }>();
const open = defineModel<boolean>('open', { required: true });
</script>

<template>
  <BaseDialog v-model:open="open" class="dish-details">
    <div class="dish-details-content">
      <h1 class="dish-name">{{ dish.name }}</h1>
      <p v-if="dish.description.trim()" class="dish-tagline">{{ dish.description.trim() }}</p>
      <img v-if="dish.imageUrl" class="dish-img" :src="dish.imageUrl" alt="Menu Item Image" />
      <p class="dish-description">{{ dish.descriptionLong }}</p>
      <button autofocus @click="open = false">Close</button>
    </div>
  </BaseDialog>
</template>

<style scoped>
.dish-details {
  background-color: var(--accent-color, #dee5f2);
  border-radius: 10px;
  box-sizing: border-box;
  max-width: 80vw;
  max-height: 80vh;
}

.dish-details-content {
  padding: 1em;
}

.dish-name {
  margin: 0 0 0.75em;
  color: var(--primary-color, #1670d6);
  font-family: Arial, Helvetica, sans-serif;
  text-align: center;
}

.dish-tagline {
  margin: -0.5em 0 1em;
  text-align: center;
  font-size: 0.85em;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  opacity: 0.7;
}

.dish-img {
  max-width: 100%;
  max-height: 30vh;
  object-fit: contain;
  margin: 0 auto;
  display: block;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  border-radius: 10px;
}

.dish-description {
  white-space: pre-wrap;
  display: block;
  max-width: 50vw;
  margin-top: 1.5em;
  font-family: Verdana, Geneva, Tahoma, sans-serif;
  color: var(--font-color, #1a1b1d);
  padding: 1em;
  text-align: left;
}

button {
  display: block;
  background-color: var(--primary-color, #1670d6);
  color: white;
  border: none;
  padding: 10px 20px;
  cursor: pointer;
  transition: background-color 0.3s;
  border-radius: 10px;
}

button:hover {
  background-color: var(--secondary-color, #1a1b1d);
}

/* On a phone the dialog and its text use nearly the whole screen width. */
@media (max-width: 600px) {
  .dish-details {
    max-width: 94vw;
    max-height: 90vh;
  }

  .dish-name {
    font-size: 1.3em;
  }

  .dish-description {
    max-width: none;
    margin-top: 1em;
    padding: 0;
    font-size: 0.9em;
  }
}
</style>

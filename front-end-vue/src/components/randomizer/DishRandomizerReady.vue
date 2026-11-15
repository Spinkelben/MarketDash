<script setup lang="ts">
defineEmits<{ spin: []; close: [] }>();
</script>

<template>
  <div class="ready-container">
    <p>Ready to discover your next meal? Hit "Surprise Me!" 😋</p>
    <button class="spin-btn" @click="$emit('spin')">🎲 Surprise Me!</button>
    <button class="close-btn" @click="$emit('close')">Close</button>
  </div>
</template>

<style scoped>
.ready-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1em;
}

.spin-btn,
.close-btn {
  border: none;
  border-radius: 8px;
  padding: 0.75em 1.5em;
  cursor: pointer;
  font-size: 1em;
}

.spin-btn {
  background-color: var(--primary-color, #1670d6);
  color: white;
}

.close-btn {
  background-color: var(--secondary-color, #1a1b1d);
  color: white;
}
</style>
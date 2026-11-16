<script setup lang="ts">
import { computed } from 'vue';
import { useTheme } from '../stores/theme';

const { theme, toggle } = useTheme();

const label = computed(() => `Switch to ${theme.value === 'dark' ? 'light' : 'dark'} mode`);
</script>

<template>
  <button type="button" class="theme-toggle" :aria-label="label" :title="label" @click="toggle">
    {{ theme === 'dark' ? '☀️' : '🌙' }}
  </button>
</template>

<style scoped>
.theme-toggle {
  width: 2.4em;
  height: 2.4em;
  padding: 0;
  font-size: 1em;
  line-height: 1;
  background: var(--surface-color);
  border: 1px solid var(--border-color);
  border-radius: 50%;
  cursor: pointer;
  transition: border-color 0.2s;
}

.theme-toggle:hover {
  border-color: var(--primary-color);
}
</style>

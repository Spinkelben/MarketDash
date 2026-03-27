<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  options: string[]
}

const props = defineProps<Props>()
const selected = defineModel<string>();

</script>

<template>
  <div class="dropdown">
    <select v-model="selected" class="dropdown-select" >
      <option v-for="option in props.options" :key="option" :value="option">
        {{ option }}
      </option>
    </select>
  </div>
</template>

<style scoped>
.dropdown {
  margin: 1rem 0;
}

.dropdown-select {
  min-width: 220px;
  padding: 0.5rem 0.7rem;
  border: 1px solid #ccc;
  border-radius: 6px;
  font-size: 1rem;
}
</style>

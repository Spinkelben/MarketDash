<script setup lang="ts">
import { ref } from 'vue'
import HelloWorld from './components/HelloWorld.vue'
import SimpleDropdown from './components/SimpleDropdown.vue'

const options = ['Apple', 'Banana', 'Cherry', 'Date']
const selectedOption = ref('')
</script>

<template>
  <div>
    <a href="https://vite.dev" target="_blank">
      <img src="/vite.svg" class="logo" alt="Vite logo" />
    </a>
    <a href="https://vuejs.org/" target="_blank">
      <img src="./assets/vue.svg" class="logo vue" alt="Vue logo" />
    </a>
  </div>

  <section>
    <h2>Simple Dropdown Example</h2>
    <SimpleDropdown
      v-model="selectedOption"
      :options="options"
    />
    <p>Selected: {{ selectedOption || 'none' }}</p>
  </section>

  <HelloWorld msg="Vite + Vue" />
</template>

<style scoped>
.logo {
  height: 6em;
  padding: 1.5em;
  will-change: filter;
  transition: filter 300ms;
}
.logo:hover {
  filter: drop-shadow(0 0 2em #646cffaa);
}
.logo.vue:hover {
  filter: drop-shadow(0 0 2em #42b883aa);
}
</style>

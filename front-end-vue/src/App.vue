<script setup lang="ts">
import VendorList from './components/VendorList.vue';
import GithubMoveBanner from './components/GithubMoveBanner.vue';
import DaySelector from './components/DaySelector.vue';
import DishRandomizer from './components/randomizer/DishRandomizer.vue';
import { useCatalog } from './stores/catalog';

// Kick off the one-time load of vendors and menus. Not awaited: the page
// renders straight away and components show the catalog's loading state.
void useCatalog().load();
</script>

<template>
  <main>
    <GithubMoveBanner />
    <header>
      <h1>Food Dashboard</h1>
      <div class="header-controls">
        <DaySelector />
        <DishRandomizer />
      </div>
    </header>
    <VendorList />

    <footer>
      Disclaimer: This site is not affiliated with Danske Bank, Food@Danske, PubQ AB, or Compass Group. I am just some nerd who built this site because I wanted to.
    </footer>
  </main>
</template>

<style scoped>
.header-controls {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75em;
  margin-bottom: 1em;
  flex-direction: column;
}
</style>

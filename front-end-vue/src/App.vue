<script setup lang="ts">
import VendorList from './components/VendorList.vue';
import GithubMoveBanner from './components/GithubMoveBanner.vue';
import DaySelector from './components/DaySelector.vue';
import DishFilter from './components/DishFilter.vue';
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
        <div class="primary-controls">
          <DaySelector />
          <DishRandomizer />
        </div>
        <DishFilter />
      </div>
    </header>
    <VendorList />

    <footer>
      Disclaimer: This site is not affiliated with Danske Bank, Food@Danske, PubQ AB, or Compass Group. I am just some nerd who built this site because I wanted to.
    </footer>
  </main>
</template>

<style scoped>
/* One panel for everything that controls the list below it, styled like the vendor cards. */
.header-controls {
  display: flex;
  flex-direction: column;
  gap: 0.9em;
  /* Keeps the panel from growing wider than the list when the allergens open. */
  max-width: 34em;
  margin: 0 auto;
  padding: 1em;
  background: var(--accent-color);
  border-radius: 10px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.primary-controls {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 0.75em;
}
</style>

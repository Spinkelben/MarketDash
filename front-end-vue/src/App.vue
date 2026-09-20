<script setup lang="ts">
import { ref } from 'vue';
import VendorList from './components/VendorList.vue'
import LoadingSpinner from './components/LoadingSpinner.vue';
import GithubMoveBanner from './components/GithubMoveBanner.vue';
import DaySelector from './components/DaySelector.vue';
import ImageCanvas from './components/ImageCanvas.vue';
import { provide } from 'vue';
import { DayManager } from './models/DayManager';
import { dayManagerKey } from './models/injectionKeys';
import { VendorModel } from './models/vendor';
import DishRandomizer from './components/DishRandomizer.vue';

const dayManager = new DayManager();
provide(dayManagerKey, dayManager);

// Keep this setup synchronous so the root component renders immediately.
// Top-level `await` in setup() is not allowed outside a <Suspense> boundary
// and would leave the app blank until the fetch resolves.
const vendors = ref<Vendor[] | null>(null);
(async () => {
  vendors.value = await VendorModel.fetchVendors();
})();

</script>

<template>
  <main>
    <GithubMoveBanner />
    <header>
      <h1>Food Dashboard</h1>
      <div class="header-controls">
        <DaySelector />
        <DishRandomizer :vendors="vendors" />
      </div>
    </header>
    <Suspense>
      <template #default>
        <VendorList />
      </template>
      <template #fallback>
        <LoadingSpinner />
      </template>
    </Suspense>

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

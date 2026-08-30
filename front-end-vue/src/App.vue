<script setup lang="ts">
import VendorList from './components/VendorList.vue'
import LoadingSpinner from './components/LoadingSpinner.vue';
import GithubMoveBanner from './components/GithubMoveBanner.vue';
import DaySelector from './components/DaySelector.vue';
import { provide } from 'vue';
import { DayManager } from './models/DayManager';
import { dayManagerKey } from './models/injectionKeys';

const dayManager = new DayManager();
provide(dayManagerKey, dayManager);

</script>

<template>
  <main>
    <GithubMoveBanner />
    <header>
      <h1>Food Dashboard</h1>
      <DaySelector />
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


</style>

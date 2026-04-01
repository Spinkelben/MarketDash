<script setup lang="ts">
import VendorList from './components/VendorList.vue'
import LoadingSpinner from './components/LoadingSpinner.vue';
import GithubMoveBanner from './components/GithubMoveBanner.vue';

</script>

<template>
  <main>
    <GithubMoveBanner />
    <header>
      <h1>Food Dashboard</h1>
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

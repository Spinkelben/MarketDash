<script setup lang="ts">
import { useCatalog } from '../stores/catalog';
import LoadingSpinner from './LoadingSpinner.vue';
import Vendor from './Vendor.vue';

const { status, error, vendors } = useCatalog();
</script>

<template>
  <p v-if="status === 'error'" class="vendors-error">Unable to load vendors: {{ error }}</p>
  <div v-else-if="status === 'ready'" class="food-table">
    <Vendor v-for="vendor in vendors" :key="vendor.routeName" :vendor="vendor" />
  </div>
  <LoadingSpinner v-else />
</template>

<style scoped>
.food-table {
    margin-left: auto;
    margin-right: auto;
    display: flex;
    flex-direction: column;
    /* margin-bottom: 1em; */
    gap: 1em;
}
</style>
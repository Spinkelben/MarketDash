<script setup lang="ts">
import { VendorModel } from '../models';
import Vendor from "./Vendor.vue";
const vendors = await VendorModel.fetchVendors();

</script>

<template>
  <div class="food-table">
    <div v-for="vendor in vendors" :key="vendor.routeName">
      <Vendor :vendor="vendor" />
    </div>
  </div>
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
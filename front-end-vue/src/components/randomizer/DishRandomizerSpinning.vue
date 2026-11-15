<script setup lang="ts">
import type { VendorDish } from '../../types';
import CoverImage from '../CoverImage.vue';

defineProps<{ pick: VendorDish }>();
</script>

<template>
  <div class="spinning-dish">
    <CoverImage :src="pick.vendor.imageUrl" :size="60" class="spinning-vendor-img" />

    <h3 class="spinning-dish-name">{{ pick.dish.name }}</h3>

    <CoverImage :src="pick.dish.imageUrl" :size="150" class="spinning-dish-img" />
  </div>
</template>

<style scoped>
.spinning-dish {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1em;
  min-height: 300px;
}

.spinning-vendor-img {
  border-radius: 10px;
}

.spinning-dish-name {
  font-size: 1.2em;
  margin: 0;
  min-height: 1.8em;
}

.spinning-dish-img {
  border-radius: 15px;
}
</style>
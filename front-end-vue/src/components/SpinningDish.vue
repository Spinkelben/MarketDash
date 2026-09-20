<script setup lang="ts">
import type { DishData } from '../models/DishData';
import ImageCanvas from './ImageCanvas.vue';

interface Props {
  dish?: DishData | null;
}

const props = withDefaults(defineProps<Props>(), {
  dish: () => null
});
</script>

<template>
  <div class="spinning-dish">
    <ImageCanvas
      v-if="dish?.vendor.imageUrl"
      :image-url="dish.vendor.imageUrl"
      :width="60"
      :height="60"
      fallback-color="#ccc"
      class="spinning-vendor-canvas"
    />

    <h3 v-if="dish?.dish.name || dish?.dish.Name" class="spinning-dish-name">
      {{ dish?.dish.name ?? dish?.dish.Name ?? 'Selecting...' }}
    </h3>

    <ImageCanvas
      v-if="dish?.dish.imageUrl || dish?.dish.ImageUrl"
      :image-url="dish?.dish.imageUrl ?? dish?.dish.ImageUrl ?? ''"
      :width="150"
      :height="150"
      fallback-color="#ddd"
      class="spinning-dish-canvas"
    />
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

.spinning-vendor-canvas {
  border-radius: 10px;
}

.spinning-dish-name {
  font-size: 1.2em;
  margin: 0;
  min-height: 1.8em;
}

.spinning-dish-canvas {
  border-radius: 15px;
}
</style>
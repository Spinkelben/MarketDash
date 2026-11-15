<script setup lang="ts">
import { ref, watch } from 'vue';

/**
 * A square image that crops to fill its box, with a placeholder when there is
 * no image or it fails to load.
 */
const props = defineProps<{
  src: string;
  /** Width and height in pixels. */
  size: number;
}>();

const failed = ref(false);
watch(
  () => props.src,
  () => {
    failed.value = false;
  },
);
</script>

<template>
  <img
    v-if="src && !failed"
    class="cover-image"
    :src="src"
    :width="size"
    :height="size"
    alt=""
    @error="failed = true"
  />
  <div v-else class="cover-image placeholder" :style="{ width: `${size}px`, height: `${size}px` }">🍽️</div>
</template>

<style scoped>
.cover-image {
  display: block;
  object-fit: cover;
}

.placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #ddd;
  font-size: 18px;
}
</style>

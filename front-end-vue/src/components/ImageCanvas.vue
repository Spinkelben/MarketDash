<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import { drawToCanvas, imageCacheVersion } from '../util/canvas';

interface Props {
  imageUrl: string;
  width: number;
  height: number;
  fallbackColor?: string;
  class?: string;
}

const props = withDefaults(defineProps<Props>(), {
  fallbackColor: '#ddd'
});

const imgCanvasRef = ref<HTMLCanvasElement | null>(null);

function draw() {
  if (imgCanvasRef.value) {
    drawToCanvas(imgCanvasRef.value, props.imageUrl, props.width, props.height, props.fallbackColor);
  }
}

onMounted(draw);
watch(
  () => [props.imageUrl, props.width, props.height, props.fallbackColor, imageCacheVersion.value],
  () => draw(),
  { immediate: true }
);
</script>

<template>
  <canvas
    ref="imgCanvasRef"
    :class="['img-canvas', props.class]"
    :width="props.width"
    :height="props.height"
  >
  </canvas>
</template>

<style scoped>
.img-canvas {
  object-fit: cover;
  display: block;
}
</style>

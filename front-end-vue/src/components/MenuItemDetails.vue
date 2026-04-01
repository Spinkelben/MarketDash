<script setup lang="ts">
import type { Product } from '../models';

interface Props {
  item: Product
}

const props = defineProps<Props>()
</script>

<template>
    <dialog class="menu-item-details">
        <h1 class="item-name">{{ item.Name }}</h1>
        <img class="menu-img-big" :src="item.ImageUrl" alt="Menu Item Image" /> 
        <br>
        <p class="menu-item-description" >{{ item.Description }}</p>
        <button autofocus>Close</button> 
    </dialog>
</template>

<style scoped>

</style>
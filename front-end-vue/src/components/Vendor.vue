<script setup lang="ts">
import type { Vendor } from "../models";
import Menu from "./Menu.vue";
interface Props {
  vendor: Vendor
}

const props = defineProps<Props>()
</script>

<template>
  <section class="vendor">
    <span class="vendor-header">
      <img :src="props.vendor.imageUrl" alt="Vendor Logo" class="vendor-img" />
      <h2 class="vendor-name">{{ props.vendor.name }}</h2>
    </span>
    <Suspense>
      <template #default>
        <Menu :venderRoute="props.vendor.routeName" :timeslots="props.vendor.timeslots" />
      </template>
      <template #fallback>
        <p>Loading menu...</p>
      </template>
    </Suspense>
  </section>
</template>

<style scoped>
.vendor {
    animation: fadeIn 1s ease-in-out;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    background: var(--accent-color);
    padding: 1em;
    display: flex;
    flex-direction: column;
    gap: .5em;
    border-radius: 10px;
}

.vendor-img {
    max-width: 50px;
    max-height: 50px;
    object-fit: contain;
    vertical-align: middle;
    animation: fadeIn 1s ease-in-out;
    border-radius: 10px;
}

.vendor-header {
    display: flex;
    justify-content: left;
    align-items: center;
    gap: .25em;
}

.vendor-header h2 {
    margin: 0;
}


@keyframes fadeIn { 
    from { opacity: 0; } 
    to { opacity: 1; } 
}



</style>
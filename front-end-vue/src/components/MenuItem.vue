<script setup lang="ts">
import { ref } from 'vue';
import type { Product } from '../models';
import MenuItemDetails from './MenuItemDetails.vue';

interface Props {
  item: Product,
}

const props = defineProps<Props>()
const showDetails = ref(false);
</script>

<template >
    <dt class="menu-item-header" @click="showDetails = true" >
        <img :src="props.item.ImageUrl" alt="Menu Item Image" class="menu-img-small" />
        <h3 class="item-name">{{ props.item.Name }}</h3>
    </dt>
    <MenuItemDetails :item="props.item" v-model="showDetails" />
    <dd>

    </dd>
</template>

<style scoped>
.menu-item-header {
    display: flex;
    justify-content: left;
    align-items: center;
    gap: .25em;
    cursor: pointer;
}

.menu-img-small {
    width: 50px;
    max-height: 50px;
    object-fit: contain;
    vertical-align: middle;
    margin-right: 0.5em; /* Add some space to prevent overlap */
    animation: fadeIn 1s ease-in-out;
    border-radius: 10px;
}

.menu-img-big {
    max-width: 75vw;
    min-width: 50vw;
    max-height: 30vh;
    object-fit: contain;
    margin: 0 auto;
    display: block;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    border-radius: 10px;
}

.menu-item-description {
    white-space: pre-wrap;
    display: block;
    max-width: 50vw;
    margin-top: 0.5em;
}

.menu-item-details {
    background-color: var(--accent-color);
    border-radius: 10px;
}

</style>
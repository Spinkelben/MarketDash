<script setup lang="ts">
import { ref } from 'vue';
import type { Product } from '../models';
import MenuItemDetails from './MenuItemDetails.vue';
import TimeSlotList from './TimeSlotList.vue';

interface Props {
  item: Product,
  timeslots?: boolean;
}

const props = defineProps<Props>()
const showDetails = ref(false);
</script>

<template >
    <Suspense>
        <template #default>
            <div>
                <dt class="menu-item-header" @click="showDetails = true" >
                    <img :src="props.item.ImageUrl" alt="Menu Item Image" class="menu-img-small" v-if="props.item.ImageUrl" />
                    <h3 class="item-name">{{ props.item.Name }}</h3>
                </dt>
                <MenuItemDetails :item="props.item" v-model="showDetails" />
                <Suspense>
                    <template #default>
                        <TimeSlotList :item="props.item" v-if="props.timeslots" />
                    </template>
                    <template #fallback>
                        <p>Loading timeslots... <span class="spinner">⏰</span></p>
                    </template>
                </Suspense>
            </div>
        </template>
        <template #fallback>
            <dt class="menu-item-header">
                <p>Loading menu item... <span class="spinner">🍴</span></p>
            </dt>
        </template>
    </Suspense>
</template>

<style scoped>
.spinner {
    transform-origin: center;
    animation: spin 1s linear infinite;
    display: flex;
    justify-content: center;
}

@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(-360deg); }
}


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



</style>
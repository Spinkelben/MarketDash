<script setup lang="ts">
import { ref } from 'vue';
import { useDishTimeslots } from '../composables/useDishTimeslots';
import type { Dish } from '../types';
import DishDetailsDialog from './DishDetailsDialog.vue';
import TimeSlotList from './TimeSlotList.vue';

const props = defineProps<{
  item: Dish;
  /** Whether the vendor offers timeslots; when false none are loaded or shown. */
  timeslots?: boolean;
}>();

const showDetails = ref(false);
const { timeslots: slots, loading } = useDishTimeslots(() => (props.timeslots ? props.item : null));
</script>

<template>
  <div>
    <dt class="menu-item-header" @click="showDetails = true">
      <img v-if="item.imageUrl" :src="item.imageUrl" alt="Menu Item Image" class="menu-img-small" />
      <h3 class="item-name">{{ item.name }}</h3>
    </dt>
    <DishDetailsDialog v-model:open="showDetails" :dish="item" />
    <TimeSlotList v-if="timeslots" :timeslots="slots" :loading="loading" />
  </div>
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

</style>
<script setup lang="ts">
import { computed, ref } from 'vue';
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
// The vendor's short note on the dish ("VEGAN", "Halal - Spicy"). Some vendors
// just repeat the name there, which is not worth showing twice.
const tagline = computed(() => {
  const text = props.item.description.trim();
  return text.toLowerCase() === props.item.name.trim().toLowerCase() ? '' : text;
});
const { timeslots: slots, loading } = useDishTimeslots(() => (props.timeslots ? props.item : null));
</script>

<template>
  <div>
    <dt class="menu-item-header" @click="showDetails = true">
      <img v-if="item.imageUrl" :src="item.imageUrl" alt="Menu Item Image" class="menu-img-small" />
      <span class="item-text">
        <h3 class="item-name">{{ item.name }}</h3>
        <span v-if="tagline" class="item-tagline">{{ tagline }}</span>
      </span>
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

/* The name and the tagline flow as one piece of text, so the tagline follows
   the name's last word instead of dropping to a line of its own. */
.item-text {
    min-width: 0;
}

.item-tagline {
    margin-left: .6em;
    font-size: 0.75em;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    opacity: 0.7;
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

@media (max-width: 600px) {
    .item-name {
        font-size: 1.05em;
    }

    .menu-img-small {
        width: 40px;
        max-height: 40px;
    }
}
</style>
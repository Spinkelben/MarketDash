<script setup lang="ts">
import { computed } from 'vue';
import { useCatalog } from '../stores/catalog';
import { useFilters } from '../stores/filters';
import MenuItem from './MenuItem.vue';

const props = defineProps<{
  vendorRoute: string;
  /** Whether timeslots are available for this vendor. */
  timeslots?: boolean;
}>();

const { menus } = useCatalog();
const menu = computed(() => menus[props.vendorRoute]);

const { matches } = useFilters();
/** The dishes that pass the user's filters. */
const shownDishes = computed(() => (menu.value?.dishes ?? []).filter(matches));
</script>

<template>
  <div class="menu">
    <p v-if="!menu || menu.status === 'loading'">Loading menu...</p>
    <p v-else-if="menu.status === 'error'" class="menu-error">
      Unable to load menu: {{ menu.error }}
    </p>
    <p v-else-if="menu.dishes.length === 0">No menu items available.</p>
    <p v-else-if="shownDishes.length === 0" class="menu-filtered">No dishes match your filters.</p>
    <dl v-else class="menu-item-list">
      <MenuItem
        v-for="dish in shownDishes"
        :key="dish.id"
        :item="dish"
        :timeslots="timeslots"
      />
    </dl>
  </div>
</template>

<style scoped>
.menu-item-list {
    display: flex;
    flex-direction: column;
    margin: 0;
}

.menu-filtered {
    margin: 0;
    opacity: 0.6;
    font-size: 0.9em;
}

.menu-error {
    color: #c00;
    margin: 0 0 1em;
}
</style>
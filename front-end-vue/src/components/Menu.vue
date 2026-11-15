<script setup lang="ts">
import { computed } from 'vue';
import { useCatalog } from '../stores/catalog';
import MenuItem from './MenuItem.vue';

const props = defineProps<{
  vendorRoute: string;
  /** Whether timeslots are available for this vendor. */
  timeslots?: boolean;
}>();

const { menus } = useCatalog();
const menu = computed(() => menus[props.vendorRoute]);
</script>

<template>
  <div class="menu">
    <p v-if="!menu || menu.status === 'loading'">Loading menu...</p>
    <p v-else-if="menu.status === 'error'" class="menu-error">
      Unable to load menu: {{ menu.error }}
    </p>
    <p v-else-if="menu.dishes.length === 0">No menu items available.</p>
    <dl v-else class="menu-item-list">
      <MenuItem
        v-for="dish in menu.dishes"
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

.menu-error {
    color: #c00;
    margin: 0 0 1em;
}
</style>
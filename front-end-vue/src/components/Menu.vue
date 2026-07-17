<script setup lang="ts">
import { computed, ref } from "vue";
import type { Category, Product } from "../models";
import { MenuModel } from "../models";
import MenuItem from "./MenuItem.vue";

interface Props {
  venderRoute: string;
}

const props = defineProps<Props>();
const categories = ref<Category[]>([]);
const fetchError = ref<string | null>(null);

try {
    categories.value = await MenuModel.fetchMenu(props.venderRoute);
} catch (error) {
    fetchError.value = error instanceof Error ? error.message : String(error ?? "Unknown error");
}

const menuItems = computed<Product[]>(() => categories.value.flatMap((category) => category.items ?? []));

</script>

<template>
  <div class="menu">
    <p v-if="fetchError" class="menu-error">
      Unable to load menu: {{ fetchError }}
    </p>
    <p v-else-if="menuItems.length === 0">No menu items available.</p>
    <dl v-else class="menu-item-list">
      <MenuItem
        v-for="item in menuItems"
        :item="item"
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
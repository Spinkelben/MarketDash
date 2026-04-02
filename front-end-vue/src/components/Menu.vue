<script setup lang="ts">
import { ref } from "vue";
import { MenuModel } from "../models";
import MenuItem from "./MenuItem.vue";

interface Props {
  venderRoute: string
}

const props = defineProps<Props>()
const categories = await MenuModel.fetchMenu(props.venderRoute);
const menuItems = categories.flatMap(category => Object.values(category.items || []));

</script>

<template>
    <dl class="menu-item-list">
        <MenuItem v-for="item in menuItems" :item="item" />
    </dl>
</template>

<style scoped>

.menu-item-list {
    display: flex;
    flex-direction: column;
    margin: 0;
}

</style>
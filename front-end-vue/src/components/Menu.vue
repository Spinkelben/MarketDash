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
const showDetails = ref(false);

</script>

<template>
    <dl class="menu-item-list">
        <dt v-for="item in menuItems" class="menu-item-header" @click="() => console.log('Clicked item:', item)">
            <MenuItem :item="item" :show-details="showDetails" />
        </dt>
    </dl>
</template>

<style scoped>

.menu-item-list {
    display: flex;
    flex-direction: column;
    margin: 0;
}

.menu-item-header {
    display: flex;
    justify-content: left;
    align-items: center;
    gap: .25em;
    cursor: pointer;
}


</style>
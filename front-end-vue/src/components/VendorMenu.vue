<script setup lang="ts">
import { MenuModel } from "../models";

interface Props {
  route: string 
}

const props = defineProps<Props>()
const categories = await MenuModel.fetchMenu(props.route);
</script>

<template>
  <div class="vendor-menu">
    <ul>
      <li v-for="category in categories" :key="category.key">
        <div v-if="category.items">
          <h3>{{ category.name }}</h3>
          <ul>
            <li v-for="item in category.items" :key="item.key">
              <img :src="item.ImageUrl" alt="Menu Item Image" class="menu-item-image" />
              <p>{{ item.Name }} - {{ item.basePrice / 100 }} kr.</p>
            </li>
          </ul>
        </div>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.vendor-menu {
  padding: 20px;
}
.menu-item-image {
  width: 100px;
  height: 100px;
  object-fit: cover;
}
</style>

<script setup lang="ts">
import { ref } from 'vue';
import type { Timeslot, VendorDish } from '../../types';
import DishDetailsDialog from '../DishDetailsDialog.vue';
import CoverImage from '../CoverImage.vue';
import TimeSlotList from '../TimeSlotList.vue';

defineProps<{
  pick: VendorDish;
  /** The day the timeslots are for, e.g. "TOMORROW". */
  day: string | null;
  timeslots: Timeslot[];
  timeslotsLoading?: boolean;
}>();

defineEmits<{ reroll: []; close: [] }>();

const showDetails = ref(false);
</script>

<template>
  <div class="result-container">
    <div class="result-dish">
      <h3>🍽️ Perfect! Here's your suggestion:</h3>
      <div class="result-vendor">
        <CoverImage :src="pick.vendor.imageUrl" :size="60" class="result-vendor-img" />
        <span class="result-vendor-name">{{ pick.vendor.name }}</span>
      </div>
      <h4 class="result-dish-name">{{ pick.dish.name }}</h4>

      <CoverImage :src="pick.dish.imageUrl" :size="150" class="result-dish-img" @click="showDetails = true" />

      <DishDetailsDialog v-model:open="showDetails" :dish="pick.dish" />

      <div class="result-timeslots">
        <h4>⏰ Available {{ day ?? 'today' }}:</h4>
        <TimeSlotList
          :timeslots="timeslots"
          :loading="timeslotsLoading"
          variant="result"
          empty-text="No times available..."
        />
      </div>
    </div>
    <div class="button-group">
      <button class="reroll-btn" @click="$emit('reroll')">🔄 Reroll</button>
      <button class="close-btn" @click="$emit('close')">Close</button>
    </div>
  </div>
</template>

<style scoped>
.result-container {
  min-height: 300px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1em;
}

.result-dish {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1em;
}

.result-dish h3 {
  margin: 0;
  color: var(--enabled-color, #197d07);
  font-size: 1em;
  font-family: Arial, Helvetica, sans-serif;
}

.result-vendor {
  display: flex;
  align-items: center;
  gap: 0.5em;
  background-color: var(--accent-color, #dee5f2);
  padding: 0.5em 1em;
  border-radius: 10px;
}

.result-vendor-name {
  font-weight: bold;
  color: var(--font-color, #1a1b1d);
  font-family: Verdana, Geneva, Tahoma, sans-serif;
}

.result-dish-name {
  font-size: 1.3em;
  margin: 0;
  color: var(--primary-color, #1670d6);
  font-family: Arial, Helvetica, sans-serif;
}

.result-dish-img {
  width: 150px;
  height: 150px;
  object-fit: cover;
  border-radius: 15px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  cursor: pointer;
}

.result-timeslots {
  margin-top: 1em;
  text-align: center;
}

.result-timeslots h4 {
  margin: 0 0 0.5em 0;
  color: var(--font-color, #1a1b1d);
  font-size: 1em;
  font-family: Arial, Helvetica, sans-serif;
}

.close-btn {
  padding: 0.75em 1.5em;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1em;
  font-family: Verdana, Geneva, Tahoma, sans-serif;
  transition: all 0.3s ease;
  background-color: var(--secondary-color, #1a1b1d);
  color: white;
}

.close-btn:hover {
  background-color: #333;
}

.button-group {
  display: flex;
  gap: 1em;
  justify-content: center;
}

.reroll-btn {
  padding: 0.75em 1.5em;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1em;
  font-family: Verdana, Geneva, Tahoma, sans-serif;
  transition: all 0.3s ease;
  background-color: var(--primary-color, #1670d6);
  color: white;
}

.reroll-btn:hover {
  background-color: #1456b8;
}
</style>
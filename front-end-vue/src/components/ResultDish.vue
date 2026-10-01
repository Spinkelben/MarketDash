<script setup lang="ts">
import { inject, ref, watch, computed } from 'vue';
import type { DishData, Timeslot, Vendor, Product } from '../models';
import { TimeslotModel } from '../models';
import type { TimeslotResponse, TimeslotRequest } from '../models';
import { dayManagerKey } from '../models/injectionKeys';
import type { DayManager } from '../models/DayManager';
import ImageCanvas from './ImageCanvas.vue';
import MenuItemDetails from './MenuItemDetails.vue';
import TimeSlotList from './TimeSlotList.vue';

interface Props {
  dish: DishData;
}

const props = withDefaults(defineProps<Props>(), {});

const emit = defineEmits<{ close: void; reroll: void }>();

const dayManager = inject<DayManager>(dayManagerKey);

const availabilityHeading = computed(() => {
  const day = dayManager?.selectedDay.value;
  if (day) {
    return `⏰ Available ${day}:`;
  }
  return '⏰ Available today:';
});

// Match the legacy JS logic: parse the ISO timestamp and render it as HH:mm.
function formatTime(timeslot: Timeslot) {
  const rawDate = timeslot.dateISO || new Date(timeslot.date).toISOString();
  const parsedDate = Date.parse(rawDate);

  return new Intl.DateTimeFormat('da-dk', { hour: 'numeric', minute: 'numeric' }).format(parsedDate);
}

const displayedTimeslots = ref<Timeslot[]>([]);
const isLoadingTimeslots = ref(true);
const isDishDetailsOpen = ref(false);

// Trigger the async timeslots fetch whenever the dish prop changes
watch(() => props.dish, async () => {
  await displayTimeslots(props.dish);
}, { immediate: true });

// Fetch and render timeslots for the selected dish on the selected day.
async function displayTimeslots(selectedDish: DishData) {
  const selectedDay = dayManager?.selectedDay.value ?? null;

  const request: TimeslotRequest = {
    routeName: selectedDish.vendor.routeName,
    products: [{
      bongCategoryId: 0,
      quantity: 1,
      productId: selectedDish.dish.key || selectedDish.dish.Name,
      productName: selectedDish.dish.Name,
    }],
  };

  isLoadingTimeslots.value = true;

  try {
    const timeslotsResponse = await TimeslotModel.fetchTimeslots(request);
    if (selectedDay) {
      const day = timeslotsResponse.find(t => t.label === selectedDay);
      if (day?.timeslots) {
        day.timeslots.sort((a, b) => Date.parse(a.dateISO || new Date(a.date).toISOString()) - Date.parse(b.dateISO || new Date(b.date).toISOString()));
        displayedTimeslots.value = day.timeslots;
      } else {
        displayedTimeslots.value = [];
      }
    } else {
      displayedTimeslots.value = [];
    }
  } catch (error) {
    console.error('Failed to fetch timeslots', error);
    displayedTimeslots.value = [];
  } finally {
    isLoadingTimeslots.value = false;
  }
}
</script>

<template>
  <div class="result-container">
    <div class="result-dish">
      <h3>🍽️ Perfect! Here's your suggestion:</h3>
      <div class="result-vendor">
        <ImageCanvas
          :image-url="dish.vendor.imageUrl || ''"
          :width="60"
          :height="60"
          fallback-color="#ccc"
          class="result-vendor-canvas"
        />
        <span class="result-vendor-name">{{ dish.vendor.name }}</span>
      </div>
      <h4 class="result-dish-name">{{ dish.dish.Name }}</h4>

      <ImageCanvas
        :image-url="dish.dish.imageUrl || ''"
        :width="150"
        :height="150"
        fallback-color="#ddd"
        class="result-dish-canvas clickable"
        @click="isDishDetailsOpen = true"
      />

      <MenuItemDetails
        v-if="dish"
        v-model="isDishDetailsOpen"
        :name="dish.dish.Name"
        :image-url="dish.dish.imageUrl || ''"
        :description="dish.dish.DescriptionLong"
        dialog-class="result-dish-details"
      />

      <div class="result-timeslots">
        <h4>{{ availabilityHeading }}</h4>
        <TimeSlotList
          :timeslots="displayedTimeslots"
          :loading="isLoadingTimeslots"
          variant="result"
          empty-text="No times available..."
        />
      </div>
    </div>
    <div class="button-group">
      <button @click="$emit('reroll')" class="reroll-btn">🔄 Reroll</button>
      <button @click="$emit('close')" class="close-btn">Close</button>
    </div>
    </div >
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

.result-dish-canvas {
  width: 150px;
  height: 150px;
  object-fit: cover;
  border-radius: 15px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  cursor: pointer;
}

.clickable {
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

.result-timeslots-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5em;
  justify-content: center;
}

.result-timeslot {
  padding: 0.3em 0.6em;
  border-radius: 6px;
  font-size: 0.9em;
  font-weight: bold;
  font-family: Verdana, Geneva, Tahoma, sans-serif;
}

.result-timeslot.enabled {
  background-color: var(--enabled-color, #197d07);
  color: white;
}

.result-timeslot.disabled {
  background-color: var(--disabled-color, #f75340);
  color: white;
}

.no-times {
  color: #666;
  font-style: italic;
  font-family: Verdana, Geneva, Tahoma, sans-serif;
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
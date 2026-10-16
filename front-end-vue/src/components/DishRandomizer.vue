<script setup lang="ts">
import { ref } from 'vue';
import { MenuModel } from '../models/menu';
import { preloadImages } from '../util/canvas';
import ReadyView from './ReadyView.vue';
import SpinningDish from './SpinningDish.vue';
import ResultDish from './ResultDish.vue';
import type { Vendor } from '../models/vendor';
import type { DishData } from '../models/DishData';

interface Props {
  vendors: Vendor[] | null;
}

const props = withDefaults(defineProps<Props>(), { vendors: () => [] });
const emit = defineEmits<{ close: void }>();

const currentSpinningDish = ref<DishData | null>(null);
const isSpinning = ref(false);
const selectedDish = ref<DishData | null>(null);
const seenDishIds = ref<Set<string>>(new Set());
const isShowingAllSeenMessage = ref(false);
const isLoadingOptions = ref(false);
let cachedDishes: DishData[] = [];

const resetDialog = () => {
  isSpinning.value = false;
  selectedDish.value = null;
  currentSpinningDish.value = null;
  isLoadingOptions.value = false;
  seenDishIds.value.clear();
};

const openModal = async () => {
  resetDialog();
  const dialog = document.querySelector('.random-dish-modal') as HTMLDialogElement | null;
  dialog?.showModal();

  isLoadingOptions.value = true;
  cachedDishes = await getAllDishes();
  isLoadingOptions.value = false;

  if (!cachedDishes.length) {
    alert('Oops! No dishes are available right now. Please try again later.');
    dialog?.close();
    return;
  }

  await preloadImages(cachedDishes);
};

const closeModal = () => {
  const dialog = document.querySelector('.random-dish-modal') as HTMLDialogElement | null;
  dialog?.close();
  resetDialog();
};

const handleReroll = async () => {
  selectedDish.value = null;

  const availableDishes = cachedDishes.filter(d => !seenDishIds.value.has(d.dish.key || d.dish.Name));

  if (availableDishes.length === 0) {
    isShowingAllSeenMessage.value = true;
    
    // Wait for 2 seconds to show the message
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    seenDishIds.value.clear();
    isShowingAllSeenMessage.value = false;
    await spin(1000, cachedDishes);
  } else {
    await spin(1000, availableDishes);
  }
};

const getAllDishes = async (): Promise<DishData[]> => {
  const allDishes: DishData[] = [];
  if (!props.vendors || props.vendors.length === 0) return allDishes;

  for (const vendor of props.vendors) {
    if (!vendor.visible) continue;

    try {
      const categories = await MenuModel.fetchMenu(vendor.routeName);
      for (const category of categories) {
        const items = category.items ?? [];
        for (const item of items) {
          if (!item.enabled || !item.key) continue;
          allDishes.push({
            vendor,
            dish: {
              ...item,
              name: item.name ?? item.Name,
              description: item.description ?? item.Description,
              descriptionLong: item.descriptionLong ?? item.DescriptionLong,
              imageUrl: item.imageUrl ?? item.ImageUrl,
              id: item.id ?? item.key,
            }
          });
        }
      }
    } catch (error) {
      console.error(`Failed to fetch menu for vendor ${vendor.routeName}`, error);
    }
  }

  return allDishes;
};

const spin = async (duration: number = 3000, dishesToUse: DishData[] | null = null) => {
  if (isSpinning.value || isLoadingOptions.value) return;

  let dishes: DishData[];
  if (dishesToUse) {
    dishes = dishesToUse;
  } else {
    dishes = cachedDishes.length ? cachedDishes : await getAllDishes();
    if (dishes.length > 0) {
      cachedDishes = dishes;
    }
  }

  if (!dishes.length) {
    alert('Oops! No dishes are available right now. Please try again later.');
    return;
  }

  try {
    await preloadImages(dishes);
    const selected = await startSpinning(dishes, duration);
    
    // Track the seen dish
    seenDishIds.value.add(selected.dish.key || selected.dish.Name);

    setTimeout(() => {
      isSpinning.value = false;
      currentSpinningDish.value = null;
      selectedDish.value = selected;
    }, 100);
  } catch (error) {
    console.error('Error during dish selection:', error);
  }
};

const startSpinning = async (dishes: DishData[], duration: number = 3000): Promise<DishData> => {
  isSpinning.value = true;
  currentSpinningDish.value = dishes[0];

  const spinDuration = duration;
  const spinInterval = 100;
  const totalSteps = Math.ceil(spinDuration / spinInterval);
  let currentStep = 0;

  return new Promise<DishData>((resolve) => {
    const intervalId = setInterval(() => {
      const randomIndex = Math.floor(Math.random() * dishes.length);
      currentSpinningDish.value = dishes[randomIndex];

      currentStep++;
      if (currentStep >= totalSteps) {
        clearInterval(intervalId);
        const finalIndex = Math.floor(Math.random() * dishes.length);
        resolve(dishes[finalIndex]);
      }
    }, spinInterval);
  });
};
</script>

<template>
  <button @click="openModal" class="random-dish-btn">🎲 Can't decide? Let me help you choose!</button>

  <dialog class="random-dish-modal" @click.self="closeModal">
    <div class="random-dish-content">
      <div v-if="isLoadingOptions" class="loading-overlay">
        <div class="loading-spinner" aria-label="Loading dishes"></div>
        <p>Loading delicious options...</p>
      </div>

      <div v-else-if="isShowingAllSeenMessage" class="fun-message-overlay">
        <div class="fun-message-content">
          <div class="fun-emoji">🎉</div>
          <p>You've seen them all!</p>
          <p class="sub-message">Let's start fresh! 🎲</p>
        </div>
      </div>

      <ReadyView
        v-else-if="!selectedDish && !currentSpinningDish"
        :dish="currentSpinningDish"
        spin-btn-text="Surprise Me!"
        @spin="spin"
        @close="closeModal"
      />

      <SpinningDish v-else-if="currentSpinningDish && selectedDish === null" :dish="currentSpinningDish" />

      <ResultDish v-else-if="selectedDish !== null" :dish="selectedDish" @close="closeModal" @reroll="handleReroll" />
    </div>
  </dialog>
</template>

<style scoped>
.random-dish-modal {
  border: none;
  border-radius: 15px;
  padding: 0;
  max-width: 500px;
  width: 90%;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
}

.random-dish-modal::backdrop {
  background-color: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(3px);
}

.random-dish-content {
  padding: 2em;
  text-align: center;
  background-color: var(--bg-color, #f9f9f9);
  border-radius: 15px;
  position: relative;
  min-height: 140px;
}

.loading-overlay {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75em;
  min-height: 140px;
}

.loading-spinner {
  width: 32px;
  height: 32px;
  border: 4px solid rgba(22, 112, 214, 0.2);
  border-top-color: var(--primary-color, #1670d6);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.fun-message-overlay {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 140px;
}

.fun-message-content {
  text-align: center;
}

.fun-emoji {
  font-size: 3em;
  margin-bottom: 0.5em;
}

.fun-message-content p {
  margin: 0;
  font-size: 1.2em;
  font-weight: bold;
  color: var(--primary-color, #1670d6);
}

.fun-message-content .sub-message {
  font-size: 1em;
  font-weight: normal;
  color: var(--font-color, #1a1b1d);
  margin-top: 0.5em;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.random-dish-btn {
  background-color: var(--primary-color, #1670d6);
  color: white;
  border: none;
  padding: 0.5em 1em;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1em;
  transition: background-color 0.3s ease;
  margin-bottom: 1em;
}

.random-dish-btn:hover {
  background-color: #1456b8;
}
</style>
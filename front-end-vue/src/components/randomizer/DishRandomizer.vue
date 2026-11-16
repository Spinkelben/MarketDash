<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useDishRandomizer } from '../../composables/useDishRandomizer';
import { useDishTimeslots } from '../../composables/useDishTimeslots';
import { useCatalog } from '../../stores/catalog';
import { useFilters } from '../../stores/filters';
import { useTimeslots } from '../../stores/timeslots';
import { preloadImages } from '../../lib/images';
import BaseDialog from '../BaseDialog.vue';
import DishRandomizerReady from './DishRandomizerReady.vue';
import DishRandomizerResult from './DishRandomizerResult.vue';
import DishRandomizerSpinning from './DishRandomizerSpinning.vue';

// This component is the randomizer's container: it connects the stores and the
// state machine to the views below, which only take props and emit events.
const catalog = useCatalog();
const filters = useFilters();
/** The dishes to choose from: the ones that pass the user's filters. */
const dishes = computed(() => catalog.availableDishes.value.filter(({ dish }) => filters.matches(dish)));
const { state, spin, reroll, reset } = useDishRandomizer(dishes);

const isOpen = ref(false);
/** True once the dishes and their images have been loaded for the first time. */
const prepared = ref(false);
const hasDishes = computed(() => dishes.value.length > 0);

// Both calls are no-ops when their work is already done, so reopening the
// dialog goes straight to the ready view.
async function prepare() {
  await catalog.load();
  await preloadImages(
    catalog.availableDishes.value.flatMap(({ vendor, dish }) => [vendor.imageUrl, dish.imageUrl]),
  );
  prepared.value = true;
}

watch(isOpen, (open) => {
  if (open) void prepare();
  else reset();
});

// Timeslots for the picked dish. The menu list has normally loaded them
// already, in which case they come from the store without a request.
const { selectedDay } = useTimeslots();
const { timeslots, loading: timeslotsLoading } = useDishTimeslots(() =>
  state.value.phase === 'result' ? state.value.pick.dish : null,
);
</script>

<template>
  <button class="random-dish-btn" @click="isOpen = true">🎲 Can't decide? Let me help you choose!</button>

  <BaseDialog v-model:open="isOpen" class="random-dish-modal">
    <div class="random-dish-content">
      <div v-if="!prepared" class="loading-overlay">
        <div class="loading-spinner" aria-label="Loading dishes"></div>
        <p>Loading delicious options...</p>
      </div>

      <div v-else-if="!hasDishes" class="error-overlay">
        <div class="error-emoji" aria-hidden="true">😕</div>
        <p v-if="filters.isActive.value">No available dishes match your filters.</p>
        <p v-else>Oops! No dishes are available right now. Please try again later.</p>
        <button class="close-btn" @click="isOpen = false">Close</button>
      </div>

      <DishRandomizerReady v-else-if="state.phase === 'ready'" @spin="spin()" @close="isOpen = false" />

      <DishRandomizerSpinning v-else-if="state.phase === 'spinning'" :pick="state.pick" />

      <DishRandomizerResult
        v-else-if="state.phase === 'result'"
        :pick="state.pick"
        :day="selectedDay"
        :timeslots="timeslots"
        :timeslots-loading="timeslotsLoading"
        @reroll="reroll"
        @close="isOpen = false"
      />

      <div v-else class="fun-message-overlay">
        <div class="fun-message-content">
          <div class="fun-emoji">🎉</div>
          <p>You've seen them all!</p>
          <p class="sub-message">Let's start fresh! 🎲</p>
        </div>
      </div>
    </div>
  </BaseDialog>
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
  border-top-color: var(--primary-text-color);
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
  color: var(--primary-text-color);
}

.fun-message-content .sub-message {
  font-size: 1em;
  font-weight: normal;
  color: var(--font-color, #1a1b1d);
  margin-top: 0.5em;
}

.error-overlay {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75em;
  min-height: 140px;
}

.error-emoji {
  font-size: 3em;
}

.error-overlay p {
  margin: 0;
  font-weight: bold;
  color: var(--disabled-color, #f75340);
}

.error-overlay .close-btn {
  border: none;
  border-radius: 8px;
  padding: 0.75em 1.5em;
  cursor: pointer;
  font-size: 1em;
  background-color: var(--secondary-color, #1a1b1d);
  color: white;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.random-dish-btn {
  background-color: var(--primary-color);
  color: white;
  border: none;
  padding: 0.5em 1em;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1em;
  transition: background-color 0.3s ease;
}

.random-dish-btn:hover {
  background-color: var(--primary-hover-color);
}
</style>
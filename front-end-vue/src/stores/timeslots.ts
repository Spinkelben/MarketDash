import { computed, reactive, ref } from 'vue';
import { fetchTimeslots } from '../api/timeslots';
import type { Dish, TimeslotDay } from '../types';

/**
 * Pickup timeslots per dish, plus the day the user is looking at.
 *
 * Like the catalog, the state lives at module scope and is shared by the whole
 * app. Each dish's timeslots are fetched at most once, however many components
 * ask for them.
 */

export interface DishTimeslots {
  status: 'loading' | 'ready' | 'error';
  days: TimeslotDay[];
}

const byDish = reactive<Record<string, DishTimeslots>>({});

const keyOf = (dish: Dish) => `${dish.vendorRoute}/${dish.id}`;

/** Starts fetching a dish's timeslots unless that has already been done. */
function load(dish: Dish) {
  const key = keyOf(dish);
  if (byDish[key]) return;

  byDish[key] = { status: 'loading', days: [] };
  fetchTimeslots(dish).then(
    (days) => {
      byDish[key] = { status: 'ready', days };
    },
    (e) => {
      console.error(`Failed to fetch timeslots for ${dish.name}`, e);
      byDish[key] = { status: 'error', days: [] };
    },
  );
}

/** The timeslots loaded for a dish; undefined until `load` is called for it. */
function forDish(dish: Dish): DishTimeslots | undefined {
  return byDish[keyOf(dish)];
}

/** Every day any loaded dish has timeslots on, in calendar order. */
const dayOptions = computed(() => {
  const dateByLabel = new Map<string, number>();
  for (const { days } of Object.values(byDish)) {
    for (const day of days) {
      if (!dateByLabel.has(day.label)) dateByLabel.set(day.label, day.date);
    }
  }
  return [...dateByLabel.keys()].sort((a, b) => dateByLabel.get(a)! - dateByLabel.get(b)!);
});

const chosenDay = ref<string | null>(null);

/**
 * The day whose timeslots are shown. Until the user picks one (or if their
 * pick is no longer on offer) this is the first available day. Writable, so it
 * can be bound with v-model.
 */
const selectedDay = computed<string | null>({
  get: () =>
    chosenDay.value !== null && dayOptions.value.includes(chosenDay.value)
      ? chosenDay.value
      : (dayOptions.value[0] ?? null),
  set: (day) => {
    chosenDay.value = day;
  },
});

export function useTimeslots() {
  return { dayOptions, selectedDay, load, forDish };
}

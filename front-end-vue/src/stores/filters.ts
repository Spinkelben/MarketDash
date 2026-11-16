import { computed, ref, watch } from 'vue';
import { ALLERGENS, DIETS, matchesFilter } from '../lib/dietary';
import type { Allergen, Diet, Dish } from '../types';

/**
 * The dish filters the user has switched on: diets a dish must have and
 * allergens it must not contain. Shared by the menu lists and the randomizer,
 * and remembered in this browser between visits.
 */

const STORAGE_KEY = 'dish-filters';

function readStored(): { diets: Diet[]; withoutAllergens: Allergen[] } {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}');
    const known = <T extends string>(options: { id: T }[], values: unknown): T[] =>
      options.map(({ id }) => id).filter((id) => Array.isArray(values) && values.includes(id));
    return {
      diets: known(DIETS, stored?.diets),
      withoutAllergens: known(ALLERGENS, stored?.withoutAllergens),
    };
  } catch {
    // Storage is unavailable or holds something else; start without filters.
    return { diets: [], withoutAllergens: [] };
  }
}

const stored = readStored();
const diets = ref<Diet[]>(stored.diets);
const withoutAllergens = ref<Allergen[]>(stored.withoutAllergens);

watch([diets, withoutAllergens], () => {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ diets: diets.value, withoutAllergens: withoutAllergens.value }),
    );
  } catch {
    // Not being able to remember the filters is not worth bothering the user with.
  }
});

const isActive = computed(() => diets.value.length > 0 || withoutAllergens.value.length > 0);

const toggled = <T>(list: T[], value: T) =>
  list.includes(value) ? list.filter((v) => v !== value) : [...list, value];

function toggleDiet(diet: Diet) {
  diets.value = toggled(diets.value, diet);
}

function toggleAllergen(allergen: Allergen) {
  withoutAllergens.value = toggled(withoutAllergens.value, allergen);
}

function clear() {
  diets.value = [];
  withoutAllergens.value = [];
}

/** Whether a dish passes the filters that are switched on. */
function matches(dish: Dish): boolean {
  return matchesFilter(dish, { diets: diets.value, withoutAllergens: withoutAllergens.value });
}

export function useFilters() {
  return { diets, withoutAllergens, isActive, toggleDiet, toggleAllergen, clear, matches };
}

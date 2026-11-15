import { computed, toValue, watchEffect, type MaybeRefOrGetter } from 'vue';
import { useTimeslots } from '../stores/timeslots';
import type { Dish, Timeslot } from '../types';

/**
 * The timeslots of one dish on the currently selected day.
 *
 * `dish` may be a plain value, a ref or a getter; pass a getter such as
 * `() => props.dish` to follow a prop. While it is null nothing is loaded.
 */
export function useDishTimeslots(dish: MaybeRefOrGetter<Dish | null>) {
  const store = useTimeslots();

  // Runs now and again whenever the dish changes. The store ignores dishes it
  // has already loaded, so this never fetches twice.
  watchEffect(() => {
    const current = toValue(dish);
    if (current) store.load(current);
  });

  const entry = computed(() => {
    const current = toValue(dish);
    return current ? store.forDish(current) : undefined;
  });

  const timeslots = computed<Timeslot[]>(
    () => entry.value?.days.find((day) => day.label === store.selectedDay.value)?.timeslots ?? [],
  );
  const loading = computed(() => entry.value?.status === 'loading');

  return { timeslots, loading };
}

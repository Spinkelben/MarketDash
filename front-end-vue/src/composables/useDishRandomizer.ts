import { onScopeDispose, shallowRef, toValue, type MaybeRefOrGetter } from 'vue';
import { pickRandom, shuffle } from '../lib/random';
import type { VendorDish } from '../types';

/**
 * Where the randomizer is in its cycle. Each phase carries exactly the data
 * that exists in it, so e.g. a result without a dish cannot be represented.
 */
export type RandomizerState =
  | { phase: 'ready' }
  | { phase: 'spinning'; pick: VendorDish }
  | { phase: 'result'; pick: VendorDish }
  | { phase: 'allSeen' };

const TICK_MS = 100;
const FIRST_SPIN_MS = 3000;
const REROLL_SPIN_MS = 1000;
const ALL_SEEN_MESSAGE_MS = 2000;

const keyOf = ({ vendor, dish }: VendorDish) => `${vendor.routeName}/${dish.id}`;

/**
 * The "surprise me" state machine: spin through `dishes` and land on one,
 * without repeating a dish until all of them have come up.
 *
 * Everything here is driven by timers; loading the dishes is the caller's
 * job. That keeps cancelling trivial: there is one pending timer at most, and
 * `reset()` clears it.
 */
export function useDishRandomizer(dishes: MaybeRefOrGetter<VendorDish[]>) {
  const state = shallowRef<RandomizerState>({ phase: 'ready' });

  // Dishes that have not come up yet, in random order. Refilled when it runs
  // out; kept across reset() so reopening does not repeat dishes either.
  let bag: VendorDish[] = [];
  let timer: number | undefined;

  function stop() {
    clearInterval(timer);
    clearTimeout(timer);
  }

  /** Cancels whatever is in progress and returns to the start. */
  function reset() {
    stop();
    state.value = { phase: 'ready' };
  }

  // The winner is decided up front; the animation flashes random dishes for
  // `durationMs` and then lands on it.
  function spin(durationMs = FIRST_SPIN_MS) {
    stop();
    const all = toValue(dishes);
    // The dishes on offer can change between spins (the user's filters), so
    // drop the ones that are no longer among them.
    const offered = new Set(all.map(keyOf));
    bag = bag.filter((entry) => offered.has(keyOf(entry)));
    if (bag.length === 0) bag = shuffle(all);
    // Only peek for now: the dish leaves the bag when the spin lands on it,
    // so a spin cancelled by reset() does not use it up.
    const winner = bag[bag.length - 1];
    if (!winner) return; // there are no dishes at all

    let ticksLeft = Math.ceil(durationMs / TICK_MS);
    state.value = { phase: 'spinning', pick: pickRandom(all) };
    timer = window.setInterval(() => {
      if (--ticksLeft > 0) {
        state.value = { phase: 'spinning', pick: pickRandom(all) };
      } else {
        stop();
        bag.pop();
        state.value = { phase: 'result', pick: winner };
      }
    }, TICK_MS);
  }

  /** Picks another dish; once every dish has come up, says so and starts over. */
  function reroll() {
    if (bag.length > 0) {
      spin(REROLL_SPIN_MS);
      return;
    }
    stop();
    state.value = { phase: 'allSeen' };
    timer = window.setTimeout(() => spin(REROLL_SPIN_MS), ALL_SEEN_MESSAGE_MS);
  }

  // Stop the timer if the component using this goes away mid-spin.
  onScopeDispose(stop);

  return { state, spin, reroll, reset };
}

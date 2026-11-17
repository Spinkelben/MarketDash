import { computed, reactive, ref, shallowRef } from 'vue';
import { fetchMenu } from '../api/menus';
import { fetchVendors } from '../api/vendors';
import { rotateByDay } from '../lib/random';
import type { Dish, Vendor, VendorDish } from '../types';

/**
 * The catalog: every vendor and its menu, fetched once and shared by all
 * components.
 *
 * The state below lives at module scope, so there is exactly one copy for the
 * whole app; `useCatalog()` just hands out references to it. Components read
 * the state and call `load()`, and only this file mutates it.
 */

export type LoadStatus = 'idle' | 'loading' | 'ready' | 'error';

export interface MenuState {
  status: 'loading' | 'ready' | 'error';
  dishes: Dish[];
  error: string | null;
}

const status = ref<LoadStatus>('idle');
const error = ref<string | null>(null);
const vendors = shallowRef<Vendor[]>([]);
/** Menu per vendor, keyed by the vendor's route name. */
const menus = reactive<Record<string, MenuState>>({});

/** Every dish that can be ordered: the enabled dishes of the (visible) vendors. */
const availableDishes = computed<VendorDish[]>(() =>
  vendors.value
    .flatMap((vendor) =>
      (menus[vendor.routeName]?.dishes ?? [])
        .filter((dish) => dish.enabled)
        .map((dish) => ({ vendor, dish })),
    ),
);

let loading: Promise<void> | null = null;

const messageOf = (e: unknown) => (e instanceof Error ? e.message : String(e ?? 'Unknown error'));

async function loadMenu(vendorRoute: string) {
  menus[vendorRoute] = { status: 'loading', dishes: [], error: null };
  try {
    menus[vendorRoute] = { status: 'ready', dishes: await fetchMenu(vendorRoute), error: null };
  } catch (e) {
    console.error(`Failed to fetch menu for vendor ${vendorRoute}`, e);
    menus[vendorRoute] = { status: 'error', dishes: [], error: messageOf(e) };
  }
}

async function loadAll() {
  status.value = 'loading';
  error.value = null;
  try {
    // Rotate daily so no vendor is always first in the list.
    vendors.value = rotateByDay(await fetchVendors());
    // The vendor list can render now; each menu fills in as it arrives.
    status.value = 'ready';
  } catch (e) {
    console.error('Failed to fetch vendors', e);
    error.value = messageOf(e);
    status.value = 'error';
    loading = null; // allow a later load() to retry
    return;
  }

  await Promise.all(vendors.value.map((vendor) => loadMenu(vendor.routeName)));
}

/**
 * Loads vendors and all their menus. Safe to call from several places: the
 * work happens once, and every caller gets the same promise, which resolves
 * when the vendor list and every menu have settled.
 */
function load(): Promise<void> {
  loading ??= loadAll();
  return loading;
}

export function useCatalog() {
  return { status, error, vendors, menus, availableDishes, load };
}

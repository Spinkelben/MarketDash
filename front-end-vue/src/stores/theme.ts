import { computed, ref, watchEffect } from 'vue';

/**
 * The colour theme. Follows the system setting until the user picks the other
 * one with the toggle; that choice is remembered in this browser. The theme is
 * applied as `data-theme` on <html>, which `style.css` keys its colours on.
 *
 * The script in `index.html` applies the same rule before the first paint, so
 * the storage key and the rule have to stay in step with it.
 */

export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'theme';

function readStored(): Theme | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === 'light' || stored === 'dark' ? stored : null;
  } catch {
    // Storage is unavailable; follow the system setting.
    return null;
  }
}

const systemQuery = window.matchMedia('(prefers-color-scheme: dark)');
const systemTheme = ref<Theme>(systemQuery.matches ? 'dark' : 'light');
systemQuery.addEventListener('change', (event) => {
  systemTheme.value = event.matches ? 'dark' : 'light';
});

/** The user's own choice, or null while they follow the system setting. */
const override = ref<Theme | null>(readStored());

const theme = computed<Theme>(() => override.value ?? systemTheme.value);

watchEffect(() => {
  document.documentElement.dataset.theme = theme.value;
});

function toggle() {
  const next: Theme = theme.value === 'dark' ? 'light' : 'dark';
  // Switching back to what the system uses drops the override, so the site
  // follows the system setting again from then on.
  override.value = next === systemTheme.value ? null : next;
  try {
    if (override.value) localStorage.setItem(STORAGE_KEY, override.value);
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Not being able to remember the theme is not worth bothering the user with.
  }
}

export function useTheme() {
  return { theme, toggle };
}

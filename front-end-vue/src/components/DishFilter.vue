<script setup lang="ts">
import { ref } from 'vue';
import { ALLERGENS, DIETS } from '../lib/dietary';
import { useFilters } from '../stores/filters';

const { diets, withoutAllergens, isActive, toggleDiet, toggleAllergen, clear } = useFilters();

// Starts open when allergen filters are remembered from an earlier visit.
const showAllergens = ref(withoutAllergens.value.length > 0);
</script>

<template>
  <div class="dish-filter">
    <div class="filter-row">
      <span class="filter-label">Show only</span>
      <button
        v-for="diet in DIETS"
        :key="diet.id"
        class="chip"
        :aria-pressed="diets.includes(diet.id)"
        @click="toggleDiet(diet.id)"
      >
        {{ diet.label }}
      </button>
      <span class="separator" aria-hidden="true"></span>
      <button
        class="chip chip-toggle"
        :class="{ 'chip-has-avoided': withoutAllergens.length > 0 }"
        :aria-expanded="showAllergens"
        aria-controls="allergen-panel"
        @click="showAllergens = !showAllergens"
      >
        Allergens<span v-if="withoutAllergens.length > 0" class="count">{{ withoutAllergens.length }}</span>
        <span class="caret" aria-hidden="true">▾</span>
      </button>
      <button v-if="isActive" class="clear-btn" @click="clear">Clear</button>
    </div>

    <div v-show="showAllergens" id="allergen-panel" class="allergen-panel">
      <div class="filter-row" role="group" aria-label="Allergens to avoid">
        <span class="filter-label">Hide dishes with</span>
        <button
          v-for="allergen in ALLERGENS"
          :key="allergen.id"
          class="chip chip-avoid"
          :aria-pressed="withoutAllergens.includes(allergen.id)"
          @click="toggleAllergen(allergen.id)"
        >
          {{ allergen.label }}
        </button>
      </div>
      <p class="hint">
        Read automatically from the vendors' descriptions and may be wrong. Dishes without
        allergen information are hidden too. Always check with the vendor.
      </p>
    </div>
  </div>
</template>

<style scoped>
.dish-filter {
  display: flex;
  flex-direction: column;
  gap: 0.75em;
  font-family: Verdana, Geneva, Tahoma, sans-serif;
  font-size: 0.9em;
  color: var(--font-color);
}

.filter-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 0.4em;
}

.filter-label {
  font-size: 0.85em;
  opacity: 0.7;
  margin-right: 0.3em;
}

.separator {
  align-self: stretch;
  width: 1px;
  margin: 0 0.4em;
  background: var(--border-color);
}

.chip {
  font: inherit;
  color: var(--font-color);
  background: var(--surface-color);
  border: 1px solid var(--border-color);
  border-radius: 999px;
  padding: 0.35em 0.9em;
  cursor: pointer;
  transition: background-color 0.2s, color 0.2s, border-color 0.2s;
}

.chip:hover {
  border-color: var(--primary-color);
}

.chip[aria-pressed='true'] {
  background: var(--primary-color);
  border-color: var(--primary-color);
  color: white;
}

.chip-avoid[aria-pressed='true'] {
  background: var(--disabled-color);
  border-color: var(--disabled-color);
  text-decoration: line-through;
}

.chip-has-avoided {
  border-color: var(--disabled-color);
}

.count {
  display: inline-block;
  min-width: 1.5em;
  margin-left: 0.4em;
  padding: 0.05em 0.3em;
  box-sizing: border-box;
  border-radius: 999px;
  background: var(--disabled-color);
  color: white;
  font-size: 0.85em;
  text-align: center;
}

.caret {
  display: inline-block;
  margin-left: 0.3em;
  transition: transform 0.2s;
}

.chip-toggle[aria-expanded='true'] .caret {
  transform: rotate(180deg);
}

.clear-btn {
  font: inherit;
  color: var(--primary-text-color);
  background: none;
  border: none;
  padding: 0.35em 0.5em;
  cursor: pointer;
  text-decoration: underline;
}

.allergen-panel {
  padding-top: 0.75em;
  border-top: 1px solid var(--border-color);
}

.hint {
  max-width: 45em;
  margin: 0.75em auto 0;
  font-size: 0.8em;
  text-align: center;
  opacity: 0.7;
}
</style>

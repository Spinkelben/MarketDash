<script setup lang="ts">
import type { Timeslot } from '../types';
import LoadingSpinner from './LoadingSpinner.vue';

withDefaults(
  defineProps<{
    timeslots: Timeslot[];
    loading?: boolean;
    emptyText?: string;
    variant?: 'default' | 'result';
  }>(),
  {
    emptyText: 'No timeslots available',
    variant: 'default',
  },
);

const timeFormatter = new Intl.DateTimeFormat('da-dk', { hour: 'numeric', minute: 'numeric' });
</script>

<template>
  <dd class="timespans">
    <TransitionGroup name="timeslot-list">
      <template v-if="loading && timeslots.length === 0">
        <div key="loading-timeslots" class="loading-timeslot">
          <LoadingSpinner size="small" />
          <span>Loading times...</span>
        </div>
      </template>

      <template v-else-if="timeslots.length === 0">
        <span key="empty-timeslots" class="no-times">
          {{ emptyText }}
        </span>
      </template>

      <template v-else>
        <span
          v-for="timeslot in timeslots"
          :key="timeslot.time"
          :class="[
            timeslot.enabled ? 'enabled' : 'disabled',
            variant === 'result' ? 'result-timeslot' : 'timeslot',
          ]"
        >
          {{ timeFormatter.format(timeslot.time) }}
        </span>
      </template>
    </TransitionGroup>
  </dd>
</template>

<style scoped>
.timespans {
  display: flex;
  flex-wrap: wrap;
  justify-content: left;
  gap: 0.5em;
}

.timeslot-list-enter-active {
  animation: fadeIn 1s ease-in;
}

.timeslot-list-leave-active {
  position: absolute;
  opacity: 0;
}

.timeslot-list-enter-from, .timeslot-list-leave-to {
  opacity: 0;
}

.timeslot, .result-timeslot {
  font-family: Verdana, Geneva, Tahoma, sans-serif;
  border-width: 1px;
  border-style: solid;
  padding: 0.25em;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  border-radius: 10px;
}

.timeslot {
  font-size: large;
  font-weight: 500;
}

.result-timeslot {
  padding: 0.3em 0.6em;
  border-radius: 6px;
  font-size: 0.9em;
  font-weight: bold;
}

/* On a phone the list uses the full width, with slots small enough for four on a row. */
@media (max-width: 600px) {
  .timespans {
    margin: 0.4em 0 1em;
    gap: 0.35em;
  }

  .timeslot {
    font-size: 0.95em;
  }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.timeslot.disabled,
.result-timeslot.disabled {
  color: #f75340;
  text-decoration: line-through;
}

.timeslot.enabled,
.result-timeslot.enabled {
  color: #197d07;
}

.result-timeslot.enabled {
  background-color: var(--enabled-color, #197d07);
  color: white;
}

.result-timeslot.disabled {
  background-color: var(--disabled-color, #f75340);
  color: white;
}

.loading-timeslot {
  display: inline-flex;
  align-items: center;
  gap: 0.5em;
  color: #666;
  font-family: Verdana, Geneva, Tahoma, sans-serif;
}

.no-times {
  color: #666;
  font-style: italic;
  font-family: Verdana, Geneva, Tahoma, sans-serif;
}
</style>
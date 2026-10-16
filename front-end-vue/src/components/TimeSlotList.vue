<script setup lang="ts">
import type { Product } from '../models';
import { computed, inject, onMounted, ref, watch, type Ref } from 'vue';
import type { DayManager } from '../models/DayManager';
import { dayManagerKey } from '../models/injectionKeys';
import { TimeslotModel } from '../models';
import type { Timeslot, TimeslotRequest, TimeslotResponse } from '../models/timeslot';
import LoadingSpinner from './LoadingSpinner.vue';

interface Props {
  item?: Product;
  timeslots?: Timeslot[];
  selectedDay?: string | null;
  emptyText?: string;
  variant?: 'default' | 'result';
  loading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  item: undefined,
  timeslots: () => [],
  selectedDay: null,
  emptyText: 'No timeslots available',
  variant: 'default',
  loading: false,
});

const dayManager = inject<DayManager | undefined>(dayManagerKey);
const timeslots: Ref<TimeslotResponse> = ref([]);
const isLoading = ref(false);

const selectedDay = computed(() => props.selectedDay ?? dayManager?.selectedDay.value ?? null);
const showLoading = computed(() => props.loading || isLoading.value);

const resolvedTimeslots = computed<Timeslot[]>(() => {
  if (props.timeslots.length > 0) {
    return [...props.timeslots].sort((a, b) => {
      const aTime = Date.parse(a.dateISO || new Date(a.date).toISOString());
      const bTime = Date.parse(b.dateISO || new Date(b.date).toISOString());
      return aTime - bTime;
    });
  }

  if (!selectedDay.value) {
    return [];
  }

  const selectedTimeSlots = timeslots.value.filter((day) => day.label === selectedDay.value);
  const matches = selectedTimeSlots[0]?.timeslots ?? [];
  return [...matches].sort((a, b) => {
    const aTime = Date.parse(a.dateISO || new Date(a.date).toISOString());
    const bTime = Date.parse(b.dateISO || new Date(b.date).toISOString());
    return aTime - bTime;
  });
});

function formatTime(timeslot: Timeslot) {
  const time = Date.parse(timeslot.dateISO || new Date(timeslot.date).toISOString());
  return new Intl.DateTimeFormat('da-dk', { hour: 'numeric', minute: 'numeric' }).format(time);
}

function getSlotClasses(timeslot: Timeslot) {
  if (props.variant === 'result') {
    return `${timeslot.enabled ? 'enabled' : 'disabled'} result-timeslot`;
  }

  return `${timeslot.enabled ? 'enabled' : 'disabled'} timeslot`;
}

async function loadTimeslots() {
  if (!props.item?.key) {
    return;
  }

  const request: TimeslotRequest = {
    routeName: props.item.venderRoute,
    products: [{
      bongCategoryId: 0,
      quantity: 1,
      productId: props.item.key,
      productName: props.item.Name,
    }],
  };

  isLoading.value = true;

  try {
    const result = await TimeslotModel.fetchTimeslots(request);
    timeslots.value = result;
    dayManager?.addDays(timeslots.value);
  } catch (error) {
    console.error('Error fetching timeslots:', error);
  } finally {
    isLoading.value = false;
  }
}

onMounted(() => {
  void loadTimeslots();
});

watch(
  () => props.item?.key,
  () => {
    void loadTimeslots();
  },
  { immediate: false },
);
</script>

<template>
  <dd class="timespans">
    <TransitionGroup name="timeslot-list">
      <template v-if="showLoading && resolvedTimeslots.length === 0">
        <div key="loading-timeslots" class="loading-timeslot">
          <LoadingSpinner size="small" />
          <span>Loading times...</span>
        </div>
      </template>

      <template v-else-if="resolvedTimeslots.length === 0">
        <span key="empty-timeslots" class="no-times">
          {{ emptyText }}
        </span>
      </template>

      <template v-else>
        <span
          v-for="timeslot in resolvedTimeslots"
          :key="(timeslot.dateISO || timeslot.date) + '-' + timeslot.label"
          :class="getSlotClasses(timeslot)"
        >
          {{ formatTime(timeslot) }}
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
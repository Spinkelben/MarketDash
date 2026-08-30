<script setup lang="ts">
import type { Product } from '../models';
import { computed, inject, ref, type Ref } from 'vue';
import type { DayManager } from '../models/DayManager';
import { dayManagerKey } from '../models/injectionKeys';
import { TimeslotModel } from '../models';
import type { Timeslot, TimeslotRequest, TimeslotResponse } from '../models/timeslot';

interface Props {
  item: Product,
}

const props = defineProps<Props>();
const dayManager = inject<DayManager>(dayManagerKey) as DayManager; 
const timeslots: Ref<TimeslotResponse> = ref([]);
const selectedDay: Ref<string | null> = dayManager.selectedDay;

const timeslotsOnSelectedDay = computed(() => {
    const selectedTimeSlots = timeslots.value
        .filter((date) => date.label === selectedDay.value)
    if (selectedTimeSlots.length > 0) {
        selectedTimeSlots[0]?.timeslots
            .sort((a: Timeslot, b: Timeslot) => a.date - b.date);
        return selectedTimeSlots[0];
    }
    
    return null;
});

if (props.item.key) {
    const request : TimeslotRequest = {
        routeName: props.item.venderRoute,
        products: [{
            bongCategoryId: 0,
            quantity: 1,
            productId: props.item.key,
            productName: props.item.Name,
        }],
    };
    
    try {
        const result = await TimeslotModel.fetchTimeslots(request);
        if (result) {
            timeslots.value = result;
        }
        dayManager.addDays(timeslots.value);
        
    } catch (error) {
        console.error("Error fetching timeslots:", error);
    }
}
</script>

<template>
    <dd class="timespans">
        <TransitionGroup name="timeslot-list" >
            <span v-for="timeslot in timeslotsOnSelectedDay?.timeslots" 
                :key="timeslotsOnSelectedDay?.label + '-' + timeslot.label" 
                class="timeslot" 
                :class="{ enabled: timeslot.enabled, disabled: !timeslot.enabled }">
                {{ timeslot.label }}
            </span>
        </TransitionGroup>
    </dd>
</template>

<style scoped>
.timespans {
    display: flex;
    flex-wrap: wrap;
    justify-content: left;
    gap: 0.5em;
    /* margin-top: 1em; */
}

.timeslot-list-enter-active {
    animation: fadeIn 1s ease-in;
}

.timeslot-list-leave-active {
    /* Remove jitter caused by leaving elements being considered for flex layout */
    position: absolute;
    opacity: 0; 
}

.timeslot-list-enter-from, .timeslot-list-leave-to {
    opacity: 0;
    /* transform: translateY(-10px); */
}

.timeslot {
    /* margin: 0 10px; */
    font-size: large;
    font-weight: 500;
    font-family: Verdana, Geneva, Tahoma, sans-serif;
    border-width: 1px;
    border-style: solid;
    padding: .25em;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    border-radius: 10px;
}

@keyframes fadeIn { 
    from { opacity: 0; } 
    to { opacity: 1; } 
}

.timeslot.disabled {
    color: #f75340;
    text-decoration: line-through;
}

.timeslot.enabled {
    color:#197d07;
}
</style>
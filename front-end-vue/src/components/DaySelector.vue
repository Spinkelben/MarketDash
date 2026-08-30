<script setup lang="ts">
import { inject } from 'vue';
import { dayManagerKey } from '../models/injectionKeys';
import type { DayManager } from '../models/DayManager';

const dayManager = inject<DayManager>(dayManagerKey) as DayManager;

function handleDayChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    dayManager.selectDay(target.value);
}

</script>


<template>
    <select name="day-selector" id="day-selector" @change="handleDayChange">
        <option v-for="day in dayManager.dayOptions.value" :value="day">{{ day }}</option>
    </select>
    
</template>

<style scoped>
select {
    font-size: large;
    font-family:'Gill Sans', 'Gill Sans MT', Calibri, 'Trebuchet MS', sans-serif;
    animation: fadeIn 1s ease-in-out;
}
</style>
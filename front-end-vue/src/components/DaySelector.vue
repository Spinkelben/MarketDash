<script setup lang="ts">
import { useTimeslots } from '../stores/timeslots';

const { dayOptions, selectedDay } = useTimeslots();
</script>

<template>
  <select id="day-selector" v-model="selectedDay" name="day-selector">
    <option v-for="day in dayOptions" :key="day" :value="day">{{ day }}</option>
  </select>
</template>

<style scoped>
select {
    font-size: 1em;
    padding: 0.5em 0.6em;
    color: var(--font-color);
    background: var(--surface-color);
    border: 1px solid var(--border-color);
    border-radius: 8px;
    cursor: pointer;
    font-family:'Gill Sans', 'Gill Sans MT', Calibri, 'Trebuchet MS', sans-serif;
    animation: fadeIn 1s ease-in-out;
}
</style>
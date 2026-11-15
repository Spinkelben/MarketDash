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
    font-size: large;
    font-family:'Gill Sans', 'Gill Sans MT', Calibri, 'Trebuchet MS', sans-serif;
    animation: fadeIn 1s ease-in-out;
}
</style>
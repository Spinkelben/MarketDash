import { ref, type Ref } from "vue";
import type { TimeslotResponse } from "./timeslot.ts";


export class DayManager {
    dayOptions: Ref<Set<string>> = ref(new Set());
    selectedDay: Ref<string | null> = ref(null);

    addDays(dates: TimeslotResponse) {
        dates.forEach(date => {
            if (typeof date.label === "string") {
                this.dayOptions.value.add(date.label);
            }
        });

        if (this.selectedDay.value === null && this.dayOptions.value.size > 0) {
            this.selectedDay.value = this.dayOptions.value.values().next().value ?? null;
        }
    }

    selectDay(day: string | null) {
        if (day && this.dayOptions.value.has(day)) {
            this.selectedDay.value = day;
        } else {
            console.warn(`Day "${day}" is not available in the options.`);
        }
    }
}
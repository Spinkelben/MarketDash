import type { InjectionKey } from "vue";
import type { DayManager } from "./DayManager.ts";


export const dayManagerKey = Symbol() as InjectionKey<DayManager>;
import type { Dish, Timeslot, TimeslotDay } from '../types';

interface TimeslotDto {
  /** Seconds since the epoch. */
  date: number;
  dateISO?: string;
  enabled: boolean;
}

interface TimeslotDayDto {
  label: string;
  /** Seconds since the epoch. */
  timestamp: number;
  timeslots?: TimeslotDto[];
}

function toTimeslot(dto: TimeslotDto): Timeslot {
  return {
    time: dto.dateISO ? Date.parse(dto.dateISO) : dto.date * 1000,
    enabled: dto.enabled,
  };
}

function toTimeslotDay(dto: TimeslotDayDto): TimeslotDay {
  return {
    label: dto.label,
    date: dto.timestamp * 1000,
    timeslots: (dto.timeslots ?? []).map(toTimeslot).sort((a, b) => a.time - b.time),
  };
}

/** Fetches the pickup timeslots for one portion of a dish, grouped by day. */
export async function fetchTimeslots(dish: Dish): Promise<TimeslotDay[]> {
  const response = await fetch('/api/timeslots', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      routeName: dish.vendorRoute,
      products: [{ bongCategoryId: 0, quantity: 1, productId: dish.id, productName: dish.name }],
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch timeslots (${response.status})`);
  }

  const data = (await response.json()) as TimeslotDayDto[] | { error: string };
  if (!Array.isArray(data)) {
    throw new Error(`Error fetching timeslots: ${data.error}`);
  }

  return data.map(toTimeslotDay);
}

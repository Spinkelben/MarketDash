export interface TimeslotProduct {
  bongCategoryId: number;
  productId: string;
  productName: string;
  quantity: number;
}

export interface TimeslotRequest {
  routeName: string;
  products: TimeslotProduct[];
}

export interface Timeslot {
  date: number; // timestamp
  dateISO: string; // ISO string representation
  enabled: boolean;
  label: string;
}

export interface TimeslotDay {
  label: string;
  timestamp: number;
  timeslots: Timeslot[];
}

export type TimeslotResponse = TimeslotDay[];

export class TimeslotModel {
  static async fetchTimeslots(request: TimeslotRequest): Promise<TimeslotResponse> {
    const response = await fetch('/api/timeslots', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch timeslots');
    }

    const data = await response.json();
    if (data.error) {
      throw new Error('Error fetching timeslots:' + data.error);
    }

    return data;
  }
}
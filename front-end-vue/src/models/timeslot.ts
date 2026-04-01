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
  // Additional properties added by client code
  label?: string; // day label (added by client)
  vendor?: string; // vendor route name (added by client)
  id?: string; // product id (added by client)
}

export interface TimeslotDay {
  label: string;
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
    return response.json();
  }

  /**
   * Flattens the timeslot response into a single array of timeslots with additional metadata
   * @param response The timeslot response from the API
   * @param vendor The vendor route name
   * @param productId The product ID
   * @returns Flattened array of timeslots with label, vendor, and id properties
   */
  static flattenTimeslots(response: TimeslotResponse, vendor: string, productId: string): Timeslot[] {
    const flattened: Timeslot[] = [];
    for (const day of response) {
      for (const timeslot of day.timeslots) {
        flattened.push({
          ...timeslot,
          label: day.label,
          vendor,
          id: productId,
        });
      }
    }
    return flattened;
  }
}
/**
 * Domain types used throughout the app.
 *
 * These are the shapes the UI works with. The raw API shapes live in `api/`
 * and are mapped to these at the boundary, so nothing outside `api/` needs to
 * know how the backend names or nests things.
 */

export interface Vendor {
  routeName: string;
  name: string;
  imageUrl: string;
  visible: boolean;
  /** Whether pickup timeslots can be requested for this vendor. */
  timeslots: boolean;
}

export type Diet = 'vegetarian' | 'vegan' | 'halal';

export type Allergen =
  | 'gluten'
  | 'milk'
  | 'eggs'
  | 'fish'
  | 'crustaceans'
  | 'molluscs'
  | 'peanuts'
  | 'nuts'
  | 'soy'
  | 'sesame'
  | 'mustard'
  | 'celery'
  | 'sulphites'
  | 'lupin';

export interface Dish {
  /** Product key, used as the product id when requesting timeslots. */
  id: string;
  /** Route name of the vendor selling this dish. */
  vendorRoute: string;
  name: string;
  description: string;
  descriptionLong: string;
  imageUrl: string;
  /** Price in whole currency units (the API sends minor units). */
  price: number;
  enabled: boolean;
  /** Diets the vendor labels the dish with. A vegan dish is also vegetarian. */
  diets: Diet[];
  /** Allergens the vendor lists for the dish; null when the vendor does not say. */
  allergens: Allergen[] | null;
}

export interface Timeslot {
  /** Pickup time, in milliseconds since the epoch. */
  time: number;
  enabled: boolean;
}

/** The timeslots a dish can be picked up in on one day. */
export interface TimeslotDay {
  /** Day name as shown in the day selector, e.g. "TOMORROW". */
  label: string;
  /** Start of the day in milliseconds since the epoch; used to order days. */
  date: number;
  /** Sorted by time. */
  timeslots: Timeslot[];
}

/** A dish together with the vendor selling it. */
export interface VendorDish {
  vendor: Vendor;
  dish: Dish;
}

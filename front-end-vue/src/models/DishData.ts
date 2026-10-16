import type { Vendor } from './vendor';
import type { Product } from './menu';

/**
 * A dish offered by a specific vendor — the unit of selection for the
 * DishRandomizer. Intentionally only carries the fields the component renders
 * or forwards to children, to avoid a heavier circular import chain.
 */
export interface DishData {
  vendor: Vendor;
  dish: Product;
}

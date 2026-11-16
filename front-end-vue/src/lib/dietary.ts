import type { Allergen, Diet, Dish } from '../types';

/**
 * Diet and allergen information for dishes.
 *
 * The API has no structured fields for either: vendors write them as free text.
 * The diet is a label in the short description or the name ("VEGAN", "Halal -
 * Spicy"), and the allergens are a list under an "Allergen info:" style
 * heading at the end of the long description, usually in both Danish and
 * English. The parsers here read those conventions, and err on the side of
 * hiding a dish: an extra allergen is harmless, a missed one is not.
 */

export const DIETS: { id: Diet; label: string }[] = [
  { id: 'vegetarian', label: 'Vegetarian' },
  { id: 'vegan', label: 'Vegan' },
  { id: 'halal', label: 'Halal' },
];

/** The 14 allergens that must be declared in the EU, with the words vendors use for them. */
const ALLERGEN_DEFINITIONS: { id: Allergen; label: string; pattern: RegExp }[] = [
  { id: 'gluten', label: 'Gluten', pattern: /gluten(?!\s*-?\s*fr)|hvede|wheat/u },
  { id: 'milk', label: 'Milk', pattern: /(?<!kokos\s?)mælk|(?<!coconut\s?)milk|la[kc]tose/u },
  { id: 'eggs', label: 'Eggs', pattern: /(?<!\p{L})æg|(?<!\p{L})eggs?(?!\p{L})/u },
  { id: 'fish', label: 'Fish', pattern: /(?<!\p{L})fisk|(?<!\p{L})fish/u },
  {
    id: 'crustaceans',
    label: 'Crustaceans',
    pattern: /krebsdyr|crustacea|skaldyr|shellfish|shrimp|prawn|(?<!\p{L})rejer?(?!\p{L})/u,
  },
  { id: 'molluscs', label: 'Molluscs', pattern: /bløddyr|mollus/u },
  { id: 'peanuts', label: 'Peanuts', pattern: /jordnød|peanut/u },
  {
    id: 'nuts',
    label: 'Nuts',
    // The lookarounds keep "jordnødder" and "peanuts" from counting as tree nuts.
    pattern:
      /(?<!\p{L})nødder|(?<!\p{L})nuts?(?!\p{L})|mandl|almond|valnød|walnut|hasselnød|hazelnut|cashew|pistac|pecan/u,
  },
  { id: 'soy', label: 'Soy', pattern: /soja|soya|(?<!\p{L})soy(?!\p{L})/u },
  { id: 'sesame', label: 'Sesame', pattern: /sesam/u },
  { id: 'mustard', label: 'Mustard', pattern: /sennep|mustard/u },
  { id: 'celery', label: 'Celery', pattern: /selleri|sellery|celery/u },
  {
    id: 'sulphites',
    label: 'Sulphites',
    pattern: /sul(f|ph)it|svovldioxid|sul(f|ph)ur\s*dioxide/u,
  },
  { id: 'lupin', label: 'Lupin', pattern: /lupin/u },
];

export const ALLERGENS: { id: Allergen; label: string }[] = ALLERGEN_DEFINITIONS.map(
  ({ id, label }) => ({ id, label }),
);

/** A line that starts the allergen list: "Allergen info:", "ALLERGENER/ALLERGENS:", ... */
const ALLERGEN_HEADING = /^\s*allerg/mu;
/** How vendors say a dish has no allergens: "INGEN / NONE". */
const NO_ALLERGENS = /(?<!\p{L})(ingen|none?)(?!\p{L})/u;

/**
 * The diets a dish is labelled with, in its short description ("VEGAN") or its
 * name ("Sandwich Vegetar"). The long description is not used: it mentions
 * things like "vegan mayo" on dishes that are not vegan. A vegan dish is also
 * vegetarian.
 */
export function parseDiets(name: string, description: string): Diet[] {
  const text = `${name}
${description}`.toLowerCase();
  const vegan = text.includes('vegan');
  const diets: Diet[] = [];
  if (vegan || text.includes('vegetar')) diets.push('vegetarian');
  if (vegan) diets.push('vegan');
  if (text.includes('halal')) diets.push('halal');
  return diets;
}

/**
 * The allergens listed in a dish's long description, or null when it does not
 * say: there is no allergen list, or the list names nothing we recognise and
 * does not say "none" either.
 */
export function parseAllergens(descriptionLong: string): Allergen[] | null {
  const text = descriptionLong.toLowerCase();
  const heading = ALLERGEN_HEADING.exec(text);
  if (!heading) return null;

  // Everything from the first heading on. Some dishes have several lists (one
  // per component) with prose in between; reading all of it catches them all.
  const section = text.slice(heading.index);
  const found = ALLERGEN_DEFINITIONS.filter(({ pattern }) => pattern.test(section)).map(
    ({ id }) => id,
  );
  if (found.length > 0) return found;

  const afterHeading = section.slice(section.indexOf('\n') + 1);
  return NO_ALLERGENS.test(afterHeading) ? [] : null;
}

export interface DishFilter {
  /** Diets the dish must be labelled with (all of them). */
  diets: Diet[];
  /** Allergens the dish must not contain. */
  withoutAllergens: Allergen[];
}

/**
 * Whether a dish passes the filter. A dish whose allergens are unknown fails
 * as soon as any allergen is excluded, since it cannot be shown to be free of it.
 */
export function matchesFilter(dish: Dish, filter: DishFilter): boolean {
  if (!filter.diets.every((diet) => dish.diets.includes(diet))) return false;
  if (filter.withoutAllergens.length === 0) return true;
  const allergens = dish.allergens;
  return allergens !== null && !filter.withoutAllergens.some((a) => allergens.includes(a));
}

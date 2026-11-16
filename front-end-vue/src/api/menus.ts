import { parseAllergens, parseDiets } from '../lib/dietary';
import type { Dish } from '../types';

/** A menu item as the API returns it. Only the fields we use are listed. */
interface ProductDto {
  key?: string;
  Name: string;
  Description?: string;
  DescriptionLong?: string;
  ImageUrl?: string;
  Cost?: number;
  enabled?: boolean;
}

interface CategoryDto {
  items?: Record<string, ProductDto> | ProductDto[];
}

function toDish(dto: ProductDto, vendorRoute: string): Dish {
  const description = dto.Description ?? '';
  // The API has no diet or allergen fields; both are read from the free text.
  return {
    diets: parseDiets(dto.Name, description),
    allergens: parseAllergens(dto.DescriptionLong ?? ''),
    id: dto.key ?? dto.Name,
    vendorRoute,
    name: dto.Name,
    description,
    descriptionLong: dto.DescriptionLong ?? description,
    imageUrl: dto.ImageUrl ?? '',
    price: (dto.Cost ?? 0) / 100,
    enabled: dto.enabled ?? false,
  };
}

/** Fetches a vendor's menu as a flat list of dishes across all categories. */
export async function fetchMenu(vendorRoute: string): Promise<Dish[]> {
  const response = await fetch(`/api/menu/${vendorRoute}`);
  if (!response.ok) {
    const errorText = await response.text().catch(() => response.statusText || 'Unknown error');
    throw new Error(`Failed to fetch menu (${response.status}): ${errorText}`);
  }

  const categories = Object.values((await response.json()) as Record<string, CategoryDto>);

  return categories
    .flatMap((category) => Object.values(category.items ?? {}))
    .map((dto) => toDish(dto, vendorRoute));
}

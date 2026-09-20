export interface Product {
  Category: string;
  Cost: number;
  Description: string;
  DescriptionLong: string;
  ImageUrl: string;
  Name: string;
  NameInternal: string;
  Volume: number;
  basePrice: number;
  blurHash: string;
  buyWithBonusDisabled?: boolean;
  dateEdited?: string;
  disabledReason?: string;
  enabled?: boolean;
  featured?: boolean;
  isCombinedProduct?: boolean;
  isUsingBuildABurger?: boolean;
  key?: string;
  showStockBalance?: boolean;
  stockBalance?: number;
  useStockBalance?: boolean;
  venderRoute: string;
  imageUrl?: string;
  name?: string;
  description?: string;
  descriptionLong?: string;
  id?: string;
}

export interface Category {
  name: string;
  items?: Product[];
  type: string;
  description: string;
  isGlobal?: boolean; 
  key?: string; 
}




export class MenuModel {
  static async fetchMenu(vendorId: string): Promise<Category[]> {
    const response = await fetch(`/api/menu/${vendorId}`);
    if (!response.ok) {
      const errorText = await response.text().catch(() => response.statusText || 'Unknown error');
      throw new Error(`Failed to fetch menu (${response.status}): ${errorText}`);
    }

    const categories = Object.values(await response.json()) as Category[];
    for (const category of categories) {
      if (category.items) {
        category.items = Object.values(category.items) as Product[];
        for (const item of category.items) {
          item.venderRoute = vendorId;
          item.name = item.Name ?? item.name ?? '';
          item.description = item.Description ?? item.description ?? '';
          item.descriptionLong = item.DescriptionLong ?? item.descriptionLong ?? item.description ?? '';
          item.imageUrl = item.ImageUrl ?? item.imageUrl ?? '';
          item.id = item.key ?? item.id ?? item.Name ?? '';
        }
      }
    }
    return categories;
  }
}
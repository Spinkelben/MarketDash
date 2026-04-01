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
      throw new Error('Failed to fetch menu');
    }

    return Object.values(await response.json()) as Category[];
  }
}
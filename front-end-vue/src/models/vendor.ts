export interface Vendor {
    address: string;
    name: string;
    routeName: string;
    imageUrl?: string;
    visible?: boolean;
    enabled?: boolean;
    children?: Vendor[];
    timeslots?: boolean; // indicates if timeslots are available for this vendor
}

export class VendorModel {
  static async fetchVendors(): Promise<Vendor[]> {
    const response = await fetch('/api/vendors');
    if (!response.ok) {
      throw new Error('Failed to fetch vendors');
    }
    const vendorsObj = await response.json();
    // Convert the object to an array of vendors
    const vendors = Object.values(vendorsObj) as Vendor[];
    const visibleVendors = vendors.filter((vendor: Vendor) => vendor.visible || vendor.enabled);
    const flattenedVendors = visibleVendors.flatMap((vendor: Vendor) => {
      if (vendor.children) {
        const children = Object.values(vendor.children) as Vendor[];

        return [vendor, ...children];
      }

      return [vendor];
    });

    return flattenedVendors;
  }
}
import type { Vendor } from '../types';

/** A vendor (or a location grouping several vendors) as the API returns it. */
interface VendorDto {
  name: string;
  routeName: string;
  imageUrl?: string;
  visible?: boolean;
  enabled?: boolean;
  timeslots?: boolean;
  children?: Record<string, VendorDto> | VendorDto[];
}

const skippedVendors = ['compassdk_centralcafe', 'compassdk_townhallcafe', 'compassdk_dbarrivalcafe'];

function toVendor(dto: VendorDto): Vendor {
  return {
    routeName: dto.routeName,
    name: dto.name,
    imageUrl: dto.imageUrl ?? '',
    visible: dto.visible ?? false,
    timeslots: dto.timeslots ?? false,
  };
}

/**
 * Fetches the vendor list, flattened: a location with children yields itself
 * followed by its children.
 */
export async function fetchVendors(): Promise<Vendor[]> {
  const response = await fetch('/api/vendors');
  if (!response.ok) {
    throw new Error(`Failed to fetch vendors (${response.status})`);
  }

  const topLevel = Object.values((await response.json()) as Record<string, VendorDto>);

  return topLevel
    .filter((dto) => dto.visible || dto.enabled)
    .flatMap((dto) => [dto, ...Object.values(dto.children ?? {})])
    .filter((dto) => !skippedVendors.includes(dto.routeName))
    .map(toVendor);
}

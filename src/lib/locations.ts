import type { CollectionEntry } from 'astro:content';

export function isOfficialServiceArea(location: CollectionEntry<'locations'>): boolean {
  return location.data.officialServiceArea !== false;
}

export interface BuildingIdentifier {
  id: string;
  slug: string;
}

/**
 * Resolve the building a campus URL points at. Matches the slug, or the short
 * block code (A, H, N, P, U) when the URL uses that instead.
 */
export function findBuildingBySlug<T extends BuildingIdentifier>(
  buildings: T[],
  slug: string | undefined
): T | undefined {
  if (!slug) return undefined;
  const target = slug.trim().toLowerCase();
  return buildings.find(
    building =>
      building.slug?.toLowerCase() === target ||
      building.id?.toLowerCase() === target
  );
}

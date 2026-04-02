/** Available visual styles for the GTA V map. */
export type MapStyle = 'satellite' | 'atlas' | 'grid';

/** Bounding box expressed as [[south, west], [north, east]]. */
export type LatLngBoundsTuple = [[number, number], [number, number]];

/** Configuration for a single tile layer style. */
export interface TileConfig {
  readonly url: string;
  readonly minZoom: number;
  readonly maxZoom: number;
  readonly extension: string;
  readonly folder: string;
}

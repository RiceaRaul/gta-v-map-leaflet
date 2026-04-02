export type MapStyle = 'satellite' | 'atlas' | 'grid';

export type LatLngBoundsTuple = [[number, number], [number, number]];

export interface TileConfig {
  readonly url: string;
  readonly minZoom: number;
  readonly maxZoom: number;
  readonly extension: string;
  readonly folder: string;
}

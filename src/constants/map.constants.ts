import type { MapStyle, LatLngBoundsTuple } from '../types/index.js';

export const DEFAULT_MAP_CONFIG = {
  zoom: 3,
  minZoom: 1,
  maxZoom: 5,
  center: [0, 0] as [number, number],
  maxBounds: [[-4000, -5500], [8000, 6000]] as LatLngBoundsTuple,
  maxBoundsViscosity: 1,
  tileBaseUrl: 'mapStyles',
  blipsUrl: 'blips',
  defaultStyle: 'satellite' as MapStyle,
} as const;

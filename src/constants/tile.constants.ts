import type { MapStyle, TileConfig } from '../types/index.js';

export const TILE_CONFIGS: Record<MapStyle, Omit<TileConfig, 'url'>> = {
  satellite: { minZoom: 0, maxZoom: 8, extension: 'jpg', folder: 'styleSatelite' },
  atlas:     { minZoom: 0, maxZoom: 5, extension: 'jpg', folder: 'styleAtlas' },
  grid:      { minZoom: 0, maxZoom: 5, extension: 'png', folder: 'styleGrid' },
} as const;

export const STYLE_LABELS: Record<MapStyle, string> = {
  satellite: 'Satellite',
  atlas: 'Atlas',
  grid: 'Grid',
} as const;

export const MAP_STYLES: readonly MapStyle[] = ['satellite', 'atlas', 'grid'] as const;

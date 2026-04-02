import type L from 'leaflet';
import type { GtaMarker } from './marker.types.js';

export interface MapClickDetail {
  readonly x: number;
  readonly y: number;
}

export interface MarkerClickDetail extends GtaMarker {
  readonly id: string;
}

export interface MapReadyDetail {
  readonly map: L.Map;
}

export interface GtaVMapEventMap {
  'map-ready': CustomEvent<MapReadyDetail>;
  'map-click': CustomEvent<MapClickDetail>;
  'marker-click': CustomEvent<MarkerClickDetail>;
}

import type L from 'leaflet';
import type { GtaMarker } from './marker.types.js';

/** Payload emitted when the map background is clicked. */
export interface MapClickDetail {
  readonly x: number;
  readonly y: number;
}

/** Payload emitted when a marker is clicked. */
export interface MarkerClickDetail extends GtaMarker {
  readonly id: string;
}

/** Payload emitted in place-mode when a position is selected. */
export interface MarkerPlacedDetail {
  readonly x: number;
  readonly y: number;
}

/** Payload emitted once the Leaflet map instance is ready. */
export interface MapReadyDetail {
  readonly map: L.Map;
}

/** Custom event map for the `<gta-v-map>` element. */
export interface GtaVMapEventMap {
  'map-ready': CustomEvent<MapReadyDetail>;
  'map-click': CustomEvent<MapClickDetail>;
  'marker-click': CustomEvent<MarkerClickDetail>;
  'marker-placed': CustomEvent<MarkerPlacedDetail>;
}

import type L from 'leaflet';

export interface GtaMarker {
  x: number;
  y: number;
  icon: number;
  /** Accepts plain text or HTML strings */
  popup?: string;
  /** Optional consumer-provided id. If omitted, auto-generated. */
  id?: string;
  /** Optional group name. Markers in the same group share a layer toggle in the control. Defaults to "Markers". */
  group?: string;
}

export interface GtaMarkerEntry {
  readonly id: string;
  x: number;
  y: number;
  icon: number;
  popup?: string;
  group: string;
  _leaflet?: L.Marker;
}

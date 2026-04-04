import type L from 'leaflet';

/** Input marker definition provided by the consumer. */
export interface GtaMarker {
  /** X coordinate (longitude) in GTA V game units. */
  x: number;
  /** Y coordinate (latitude) in GTA V game units. */
  y: number;
  /** Blip icon number corresponding to a sprite in the blips folder. */
  icon: number;
  /** Accepts plain text or HTML strings */
  popup?: string;
  /** Optional consumer-provided id. If omitted, auto-generated. */
  id?: string;
  /** Optional group name. Markers in the same group share a layer toggle in the control. Defaults to "Markers". */
  group?: string;
}

/** Internal marker entry with a guaranteed id, group, and optional Leaflet instance. */
export interface GtaMarkerEntry {
  readonly id: string;
  x: number;
  y: number;
  icon: number;
  popup?: string;
  group: string;
  _leaflet?: L.Marker;
}

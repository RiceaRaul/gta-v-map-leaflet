import type L from 'leaflet';

export interface GtaMarker {
  x: number;
  y: number;
  icon: number;
  popup?: string;
}

export interface GtaMarkerEntry extends GtaMarker {
  readonly id: string;
  _leaflet?: L.Marker;
}

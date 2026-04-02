import type L from 'leaflet';

export interface ShapeLabel {
  text: string;
  className?: string;
  fontSize?: number;
  color?: string;
}

export interface GtaShape {
  type: 'polyline' | 'polygon';
  points: [number, number][];
  color?: string;
  weight?: number;
  opacity?: number;
  fillColor?: string;
  fillOpacity?: number;
  popup?: string;
  group?: string;
  id?: string;
  label?: ShapeLabel;
}

export interface GtaShapeEntry extends Required<Pick<GtaShape, 'type' | 'points' | 'id' | 'group'>> {
  color: string;
  weight: number;
  opacity: number;
  fillColor: string;
  fillOpacity: number;
  popup?: string;
  label?: ShapeLabel;
  _leaflet?: L.Polyline | L.Polygon;
  _labelMarker?: L.Marker;
}

export const SHAPE_DEFAULTS = {
  color: '#3388ff',
  weight: 3,
  opacity: 1,
  fillColor: '#3388ff',
  fillOpacity: 0.2,
  group: 'Shapes',
} as const;

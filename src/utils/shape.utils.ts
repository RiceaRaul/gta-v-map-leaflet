import L from 'leaflet';
import type { GtaShape, GtaShapeEntry, ShapeLabel } from '../types/index.js';
import { SHAPE_DEFAULTS } from '../types/index.js';
import { generateId } from './id.utils.js';

/**
 * Normalizes a GtaShape into a full GtaShapeEntry with defaults applied.
 */
export function createShapeEntry(shape: GtaShape): GtaShapeEntry {
  return {
    id: shape.id ?? generateId(),
    type: shape.type,
    points: shape.points,
    color: shape.color ?? SHAPE_DEFAULTS.color,
    weight: shape.weight ?? SHAPE_DEFAULTS.weight,
    opacity: shape.opacity ?? SHAPE_DEFAULTS.opacity,
    fillColor: shape.fillColor ?? shape.color ?? SHAPE_DEFAULTS.fillColor,
    fillOpacity: shape.fillOpacity ?? SHAPE_DEFAULTS.fillOpacity,
    popup: shape.popup,
    group: shape.group ?? SHAPE_DEFAULTS.group,
    label: shape.label,
  };
}

/**
 * Upserts a shape entry into the entries array.
 */
export function upsertShapeEntry(
  entries: GtaShapeEntry[],
  shape: GtaShape,
): { entry: GtaShapeEntry; isUpdate: boolean } {
  const id = shape.id ?? generateId();
  const index = entries.findIndex((e) => e.id === id);

  if (index !== -1) {
    const entry = createShapeEntry({ ...shape, id });
    entry._leaflet = entries[index]._leaflet;
    entry._labelMarker = entries[index]._labelMarker;
    entries[index] = entry;
    return { entry, isUpdate: true };
  }

  const entry = createShapeEntry({ ...shape, id });
  entries.push(entry);
  return { entry, isUpdate: false };
}

/**
 * Computes the centroid of a set of points.
 */
export function computeCentroid(points: [number, number][]): [number, number] {
  if (points.length === 0) return [0, 0];

  let sumX = 0;
  let sumY = 0;
  for (const [x, y] of points) {
    sumX += x;
    sumY += y;
  }
  return [sumX / points.length, sumY / points.length];
}

/**
 * Creates a Leaflet DivIcon for a shape label at the centroid.
 */
export function createLabelIcon(label: ShapeLabel): L.DivIcon {
  const fontSize = label.fontSize ?? 12;
  const color = label.color ?? '#fff';
  const className = label.className ?? '';

  return L.divIcon({
    className: `gta-shape-label ${className}`.trim(),
    html: `<span style="
      font-size: ${fontSize}px;
      color: ${color};
      white-space: nowrap;
      text-shadow: 1px 1px 2px rgba(0,0,0,0.8);
      pointer-events: none;
    ">${label.text}</span>`,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  });
}

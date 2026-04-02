import L from 'leaflet';
import type { GtaMarker, GtaMarkerEntry } from '../types/index.js';
import { generateId } from './id.utils.js';

export const DEFAULT_MARKER_GROUP = 'Markers';

/**
 * Creates or updates a marker entry.
 * If an entry with the same id exists, updates it in place and returns it.
 * Otherwise creates a new entry.
 */
export function upsertMarkerEntry(
  entries: GtaMarkerEntry[],
  marker: GtaMarker,
): { entry: GtaMarkerEntry; isUpdate: boolean } {
  const id = marker.id ?? generateId();
  const group = marker.group ?? DEFAULT_MARKER_GROUP;
  const existing = entries.find((e) => e.id === id);

  if (existing) {
    existing.x = marker.x;
    existing.y = marker.y;
    existing.icon = marker.icon;
    existing.popup = marker.popup;
    existing.group = group;
    return { entry: existing, isUpdate: true };
  }

  const entry: GtaMarkerEntry = {
    id,
    x: marker.x,
    y: marker.y,
    icon: marker.icon,
    popup: marker.popup,
    group,
  };
  entries.push(entry);
  return { entry, isUpdate: false };
}

/**
 * Updates a Leaflet marker's position, icon, and popup to match the entry.
 */
export function updateLeafletMarker(
  entry: GtaMarkerEntry,
  createIcon: (iconNum: number) => L.Icon,
): void {
  if (!entry._leaflet) return;

  entry._leaflet.setLatLng([entry.y, entry.x]);
  entry._leaflet.setIcon(createIcon(entry.icon));

  if (entry.popup) {
    entry._leaflet.unbindPopup();
    entry._leaflet.bindPopup(entry.popup);
  } else {
    entry._leaflet.unbindPopup();
  }
}

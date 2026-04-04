import L from 'leaflet';
import { GTA_CRS_CONFIG } from '../constants/index.js';

/**
 * Creates a custom CRS for GTA V map coordinates.
 * Uses Object.assign intentionally — L.CRS.Simple is a Leaflet CRS object
 * that requires prototype chain preservation, which spread syntax cannot provide.
 */
export function createGtaCRS(): L.CRS {
  const { centerX, centerY, scaleX, scaleY, ln2 } = GTA_CRS_CONFIG;

  // eslint-disable-next-line prefer-object-spread
  return Object.assign({}, L.CRS.Simple, {
    projection: L.Projection.LonLat,
    scale(zoom: number): number {
      return Math.pow(2, zoom);
    },
    zoom(sc: number): number {
      return Math.log(sc) / ln2;
    },
    distance(pos1: L.LatLng, pos2: L.LatLng): number {
      return Math.hypot(pos2.lng - pos1.lng, pos2.lat - pos1.lat);
    },
    transformation: new L.Transformation(scaleX, centerX, -scaleY, centerY),
    infinite: true,
  });
}

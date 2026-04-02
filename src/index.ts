// Components
export { GtaVMap } from './components/index.js';

// Types
export type {
  GtaMarker,
  GtaMarkerEntry,
  GtaShape,
  GtaShapeEntry,
  ShapeLabel,
  MapStyle,
  LatLngBoundsTuple,
  TileConfig,
  MapClickDetail,
  MarkerClickDetail,
  MarkerPlacedDetail,
  MapReadyDetail,
  GtaVMapEventMap,
} from './types/index.js';
export { SHAPE_DEFAULTS } from './types/index.js';

// Constants
export {
  WATER_COLOR,
  WATER_TILE_DATA_URI,
  TILE_CONFIGS,
  STYLE_LABELS,
  MAP_STYLES,
  DEFAULT_MAP_CONFIG,
  GTA_CRS_CONFIG,
  MARKERCLUSTER_CSS_URL,
  MARKERCLUSTER_DEFAULT_CSS_URL,
} from './constants/index.js';

// Utilities
export {
  createGtaCRS,
  generateId,
  upsertMarkerEntry,
  updateLeafletMarker,
  DEFAULT_MARKER_GROUP,
} from './utils/index.js';
export {
  createShapeEntry,
  upsertShapeEntry,
  computeCentroid,
  createLabelIcon,
} from './utils/shape.utils.js';

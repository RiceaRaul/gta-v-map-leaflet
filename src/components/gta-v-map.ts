import { LitElement, html, type PropertyValues } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import L from 'leaflet';
import 'leaflet.markercluster';
import 'leaflet.heat';
import { createGtaCRS, generateId, upsertMarkerEntry, updateLeafletMarker, DEFAULT_MARKER_GROUP } from '../utils/index.js';
import { upsertShapeEntry, computeCentroid, createLabelIcon } from '../utils/shape.utils.js';
import {
  WATER_COLOR,
  WATER_TILE_DATA_URI,
  TILE_CONFIGS,
  STYLE_LABELS,
  MAP_STYLES,
  DEFAULT_MAP_CONFIG,
  MARKERCLUSTER_CSS_URL,
  MARKERCLUSTER_DEFAULT_CSS_URL,
} from '../constants/index.js';
import type {
  GtaMarker,
  GtaMarkerEntry,
  GtaShape,
  GtaShapeEntry,
  MapStyle,
  MapClickDetail,
  MarkerClickDetail,
  MarkerPlacedDetail,
  MapReadyDetail,
  LatLngBoundsTuple,
  GtaVMapEventMap,
} from '../types/index.js';
import { gtaVMapStyles } from './gta-v-map.styles.js';

@customElement('gta-v-map')
export class GtaVMap extends LitElement {
  static override readonly styles = gtaVMapStyles;

  // --- Leaflet CSS ---

  @property({ type: String, attribute: 'leaflet-css-url' })
  leafletCssUrl = 'https://unpkg.com/leaflet@1.7.1/dist/leaflet.css';

  // --- Custom CRS (property only, set via JS) ---

  private _crs?: L.CRS;

  get crs(): L.CRS | undefined {
    return this._crs;
  }

  set crs(value: L.CRS | undefined) {
    this._crs = value;
  }

  // --- Tile config ---

  @property({ type: String, attribute: 'tile-base-url' })
  tileBaseUrl: string = DEFAULT_MAP_CONFIG.tileBaseUrl;

  @property({ type: String, attribute: 'satellite-url' })
  satelliteUrl?: string;

  @property({ type: String, attribute: 'atlas-url' })
  atlasUrl?: string;

  @property({ type: String, attribute: 'grid-url' })
  gridUrl?: string;

  // --- Map config ---

  @property({ type: String, attribute: 'default-style' })
  defaultStyle: MapStyle = DEFAULT_MAP_CONFIG.defaultStyle;

  @property({ type: Number })
  zoom: number = DEFAULT_MAP_CONFIG.zoom;

  @property({ type: Number, attribute: 'min-zoom' })
  minZoom: number = DEFAULT_MAP_CONFIG.minZoom;

  @property({ type: Number, attribute: 'max-zoom' })
  maxZoom: number = DEFAULT_MAP_CONFIG.maxZoom;

  // --- Bounds config ---

  @property({ type: Array, attribute: 'max-bounds' })
  maxBounds: LatLngBoundsTuple | null = DEFAULT_MAP_CONFIG.maxBounds;

  @property({ type: Number, attribute: 'max-bounds-viscosity' })
  maxBoundsViscosity: number = DEFAULT_MAP_CONFIG.maxBoundsViscosity;

  // --- Blips/icons config ---

  @property({ type: String, attribute: 'blips-url' })
  blipsUrl: string = DEFAULT_MAP_CONFIG.blipsUrl;

  // --- Layer control ---

  @property({ type: Boolean, attribute: 'show-layer-control' })
  showLayerControl = false;

  // --- Clustering ---

  @property({ type: Boolean, attribute: 'disable-clustering' })
  disableClustering = false;

  // --- Click-to-place ---

  @property({ type: Boolean, attribute: 'place-mode' })
  placeMode = false;

  // --- Markers (declarative) ---

  @property({ type: Array })
  markers: GtaMarker[] = [];

  // --- Shapes (declarative) ---

  @property({ type: Array })
  shapes: GtaShape[] = [];

  // --- Heatmap ---

  @property({ type: Boolean, attribute: 'show-heatmap' })
  showHeatmap = false;

  // --- Internal state ---

  private _map?: L.Map;
  private readonly _markerEntries: GtaMarkerEntry[] = [];
  private readonly _shapeEntries: GtaShapeEntry[] = [];
  private readonly _overlayGroups = new Map<string, L.LayerGroup | L.MarkerClusterGroup>();
  private _tileLayers: Record<MapStyle, L.TileLayer> = {} as Record<MapStyle, L.TileLayer>;
  private _layerControl?: L.Control.Layers;
  private _heatLayer?: L.Layer & { setLatLngs(latlngs: [number, number][]): void };

  // --- Imperative API: Markers ---

  addMarker(marker: GtaMarker): string {
    const oldGroup = this._markerEntries.find((e) => e.id === marker.id)?.group;
    const { entry, isUpdate } = upsertMarkerEntry(this._markerEntries, marker);

    if (this._map) {
      if (isUpdate) {
        if (oldGroup && oldGroup !== entry.group && entry._leaflet) {
          const oldLayer = this._overlayGroups.get(oldGroup);
          if (oldLayer) oldLayer.removeLayer(entry._leaflet);
          entry._leaflet = undefined;
          this._addLeafletMarker(entry);
        } else {
          updateLeafletMarker(entry, (n) => this._createIcon(n));
        }
      } else {
        this._addLeafletMarker(entry);
      }
      this._updateHeatmap();
    }

    return entry.id;
  }

  removeMarker(id: string): boolean {
    const index = this._markerEntries.findIndex((e) => e.id === id);
    if (index === -1) return false;

    const entry = this._markerEntries[index];
    if (entry._leaflet) {
      const groupLayer = this._overlayGroups.get(entry.group);
      if (groupLayer) groupLayer.removeLayer(entry._leaflet);
    }
    this._markerEntries.splice(index, 1);
    this._updateHeatmap();
    return true;
  }

  getMarkers(): ReadonlyArray<Omit<GtaMarkerEntry, '_leaflet'>> {
    return this._markerEntries.map(({ _leaflet, ...rest }) => rest);
  }

  clearMarkers(): void {
    for (const entry of this._markerEntries) {
      if (entry._leaflet) {
        const groupLayer = this._overlayGroups.get(entry.group);
        if (groupLayer) groupLayer.removeLayer(entry._leaflet);
      }
    }
    this._markerEntries.length = 0;
    this._updateHeatmap();
  }

  // --- Imperative API: Shapes ---

  addShape(shape: GtaShape): string {
    const oldEntry = shape.id ? this._shapeEntries.find((e) => e.id === shape.id) : undefined;
    const oldGroup = oldEntry?.group;

    const { entry, isUpdate } = upsertShapeEntry(this._shapeEntries, shape);

    if (this._map) {
      if (isUpdate && entry._leaflet) {
        // Remove old shape from its group
        if (oldGroup) {
          const oldLayer = this._overlayGroups.get(oldGroup);
          if (oldLayer) {
            oldLayer.removeLayer(entry._leaflet);
            if (entry._labelMarker) oldLayer.removeLayer(entry._labelMarker);
          }
        }
        entry._leaflet = undefined;
        entry._labelMarker = undefined;
      }
      this._addLeafletShape(entry);
    }

    return entry.id;
  }

  removeShape(id: string): boolean {
    const index = this._shapeEntries.findIndex((e) => e.id === id);
    if (index === -1) return false;

    const entry = this._shapeEntries[index];
    const groupLayer = this._overlayGroups.get(entry.group);
    if (groupLayer) {
      if (entry._leaflet) groupLayer.removeLayer(entry._leaflet);
      if (entry._labelMarker) groupLayer.removeLayer(entry._labelMarker);
    }
    this._shapeEntries.splice(index, 1);
    return true;
  }

  getShapes(): ReadonlyArray<Omit<GtaShapeEntry, '_leaflet' | '_labelMarker'>> {
    return this._shapeEntries.map(({ _leaflet, _labelMarker, ...rest }) => rest);
  }

  clearShapes(): void {
    for (const entry of this._shapeEntries) {
      const groupLayer = this._overlayGroups.get(entry.group);
      if (groupLayer) {
        if (entry._leaflet) groupLayer.removeLayer(entry._leaflet);
        if (entry._labelMarker) groupLayer.removeLayer(entry._labelMarker);
      }
    }
    this._shapeEntries.length = 0;
  }

  // --- Lifecycle ---

  override render() {
    const clusterLinks = this.disableClustering
      ? ''
      : html`
          <link rel="stylesheet" href="${MARKERCLUSTER_CSS_URL}">
          <link rel="stylesheet" href="${MARKERCLUSTER_DEFAULT_CSS_URL}">
        `;

    return html`
      <link rel="stylesheet" href="${this.leafletCssUrl}" @load=${this._onCssLoad}>
      ${clusterLinks}
      <div id="map-container"></div>
    `;
  }

  private _onCssLoad(): void {
    if (!this._map) {
      this._initMap();
    }
  }

  override firstUpdated(): void {
    const link = this.renderRoot.querySelector<HTMLLinkElement>('link');
    if (link?.sheet) {
      this._initMap();
    }
  }

  private _initMap(): void {
    if (this._map) return;

    const container = this.renderRoot.querySelector<HTMLElement>('#map-container');
    if (!container) return;

    const crs = this._crs ?? createGtaCRS();
    this._buildTileLayers();

    const defaultLayer = this._tileLayers[this.defaultStyle] ?? this._tileLayers.satellite;

    const mapOptions: L.MapOptions = {
      crs,
      minZoom: this.minZoom,
      maxZoom: this.maxZoom,
      preferCanvas: true,
      layers: [defaultLayer],
      center: DEFAULT_MAP_CONFIG.center,
      zoom: this.zoom,
    };

    if (this.maxBounds) {
      mapOptions.maxBounds = L.latLngBounds(
        L.latLng(this.maxBounds[0][0], this.maxBounds[0][1]),
        L.latLng(this.maxBounds[1][0], this.maxBounds[1][1]),
      );
      mapOptions.maxBoundsViscosity = this.maxBoundsViscosity;
    }

    this._map = L.map(container, mapOptions);
    this._map.getContainer().style.background = WATER_COLOR;

    requestAnimationFrame(() => {
      this._map?.invalidateSize();
    });

    this._syncMarkers();
    this._syncShapes();

    if (this.showHeatmap) {
      this._enableHeatmap();
    }

    if (this.showLayerControl) {
      this._addLayerControl();
    }

    this._bindMapEvents();
    this._dispatch<MapReadyDetail>('map-ready', { map: this._map });
  }

  override updated(changed: PropertyValues): void {
    if (!this._map) return;

    if (changed.has('markers')) {
      this._syncMarkers();
      this._updateHeatmap();
    }

    if (changed.has('shapes')) {
      this._syncShapes();
    }

    if (changed.has('zoom') && changed.get('zoom') !== undefined) {
      this._map.setZoom(this.zoom);
    }

    if (changed.has('defaultStyle') && changed.get('defaultStyle') !== undefined) {
      const oldStyle = changed.get('defaultStyle') as MapStyle;
      this._switchTileLayer(oldStyle, this.defaultStyle);
    }

    if (changed.has('showLayerControl')) {
      this._toggleLayerControl();
    }

    if (changed.has('showHeatmap')) {
      if (this.showHeatmap) {
        this._enableHeatmap();
      } else {
        this._disableHeatmap();
      }
      this._rebuildLayerControl();
    }
  }

  // --- Private: Map events ---

  private _bindMapEvents(): void {
    if (!this._map) return;

    this._map.on('click', (e: L.LeafletMouseEvent) => {
      const detail: MapClickDetail = { x: e.latlng.lng, y: e.latlng.lat };

      this._dispatch<MapClickDetail>('map-click', detail);

      if (this.placeMode) {
        this._dispatch<MarkerPlacedDetail>('marker-placed', detail);
      }
    });
  }

  // --- Private: Overlay groups ---

  private _getOrCreateOverlayGroup(groupName: string): L.LayerGroup | L.MarkerClusterGroup {
    const existing = this._overlayGroups.get(groupName);
    if (existing) return existing;

    const group = this.disableClustering
      ? L.layerGroup()
      : L.markerClusterGroup();

    this._overlayGroups.set(groupName, group);

    if (this._map) {
      group.addTo(this._map);
      this._rebuildLayerControl();
    }

    return group;
  }

  // --- Private: Tile layers ---

  private _resolveTileUrl(style: MapStyle): string {
    const overrides: Record<MapStyle, string | undefined> = {
      satellite: this.satelliteUrl,
      atlas: this.atlasUrl,
      grid: this.gridUrl,
    };

    const override = overrides[style];
    if (override) return override;

    const config = TILE_CONFIGS[style];
    return `${this.tileBaseUrl}/${config.folder}/{z}/{x}/{y}.${config.extension}`;
  }

  private _buildTileLayers(): void {
    for (const style of MAP_STYLES) {
      const url = this._resolveTileUrl(style);
      const config = TILE_CONFIGS[style];
      const layer = L.tileLayer(url, {
        minZoom: config.minZoom,
        maxZoom: config.maxZoom,
        noWrap: true,
        attribution: 'Online map GTA V',
        errorTileUrl: WATER_TILE_DATA_URI,
      });

      layer.on('tileerror', (e: L.TileErrorEvent) => {
        const img = e.tile as HTMLImageElement;
        img.src = WATER_TILE_DATA_URI;
      });

      this._tileLayers[style] = layer;
    }
  }

  private _switchTileLayer(oldStyle: MapStyle, newStyle: MapStyle): void {
    if (!this._map) return;

    const oldLayer = this._tileLayers[oldStyle];
    const newLayer = this._tileLayers[newStyle];
    if (oldLayer && newLayer && oldLayer !== newLayer) {
      this._map.removeLayer(oldLayer);
      this._map.addLayer(newLayer);
    }
  }

  // --- Private: Layer control ---

  private _addLayerControl(): void {
    if (this._layerControl || !this._map) return;

    const baseLayers: Record<string, L.TileLayer> = {};
    for (const style of MAP_STYLES) {
      baseLayers[STYLE_LABELS[style]] = this._tileLayers[style];
    }

    const overlays: Record<string, L.LayerGroup | L.Layer> = {};
    for (const [name, group] of this._overlayGroups) {
      overlays[name] = group;
    }
    if (this._heatLayer) {
      overlays['Heatmap'] = this._heatLayer;
    }

    this._layerControl = L.control
      .layers(baseLayers, overlays)
      .addTo(this._map);
  }

  private _rebuildLayerControl(): void {
    if (!this._map || !this.showLayerControl) return;

    if (this._layerControl) {
      this._map.removeControl(this._layerControl);
      this._layerControl = undefined;
    }
    this._addLayerControl();
  }

  private _toggleLayerControl(): void {
    if (!this._map) return;

    if (this.showLayerControl) {
      this._addLayerControl();
    } else if (this._layerControl) {
      this._map.removeControl(this._layerControl);
      this._layerControl = undefined;
    }
  }

  // --- Private: Markers ---

  private _createIcon(iconNum: number): L.Icon {
    return L.icon({
      iconUrl: `${this.blipsUrl}/${iconNum}.png`,
      iconSize: [20, 20],
      iconAnchor: [20, 20],
      popupAnchor: [-10, -27],
    });
  }

  private _addLeafletMarker(entry: GtaMarkerEntry): void {
    const groupLayer = this._getOrCreateOverlayGroup(entry.group);

    const icon = this._createIcon(entry.icon);
    const leafletMarker = L.marker([entry.y, entry.x], { icon })
      .addTo(groupLayer);

    if (entry.popup) {
      leafletMarker.bindPopup(entry.popup);
    }

    leafletMarker.on('click', () => {
      this._dispatch<MarkerClickDetail>('marker-click', {
        id: entry.id,
        x: entry.x,
        y: entry.y,
        icon: entry.icon,
        popup: entry.popup,
      });
    });

    entry._leaflet = leafletMarker;
  }

  private _syncMarkers(): void {
    // Clear only marker leaflet refs from groups
    for (const entry of this._markerEntries) {
      if (entry._leaflet) {
        const group = this._overlayGroups.get(entry.group);
        if (group) group.removeLayer(entry._leaflet);
      }
      entry._leaflet = undefined;
    }

    // Rebuild declarative markers
    const parsed = typeof this.markers === 'string' ? JSON.parse(this.markers) as GtaMarker[] : this.markers;
    const declarativeEntries: GtaMarkerEntry[] = [];
    for (const marker of parsed) {
      const id = marker.id ?? generateId();
      const group = marker.group ?? DEFAULT_MARKER_GROUP;
      const entry: GtaMarkerEntry = { ...marker, id, group };
      declarativeEntries.push(entry);
      this._addLeafletMarker(entry);
    }

    // Re-add imperative markers
    for (const entry of this._markerEntries) {
      this._addLeafletMarker(entry);
    }
  }

  // --- Private: Shapes ---

  private _addLeafletShape(entry: GtaShapeEntry): void {
    const groupLayer = this._getOrCreateOverlayGroup(entry.group);
    const latLngs = entry.points.map(([x, y]) => L.latLng(y, x));

    const shapeOptions: L.PolylineOptions = {
      color: entry.color,
      weight: entry.weight,
      opacity: entry.opacity,
    };

    if (entry.type === 'polygon') {
      (shapeOptions as L.PolylineOptions & { fillColor: string; fillOpacity: number }).fillColor = entry.fillColor;
      (shapeOptions as L.PolylineOptions & { fillOpacity: number }).fillOpacity = entry.fillOpacity;
      entry._leaflet = L.polygon(latLngs, shapeOptions).addTo(groupLayer);
    } else {
      entry._leaflet = L.polyline(latLngs, shapeOptions).addTo(groupLayer);
    }

    if (entry.popup) {
      entry._leaflet.bindPopup(entry.popup);
    }

    // Add centered label
    if (entry.label) {
      const [cx, cy] = computeCentroid(entry.points);
      const labelIcon = createLabelIcon(entry.label);
      entry._labelMarker = L.marker([cy, cx], {
        icon: labelIcon,
        interactive: false,
      }).addTo(groupLayer);
    }
  }

  private _syncShapes(): void {
    // Remove existing shape leaflet objects
    for (const entry of this._shapeEntries) {
      if (entry._leaflet) {
        const group = this._overlayGroups.get(entry.group);
        if (group) {
          group.removeLayer(entry._leaflet);
          if (entry._labelMarker) group.removeLayer(entry._labelMarker);
        }
      }
      entry._leaflet = undefined;
      entry._labelMarker = undefined;
    }
    this._shapeEntries.length = 0;

    // Rebuild from declarative shapes
    const parsedShapes = typeof this.shapes === 'string' ? JSON.parse(this.shapes) as GtaShape[] : this.shapes;
    for (const shape of parsedShapes) {
      const { entry } = upsertShapeEntry(this._shapeEntries, shape);
      this._addLeafletShape(entry);
    }
  }

  // --- Private: Heatmap ---

  private _getHeatmapData(): [number, number][] {
    const parsed = typeof this.markers === 'string' ? JSON.parse(this.markers) as GtaMarker[] : this.markers;
    const allMarkers = [
      ...parsed,
      ...this._markerEntries,
    ];
    return allMarkers.map((m) => [m.y, m.x]);
  }

  private _enableHeatmap(): void {
    if (!this._map || this._heatLayer) return;

    const data = this._getHeatmapData();
    this._heatLayer = L.heatLayer(data, {
      radius: 40,
      blur: 20,
      max: 1.0,
      minOpacity: 0.3,
      maxZoom: this.zoom,
    });
    this._heatLayer.addTo(this._map);
    this._rebuildLayerControl();
  }

  private _disableHeatmap(): void {
    if (!this._map || !this._heatLayer) return;

    this._map.removeLayer(this._heatLayer);
    this._heatLayer = undefined;
    this._rebuildLayerControl();
  }

  private _updateHeatmap(): void {
    if (!this._heatLayer) return;
    const data = this._getHeatmapData();
    this._heatLayer.setLatLngs(data);
  }

  // --- Private: Events ---

  private _dispatch<T>(name: keyof GtaVMapEventMap | string, detail: T): void {
    this.dispatchEvent(
      new CustomEvent(name, {
        detail,
        bubbles: true,
        composed: true,
      }),
    );
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'gta-v-map': GtaVMap;
  }
}

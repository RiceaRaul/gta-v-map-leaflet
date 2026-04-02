import { LitElement, html, type PropertyValues } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import L from 'leaflet';
import { createGtaCRS, generateId } from '../utils/index.js';
import {
  WATER_COLOR,
  WATER_TILE_DATA_URI,
  TILE_CONFIGS,
  STYLE_LABELS,
  MAP_STYLES,
  DEFAULT_MAP_CONFIG,
} from '../constants/index.js';
import type {
  GtaMarker,
  GtaMarkerEntry,
  MapStyle,
  MapClickDetail,
  MarkerClickDetail,
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

  // --- Markers (declarative) ---

  @property({ type: Array })
  markers: GtaMarker[] = [];

  // --- Internal state ---

  private _map?: L.Map;
  private readonly _markerEntries: GtaMarkerEntry[] = [];
  private _markerLayerGroup?: L.LayerGroup;
  private _tileLayers: Record<MapStyle, L.TileLayer> = {} as Record<MapStyle, L.TileLayer>;
  private _layerControl?: L.Control.Layers;

  // --- Imperative API ---

  addMarker(marker: GtaMarker): string {
    const id = generateId();
    const entry: GtaMarkerEntry = { ...marker, id };
    this._markerEntries.push(entry);
    if (this._map) {
      this._addLeafletMarker(entry);
    }
    return id;
  }

  removeMarker(id: string): boolean {
    const index = this._markerEntries.findIndex((e) => e.id === id);
    if (index === -1) return false;

    const entry = this._markerEntries[index];
    if (entry._leaflet && this._markerLayerGroup) {
      this._markerLayerGroup.removeLayer(entry._leaflet);
    }
    this._markerEntries.splice(index, 1);
    return true;
  }

  // --- Lifecycle ---

  override render() {
    return html`
      <link rel="stylesheet" href="${this.leafletCssUrl}" @load=${this._onCssLoad}>
      <div id="map-container"></div>
    `;
  }

  private _onCssLoad(): void {
    if (!this._map) {
      this._initMap();
    }
  }

  override firstUpdated(): void {
    // CSS might already be cached — try init immediately
    const link = this.renderRoot.querySelector<HTMLLinkElement>('link');
    if (link?.sheet) {
      this._initMap();
    }
  }

  private _initMap(): void {
    if (this._map) return;

    const container = this.renderRoot.querySelector<HTMLElement>('#map-container');
    if (!container) return;

    const crs = createGtaCRS();
    this._buildTileLayers();
    this._markerLayerGroup = L.layerGroup();

    const defaultLayer = this._tileLayers[this.defaultStyle] ?? this._tileLayers.satellite;

    const mapOptions: L.MapOptions = {
      crs,
      minZoom: this.minZoom,
      maxZoom: this.maxZoom,
      preferCanvas: true,
      layers: [defaultLayer, this._markerLayerGroup],
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

    if (this.showLayerControl) {
      this._addLayerControl();
    }

    this._syncMarkers();
    this._bindMapEvents();
    this._dispatch<MapReadyDetail>('map-ready', { map: this._map });
  }

  override updated(changed: PropertyValues): void {
    if (!this._map) return;

    if (changed.has('markers')) {
      this._syncMarkers();
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
  }

  // --- Private: Map events ---

  private _bindMapEvents(): void {
    if (!this._map) return;

    this._map.on('click', (e: L.LeafletMouseEvent) => {
      this._dispatch<MapClickDetail>('map-click', {
        x: e.latlng.lng,
        y: e.latlng.lat,
      });
    });
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
      this._tileLayers[style] = L.tileLayer(url, {
        minZoom: config.minZoom,
        maxZoom: config.maxZoom,
        noWrap: true,
        attribution: 'Online map GTA V',
        errorTileUrl: WATER_TILE_DATA_URI,
      });
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

    this._layerControl = L.control
      .layers(baseLayers, { Markers: this._markerLayerGroup! })
      .addTo(this._map);
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
    if (!this._markerLayerGroup) return;

    const icon = this._createIcon(entry.icon);
    const leafletMarker = L.marker([entry.y, entry.x], { icon })
      .addTo(this._markerLayerGroup);

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
    if (this._markerLayerGroup) {
      this._markerLayerGroup.clearLayers();
    }

    for (const entry of this._markerEntries) {
      entry._leaflet = undefined;
    }

    for (const marker of this.markers) {
      const entry: GtaMarkerEntry = { ...marker, id: generateId() };
      this._addLeafletMarker(entry);
    }

    for (const entry of this._markerEntries) {
      this._addLeafletMarker(entry);
    }
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

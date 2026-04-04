import { Component, CUSTOM_ELEMENTS_SCHEMA, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import 'gta-v-map';
import type { GtaVMap, MapClickDetail, MarkerClickDetail, MarkerPlacedDetail } from 'gta-v-map';

interface LogEntry {
  id: number;
  text: string;
}

let logCounter = 0;

@Component({
  selector: 'app-root',
  imports: [CommonModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <div class="demo-container">
      <div class="map-wrapper">
        <gta-v-map
          #mapEl
          zoom="3"
          default-style="satellite"
          tile-base-url="/mapStyles"
          blips-url="/blips"
          show-layer-control
          [attr.markers]="initialMarkers"
          (map-ready)="onMapReady()"
          (map-click)="onMapClick($event)"
          (marker-click)="onMarkerClick($event)"
          (marker-placed)="onMarkerPlaced($event)"
        ></gta-v-map>
      </div>

      <div class="controls">
        <h2>GTA V Map - Angular Demo</h2>

        <h3>Markers</h3>
        <button (click)="addRandomMarker()">addMarker() - Random</button>
        <button (click)="upsertHQ()">addMarker() - Upsert "hq"</button>
        <button (click)="removeLast()">removeMarker() - Last</button>
        <button (click)="clearAllMarkers()">clearMarkers()</button>
        <button (click)="logMarkers()">getMarkers() - Log</button>

        <h3>Shapes</h3>
        <button (click)="addRandomPolygon()">addShape() - Polygon</button>
        <button (click)="addRandomPolyline()">addShape() - Polyline</button>
        <button (click)="clearAllShapes()">clearShapes()</button>

        <h3>Modes</h3>
        <button (click)="togglePlaceMode()" [class.active]="placeMode">
          {{ placeMode ? 'Place Mode: ON' : 'Toggle Place Mode' }}
        </button>
        <button (click)="toggleHeatmap()" [class.active]="heatmap">
          {{ heatmap ? 'Heatmap: ON' : 'Toggle Heatmap' }}
        </button>

        <h3>Map Controls</h3>
        <button (click)="zoomIn()">Zoom In</button>
        <button (click)="zoomOut()">Zoom Out</button>
        <button (click)="setStyle('satellite')">Style: Satellite</button>
        <button (click)="setStyle('atlas')">Style: Atlas</button>
        <button (click)="setStyle('grid')">Style: Grid</button>

        <h3>Events</h3>
        <div class="event-log">
          @for (entry of log; track entry.id) {
            <div>{{ entry.text }}</div>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; height: 100vh; }

    .demo-container {
      display: flex;
      height: 100%;
      background: #1a1a1a;
      color: #fff;
      font-family: system-ui, sans-serif;
    }

    .map-wrapper {
      flex: 1;
      background: #1a3a4a;
    }

    gta-v-map {
      display: block;
      width: 100%;
      height: 100%;
    }

    .controls {
      width: 320px;
      padding: 16px;
      background: #222;
      overflow-y: auto;
      border-left: 1px solid #333;
    }

    h2 { margin-bottom: 12px; font-size: 16px; }
    h3 { margin: 16px 0 8px; font-size: 14px; color: #aaa; }

    button {
      display: block;
      width: 100%;
      padding: 8px 12px;
      margin-bottom: 8px;
      background: #3a3a3a;
      color: #fff;
      border: 1px solid #555;
      border-radius: 4px;
      cursor: pointer;
      font-size: 13px;
    }
    button:hover { background: #4a4a4a; }
    button.active { background: #2a6a2a; border-color: #4a8a4a; }

    .event-log {
      margin-top: 12px;
      padding: 8px;
      background: #111;
      border-radius: 4px;
      font-family: monospace;
      font-size: 11px;
      max-height: 200px;
      overflow-y: auto;
    }
    .event-log div {
      padding: 2px 0;
      border-bottom: 1px solid #222;
    }
  `],
})
export class App {
  @ViewChild('mapEl') mapElRef!: ElementRef<GtaVMap>;

  log: LogEntry[] = [];
  addedIds: string[] = [];
  placeMode = false;
  heatmap = false;

  initialMarkers = JSON.stringify([
    { x: 0, y: 0, icon: 1, popup: '<b>Spawn</b>', group: 'Spawns' },
    { x: 500, y: 500, icon: 1, popup: '<b>Safe House</b>', group: 'Properties' },
    { x: -800, y: 200, icon: 1, popup: '<b>Shop</b>', group: 'Shops' },
  ]);

  private get map(): GtaVMap | undefined {
    return this.mapElRef?.nativeElement;
  }

  private logEvent(text: string): void {
    this.log = [{ id: ++logCounter, text }, ...this.log].slice(0, 50);
  }

  onMapReady(): void {
    this.logEvent('map-ready');
  }

  onMapClick(e: Event): void {
    const detail = (e as CustomEvent<MapClickDetail>).detail;
    this.logEvent(`map-click: x=${detail.x.toFixed(1)}, y=${detail.y.toFixed(1)}`);
  }

  onMarkerClick(e: Event): void {
    const detail = (e as CustomEvent<MarkerClickDetail>).detail;
    this.logEvent(`marker-click: id=${detail.id}`);
  }

  onMarkerPlaced(e: Event): void {
    const detail = (e as CustomEvent<MarkerPlacedDetail>).detail;
    this.logEvent(`marker-placed: x=${detail.x.toFixed(1)}, y=${detail.y.toFixed(1)}`);
    this.map?.addMarker({
      ...detail,
      icon: 1,
      popup: `<b>Placed</b><br>x: ${detail.x.toFixed(1)}, y: ${detail.y.toFixed(1)}`,
    });
  }

  addRandomMarker(): void {
    const id = this.map?.addMarker({
      x: (Math.random() - 0.5) * 4000,
      y: (Math.random() - 0.5) * 4000,
      icon: 1,
      popup: `<b>Random #${this.addedIds.length + 1}</b>`,
      group: 'Random',
    });
    if (id) {
      this.addedIds.push(id);
      this.logEvent(`addMarker: ${id}`);
    }
  }

  upsertHQ(): void {
    const id = this.map?.addMarker({
      id: 'hq',
      x: (Math.random() - 0.5) * 2000,
      y: (Math.random() - 0.5) * 2000,
      icon: 1,
      popup: '<b>HQ</b><br>Moves each click (upsert)',
      group: 'HQ',
    });
    this.logEvent(`upsert: ${id}`);
  }

  removeLast(): void {
    const id = this.addedIds.pop();
    if (id) {
      this.map?.removeMarker(id);
      this.logEvent(`removeMarker: ${id}`);
    }
  }

  clearAllMarkers(): void {
    this.map?.clearMarkers();
    this.addedIds = [];
    this.logEvent('clearMarkers');
  }

  logMarkers(): void {
    const markers = this.map?.getMarkers() ?? [];
    this.logEvent(`getMarkers: ${markers.length} markers`);
  }

  addRandomPolygon(): void {
    const cx = (Math.random() - 0.5) * 2000;
    const cy = (Math.random() - 0.5) * 2000;
    const size = 200 + Math.random() * 300;
    const id = this.map?.addShape({
      type: 'polygon',
      points: [[cx - size, cy - size], [cx + size, cy - size], [cx + size, cy + size], [cx - size, cy + size]],
      color: `hsl(${Math.random() * 360}, 70%, 50%)`,
      fillOpacity: 0.2,
      group: 'Zones',
      label: { text: 'Zone', color: '#fff', fontSize: 12 },
    });
    this.logEvent(`addShape polygon: ${id}`);
  }

  addRandomPolyline(): void {
    const points: [number, number][] = Array.from(
      { length: 3 + Math.floor(Math.random() * 4) },
      () => [(Math.random() - 0.5) * 3000, (Math.random() - 0.5) * 3000],
    );
    const id = this.map?.addShape({
      type: 'polyline',
      points,
      color: `hsl(${Math.random() * 360}, 70%, 50%)`,
      weight: 3,
      group: 'Routes',
      label: { text: 'Route', color: '#fff' },
    });
    this.logEvent(`addShape polyline: ${id}`);
  }

  clearAllShapes(): void {
    this.map?.clearShapes();
    this.logEvent('clearShapes');
  }

  togglePlaceMode(): void {
    this.placeMode = !this.placeMode;
    if (this.map) this.map.placeMode = this.placeMode;
  }

  toggleHeatmap(): void {
    this.heatmap = !this.heatmap;
    if (this.map) this.map.showHeatmap = this.heatmap;
  }

  zoomIn(): void {
    if (this.map) this.map.zoom = Math.min(this.map.zoom + 1, this.map.maxZoom);
  }

  zoomOut(): void {
    if (this.map) this.map.zoom = Math.max(this.map.zoom - 1, this.map.minZoom);
  }

  setStyle(style: 'satellite' | 'atlas' | 'grid'): void {
    if (this.map) this.map.defaultStyle = style;
  }
}

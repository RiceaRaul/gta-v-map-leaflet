import React, { useState, useCallback } from 'react';
import { useGtaVMap, useMapEvent } from './useGtaVMap.js';
import type { MapClickDetail, MarkerClickDetail, MarkerPlacedDetail } from '../../src/index.js';

let logCounter = 0;

interface LogEntry {
  id: number;
  text: string;
}

export function GtaVMapApp() {
  const { ref, addMarker, removeMarker, clearMarkers, getMarkers, addShape, clearShapes } = useGtaVMap();
  const [log, setLog] = useState<LogEntry[]>([]);
  const [addedIds, setAddedIds] = useState<string[]>([]);
  const [placeMode, setPlaceMode] = useState(false);
  const [heatmap, setHeatmap] = useState(false);

  const logEvent = useCallback((text: string) => {
    setLog((prev) => [{ id: ++logCounter, text }, ...prev].slice(0, 50));
  }, []);

  // Event listeners
  useMapEvent(ref, 'map-ready', useCallback(() => {
    logEvent('map-ready');
  }, [logEvent]));

  useMapEvent<MapClickDetail>(ref, 'map-click', useCallback((detail) => {
    logEvent(`map-click: x=${detail.x.toFixed(1)}, y=${detail.y.toFixed(1)}`);
  }, [logEvent]));

  useMapEvent<MarkerClickDetail>(ref, 'marker-click', useCallback((detail) => {
    logEvent(`marker-click: id=${detail.id}`);
  }, [logEvent]));

  useMapEvent<MarkerPlacedDetail>(ref, 'marker-placed', useCallback((detail) => {
    logEvent(`marker-placed: x=${detail.x.toFixed(1)}, y=${detail.y.toFixed(1)}`);
    addMarker({
      ...detail,
      icon: 1,
      popup: `<b>Placed</b><br>x: ${detail.x.toFixed(1)}, y: ${detail.y.toFixed(1)}`,
    });
  }, [logEvent, addMarker]));

  const handleAddRandom = () => {
    const id = addMarker({
      x: (Math.random() - 0.5) * 4000,
      y: (Math.random() - 0.5) * 4000,
      icon: 1,
      popup: `<b>Random #${addedIds.length + 1}</b>`,
      group: 'Random',
    });
    if (id) {
      setAddedIds((prev) => [...prev, id]);
      logEvent(`addMarker: ${id}`);
    }
  };

  const handleUpsertHQ = () => {
    const id = addMarker({
      id: 'hq',
      x: (Math.random() - 0.5) * 2000,
      y: (Math.random() - 0.5) * 2000,
      icon: 1,
      popup: '<b>HQ</b><br>Moves each click (upsert)',
      group: 'HQ',
    });
    logEvent(`upsert: ${id}`);
  };

  const handleRemoveLast = () => {
    const id = addedIds[addedIds.length - 1];
    if (id && removeMarker(id)) {
      setAddedIds((prev) => prev.slice(0, -1));
      logEvent(`removeMarker: ${id}`);
    }
  };

  const handleClearMarkers = () => {
    clearMarkers();
    setAddedIds([]);
    logEvent('clearMarkers');
  };

  const handleGetMarkers = () => {
    const markers = getMarkers();
    logEvent(`getMarkers: ${markers.length} markers`);
  };

  const handleAddPolygon = () => {
    const cx = (Math.random() - 0.5) * 2000;
    const cy = (Math.random() - 0.5) * 2000;
    const size = 200 + Math.random() * 300;
    const id = addShape({
      type: 'polygon',
      points: [[cx - size, cy - size], [cx + size, cy - size], [cx + size, cy + size], [cx - size, cy + size]],
      color: `hsl(${Math.random() * 360}, 70%, 50%)`,
      fillOpacity: 0.2,
      group: 'Zones',
      label: { text: 'Zone', color: '#fff', fontSize: 12 },
    });
    logEvent(`addShape polygon: ${id}`);
  };

  const handleAddPolyline = () => {
    const points: [number, number][] = Array.from({ length: 3 + Math.floor(Math.random() * 4) }, () => [
      (Math.random() - 0.5) * 3000,
      (Math.random() - 0.5) * 3000,
    ]);
    const id = addShape({
      type: 'polyline',
      points,
      color: `hsl(${Math.random() * 360}, 70%, 50%)`,
      weight: 3,
      group: 'Routes',
      label: { text: 'Route', color: '#fff' },
    });
    logEvent(`addShape polyline: ${id}`);
  };

  const handleTogglePlace = () => {
    setPlaceMode((prev) => !prev);
  };

  const handleToggleHeatmap = () => {
    setHeatmap((prev) => !prev);
  };

  // Sync placeMode and heatmap to the element
  React.useEffect(() => {
    if (ref.current) ref.current.placeMode = placeMode;
  }, [placeMode, ref]);

  React.useEffect(() => {
    if (ref.current) ref.current.showHeatmap = heatmap;
  }, [heatmap, ref]);

  const initialMarkers = JSON.stringify([
    { x: 0, y: 0, icon: 1, popup: '<b>Spawn</b>', group: 'Spawns' },
    { x: 500, y: 500, icon: 1, popup: '<b>Safe House</b>', group: 'Properties' },
  ]);

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#1a1a1a', color: '#fff', fontFamily: 'system-ui' }}>
      <div style={{ flex: 1, background: '#1a3a4a' }}>
        <gta-v-map
          ref={ref}
          zoom="3"
          default-style="satellite"
          tile-base-url="/mapStyles"
          blips-url="/blips"
          show-layer-control
          markers={initialMarkers}
          style={{ display: 'block', width: '100%', height: '100%' }}
        />
      </div>

      <div style={{ width: 320, padding: 16, background: '#222', overflowY: 'auto', borderLeft: '1px solid #333' }}>
        <h2 style={{ fontSize: 16, marginBottom: 12 }}>GTA V Map - React Demo</h2>

        <Section title="Markers">
          <Button onClick={handleAddRandom}>addMarker() - Random</Button>
          <Button onClick={handleUpsertHQ}>addMarker() - Upsert "hq"</Button>
          <Button onClick={handleRemoveLast}>removeMarker() - Last</Button>
          <Button onClick={handleClearMarkers}>clearMarkers()</Button>
          <Button onClick={handleGetMarkers}>getMarkers() - Log</Button>
        </Section>

        <Section title="Shapes">
          <Button onClick={handleAddPolygon}>addShape() - Polygon</Button>
          <Button onClick={handleAddPolyline}>addShape() - Polyline</Button>
          <Button onClick={() => { clearShapes(); logEvent('clearShapes'); }}>clearShapes()</Button>
        </Section>

        <Section title="Modes">
          <Button onClick={handleTogglePlace} active={placeMode}>
            {placeMode ? 'Place Mode: ON' : 'Toggle Place Mode'}
          </Button>
          <Button onClick={handleToggleHeatmap} active={heatmap}>
            {heatmap ? 'Heatmap: ON' : 'Toggle Heatmap'}
          </Button>
        </Section>

        <Section title="Events">
          <div style={{
            padding: 8, background: '#111', borderRadius: 4,
            fontFamily: 'monospace', fontSize: 11, maxHeight: 200, overflowY: 'auto',
          }}>
            {log.map((entry) => (
              <div key={entry.id} style={{ padding: '2px 0', borderBottom: '1px solid #222' }}>
                {entry.text}
              </div>
            ))}
          </div>
        </Section>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <>
      <h3 style={{ margin: '16px 0 8px', fontSize: 14, color: '#aaa' }}>{title}</h3>
      {children}
    </>
  );
}

function Button({ onClick, active, children }: { onClick: () => void; active?: boolean; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'block', width: '100%', padding: '8px 12px', marginBottom: 8,
        background: active ? '#2a6a2a' : '#3a3a3a', color: '#fff',
        border: `1px solid ${active ? '#4a8a4a' : '#555'}`, borderRadius: 4,
        cursor: 'pointer', fontSize: 13,
      }}
    >
      {children}
    </button>
  );
}

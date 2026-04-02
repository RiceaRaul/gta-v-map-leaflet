import { useRef, useEffect, useCallback } from 'react';
import type { GtaVMap } from '../../src/index.js';
import type { GtaMarker, GtaShape } from '../../src/index.js';

// Ensure the component is registered
import '../../src/index.js';

export interface UseGtaVMapReturn {
  ref: React.RefObject<GtaVMap | null>;
  addMarker: (marker: GtaMarker) => string | undefined;
  removeMarker: (id: string) => boolean;
  clearMarkers: () => void;
  getMarkers: () => ReturnType<GtaVMap['getMarkers']> | [];
  addShape: (shape: GtaShape) => string | undefined;
  removeShape: (id: string) => boolean;
  clearShapes: () => void;
}

export function useGtaVMap(): UseGtaVMapReturn {
  const ref = useRef<GtaVMap | null>(null);

  const addMarker = useCallback((marker: GtaMarker) => {
    return ref.current?.addMarker(marker);
  }, []);

  const removeMarker = useCallback((id: string) => {
    return ref.current?.removeMarker(id) ?? false;
  }, []);

  const clearMarkers = useCallback(() => {
    ref.current?.clearMarkers();
  }, []);

  const getMarkers = useCallback(() => {
    return ref.current?.getMarkers() ?? [];
  }, []);

  const addShape = useCallback((shape: GtaShape) => {
    return ref.current?.addShape(shape);
  }, []);

  const removeShape = useCallback((id: string) => {
    return ref.current?.removeShape(id) ?? false;
  }, []);

  const clearShapes = useCallback(() => {
    ref.current?.clearShapes();
  }, []);

  return { ref, addMarker, removeMarker, clearMarkers, getMarkers, addShape, removeShape, clearShapes };
}

/**
 * Hook to listen to custom events on the gta-v-map element.
 */
export function useMapEvent<T>(
  ref: React.RefObject<GtaVMap | null>,
  eventName: string,
  handler: (detail: T) => void,
): void {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const listener = (e: Event) => {
      handler((e as CustomEvent<T>).detail);
    };

    el.addEventListener(eventName, listener);
    return () => el.removeEventListener(eventName, listener);
  }, [ref, eventName, handler]);
}

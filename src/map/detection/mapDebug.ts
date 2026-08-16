import { useSyncExternalStore } from 'react';
import mapDetectionSummary from './mapDetectionSummary.json';

export const MAP_DEBUG_STORAGE_KEY = 'apawthecaria.mapDebug';

export type MapDebugLocationAnchor = {
  id: string;
  x: number;
  y: number;
  status: 'VERIFIED' | 'PROBABLE' | 'UNMATCHED' | 'MANUAL';
  readiness: 'READY' | 'NEEDS_REVIEW' | 'UNSAFE';
  candidate: { x: number; y: number; offsetPercent: number; offsetPx: number } | null;
};

export const MAP_DETECTION_SUMMARY = mapDetectionSummary;

const debugListeners = new Set<() => void>();

const readDebugFlag = () => {
  if (typeof window === 'undefined') return false;
  try {
    if (window.localStorage.getItem(MAP_DEBUG_STORAGE_KEY) === '1') return true;
    return new URLSearchParams(window.location.search).get('mapDebug') === '1';
  } catch {
    return false;
  }
};

let cachedDebug = readDebugFlag();

const subscribeDebug = (listener: () => void) => {
  debugListeners.add(listener);
  return () => { debugListeners.delete(listener); };
};

export const useMapDebugEnabled = () =>
  useSyncExternalStore(subscribeDebug, () => cachedDebug, () => false);

if (typeof window !== 'undefined') {
  window.addEventListener('popstate', () => {
    cachedDebug = readDebugFlag();
    debugListeners.forEach(listener => listener());
  });
}

export const mapDebugLocationAnchors = (): MapDebugLocationAnchor[] =>
  (mapDetectionSummary.locationAnchors || []) as MapDebugLocationAnchor[];

export const mapDebugJunctions = (): Array<{ id: number; x: number; y: number; degree: number }> =>
  mapDetectionSummary.junctionsPreview || [];

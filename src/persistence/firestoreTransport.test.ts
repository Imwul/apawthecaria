import { describe, expect, it } from 'vitest';
import { firestoreTransportSettings } from './firestoreTransport';

describe('Firestore browser transport compatibility', () => {
  const settings = (userAgent: string, platform = 'MacIntel', maxTouchPoints = 0) =>
    firestoreTransportSettings({ userAgent, platform, maxTouchPoints });
  const compatible = { experimentalForceLongPolling: true, useFetchStreams: false };

  it('avoids buffered streaming responses on macOS Safari and WebKit webviews', () => {
    expect(settings('Mozilla/5.0 (Macintosh) AppleWebKit/605.1.15 Version/26.6 Safari/605.1.15')).toEqual(compatible);
    expect(settings('Mozilla/5.0 (Macintosh) AppleWebKit/605.1.15')).toEqual(compatible);
  });

  it('uses compatible transport on iOS browsers and desktop-mode iPad', () => {
    for (const browser of ['Version/26.6', 'CriOS/150.0', 'FxiOS/148.0', 'EdgiOS/150.0']) {
      expect(settings(`Mozilla/5.0 (iPhone) AppleWebKit/605.1.15 ${browser} Mobile Safari/604.1`, 'iPhone', 5)).toEqual(compatible);
    }
    expect(settings('Mozilla/5.0 (Macintosh) AppleWebKit/605.1.15 Version/26.6 Safari/605.1.15', 'MacIntel', 5)).toEqual(compatible);
  });

  it('preserves the SDK defaults in non-WebKit browsers', () => {
    for (const browser of ['Chrome/150.0 Safari/537.36', 'Chrome/150.0 Safari/537.36 Edg/150.0', 'Chromium/150.0', 'Chrome/150.0 OPR/120.0']) {
      expect(settings(`Mozilla/5.0 (Macintosh) AppleWebKit/537.36 ${browser}`)).toEqual({});
    }
    expect(settings('Mozilla/5.0 (X11; Linux x86_64) Gecko/20100101 Firefox/150.0', 'Linux x86_64')).toEqual({});
    expect(settings('Mozilla/5.0 (Linux; Android 15) AppleWebKit/537.36 Chrome/150.0 Mobile Safari/537.36', 'Linux', 5)).toEqual({});
    expect(settings('')).toEqual({});
  });
});

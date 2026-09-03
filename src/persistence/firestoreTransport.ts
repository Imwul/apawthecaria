import type { FirestoreSettings } from 'firebase/firestore';

type BrowserIdentity = Pick<Navigator, 'userAgent' | 'platform' | 'maxTouchPoints'>;
type TransportSettings = FirestoreSettings & { useFetchStreams?: boolean };

export const firestoreTransportSettings = (
  browser: BrowserIdentity | undefined = typeof navigator === 'undefined' ? undefined : navigator
): TransportSettings => {
  if (!browser) return {};
  const { userAgent, platform, maxTouchPoints } = browser;
  const ios = /iPad|iPhone|iPod/i.test(userAgent)
    || (platform === 'MacIntel' && maxTouchPoints > 1);
  const webkit = /AppleWebKit/i.test(userAgent)
    && !/Chrome|Chromium|Edg|OPR|Android/i.test(userAgent);
  if (!ios && !webkit) return {};

  // Safari can buffer Firestore's streaming completion frame until a 30s
  // keep-alive, stalling even getDocFromServer. Close responses after data and
  // use XHR on WebKit; keep the SDK's default transport on other browsers.
  // https://github.com/firebase/firebase-js-sdk/issues/9789
  return { experimentalForceLongPolling: true, useFetchStreams: false };
};

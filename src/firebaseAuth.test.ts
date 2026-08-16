// @ts-expect-error Vitest runs this source audit in Node; the app build intentionally exposes browser types only.
import { readFileSync } from 'node:fs';
// @ts-expect-error Vitest runs this source audit in Node; the app build intentionally exposes browser types only.
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { googleSignInErrorMessage } from './firebase';

const firebaseSource = readFileSync(fileURLToPath(new URL('./firebase.ts', import.meta.url)), 'utf8');
const appSource = readFileSync(fileURLToPath(new URL('./App.tsx', import.meta.url)), 'utf8');

describe('google sign-in', () => {
  it('asks Google for an account picker instead of reusing the last session', () => {
    expect(firebaseSource).toContain("prompt: 'select_account'");
  });

  it('uses a full-page redirect on Firefox where popups fail after gapi loads', () => {
    expect(firebaseSource).toContain(" /firefox/i.test(navigator.userAgent)");
    expect(appSource).toContain('signInWithRedirect');
    expect(appSource).toContain('getRedirectResult');
  });

  it('explains blocked popups and test-mode access denials in Korean', () => {
    expect(googleSignInErrorMessage({ code: 'auth/popup-blocked' })).toContain('팝업');
    expect(googleSignInErrorMessage({ code: 'auth/unauthorized-domain' })).toContain('apawthecaria.vercel.app');
    expect(googleSignInErrorMessage({ message: '403: access_denied' })).toContain('테스트 모드');
  });
});

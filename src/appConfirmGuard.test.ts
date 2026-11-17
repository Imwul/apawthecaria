// @ts-expect-error Vitest runs this source audit in Node; the app build intentionally exposes browser types only.
import { readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const sources = ['src/App.tsx', ...readdirSync('src/components')
  .filter((name: string) => name.endsWith('.tsx') && !name.includes('.test.'))
  .map((name: string) => `src/components/${name}`)];

describe('yes/no questions', () => {
  it('ask through the app dialog, never the browser confirm box', () => {
    for (const file of sources) {
      const source: string = readFileSync(file, 'utf8');
      const calls = source.match(/window\.confirm/g) || [];
      // App.tsx keeps exactly one: the fallback inside askAppConfirm before the dialog is mounted.
      expect(calls.length, file).toBe(file === 'src/App.tsx' ? 1 : 0);
    }
  });
});

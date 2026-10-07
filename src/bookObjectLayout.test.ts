// @ts-expect-error Vitest runs this source audit in Node; the app build intentionally exposes browser types only.
import { readFileSync } from 'node:fs';
// @ts-expect-error Vitest runs this source audit in Node; the app build intentionally exposes browser types only.
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const cssSource: string = readFileSync(fileURLToPath(new URL('./workspace.css', import.meta.url)), 'utf8');
const appSource: string = readFileSync(fileURLToPath(new URL('./App.tsx', import.meta.url)), 'utf8');
const baseSource: string = readFileSync(fileURLToPath(new URL('./index.css', import.meta.url)), 'utf8');
const desktopSource = baseSource.split('@media')[0] + cssSource.split('@media')[0];
const writingKeys = ['originJournal', 'mementoNote', 'familiarJournal', 'relationshipJournal'];

// Small source guards supplement browser checks; they do not simulate the CSS cascade.
const rulesIn = (source: string) => [...source.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/([^{}]+)\{([^{}]*)\}/g)]
  .map(([, selector, body]) => ({ selector: selector.trim(), body }));

const declarationsFor = (selector: string, source = desktopSource): string => {
  const matching = rulesIn(source).filter(candidate => candidate.selector.split(',').map(part => part.trim()).includes(selector));
  const rule = matching.length ? { body: matching.map(row => row.body).join(';') } : undefined;
  expect(rule, `Missing presentation rule: ${selector}`).toBeDefined();
  return rule?.body || '';
};

const property = (body: string, name: string) =>
  body.match(new RegExp(`(?:^|;)\\s*${name}\\s*:\\s*([^;]+)`))?.[1].replace(/\s*!important\s*$/, '').trim();

const mobileSource = () => {
  const opening = cssSource.match(/@media\s*\(max-width:\s*760px\)\s*\{/);
  expect(opening).not.toBeNull();
  const start = (opening?.index || 0) + (opening?.[0].length || 0);
  let depth = 1;
  for (let end = start; end < cssSource.length; end += 1) {
    if (cssSource[end] === '{') depth += 1;
    if (cssSource[end] === '}') depth -= 1;
    if (depth === 0) return cssSource.slice(start, end);
  }
  throw new Error('Unclosed mobile presentation block');
};

describe('field station layout regression guards', () => {
  it('wraps long register labels without clipping their focus outline', () => {
    const register = declarationsFor('.journal-subtabs');
    const button = declarationsFor('.journal-subtabs button');
    expect(property(register, 'flex-wrap')).toBe('wrap');
    expect(property(register, 'overflow')).toBe('visible');
    expect(property(button, 'white-space')).toBe('normal');
    expect(property(button, 'overflow-wrap')).toBe('anywhere');
    expect(property(declarationsFor(':focus-visible'), 'outline')).toMatch(/[1-9]\d*px\s+solid\s+/);
  });

  it('keeps import and both photo pickers in keyboard order with visible label focus', () => {
    const labels = [...appSource.matchAll(/<label\b[^>]*className="[^"]*\bfolio-file-control\b[^"]*"[^>]*>[\s\S]*?<\/label>/g)];
    expect(labels).toHaveLength(3);
    const accessibleNames = labels.map(([label]) => {
      const input = label.match(/<input\b[\s\S]*?\/>/)?.[0] || '';
      expect(input).toContain('type="file"');
      expect(input).not.toMatch(/display\s*:\s*['"]none['"]|visibility\s*:\s*['"]hidden['"]/);
      expect(input).not.toMatch(/\b(?:hidden|disabled)(?=[\s=>])|tabIndex=\{-1\}/);
      return input.match(/aria-label="([^"]+)"/)?.[1];
    });
    expect(accessibleNames).toEqual(['기록 불러오기', '사진 선택', '사진 추가']);
    const fileInput = declarationsFor('.folio-file-control input[type=file]');
    expect(property(fileInput, 'display')).not.toBe('none');
    expect(property(fileInput, 'visibility')).not.toBe('hidden');
    expect(property(fileInput, 'width')).toBe('100%');
    expect(property(fileInput, 'height')).toBe('100%');
    expect(property(declarationsFor('.folio-file-control:focus-within'), 'outline'))
      .toMatch(/[1-9]\d*px\s+solid\s+/);
  });

  it('reflows the writing fields in one mobile column while preserving vertical resizing', () => {
    const mobile = mobileSource();
    expect(property(declarationsFor('.journal-writing-spread', mobile), 'grid-template-columns'))
      .toMatch(/^minmax\(0,\s*1fr\)$/);
    expect(property(declarationsFor('.journal-writing-field', mobile), 'grid-column')).toBe('1');
    const writing = rulesIn(desktopSource).find(rule => rule.selector === '.journal-writing-field textarea');
    expect(property(writing?.body || '', 'resize')).toBe('vertical');
    expect(property(declarationsFor('.journal-writing-field'), 'min-width')).toBe('0');
    writingKeys.forEach(key => expect(appSource).toContain(`key: '${key}'`));
  });

  it('keeps index, register, file, and journal action targets at least 44px high', () => {
    [
      '.station-nav-group .journal-tab',
      'button',
      '.journal-subtabs button'
    ].forEach(selector => {
      const height = property(declarationsFor(selector), 'min-height');
      expect(height).toMatch(/^\d+(?:\.\d+)?px$/);
      expect(Number.parseFloat(height || '0'), selector).toBeGreaterThanOrEqual(44);
    });
  });
});

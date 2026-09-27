// @ts-expect-error Vitest runs this source audit in Node; the app build intentionally exposes browser types only.
import { readFileSync } from 'node:fs';
// @ts-expect-error Vitest runs this source audit in Node; the app build intentionally exposes browser types only.
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const cssSource: string = readFileSync(fileURLToPath(new URL('./woodland.css', import.meta.url)), 'utf8');
const appSource: string = readFileSync(fileURLToPath(new URL('./App.tsx', import.meta.url)), 'utf8');
const desktopSource = cssSource.split('@media')[0];
const writingKeys = ['originJournal', 'mementoNote', 'familiarJournal', 'relationshipJournal'];

// Small source guards supplement browser checks; they do not simulate the CSS cascade.
const rulesIn = (source: string) => [...source.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/([^{}]+)\{([^{}]*)\}/g)]
  .map(([, selector, body]) => ({ selector: selector.trim(), body }));

const declarationsFor = (selector: string, source = desktopSource): string => {
  const rule = rulesIn(source).find(candidate => candidate.selector === selector);
  expect(rule, `Missing presentation rule: ${selector}`).toBeDefined();
  return rule?.body || '';
};

const property = (body: string, name: string) =>
  body.match(new RegExp(`(?:^|;)\\s*${name}\\s*:\\s*([^;]+)`))?.[1].replace(/\s*!important\s*$/, '').trim();

const mobileSource = () => {
  const opening = cssSource.match(/@media\s*\(max-width:\s*640px\)\s*\{/);
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

describe('book object layout regression guards', () => {
  it('marks the active chapter with typography instead of a filled index rectangle', () => {
    const active = declarationsFor('.print-edition .journal-tab--active');
    expect(property(active, 'background')).toMatch(/^(none|transparent)$/);
    expect(property(active, 'text-decoration')).toContain('underline');
    expect(Number(property(active, 'font-weight'))).toBeGreaterThanOrEqual(600);
  });

  it('wraps the register and long labels without clipping an external focus outline', () => {
    const register = declarationsFor('.print-edition .journal-subtabs');
    const button = declarationsFor('.print-edition .journal-subtabs button');
    expect(property(register, 'flex-wrap')).toBe('wrap');
    expect(property(register, 'overflow')).toBe('visible');
    expect(property(button, 'white-space')).toBe('normal');
    expect(property(button, 'overflow-wrap')).toBe('anywhere');
    const focus = rulesIn(desktopSource).find(rule => rule.selector.includes('summary):focus-visible'));
    expect(property(focus?.body || '', 'outline')).toMatch(/[1-9]\d*px\s+solid\s+/);
  });

  it('keeps import and both photo pickers in keyboard order with visible label focus', () => {
    const labels = [...appSource.matchAll(/<label\b[^>]*className="[^"]*\bjournal-file-action\b[^"]*"[^>]*>[\s\S]*?<\/label>/g)];
    expect(labels).toHaveLength(3);
    const accessibleNames = labels.map(([label]) => {
      const input = label.match(/<input\b[\s\S]*?\/>/)?.[0] || '';
      expect(input).toContain('type="file"');
      expect(input).not.toMatch(/display\s*:\s*['"]none['"]|visibility\s*:\s*['"]hidden['"]/);
      expect(input).not.toMatch(/\b(?:hidden|disabled)(?=[\s=>])|tabIndex=\{-1\}/);
      return input.match(/aria-label="([^"]+)"/)?.[1];
    });
    expect(accessibleNames).toEqual(['기록 불러오기', '사진 선택', '사진 추가']);
    const fileInput = declarationsFor('.print-edition .journal-file-action input[type="file"]');
    expect(property(fileInput, 'display')).not.toBe('none');
    expect(property(fileInput, 'visibility')).not.toBe('hidden');
    expect(property(fileInput, 'width')).toBe('100%');
    expect(property(fileInput, 'height')).toBe('100%');
    expect(property(declarationsFor('.print-edition .journal-file-action:focus-within'), 'outline'))
      .toMatch(/[1-9]\d*px\s+solid\s+/);
  });

  it('gives the four existing writing fields distinct widths and a shorter memento annotation', () => {
    const widths = writingKeys.map(key => {
      expect(appSource).toContain(`key: '${key}'`);
      return property(declarationsFor(`.print-edition .journal-writing-field--${key}`), 'grid-column');
    });
    widths.forEach(width => expect(width).toMatch(/^span\s+\d+$/));
    expect(new Set(widths).size).toBe(4);
    const heights = writingKeys.map(key => Number.parseFloat(property(
      declarationsFor(`.print-edition .journal-writing-field--${key} textarea`), 'height') || '0'));
    expect(heights[0]).toBeGreaterThan(heights[1]);
    expect(heights[2]).toBeGreaterThan(heights[1]);
    expect(heights[3]).toBeGreaterThan(heights[1]);
  });

  it('reflows the writing fields in one mobile column while preserving vertical resizing', () => {
    const mobile = mobileSource();
    expect(property(declarationsFor('.print-edition .journal-writing-spread', mobile), 'grid-template-columns'))
      .toMatch(/^minmax\(0,\s*1fr\)$/);
    expect(property(declarationsFor('.print-edition .journal-writing-field', mobile), 'grid-column')).toBe('1');
    expect(property(declarationsFor('.print-edition .journal-writing-field--mementoNote', mobile), 'padding-top')).toBe('0');
    const writing = rulesIn(desktopSource).find(rule => rule.selector.includes('.journal-writing-field textarea,'));
    expect(property(writing?.body || '', 'resize')).toBe('vertical');
    expect(property(declarationsFor('.print-edition .journal-writing-field'), 'min-width')).toBe('0');
  });

  it('keeps index, register, file, and journal action targets at least 44px high', () => {
    [
      '.print-edition button',
      '.print-edition .journal-tab',
      '.print-edition .journal-subtabs button',
      '.print-edition .journal-file-action',
      '.print-edition .journal-document-actions :is(button, label)',
      '.print-edition .main-content-panel .journal-chapter .journal-writing-composer > input'
    ].forEach(selector => {
      const height = property(declarationsFor(selector), 'min-height');
      expect(height).toMatch(/^\d+(?:\.\d+)?px$/);
      expect(Number.parseFloat(height || '0'), selector).toBeGreaterThanOrEqual(44);
    });
  });
});

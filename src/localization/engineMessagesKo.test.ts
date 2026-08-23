// @ts-expect-error Vitest runs this source audit in Node; the app build intentionally exposes browser types only.
import { readFileSync, readdirSync } from 'node:fs';
// @ts-expect-error Vitest runs this source audit in Node; the app build intentionally exposes browser types only.
import { fileURLToPath } from 'node:url';
// @ts-expect-error Vitest runs this source audit in Node; the app build intentionally exposes browser types only.
import { join } from 'node:path';
import ts from 'typescript';
import { describe, expect, it } from 'vitest';
import { ENGINE_MESSAGE_TRANSLATION_COUNT, localizeGameplayMessage } from './engineMessagesKo';

const rulesDirectory = fileURLToPath(new URL('../rules', import.meta.url));

const auditedEngineStrings = () => {
  const results: Array<{ file: string; line: number; text: string }> = [];
  const propertyNames = new Set(['messages', 'title', 'text', 'journalPrompt', 'message']);
  const add = (source: ts.SourceFile, file: string, node: ts.Node) => {
    if (!ts.isStringLiteral(node) && !ts.isNoSubstitutionTemplateLiteral(node)) return;
    if (!/[A-Za-z]{2}/.test(node.text) || /[가-힣]/.test(node.text)) return;
    results.push({ file, line: source.getLineAndCharacterOfPosition(node.getStart(source)).line + 1, text: node.text });
  };
  for (const relative of readdirSync(rulesDirectory, { recursive: true }) as string[]) {
    if (!relative.endsWith('.ts') || relative.endsWith('.test.ts') || relative.startsWith('data/')) continue;
    const file = join(rulesDirectory, relative);
    const source = ts.createSourceFile(file, readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
    const visit = (node: ts.Node) => {
      if (ts.isPropertyAssignment(node)) {
        const name = ts.isIdentifier(node.name) || ts.isStringLiteral(node.name) ? node.name.text : '';
        if (propertyNames.has(name)) {
          if (ts.isArrayLiteralExpression(node.initializer)) node.initializer.elements.forEach(child => add(source, relative, child));
          else add(source, relative, node.initializer);
        }
      }
      if (ts.isNewExpression(node) && node.expression.getText(source) === 'Error' && node.arguments?.[0]) add(source, relative, node.arguments[0]);
      if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression) && node.expression.name.text === 'push'
        && /(messages|blockers)/i.test(node.expression.expression.getText(source))) node.arguments.forEach(child => add(source, relative, child));
      if (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.EqualsToken && ts.isIdentifier(node.left)
        && ['title', 'text'].includes(node.left.text)) add(source, relative, node.right);
      ts.forEachChild(node, visit);
    };
    visit(source);
  }
  return results;
};

describe('gameplay message Korean presentation layer', () => {
  it('covers every audited fixed engine message', () => {
    expect(ENGINE_MESSAGE_TRANSLATION_COUNT).toBe(381);
  });

  it('preserves proper names while translating surrounding instructions', () => {
    expect(localizeGameplayMessage('Glass Alembic is required to CATALYSE.')).toBe('CATALYSE에는 Glass Alembic이 필요합니다.');
    expect(localizeGameplayMessage('Brave requires a local Reagent with Base Rarity 6 or lower.')).toContain('Brave');
    expect(localizeGameplayMessage('Brave requires a local Reagent with Base Rarity 6 or lower.')).toContain('현지 영약재');
  });

  it('translates dynamic engine message formats and multiline alerts', () => {
    expect(localizeGameplayMessage('Route exceeds Speed 3.')).toBe('경로가 속도 3을 초과합니다.');
    expect(localizeGameplayMessage('Unknown ailment: ailment-17')).toBe('알 수 없는 질병입니다: ailment-17');
    expect(localizeGameplayMessage('Not enough Trinkets.\nTreatment requires a transaction ID.')).toBe('장신구가 부족합니다.\n치료에는 트랜잭션 ID가 필요합니다.');
    expect(localizeGameplayMessage('One of: FUR 2 (provided 0) OR FEATHER 2 (provided 1)'))
      .toBe('다음 중 하나 필요: FUR 2 필요 · 현재 0 또는 FEATHER 2 필요 · 현재 1');
    expect(localizeGameplayMessage('Required Tool is not selected: paws'))
      .toBe('필요한 도구가 선택되지 않았습니다: 앞발/발톱');
    expect(localizeGameplayMessage('Missing Tool for Leaves: camp-kettle, glass-alembic'))
      .toBe('Leaves에 필요한 도구가 없습니다: 낡은 캠프 주전자, 유리 증류기');
  });

  it('translates generated journal events without changing proper names', () => {
    expect(localizeGameplayMessage('Guild Services ready for Journey')).toBe('여정용 길드 서비스 준비');
    expect(localizeGameplayMessage('Guild Services ready for 여정')).toBe('여정용 길드 서비스 준비');
    expect(localizeGameplayMessage('Journey started')).toBe('여정 시작');
    expect(localizeGameplayMessage('여정 started')).toBe('여정 시작');
    expect(localizeGameplayMessage('Barter: Nettles')).toBe('물물교환: Nettles');
    expect(localizeGameplayMessage('Spring to Summer')).toBe('봄에서 여름으로');
    expect(localizeGameplayMessage('Downtime: self-improvement')).toBe('휴식기 활동: 자기 계발');
    expect(localizeGameplayMessage('Downtime: relax-tool')).toBe('휴식기 활동: 친구들과 휴식하기 · 도구 선물');
    expect(localizeGameplayMessage('Downtime: lend-a-paw')).toBe('휴식기 활동: 도움의 손길');
  });

  it('covers rare engine failures and persisted journal formats', () => {
    const samples = [
      'Reconnect destination is not a nearest canonical City.',
      'Pantry Hibernation requires 30 Trinkets for 2 occupant(s).',
      'Nettles was gathered; all active Ailment Timers were reduced by 1.',
      'BR 8; paid 2 Trinkets and 1 Reputation. Juicy Gossip was discarded to automatically obtain the Reagent.',
      'camp-kettle retained its identity and was upgraded for 3 Trinkets.',
      'Spoutneck to Odoak. Reason: 왕진. Goal: Responsibility.'
    ];
    for (const sample of samples) {
      expect(localizeGameplayMessage(sample)).not.toBe(sample);
      expect(localizeGameplayMessage(sample)).toMatch(/[가-힣]/);
    }
  });

  it('keeps every fixed user-facing engine string behind the Korean presentation layer', () => {
    const uncovered = auditedEngineStrings()
      .filter(row => localizeGameplayMessage(row.text) === row.text)
      .map(row => `${row.file}:${row.line} ${row.text}`);
    expect(uncovered).toEqual([]);
  });
});

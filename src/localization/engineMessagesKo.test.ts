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
const localizationFile = fileURLToPath(new URL('./engineMessagesKo.ts', import.meta.url));

const fixedEngineTranslations = () => {
  const source = ts.createSourceFile(
    localizationFile,
    readFileSync(localizationFile, 'utf8'),
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS
  );
  const results: string[] = [];
  const visit = (node: ts.Node) => {
    if (ts.isVariableDeclaration(node)
      && node.name.getText(source) === 'exactEngineMessages'
      && node.initializer
      && ts.isObjectLiteralExpression(node.initializer)) {
      for (const property of node.initializer.properties) {
        if (ts.isPropertyAssignment(property) && ts.isStringLiteral(property.initializer)) {
          results.push(property.initializer.text);
        }
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
  return results;
};

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
    expect(ENGINE_MESSAGE_TRANSLATION_COUNT).toBe(386);
  });

  it('preserves canonical tags while localizing player-facing names and instructions', () => {
    expect(localizeGameplayMessage('Glass Alembic is required to CATALYSE.')).toBe('CATALYSE에는 유리 증류기가 필요합니다.');
    expect(localizeGameplayMessage('Brave requires a local Reagent with Base Rarity 6 or lower.')).toContain('Brave');
    expect(localizeGameplayMessage('Brave requires a local Reagent with Base Rarity 6 or lower.')).toContain('현지 영약재');
    expect(localizeGameplayMessage('Bad Idea cannot be treated with a Remedy containing FOUL.')).toContain('FOUL');
  });

  it('translates dynamic engine message formats and multiline alerts', () => {
    expect(localizeGameplayMessage('Route exceeds Speed 3.')).toBe('경로가 속도 3을 초과합니다.');
    expect(localizeGameplayMessage('Unknown ailment: ailment-17')).toBe('알 수 없는 질병입니다: ailment-17');
    expect(localizeGameplayMessage('Not enough Trinkets.\nTreatment requires a transaction ID.')).toBe('장신구가 부족합니다.\n치료 처리 정보가 없습니다.');
    expect(localizeGameplayMessage('One of: FUR 2 (provided 0) OR FEATHER 2 (provided 1)'))
      .toBe('다음 중 하나 필요: FUR 2 필요 · 현재 0 또는 FEATHER 2 필요 · 현재 1');
    expect(localizeGameplayMessage('Required Tool is not selected: paws'))
      .toBe('필요한 도구가 선택되지 않았습니다: 앞발/발톱');
    expect(localizeGameplayMessage('Missing Tool for Leaves: camp-kettle, glass-alembic'))
      .toBe('Leaves에 필요한 도구가 없습니다: 낡은 캠프 주전자, 유리 증류기');
    expect(localizeGameplayMessage('BR 8; paid 2 Trinkets and 1 Reputation.'))
      .toBe('기본 희귀도 8; 장신구 2개와 Guild Reputation 1점을 지불했습니다.');
  });

  it('keeps engine implementation jargon out of fixed player-facing messages', () => {
    const forbiddenKoreanJargon = /트랜잭션|정식|인쇄된|인쇄 효과|인쇄 결과|인쇄 무게/;
    const untranslatedGenericTerms = /\b(?:Social Encounter|Travel Encounter|Foraging Encounter|Passenger|Wagon|Soar|City|Settlement|Wilds|Titan Ruins?|Behemoth Barrows?|Inventory|Waterways|Mailbox|Base Unit)\b/;
    expect(fixedEngineTranslations().filter(text => forbiddenKoreanJargon.test(text))).toEqual([]);
    expect(fixedEngineTranslations().filter(text => untranslatedGenericTerms.test(text))).toEqual([]);
  });

  it('uses natural Korean in dynamic validation and journal formats', () => {
    expect(localizeGameplayMessage('Move must use Speed 3; route costs 4.'))
      .toBe('이 이동의 속도는 3이어야 하며 경로 비용은 4입니다.');
    expect(localizeGameplayMessage('Every active Timer must have at least 2 remaining.'))
      .toBe('진행 중인 모든 타이머가 2시간 이상 남아 있어야 합니다.');
    expect(localizeGameplayMessage('Commissioning or expanding a Wagon requires a City and 20 Trinkets.'))
      .toBe('마차 제작 또는 확장에는 도시와 장신구 20개가 필요합니다.');
    expect(localizeGameplayMessage('Forecast completed. Forecast protection remaining: 2.'))
      .toBe('날씨 예보 완료. 날씨 예보 보호 남은 횟수: 2.');
    expect(localizeGameplayMessage('Mossmilk acquired through forage; BR 12, Weight 2/3, target PAIN, source REMEDY-003.'))
      .toContain('목표 태그 PAIN, 적용 규칙 REMEDY-003');
    expect(localizeGameplayMessage('3 Plant Part(s) became weightless Powder or Tea.'))
      .toBe('식물 부위 3개를 무게 없는 가루 또는 차로 만들었습니다.');
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

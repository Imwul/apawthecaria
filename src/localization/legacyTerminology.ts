import { normalizeGuildReputationTerms } from './guildReputation';

const USER_AUTHORED_CONTAINERS = new Set([
  'bio',
  'customMapLocations',
  'customMapEdges',
  'barrows',
  'journals',
  'journalEvents',
  'journeyChronicles',
  'travelScrapbook',
  'trinketArchive',
  'worldAlmanac',
  'legacyApothecaries',
  'legacyClinics',
  'familiarMemories',
  'inputValues',
  'trinkets'
]);

const USER_AUTHORED_FIELDS = new Set([
  'name',
  'title',
  'text',
  'label',
  'story',
  'species',
  'personality',
  'descriptor',
  'patientName',
  'journalNote',
  'initialRememberedNote',
  'memoir',
  'notes',
  'note',
  'resultSummary',
  'currentLocationName',
  'journeyOrigin',
  'journeyDestination',
  'journeyGoalTitle',
  'journeyGoalDesc',
  'journeyGoalProgress'
]);

export const polishLegacyRuleText = (text: string = ''): string => normalizeGuildReputationTerms(text
  .replace(/사역마/g, '길동무')
  .replace(/길동무\s*\(Familiar\)/g, '길동무')
  .replace(/Familiar/g, '길동무')
  .replace(/Bartering/g, '물꼬 거래')
  .replace(/Social Encounter Card Draw/g, '사교 조우 카드 뽑기')
  .replace(/Rarity Check Card Draw/g, '희귀도 판정 카드 뽑기')
  .replace(/Rarity/g, '희귀도')
  .replace(/Draw a Card/gi, '카드를 뽑습니다')
  .replace(/Draw another Card/gi, '카드를 한 장 더 뽑습니다')
  .replace(/Trinkets?/g, '장신구')
  .replace(/Reagents?/g, '영약재')
  .replace(/Journey/g, '여정')
  .replace(/Calendar/g, '일정')
  .replace(/\b(?:Guild\s+)?Reputation\b/g, 'Guild Reputation')
  .replace(/Foraging Points?|FP/g, '채집 포인트')
  .replace(/Behemoth/g, '거수')
  .replace(/\s+\)/g, ')'));

const isUserAuthoredPath = (path: readonly string[]): boolean =>
  path.some(segment => USER_AUTHORED_CONTAINERS.has(segment))
  || (path.length > 0 && USER_AUTHORED_FIELDS.has(path[path.length - 1]));

/**
 * Normalizes legacy rule-owned labels without rewriting prose the player
 * authored. Save migration must never silently edit a Journal sentence merely
 * because it happens to contain words such as "명성", "Journey", or "Reagent".
 */
export const migrateLegacyTerminology = (value: unknown, path: readonly string[] = []): unknown => {
  if (typeof value === 'string') {
    return isUserAuthoredPath(path) ? value : polishLegacyRuleText(value);
  }
  if (Array.isArray(value)) {
    return value.map((nested, index) => migrateLegacyTerminology(nested, [...path, String(index)]));
  }
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, nested]) => [key, migrateLegacyTerminology(nested, [...path, key])])
    );
  }
  return value;
};

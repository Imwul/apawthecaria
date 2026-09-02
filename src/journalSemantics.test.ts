import { describe, expect, it } from 'vitest';
import {
  appendPlayerFacingEngineJournals,
  createEncounterSemantic,
  createManualResolutionSemantic,
  createPlayerMemorySemantic,
  encounterOutcomeSummary,
  isActivityJournalEntry,
  isLongJournalMemory,
  journalEntriesNewestFirst,
  journalDisplayTitle,
  journalPreview,
  normalizeJournalSemantics,
  normalizeStoredJournalEntries,
  playerFacingEngineJournal,
  presentJournalEntry,
  type JournalEntryLike,
  type TimedJournalEntryLike
} from './journalSemantics';
import { formatManualEffectJournalEntry } from './manualEffectJournal';
import { ENCOUNTERS } from './rules/data/encounters';
import { localizeManualEffectOption } from './localization/manualEffectKo';

const timedEntry = (
  id: string,
  title = `기록 ${id}`,
  text = `내용 ${id}`,
  timestamp = 1
): TimedJournalEntryLike => ({ id, title, text, timestamp });

describe('Journal semantic boundaries', () => {
  it('records the scene instead of a generic navigation label without inventing player prose', () => {
    const semantic = createEncounterSemantic({
      note: '',
      outcome: '기록하고 계속\n추가로 바뀐 수치 없이 장면을 기록했습니다.',
      sourceTitle: '버릇없는 새',
      sourcePrompt: 'What are the birds saying?'
    });
    expect(semantic.category).toBe('gameplay-event');
    expect(semantic.memory).toBeUndefined();
    expect(semantic.outcome).toBe('「버릇없는 새」 장면을 기록했습니다.\n추가로 바뀐 수치 없이 장면을 기록했습니다.');
    expect(semantic.source?.prompt).toBe('What are the birds saying?');
  });

  it('replaces generated continue labels across every encounter family', () => {
    const genericEncounters = ENCOUNTERS.filter(encounter =>
      encounter.choices.some(choice => choice.label === '기록하고 계속'));
    expect(new Set(genericEncounters.map(encounter => encounter.encounterType))).toEqual(new Set(['travel', 'foraging', 'social']));
    for (const encounter of genericEncounters) {
      for (const choice of encounter.choices.filter(row => row.label === '기록하고 계속')) {
        const localized = localizeManualEffectOption(choice.label, encounter.id, choice.id);
        const outcome = encounterOutcomeSummary(localized, encounter.title);
        expect(outcome, encounter.id).not.toBe('기록하고 계속');
        expect(outcome, encounter.id).toContain(encounter.title);
      }
    }
  });

  it('preserves meaningful choices, consequences, and player memories that resemble button labels', () => {
    const choice = '그냥 지나가기 — 길드 명성 1을 잃습니다.';
    expect(encounterOutcomeSummary(choice, '홍수')).toBe(choice);
    const semantic = createEncounterSemantic({ note: '기록하고 계속', outcome: choice, sourceTitle: '홍수' });
    expect(semantic.memory).toBe('기록하고 계속');
    expect(semantic.outcome).toBe(choice);
  });

  it('repairs the display of old application-owned outcomes without changing stored notes', () => {
    const entry: JournalEntryLike = {
      title: '사회 조우: 버릇없는 새',
      text: '기록하고 계속',
      semantic: { version: 1, category: 'gameplay-event', origin: 'encounter', outcome: '기록하고 계속' }
    };
    expect(presentJournalEntry(entry).outcome).toBe('「버릇없는 새」 장면을 기록했습니다.');
    expect(entry.semantic?.outcome).toBe('기록하고 계속');
    expect(presentJournalEntry({ ...entry, semantic: { ...entry.semantic!, origin: 'player', memory: '기록하고 계속' } }).memory).toBe('기록하고 계속');
  });

  it('keeps a short Encounter note primary and separates outcome, context, and provenance', () => {
    const note = '검사관이 말없이 길을 열어 주었다.';
    const entry = {
      id: 'travel-encounter:short',
      title: '여정 조우: 검문',
      text: note,
      semantic: createEncounterSemantic({
        note,
        outcome: '통행 허가를 받았다.',
        location: 'Odoak',
        season: '봄',
        sourcePage: 162,
        sourceTitle: 'Inspection',
        sourcePrompt: 'Every traveller is stopped at the gate.',
        sourceChoices: ['Show your papers', 'Turn back']
      })
    };

    expect(presentJournalEntry(entry)).toEqual({
      category: 'player-memory',
      origin: 'encounter',
      memory: note,
      outcome: '통행 허가를 받았다.',
      context: { location: 'Odoak', season: '봄' },
      source: {
        page: 162,
        title: 'Inspection',
        prompt: 'Every traveller is stopped at the gate.',
        choices: ['Show your papers', 'Turn back']
      }
    });
    expect(journalPreview(entry)).toBe(note);
    expect(isLongJournalMemory(note)).toBe(false);
  });

  it('preserves a long multi-paragraph Encounter memory verbatim', () => {
    const note = [
      '첫 문단에는 젖은 풀 냄새를 적었다.',
      '',
      '둘째 문단에는  두 칸의 여백과 — 기호를 그대로 남겼다.',
      '셋째 줄.',
      '넷째 줄.',
      '다섯째 줄.',
      '여섯째 줄.',
      '마지막 줄.'
    ].join('\n');
    const entry = {
      id: 'forage-encounter:long',
      title: '채집 조우: 오래된 풀밭',
      text: note,
      semantic: createEncounterSemantic({ note, outcome: '채집을 마쳤다.' })
    };

    expect(presentJournalEntry(entry).memory).toBe(note);
    expect(isLongJournalMemory(note)).toBe(true);
  });

  it('treats a whitespace-only Encounter note as no player memory', () => {
    const semantic = createEncounterSemantic({
      note: '   ',
      outcome: '폭풍을 피해 빈 나무 아래에서 기다렸다.',
      sourcePrompt: 'Wait out the storm or press onward?'
    });
    const entry = {
      id: 'travel-encounter:no-note',
      title: '여정 조우: 폭풍',
      text: semantic.outcome || '',
      semantic
    };

    expect(presentJournalEntry(entry)).toMatchObject({
      category: 'gameplay-event',
      origin: 'encounter',
      memory: '',
      outcome: '폭풍을 피해 빈 나무 아래에서 기다렸다.'
    });
    expect(journalPreview(entry)).toBe('폭풍을 피해 빈 나무 아래에서 기다렸다.');
    expect(journalPreview(entry)).not.toContain('Wait out the storm');
  });

  it('parses the application-owned legacy social Encounter delimiter without exposing its page marker', () => {
    const entry = {
      id: 'legacy-social',
      title: '사회 조우: 도움의 발길',
      text: '[p.204] A traveller paws in to help.\n\n나의 선택: 곤란한 이웃을 위해 발 벗고 나섰다.'
    };

    expect(presentJournalEntry(entry)).toMatchObject({
      category: 'player-memory',
      origin: 'encounter',
      memory: '곤란한 이웃을 위해 발 벗고 나섰다.',
      source: {
        page: 204,
        prompt: 'A traveller paws in to help.'
      }
    });
    expect(journalPreview(entry)).toBe('곤란한 이웃을 위해 발 벗고 나섰다.');

    const [migrated] = normalizeStoredJournalEntries([{ ...entry, timestamp: 11 }]);
    expect(migrated.semantic).toBeDefined();
    expect(presentJournalEntry(migrated)).toMatchObject({
      memory: '곤란한 이웃을 위해 발 벗고 나섰다.',
      source: { page: 204, prompt: 'A traveller paws in to help.' }
    });
  });

  it('keeps player whitespace verbatim when migrating exact legacy Encounter delimiters', () => {
    const memory = '  첫 문장의 앞뒤 여백.\n\n둘째 문단 뒤 여백.  ';
    const current = {
      id: 'legacy-social-current',
      title: '사회 조우: 나무를 들어 올리다',
      text: `나의 기록: ${memory}\n\n조우 정보:\n장소: Odoak\n결과: 길을 열었습니다.`,
      timestamp: 15
    };
    const older = {
      id: 'legacy-social-choice',
      title: '사회 조우: 도움의 발길',
      text: `[p.204] A traveller paws in to help.\n\n나의 선택: ${memory}`,
      timestamp: 14
    };

    const migrated = normalizeStoredJournalEntries([current, older]);
    expect(presentJournalEntry(migrated[0]).memory).toBe(memory);
    expect(presentJournalEntry(migrated[1]).memory).toBe(memory);
    expect(normalizeStoredJournalEntries(migrated)).toEqual(migrated);
  });

  it('keeps an ambiguous pre-semantic Foraging record intact instead of guessing which prose was the player note', () => {
    const text = [
      'Mushroom Pickers — The junior picker studies a strange mushroom.',
      '',
      '나는  젖은 흙 냄새를 기억했다. · Rosehip 1개를 버렸다.'
    ].join('\n');
    const entry = {
      id: 'legacy-forage:resolved',
      title: '채집 조우: Mushroom Pickers',
      text
    };

    expect(presentJournalEntry(entry)).toEqual({
      category: 'player-memory',
      origin: 'encounter',
      memory: text,
      outcome: '',
      context: {},
      source: {}
    });
    expect(journalDisplayTitle(entry)).toBe('채집 조우: 버섯 채집꾼들');

    const [normalized] = normalizeStoredJournalEntries([{ ...entry, timestamp: 12 }]);
    expect(normalized).not.toHaveProperty('semantic');
    expect(presentJournalEntry(normalized).memory).toBe(text);
  });

  it('migrates only the exact legacy manual header and fixed override suffix while preserving its ambiguous body verbatim', () => {
    const text = formatManualEffectJournalEntry({
      ruleIds: ['FORAGE-006', 'TRAVEL-009'],
      sourcePage: 174,
      resultSummary: '채집 결과를 적용했다.',
      journalNote: '첫 문단에는  두 칸을 남겼다.\n\nSecond paragraph — 그대로.',
      overrideReason: '테이블 합의로 다른 결과를 적용했다.'
    });
    const entry = {
      id: 'manual-legacy:journal',
      title: '예외 처리: Paws In',
      text
    };

    expect(presentJournalEntry(entry)).toEqual({
      category: 'player-memory',
      origin: 'manual',
      memory: '채집 결과를 적용했다.\n\n첫 문단에는  두 칸을 남겼다.\n\nSecond paragraph — 그대로.',
      outcome: '',
      context: {},
      source: { page: 174, ruleIds: ['FORAGE-006', 'TRAVEL-009'] },
      audit: { overrideReason: '테이블 합의로 다른 결과를 적용했다.' }
    });
    expect(journalDisplayTitle(entry)).toBe('예외 처리: 발 벗고 돕기');
    expect(journalPreview(entry)).toContain('첫 문단에는 두 칸을 남겼다.');

    const once = normalizeStoredJournalEntries([{ ...entry, timestamp: 13 }]);
    const twice = normalizeStoredJournalEntries(once);
    expect(once[0].semantic).toBeDefined();
    expect(twice).toEqual(once);
    expect(presentJournalEntry(twice[0])).toMatchObject({
      category: 'player-memory',
      origin: 'manual',
      memory: '채집 결과를 적용했다.\n\n첫 문단에는  두 칸을 남겼다.\n\nSecond paragraph — 그대로.',
      source: { page: 174, ruleIds: ['FORAGE-006', 'TRAVEL-009'] },
      audit: { overrideReason: '테이블 합의로 다른 결과를 적용했다.' }
    });
  });

  it('does not interpret a player entry as manual metadata from its text alone', () => {
    const text = '[FORAGE-006 · p.174]\n내가 쓴 문장 — 그대로.\n\n예외 처리 사유: 이것도 내 문장이다.';
    const entry = { id: 'almost-manual', title: '낡은 기록', text };
    expect(presentJournalEntry(entry)).toEqual({
      category: 'player-memory',
      origin: 'player',
      memory: text,
      outcome: '',
      context: {},
      source: {}
    });
    const [normalized] = normalizeStoredJournalEntries([{ ...entry, timestamp: 14 }]);
    expect(normalized).not.toHaveProperty('semantic');
  });

  it('never reclassifies a player entry whose title resembles an engine event', () => {
    const memory = "  Barter: Nettles는 오늘 기억의 제목일 뿐이다.\n\nDowntime effects applied.도 내가 직접 쓴 문장이다.  ";
    const entries = normalizeStoredJournalEntries([{
      id: 'user_journal_engine_like_title',
      title: 'Barter: Nettles',
      text: memory,
      timestamp: 12
    }]);

    expect(entries[0]).not.toHaveProperty('semantic');
    expect(presentJournalEntry(entries[0])).toMatchObject({
      category: 'player-memory',
      origin: 'player',
      memory
    });
  });

  it('treats explicit player authorship as stronger than a legacy system-looking title', () => {
    const memory = '  이 제목은 내 기억의 일부일 뿐이다.  ';
    const [entry] = normalizeStoredJournalEntries([{
      id: 'imported-player-row',
      title: '친구들과 보낸 휴식',
      text: memory,
      authorship: 'player',
      playerMemory: memory,
      timestamp: 17
    }]);

    expect(entry).not.toHaveProperty('semantic');
    expect(presentJournalEntry(entry)).toMatchObject({
      category: 'player-memory',
      memory
    });
  });

  it('stores new manual records as separate memory, outcome, provenance, and raw audit context', () => {
    const memory = '  I chose the quieter path — 문장과 여백을 그대로.  ';
    const overrideReason = '  Table ruling: keep this English raw.  ';
    const semantic = createManualResolutionSemantic({
      resultSummary: 'Guild Reputation 1을 얻었습니다.',
      journalNote: memory,
      overrideReason,
      sourcePage: 168,
      sourceRuleIds: ['ENCOUNTER-168-PAWS-IN'],
      sourceTitle: 'Paws In',
      sourcePrompt: 'Paws in to help the locals.'
    });
    const presentation = presentJournalEntry({
      id: 'manual-current:journal',
      title: '직접 판정: Paws In',
      text: memory,
      semantic
    });

    expect(presentation).toMatchObject({
      category: 'player-memory',
      origin: 'manual',
      memory,
      outcome: 'Guild Reputation 1을 얻었습니다.',
      source: {
        page: 168,
        ruleIds: ['ENCOUNTER-168-PAWS-IN'],
        title: 'Paws In',
        prompt: 'Paws in to help the locals.'
      },
      audit: { overrideReason }
    });
    expect(presentation.outcome).not.toContain('예외 처리 사유');
    expect(journalDisplayTitle({ title: '직접 판정: Paws In', text: memory, semantic }))
      .toBe('직접 판정: 발 벗고 돕기');
  });

  it('keeps an explicit manual note as player memory even when it repeats the result', () => {
    const memory = '  내가 직접 적은 결과.  ';
    const semantic = createManualResolutionSemantic({
      resultSummary: '내가 직접 적은 결과.',
      journalNote: memory
    });

    expect(semantic).toMatchObject({
      category: 'player-memory',
      origin: 'manual',
      memory
    });
    expect(semantic.outcome).toBeUndefined();
    expect(presentJournalEntry({ title: '직접 판정', text: memory, semantic }).memory).toBe(memory);
  });

  it('keeps a manual result fallback as a gameplay event when the player wrote no note', () => {
    const semantic = createManualResolutionSemantic({
      resultSummary: 'Guild Reputation +1',
      journalNote: ' \n\t '
    });

    expect(semantic).toMatchObject({
      category: 'gameplay-event',
      origin: 'manual',
      outcome: 'Guild Reputation +1'
    });
    expect(semantic.memory).toBeUndefined();
    expect(presentJournalEntry({ title: '직접 판정', text: 'Guild Reputation +1', semantic })).toMatchObject({
      memory: '',
      outcome: 'Guild Reputation +1'
    });
  });

  it('migrates exact legacy Barrow engine rows as system outcomes, never player memories', () => {
    const entries = normalizeStoredJournalEntries([
      { id: 'legacy:uneasy', type: 'encounter', title: 'Uneasy Sleep: Challenge', text: 'Soporific Incense', timestamp: 1 },
      { id: 'legacy:bellies', type: 'encounter', title: 'The Bellies of Many: Attempt', text: 'Foraging attempt recorded; Timer is now 11.', timestamp: 2 },
      { id: 'legacy:inside', type: 'encounter', title: 'Inside Job: Failed', text: 'The plot happens before the concoction is finished.', timestamp: 3 },
      { id: 'legacy:pilfer', type: 'encounter', title: 'Pilfer Unnoticed: Journey Ended', text: 'No Tool or Benefit could prevent the fatal outcome.', timestamp: 4 }
    ]);

    expect(entries.every(entry => entry.semantic?.origin === 'engine')).toBe(true);
    expect(entries.every(entry => entry.semantic?.category === 'gameplay-event')).toBe(true);
    expect(entries.every(entry => presentJournalEntry(entry).memory === '')).toBe(true);
    expect(presentJournalEntry(entries[0]).outcome).toBe('수면 향');
    expect(presentJournalEntry(entries[1]).outcome).toBe('채집 시도를 기록했습니다. 현재 타이머는 11입니다.');
    expect(presentJournalEntry(entries[2]).outcome).toBe('조제물을 완성하기 전에 음모가 실행되었습니다.');
    expect(presentJournalEntry(entries[3]).outcome).toBe('치명적인 결과를 막을 도구나 혜택이 없어 여정이 끝났습니다.');

    expect(normalizeStoredJournalEntries(entries)).toEqual(entries);
  });

  it('never selects source provenance for the recent-entry preview', () => {
    const entry = {
      id: 'manual-encounter:source-heavy',
      title: '수동 조우 판정',
      text: '명성 1점을 얻었다.',
      semantic: createEncounterSemantic({
        note: '',
        outcome: '명성 1점을 얻었다.',
        location: 'Fort Bulrush',
        sourcePage: 187,
        sourceTitle: 'Paws In',
        sourcePrompt: 'This deliberately long English source must not become the recent memory preview.',
        sourceChoices: ['Internal choice ID: paws-in', 'Internal choice ID: pass-by']
      })
    };

    expect(journalPreview(entry)).toBe('명성 1점을 얻었다.');
    expect(journalPreview(entry)).not.toMatch(/187|Paws In|Internal choice|English source/);
  });

  it('does not rewrite punctuation, whitespace, or English inside player-authored prose', () => {
    const memory = "  Nettles와 'Downtime effects applied.'를 그대로 기억했다.\n\n다음 줄에는  두 칸을 남겼다.  ";
    const semanticEntry = {
      id: 'user_journal_verbatim',
      title: '내 기록',
      text: memory,
      semantic: createPlayerMemorySemantic(memory)
    };
    const legacyEntry = { id: 'user_journal_legacy', title: '오래된 기록', text: memory };

    expect(presentJournalEntry(semanticEntry).memory).toBe(memory);
    expect(presentJournalEntry(legacyEntry).memory).toBe(memory);
  });

  it('recovers the player reason from a legacy Journey start without exposing map ids', () => {
    const entry = {
      id: 'legacy-journey-start',
      type: 'travel',
      title: 'Journey started',
      text: 'marker-odoak to node-fort-bulrush. Reason: 약속을 지키러 간다. Goal: Justice.'
    };

    expect(presentJournalEntry(entry)).toEqual({
      category: 'player-memory',
      origin: 'engine',
      memory: '약속을 지키러 간다',
      outcome: '여정을 시작했습니다.',
      context: {},
      source: {}
    });
    expect(journalPreview(entry)).toBe('약속을 지키러 간다');
    expect(journalPreview(entry)).not.toMatch(/marker-odoak|node-fort-bulrush|Justice/);

    const [migrated] = normalizeStoredJournalEntries([entry]);
    expect(migrated.semantic).toMatchObject({
      category: 'player-memory',
      origin: 'engine',
      memory: '약속을 지키러 간다',
      outcome: '여정을 시작했습니다.'
    });
    expect(normalizeStoredJournalEntries([migrated])).toEqual([migrated]);
  });

  it('keeps a mirrored Chronicle memoir verbatim through the shared semantic presenter', () => {
    const memory = "  Nettles를 찾던 밤 — 번역하지 않는다.\n\n둘째 문단.  ";
    const scrapbookMirror = {
      id: 'scrap:chronicle-1',
      sourceId: 'chronicle-1',
      title: '내 첫 여정',
      text: memory,
      semantic: createPlayerMemorySemantic(memory)
    };

    expect(presentJournalEntry(scrapbookMirror).memory).toBe(memory);
    expect(journalPreview(scrapbookMirror)).toBe('Nettles를 찾던 밤 — 번역하지 않는다. 둘째 문단.');
  });

  it.each([
    ['barter-7:social-journal', '사교 조우: Paws In'],
    ['barter-7:social-note', '사교 조우 기록'],
    ['journey-7:reflection', '여정 출발 기록: Odoak']
  ])('recognizes known legacy player-note id %s without localizing its prose', (id, title) => {
    const memory = '내가 쓴 Short note — 그대로.';
    expect(presentJournalEntry({ id, title, text: memory })).toMatchObject({
      category: 'player-memory',
      origin: 'player',
      memory
    });
  });
});

describe('engine Journal boundary', () => {
  it('localizes known internal English before storage and classifies activity separately', () => {
    const barter = playerFacingEngineJournal({
      id: 'barter-1',
      type: 'encounter',
      authorship: 'system' as const,
      title: 'Barter: Nettles',
      text: 'BR 8; paid 2 Trinkets and 1 Reputation.'
    });
    const downtime = playerFacingEngineJournal({
      id: 'downtime-1',
      type: 'downtime',
      title: 'Downtime: lend-a-paw',
      text: 'Downtime effects applied.'
    });
    const leaving = playerFacingEngineJournal({
      id: 'leave-1',
      type: 'failure',
      title: 'Preparing to Leave',
      text: 'All Ailments were resolved before Moving On.'
    });
    const started = playerFacingEngineJournal({
      id: 'journey-1',
      type: 'travel',
      title: 'Journey started',
      text: 'Journey started'
    });

    expect(barter.title).toBe('물물교환: Nettles');
    expect(barter.text).toBe('기본 희귀도 8; 장신구 2개와 Guild Reputation 1점을 지불했습니다.');
    expect(barter.semantic.category).toBe('gameplay-event');
    expect(downtime.title).toBe('휴식기 활동: 도움의 손길');
    expect(downtime.text).toBe('휴식기 활동을 마쳤습니다.');
    expect(downtime.semantic.category).toBe('activity');
    expect(leaving.title).toBe('환자를 떠나보내고 다시 길 위로');
    expect(leaving.text).not.toMatch(/Preparing to Leave|Ailments|Moving On/);
    expect(started.title).toBe('여정 시작');
    expect(started.text).toBe('여정 시작');
    expect(isActivityJournalEntry(started)).toBe(true);
    expect(isActivityJournalEntry(barter)).toBe(false);
  });

  it('honours explicit player versus system authorship at the engine boundary', () => {
    const memory = "  I wrote this — 번역하거나 다듬지 않는다.\n둘째 줄.  ";
    const playerAuthored = playerFacingEngineJournal({
      id: 'ending-1:journal',
      type: 'travel',
      authorship: 'player' as const,
      title: 'Journey success',
      text: memory
    });
    const systemAuthored = playerFacingEngineJournal({
      id: 'journey-started:system',
      type: 'travel',
      authorship: 'system' as const,
      title: 'Journey started',
      text: 'Journey started'
    });

    expect(playerAuthored.text).toBe(memory);
    expect(playerAuthored.semantic).toMatchObject({ category: 'player-memory', memory });
    expect(systemAuthored.semantic.memory).toBeUndefined();
    expect(systemAuthored.text).toBe('여정 시작');
  });

  it('separates a Journey reason from the deterministic start outcome', () => {
    const memory = '먼 마을의 약속을 지키러 간다.';
    const started = playerFacingEngineJournal({
      id: 'journey-2:journal',
      type: 'travel',
      title: 'Journey started',
      text: 'Journey started',
      authorship: 'player' as const,
      playerMemory: memory
    });

    expect(started.text).toBe('Journey started');
    expect(presentJournalEntry(started)).toMatchObject({
      category: 'player-memory',
      memory,
      outcome: '여정 시작'
    });
  });

  it('keeps player prose primary without dropping a distinct deterministic outcome', () => {
    const memory = '  이웃들의 약장을 정리하며 보낸 저녁.  ';
    const result = playerFacingEngineJournal({
      id: 'downtime-general-practice:journal',
      type: 'downtime',
      authorship: 'player' as const,
      playerMemory: memory,
      title: 'Downtime: general-practice',
      text: 'Downtime effects applied.'
    });

    expect(result.semantic.memory).toBe(memory);
    expect(result.semantic.outcome).toBe('휴식기 활동을 마쳤습니다.');
    expect(result.semantic.outcome).not.toBe(result.title);
  });

  it('keeps engine rule provenance on demand instead of in the visible outcome', () => {
    const result = playerFacingEngineJournal({
      id: 'make-do-acquired:journal',
      type: 'foraging',
      authorship: 'system' as const,
      title: 'Make Do Acquired',
      text: 'Mossmilk acquired through forage; BR 12, Weight 2/3, target PAIN, source REMEDY-003.'
    });

    expect(result.semantic.outcome).not.toContain('REMEDY-003');
    expect(result.semantic.source?.ruleIds).toEqual(['REMEDY-003']);
  });

  it('prepends a chronological engine batch newest-first while retaining prior Journal order', () => {
    const current = [timedEntry('existing-new', '기존 최신'), timedEntry('existing-old', '기존 과거')];
    const events = [
      { id: 'event-1', type: 'travel', title: 'Journey started', text: 'Journey started' },
      { id: 'event-2', type: 'travel', title: '이동: Odoak', text: 'Odoak에 도착했다.' },
      { id: 'event-3', type: 'encounter', title: '조우 해결', text: '길을 비켜 주었다.' }
    ];

    const result = appendPlayerFacingEngineJournals(current, events, 77);

    expect(result.map(row => row.id)).toEqual([
      'event-3', 'event-2', 'event-1', 'existing-new', 'existing-old'
    ]);
    expect(result.slice(0, 3).every(row => row.timestamp === 77)).toBe(true);
  });
});

describe('legacy normalization and long-campaign accumulation', () => {
  it('recovers valid legacy photos and drops malformed photo values before rendering', () => {
    const rows = normalizeStoredJournalEntries<Array<TimedJournalEntryLike & { photos?: Array<Record<string, unknown>> }>[number]>([
      {
        id: 'photo-memory',
        title: '사진만 남긴 날',
        text: '',
        timestamp: 10,
        photos: [
          null,
          {},
          { id: 'kept', name: '숲.jpg', dataUrl: 'data:image/jpeg;base64,abc' },
          { dataUrl: 'https://example.invalid/legacy.jpg' }
        ]
      },
      { id: 'broken-only', title: '손상됨', text: '', timestamp: 11, photos: {} }
    ]);

    expect(rows).toHaveLength(1);
    expect(rows[0].photos).toEqual([
      { id: 'kept', name: '숲.jpg', dataUrl: 'data:image/jpeg;base64,abc' },
      { id: 'legacy-journal-photo:0:3', name: '사진 4', dataUrl: 'https://example.invalid/legacy.jpg' }
    ]);
    expect(presentJournalEntry(rows[0])).toMatchObject({ category: 'player-memory', memory: '' });
  });

  it('recovers a partially written row from valid semantic memory or outcome', () => {
    const memory = '  구조화된 기억은 남아 있다.\n\n둘째 문단.  ';
    const rows = normalizeStoredJournalEntries([
      {
        id: 'semantic-memory-only',
        title: '부분 저장 기억',
        timestamp: 20,
        semantic: createPlayerMemorySemantic(memory)
      },
      {
        id: 'semantic-outcome-only',
        title: '부분 저장 결과',
        timestamp: 21,
        semantic: createEncounterSemantic({ note: '', outcome: '비를 피해 하루를 보냈습니다.' })
      }
    ]);

    expect(rows).toHaveLength(2);
    expect(rows[0].text).toBe(memory);
    expect(presentJournalEntry(rows[0]).memory).toBe(memory);
    expect(rows[1].text).toBe('비를 피해 하루를 보냈습니다.');
    expect(presentJournalEntry(rows[1]).outcome).toBe('비를 피해 하루를 보냈습니다.');
    expect(normalizeStoredJournalEntries(rows)).toEqual(rows);
  });

  it.each([
    '환자 타이머 만료',
    '🏡 선배의 진료소 거점 휴식',
    '🐾 길동무 교감: 시간 보내기',
    '🌿 영약재 획득: Ancient Lichen',
    '🗺️ 거수 무덤 소문',
    '🧩 약재 대체: Rosehip',
    '친구들과 보낸 휴식',
    'Barter: Nettles'
  ])('keeps known legacy system row %s out of player memory', title => {
    expect(presentJournalEntry({ id: `legacy:${title}`, title, text: '시스템 결과' }).category)
      .toBe('gameplay-event');
  });

  it.each([
    '환자 타이머 만료',
    '🏡 선배의 진료소 거점 휴식',
    '🐾 길동무 교감: 시간 보내기',
    '🌿 영약재 획득: Ancient Lichen',
    '🗺️ 거수 무덤 소문',
    '🧩 약재 대체: Rosehip',
    '친구들과 보낸 휴식',
    'Barter: Nettles'
  ])('persists exact known legacy system row %s as engine semantics idempotently', title => {
    const row = { id: `legacy:${title}`, title, text: '시스템 결과', timestamp: 22 };
    const once = normalizeStoredJournalEntries([row]);
    const twice = normalizeStoredJournalEntries(once);

    expect(once[0].semantic).toMatchObject({
      version: 1,
      category: 'gameplay-event',
      origin: 'engine',
      outcome: '시스템 결과'
    });
    expect(twice).toEqual(once);
  });

  it('drops malformed semantic metadata and falls back without corrupting legacy player prose', () => {
    const memory = '문장부호 — 와\n줄바꿈을 보존한 오래된 기록';
    const malformed = [{
      id: 'legacy-untyped-row',
      title: '비 오는 저녁',
      text: memory,
      semantic: {
        version: 99,
        category: 'debug',
        origin: 'unknown',
        memory: '이 값으로 덮어쓰면 안 된다.'
      }
    }];

    const normalized = normalizeJournalSemantics(malformed);

    expect(normalized[0]).not.toHaveProperty('semantic');
    expect(presentJournalEntry(normalized[0] as unknown as JournalEntryLike)).toMatchObject({
      category: 'player-memory',
      memory
    });
  });

  it('drops obsolete type and authorship enums before conservatively reading legacy prose', () => {
    const memory = 'Barter: Nettles라는 표현도 내가 직접 남긴 원문이다.';
    const [entry] = normalizeStoredJournalEntries([{
      id: 'legacy-obsolete-enums',
      title: '개인 기록',
      text: memory,
      timestamp: 18,
      type: 'legacy-debug-state',
      authorship: 'unknown-author'
    }]);

    expect(entry).not.toHaveProperty('type');
    expect(entry).not.toHaveProperty('authorship');
    expect(presentJournalEntry(entry)).toMatchObject({
      category: 'player-memory',
      origin: 'player',
      memory
    });
  });

  it('normalizes valid and malformed semantic data idempotently without mutating its input', () => {
    const entries = [
      {
        id: 'valid',
        title: '기록',
        text: '기록',
        semantic: {
          version: 1,
          category: 'player-memory',
          origin: 'player',
          memory: '  원문 여백  ',
          context: { location: 'Odoak', ignored: 'internal' },
          source: {
            page: 12.8,
            ruleIds: [' FORAGE-006 ', '', 7, 'TRAVEL-009'],
            choices: ['선택 A', '', '   ', '선택 B'],
            internalId: 'do-not-keep'
          },
          audit: { overrideReason: '  원문과 다른 이유  ', internalId: 'do-not-keep' }
        }
      },
      {
        id: 'invalid',
        title: '레거시',
        text: '레거시 원문',
        semantic: { version: 1, category: 'debug', origin: 'engine' }
      }
    ];
    const snapshot = JSON.parse(JSON.stringify(entries));

    const once = normalizeJournalSemantics(entries);
    const twice = normalizeJournalSemantics(once);

    expect(twice).toEqual(once);
    expect(entries).toEqual(snapshot);
    expect(once[0].semantic).toEqual({
      version: 1,
      category: 'player-memory',
      origin: 'player',
      memory: '  원문 여백  ',
      context: { location: 'Odoak', season: undefined, patient: undefined, journey: undefined },
      source: {
        page: 12,
        ruleIds: ['FORAGE-006', 'TRAVEL-009'],
        title: undefined,
        prompt: undefined,
        choices: ['선택 A', '선택 B']
      },
      audit: { overrideReason: '  원문과 다른 이유  ' }
    });
    expect(once[1]).not.toHaveProperty('semantic');
  });

  it.each([5, 15, 31])('keeps %i accumulated events unique and newest-first', count => {
    const events = Array.from({ length: count }, (_, index) => ({
      id: `event-${index}`,
      type: 'encounter',
      title: `조우 ${index}`,
      text: `결과 ${index}`
    }));
    const withIncomingDuplicate = [...events, { ...events[2] }];

    const once = appendPlayerFacingEngineJournals([], withIncomingDuplicate, 100);
    const afterReloadLikeRepeat = appendPlayerFacingEngineJournals(once, events, 101);

    expect(once).toHaveLength(count);
    expect(new Set(once.map(row => row.id)).size).toBe(count);
    expect(once.map(row => row.id)).toEqual([...events].reverse().map(row => row.id));
    expect(afterReloadLikeRepeat.map(row => row.id)).toEqual(once.map(row => row.id));
  });

  it.each([5, 15, 31])('orders %i mixed imported records by timestamp without mutating equal-time order', count => {
    const entries = Array.from({ length: count }, (_, index) => ({
      id: `mixed-${index}`,
      title: `기록 ${index}`,
      text: `내용 ${index}`,
      timestamp: index % 6 === 0 ? Number.NaN : (index * 11) % 97
    }));
    const snapshot = [...entries];

    const ordered = journalEntriesNewestFirst(entries);

    expect(entries).toEqual(snapshot);
    expect(ordered.map(entry => Number.isFinite(entry.timestamp) ? entry.timestamp : 0))
      .toEqual([...ordered].map(entry => Number.isFinite(entry.timestamp) ? entry.timestamp : 0).sort((a, b) => b - a));
    const equalTimeEntries = [
      { id: 'first', timestamp: 9 },
      { id: 'second', timestamp: 9 },
      { id: 'third', timestamp: 9 }
    ];
    expect(journalEntriesNewestFirst(equalTimeEntries).map(entry => entry.id))
      .toEqual(['first', 'second', 'third']);
  });
});

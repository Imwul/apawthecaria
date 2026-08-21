export interface EncounterJournalPresentation {
  isEncounter: boolean;
  memory: string;
  context: string;
  metadata: {
    location?: string;
    season?: string;
    outcome?: string;
    result?: string;
  };
}

const ENCOUNTER_TITLE = /^(?:판정 대기|여정 조우|채집 조우):\s*/;
const DEFAULT_MEMORY = '별도 메모 없이 조우를 마쳤습니다.';

export const buildEncounterJournalText = ({
  printedText,
  note,
  supportingNote,
  location,
  season,
  outcome,
  result,
  pendingManualResolution = false
}: {
  printedText: string;
  note: string;
  supportingNote?: string;
  location?: string;
  season?: string;
  outcome?: string;
  result?: string;
  pendingManualResolution?: boolean;
}): string => {
  const memory = [note.trim(), supportingNote?.trim()].filter(Boolean).join(' · ') || DEFAULT_MEMORY;
  const metadata = [
    location?.trim() ? `장소: ${location.trim()}` : '',
    season?.trim() ? `계절: ${season.trim()}` : '',
    outcome?.trim() ? `선택: ${outcome.trim()}` : '',
    result?.trim() ? `결과: ${result.trim()}` : ''
  ].filter(Boolean);
  const metadataBlock = metadata.length > 0 ? `\n\n조우 정보:\n${metadata.join('\n')}` : '';
  const followUp = pendingManualResolution
    ? '\n\n이 조우의 인쇄된 후속 판정은 직접 판정 기록에서 이어집니다.'
    : '';
  return `나의 기록: ${memory}${metadataBlock}\n\n조우 맥락: ${printedText.trim()}${followUp}`;
};

const parseMetadata = (block = ''): EncounterJournalPresentation['metadata'] => {
  const metadata: EncounterJournalPresentation['metadata'] = {};
  block.split('\n').forEach(line => {
    const match = line.match(/^(장소|계절|선택|결과):\s*(.+)$/);
    if (!match) return;
    if (match[1] === '장소') metadata.location = match[2].trim();
    if (match[1] === '계절') metadata.season = match[2].trim();
    if (match[1] === '선택') metadata.outcome = match[2].trim();
    if (match[1] === '결과') metadata.result = match[2].trim();
  });
  return metadata;
};

export const presentEncounterJournal = (title: string, text: string): EncounterJournalPresentation => {
  const isEncounter = ENCOUNTER_TITLE.test(title);
  if (!isEncounter) return { isEncounter: false, memory: '', context: text, metadata: {} };

  const current = text.match(/^나의 기록:\s*([\s\S]*?)(?:\n\n조우 정보:\n([\s\S]*?))?(?:\n\n조우 맥락:\s*([\s\S]*))?$/);
  if (current) {
    return {
      isEncounter: true,
      memory: current[1].trim() || DEFAULT_MEMORY,
      context: (current[3] || '').trim(),
      metadata: parseMetadata(current[2])
    };
  }

  // Saves made before the encounter workspace separated the player's prose
  // only with “나의 선택”. Preserve those entries, but surface the prose first.
  const legacy = text.match(/^([\s\S]*?)\n\n나의 선택:\s*([\s\S]*)$/);
  if (legacy) {
    return {
      isEncounter: true,
      memory: legacy[2].trim() || DEFAULT_MEMORY,
      context: legacy[1].replace(/^\[p\.\d+\]\s*/, '').trim(),
      metadata: {}
    };
  }

  return { isEncounter: true, memory: DEFAULT_MEMORY, context: text.replace(/^\[p\.\d+\]\s*/, '').trim(), metadata: {} };
};

const ACTIVITY_TITLES = [
  /^(?:Journey|여정) started$/i,
  /^(?:Journey|여정) ended$/i,
  /^Guild Service Move$/i,
  /^Guild Services ready for (?:Journey|여정)$/i,
  / consumed$/i,
  /^이동:/,
  /^여정 시작$/,
  /^여정 종료$/,
  /^길드 서비스 이동$/,
  /^여정용 길드 서비스 준비$/
];

export const isActivityJournalEntry = (title: string): boolean =>
  ACTIVITY_TITLES.some(pattern => pattern.test(title.trim()));

export const GUILD_REPUTATION_RANKS = [
  { minimum: 35, label: 'Trusted' },
  { minimum: 25, label: 'Upstanding' },
  { minimum: 15, label: 'Established' },
  { minimum: 0, label: 'Unknown' }
] as const;

export type GuildReputationRank = (typeof GUILD_REPUTATION_RANKS)[number]['label'];

export const guildReputationRank = (reputation: number): GuildReputationRank =>
  GUILD_REPUTATION_RANKS.find(rank => reputation >= rank.minimum)?.label || 'Unknown';

/**
 * Keep the rulebook's named stat and its four ranks recognisable across the
 * Korean reading layer. Older saves and the generated translation fallback
 * can contain several Korean or hybrid spellings; normalising only those
 * explicit rule-term shapes avoids rewriting ordinary narrative uses of
 * "명성".
 */
export const normalizeGuildReputationTerms = (value: string): string => {
  let text = value
    .replace(/\bGuild\s+(?:길드(?:의)?\s*)?(?:명성|신뢰도|평판)(?=\s|[이가은는을를과와,:.!?]|$)/gi, 'Guild Reputation')
    .replace(/\b(?:the\s+)?Guild(?:'s|’s)\s+Reputation\b/gi, 'Guild Reputation')
    .replace(/\bGuild\s+Reputation\b/gi, 'Guild Reputation')
    .replace(/(?:치유\s+)?길드(?:의)?\s*(?:명성|신뢰도|평판)/g, 'Guild Reputation')
    .replace(/(?:길드|Guild)\s*(?:레벨|등급|Level)(?=\s|[이가은는을를과와,:.!?]|$)/gi, 'Guild Reputation')
    .replace(/길드(?:는|가|은|이)\s*(\d+)\s*(?:명성|평판)(?=\s|[을를은는이가,:.!?]|$)/g, 'Guild Reputation $1')
    .replace(/(\d+)\s*(?:명성|평판)(?=\s|[을를은는이가,:.!?]|$)/g, 'Guild Reputation $1')
    .replace(/(?:명성|평판)\s*([+−-]?\d+)(?=\s|점|개|[을를은는이가,:.!?]|$)/g, 'Guild Reputation $1')
    .replace(/(?:명성|평판)(을|를|은|는|이|가)\s*(?=(?:얻|잃|받|올|내리|높|낮|증가|감소|획득|추가|차감|변환|돌려받))/g, 'Guild Reputation$1 ');

  // Known machine-translation forms for the four printed ranks. Keep these
  // replacements anchored to the stat name so ordinary Korean adjectives are
  // never rewritten.
  text = text
    .replace(/Guild Reputation(?:을|를)?\s*신뢰하는 경우/g, 'Guild Reputation이 Trusted인 경우')
    .replace(/Guild Reputation(?:이|가)?\s*신뢰할 수 있는 경우/g, 'Guild Reputation이 Trusted인 경우')
    .replace(/Guild Reputation(?:이|가)?\s*신뢰할 수 있는/g, 'Guild Reputation이 Trusted인')
    .replace(/Guild Reputation(?:이|가)?\s*(?:똑바로 서 있으면|신망 있음이면|굳건하다면)/g, 'Guild Reputation이 Upstanding이면')
    .replace(/Guild Reputation(?:이|가)?\s*(?:직립 상태|직립|신망 있음|명망 높음)/g, 'Guild Reputation이 Upstanding')
    .replace(/Guild Reputation(?:이|가)?\s*(?:자리 잡음|인지도 있음|확립)/g, 'Guild Reputation이 Established')
    .replace(/Guild Reputation(?:이|가)?\s*(?:신뢰받음|신뢰할 수 있음)/g, 'Guild Reputation이 Trusted')
    .replace(/Guild Reputation(?:이|가)?\s*미등록/g, 'Guild Reputation이 Unknown')
    .replace(/Guild Reputation(?:이|가)?\s*알 수 없(?:는 경우|음)/g, 'Guild Reputation이 Unknown인 경우')
    .replace(/Guild Reputation(?:이|가)?\s*최소한 알려진(?: 경우)?/g, 'Guild Reputation이 Established 이상인 경우');

  // English rule names take the consonant-ending Korean particles used by
  // “Reputation”. These repairs also clean up substitutions in legacy saves.
  return text
    .replace(/Guild Reputation ([+−-]?\d+)개/g, 'Guild Reputation $1')
    .replace(/Guild Reputation(?:을|를)?\s*([+−-]\d+)/g, 'Guild Reputation $1')
    .replaceAll('Guild Reputation가', 'Guild Reputation이')
    .replaceAll('Guild Reputation를', 'Guild Reputation을')
    .replaceAll('Guild Reputation는', 'Guild Reputation은')
    .replaceAll('Guild Reputation로', 'Guild Reputation으로')
    .replaceAll('Guild Reputation와', 'Guild Reputation과');
};

/**
 * Canonical rule-owned copy may use the shortened English name or omit
 * "Guild" from a Korean stat reference entirely. This broader pass is only
 * for trusted UI copy; never apply it to prose supplied by the player.
 */
export const normalizeCanonicalGuildReputationTerms = (value: string): string =>
  normalizeGuildReputationTerms(
    normalizeGuildReputationTerms(value)
      .replace(/\b(?:Guild\s+)?Reputation\b/gi, 'Guild Reputation')
      .replace(/(?:\uBA85\uC131|\uC2E0\uB8B0\uB3C4|\uD3C9\uD310)/g, 'Guild Reputation')
  );

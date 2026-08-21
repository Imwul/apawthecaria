import { localizeInventoryItemName, localizePreparationMethod, localizePreparationName } from './localization/gameplayKo';
import { REAGENT_BY_ID, REAGENTS } from './rules/data/reagents';
import type { ReagentDefinition } from './rules/types';

// Only use established Korean common names here. Loanword transliterations are
// intentionally omitted: the rulebook's English name remains the stable label.
const EXACT_KOREAN_REAGENT_NAMES: Readonly<Record<string, string>> = {
  'Animal Sheddings': '동물 허물',
  Beech: '너도밤나무',
  Beehive: '벌집',
  Beetles: '딱정벌레',
  'Big Fish': '큰 물고기',
  'Bird Leavings': '새 배설물',
  Brambles: '가시덤불',
  Burdock: '우엉',
  Butterfly: '나비',
  Catnip: '개박하',
  Chalk: '백악',
  'Cherry Trees': '벚나무',
  Chillies: '고추',
  Clay: '점토',
  'Coarse Grit': '굵은 모래',
  Cucumbers: '오이',
  Dandelions: '민들레',
  'Doused Bonfires': '꺼진 모닥불',
  'Fine Sand': '고운 모래',
  'Fly Agaric': '광대버섯',
  'Forget-Me-Not': '물망초',
  'Frog Slime': '개구리 점액',
  Goosegrass: '갈퀴덩굴',
  'Haircap Moss': '솔이끼',
  Honeybees: '꿀벌',
  Horsetails: '쇠뜨기',
  'Iron Ore': '철광석',
  Leech: '거머리',
  Maggots: '구더기',
  Marigold: '금잔화',
  Marshgold: '동의나물',
  Nettles: '쐐기풀',
  Oak: '참나무',
  Pearls: '진주',
  Rhubarb: '대황',
  Ribwort: '창질경이',
  Rivermint: '강박하',
  'Rock Salt': '암염',
  Roses: '장미',
  Shells: '조개껍데기',
  'Silver Ore': '은광석',
  Slugs: '민달팽이',
  'Small Fish': '작은 물고기',
  Spiders: '거미',
  Strawberries: '딸기',
  Tansies: '쑥국화',
  Thistles: '엉겅퀴',
  Toads: '두꺼비',
  Wasps: '말벌',
  'White Willow': '흰버들',
  'Wild Garlic': '산마늘',
  'Wild Violet': '야생 제비꽃',
  Yarrow: '서양톱풀'
};

type ReagentItemLike = {
  canonicalReagentId?: string | null;
  name: string;
  quantity?: number | null;
  qty?: number | null;
};

type ParsedReagentItem = {
  reagent: ReagentDefinition | null;
  detail: string;
};

const splitItemName = (value: string): { base: string; preparation?: string; method?: string } => {
  const prepared = value.match(/^(.+?) \(([^,]+),\s*([^)]+)\)$/);
  if (prepared) return { base: prepared[1].trim(), preparation: prepared[2].trim(), method: prepared[3].trim() };
  const single = value.match(/^(.+?) \(([^)]+)\)$/);
  if (single) return { base: single[1].trim(), preparation: single[2].trim() };
  return { base: value.trim() };
};

const findReagent = (value: string, canonicalReagentId?: string | null): ReagentDefinition | null => {
  if (canonicalReagentId) {
    const byId = REAGENT_BY_ID.get(canonicalReagentId);
    if (byId) return byId;
  }
  const { base } = splitItemName(value);
  const normalized = base.toLocaleLowerCase();
  return REAGENTS.find(reagent =>
    reagent.canonicalName.toLocaleLowerCase() === normalized
    || reagent.displayName.toLocaleLowerCase() === normalized
  ) || null;
};

const parsedReagentItem = (value: string, canonicalReagentId?: string | null): ParsedReagentItem => {
  const parsed = splitItemName(value);
  const reagent = findReagent(value, canonicalReagentId);
  if (!reagent) return { reagent: null, detail: localizeInventoryItemName(value) };
  const detail = [
    parsed.preparation ? localizePreparationName(parsed.preparation) : '',
    parsed.method ? localizePreparationMethod(parsed.method.toLocaleUpperCase()) : ''
  ].filter(Boolean).join(' · ');
  return { reagent, detail };
};

export const formatReagentName = (reagent: ReagentDefinition): string => {
  const korean = EXACT_KOREAN_REAGENT_NAMES[reagent.canonicalName];
  return korean ? `${reagent.canonicalName} (${korean})` : reagent.canonicalName;
};

export const formatReagentItemName = (value: string, canonicalReagentId?: string | null): string => {
  const parsed = parsedReagentItem(value, canonicalReagentId);
  if (!parsed.reagent) return parsed.detail;
  const label = formatReagentName(parsed.reagent);
  return parsed.detail ? `${label} — ${parsed.detail}` : label;
};

export const groupReagentPartNames = (parts: readonly string[]): string[] => {
  const grouped = new Map<string, { label: string; details: string[] }>();
  const fallback: string[] = [];
  parts.forEach(part => {
    const parsed = parsedReagentItem(part);
    if (!parsed.reagent) {
      fallback.push(parsed.detail);
      return;
    }
    const current = grouped.get(parsed.reagent.id) || { label: formatReagentName(parsed.reagent), details: [] };
    if (parsed.detail && !current.details.includes(parsed.detail)) current.details.push(parsed.detail);
    grouped.set(parsed.reagent.id, current);
  });
  return [
    ...Array.from(grouped.values()).map(row => row.details.length > 0 ? `${row.label} — ${row.details.join(' / ')}` : row.label),
    ...fallback
  ];
};

const itemUnits = (item: ReagentItemLike): number => Math.max(1, item.quantity ?? item.qty ?? 1);

export const gatheredReagentSummary = (
  gatheredItems: readonly ReagentItemLike[],
  inventory: readonly ReagentItemLike[]
): string => {
  const grouped = new Map<string, { label: string; gained: number; total: number; details: string[] }>();
  gatheredItems.forEach(item => {
    const parsed = parsedReagentItem(item.name, item.canonicalReagentId);
    const key = parsed.reagent?.id || item.name;
    const current = grouped.get(key) || {
      label: parsed.reagent ? formatReagentName(parsed.reagent) : localizeInventoryItemName(item.name),
      gained: 0,
      total: inventory
        .filter(candidate => (parsed.reagent
          ? candidate.canonicalReagentId === parsed.reagent.id || findReagent(candidate.name)?.id === parsed.reagent.id
          : candidate.name === item.name))
        .reduce((sum, candidate) => sum + itemUnits(candidate), 0),
      details: []
    };
    current.gained += itemUnits(item);
    if (parsed.detail && !current.details.includes(parsed.detail)) current.details.push(parsed.detail);
    grouped.set(key, current);
  });
  return Array.from(grouped.values()).map(row =>
    `${row.label}${row.details.length > 0 ? ` — ${row.details.join(' / ')}` : ''} +${row.gained} · 현재 ${row.total}개`
  ).join(' · ');
};

export const reagentInventorySearchText = (item: ReagentItemLike): string => {
  const reagent = findReagent(item.name, item.canonicalReagentId);
  return [item.name, reagent?.canonicalName, reagent ? EXACT_KOREAN_REAGENT_NAMES[reagent.canonicalName] : '']
    .filter(Boolean)
    .join(' ')
    .toLocaleLowerCase();
};

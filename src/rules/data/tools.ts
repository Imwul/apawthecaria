import { canonicalMetadata } from '../source';
import type { ToolDefinition } from '../types';

type ToolSpec = Omit<ToolDefinition, 'rulebookEdition' | 'sourcePage' | 'source' | 'support'> & { page: number };

const tool = (spec: ToolSpec): ToolDefinition => {
  const { page, ...definition } = spec;
  return {
    ...definition,
    ...canonicalMetadata(page),
    support: 'structured-but-not-executed'
  };
};

export const TOOLS: readonly ToolDefinition[] = [
  tool({ id: 'belt-knife', canonicalName: 'Belt Knife', category: 'basic', weight: 1 / 3, cost: null, purchaseLocations: [], preparationMethods: [], almanackEntry: false, page: 12 }),
  tool({ id: 'mortar-and-pestle', canonicalName: 'Wooden Mortar and Pestle', category: 'basic', weight: 1 / 3, cost: null, purchaseLocations: [], preparationMethods: ['GROUND', 'CRUSHED'], almanackEntry: false, page: 12 }),
  tool({ id: 'camp-kettle', canonicalName: 'Battered Camp Kettle', category: 'basic', weight: 1 / 3, cost: null, purchaseLocations: [], preparationMethods: ['BOILED', 'BREWED'], almanackEntry: false, page: 12 }),
  tool({ id: 'teeth', canonicalName: 'Jaws', category: 'basic', weight: 0, cost: null, purchaseLocations: [], preparationMethods: ['CHEWED', 'DIGESTED'], almanackEntry: false, page: 12 }),
  tool({ id: 'paws', canonicalName: 'Paws/Claws', category: 'basic', weight: 0, cost: null, purchaseLocations: [], preparationMethods: ['ADDED', 'APPLIED'], almanackEntry: false, page: 12 }),
  tool({ id: 'canvas-tent', canonicalName: 'Canvas Tent', category: 'market', weight: 1, cost: 3, purchaseLocations: ['Meadow Settlement'], preparationMethods: [], almanackEntry: true, page: 62 }),
  tool({ id: 'copper-frying-pan', canonicalName: 'Copper Frying Pan', category: 'market', weight: 2 / 3, cost: 6, purchaseLocations: ['Mountain Settlement'], preparationMethods: ['COOKED'], almanackEntry: true, page: 62 }),
  tool({ id: 'big-iron-cauldron', canonicalName: 'Big Iron Cauldron', category: 'market', weight: 1, cost: 7, purchaseLocations: ['Mountain Settlement', 'Bog Settlement'], preparationMethods: ['DISTILLED', 'PRESERVED'], almanackEntry: true, page: 62 }),
  tool({ id: 'bark-coracle', canonicalName: 'Bark Coracle', category: 'market', weight: 1, cost: 5, purchaseLocations: ['Loch Settlement'], preparationMethods: [], almanackEntry: true, page: 62 }),
  tool({ id: 'basic-tools-replacement', canonicalName: 'Basic Tools', category: 'replacement', weight: 0, cost: 1, purchaseLocations: ['Any'], preparationMethods: [], almanackEntry: true, replacesToolIds: ['belt-knife', 'camp-kettle', 'mortar-and-pestle'], page: 62 }),
  tool({ id: 'crossbow', canonicalName: 'Crossbow', category: 'market', weight: 1, cost: 5, purchaseLocations: ['Spoolkeep'], preparationMethods: [], almanackEntry: true, page: 62 }),
  tool({ id: 'bolts', canonicalName: 'Bolts', category: 'market', weight: 1 / 3, cost: 1, purchaseLocations: ['Any'], preparationMethods: [], almanackEntry: true, page: 62 }),
  tool({ id: 'greenpaw-bandolier', canonicalName: 'Greenpaw Bandolier', category: 'market', weight: 1, cost: 5, purchaseLocations: ['Noonhill'], preparationMethods: [], almanackEntry: true, page: 63 }),
  tool({ id: 'glass-alembic', canonicalName: 'Glass Alembic', category: 'market', weight: 2 / 3, cost: 10, purchaseLocations: ['Loch Settlement'], preparationMethods: ['CATALYSED'], almanackEntry: true, page: 63 }),
  tool({ id: 'fine-spidersilk-net', canonicalName: 'Fine Spidersilk Net', category: 'market', weight: 1 / 3, cost: 4, purchaseLocations: ['Forest Settlement'], preparationMethods: [], almanackEntry: true, page: 63 }),
  tool({ id: 'fairwind-spices', canonicalName: 'Fairwind Spices', category: 'market', weight: 1, cost: 10, purchaseLocations: ['Odoak'], preparationMethods: [], almanackEntry: true, page: 63 }),
  tool({ id: 'fine-toothed-comb', canonicalName: 'Fine-toothed Comb', category: 'market', weight: 1 / 3, cost: 3, purchaseLocations: ['Forest Settlement', 'Mountain Settlement'], preparationMethods: [], almanackEntry: true, page: 63 }),
  tool({ id: 'knitting-needles', canonicalName: 'Knitting Needles', category: 'market', weight: 1 / 3, cost: 2, purchaseLocations: ['Noonhill'], preparationMethods: [], almanackEntry: true, page: 64 }),
  tool({ id: 'instruments', canonicalName: 'Instruments', category: 'market', weight: 1, cost: 5, purchaseLocations: ['Forest Settlement', 'Bog Settlement'], preparationMethods: [], almanackEntry: true, page: 64 }),
  tool({ id: 'titan-thingamabob', canonicalName: 'Titan Thingamabob', category: 'special', weight: 2 / 3, cost: null, purchaseLocations: [], preparationMethods: [], almanackEntry: true, page: 65 }),
  tool({ id: 'saddlebags', canonicalName: 'Saddlebags', category: 'market', weight: 0, cost: 3, purchaseLocations: ['Any'], preparationMethods: [], almanackEntry: true, page: 65 }),
  tool({ id: 'waxed-satchel', canonicalName: 'Waxed Satchel', category: 'market', weight: 1, cost: 5, purchaseLocations: ['Any'], preparationMethods: [], almanackEntry: true, page: 65 }),
  tool({ id: 'stilts', canonicalName: 'Stilts', category: 'market', weight: 1 / 3, cost: 3, purchaseLocations: ['Noonhill'], preparationMethods: [], almanackEntry: true, page: 65 })
];

export const TOOL_BY_ID = new Map(TOOLS.map(entry => [entry.id, entry]));
export const ALMANACK_TOOLS = TOOLS.filter(entry => entry.almanackEntry);

export const TOOL_REFERENCE_EFFECTS: Readonly<Record<string, string>> = {
  'belt-knife': '채집 카드가 영약재 희귀도보다 낮을 때 채집 포인트를 얻을 수 있게 하는 기본 도구입니다.',
  'mortar-and-pestle': 'GROUND와 CRUSHED 조제법을 사용할 수 있습니다.',
  'camp-kettle': 'BOILED와 BREWED 조제법을 사용할 수 있습니다.',
  teeth: 'CHEWED와 DIGESTED 조제법을 사용할 수 있습니다.',
  paws: 'ADDED와 APPLIED 조제법을 사용할 수 있습니다.',
  'canvas-tent': 'Weather 태그 이동 조우의 부정적 결과를 무시합니다. 사용 후 클로버 또는 스페이드를 뽑으면 파손되며, 정착지나 도시에서 장신구 2개로 수리합니다.',
  'copper-frying-pan': 'COOKED 조제법을 사용할 수 있습니다.',
  'big-iron-cauldron': 'DISTILLED 조제법과 PRESERVE를 사용할 수 있습니다. 일부 질환은 PRESERVED 치료제를 요구합니다.',
  'bark-coracle': '영약재를 버리지 않고 수로를 헤엄치며 Loch 위치에 멈출 수 있습니다. Loch에서 채집할 때 영약재 희귀도를 2 낮춥니다.',
  'basic-tools-replacement': '잃어버린 Belt Knife, Camp Kettle 또는 Mortar and Pestle의 기본 교체품을 구입합니다.',
  crossbow: 'Bolt 1개를 소비해 Beast 또는 Behemoth 태그 조우의 부정적 결과를 무시합니다. 조우에 석궁 전용 선택지가 있으면 그 지시를 따릅니다.',
  bolts: 'Crossbow로 발사하는 탄약이며 사용 후 버립니다.',
  'greenpaw-bandolier': 'Plant 또는 Insect 부위를 무게 5까지 담으며, 내용물과 관계없이 반도리어 전체 무게는 1입니다.',
  'glass-alembic': '치료제 조제 시 같은 태그를 가진 두 영약재를 CATALYSE하여 해당 태그 값을 합칩니다.',
  'fine-spidersilk-net': '채집할 때 Insect 영약재와 Small Fish의 희귀도를 3 낮춥니다.',
  'fairwind-spices': '모든 치료제에 FAIR 1을 더합니다.',
  'fine-toothed-comb': '치료제에 FUR 3과 PARASITE 1을 기여합니다. 사용 후 스페이드를 뽑으면 파손됩니다.',
  'knitting-needles': '여분 채집 대신 타이머를 사용해 뜨개질 프로젝트를 진행합니다. 타이머가 0인 동안에는 뜨개질할 수 없습니다.',
  instruments: '정착지나 도시에 들어가 사교 조우를 마친 뒤 공연해, 악기와 연주 가능한 발 한 쌍마다 장신구 1개를 얻습니다.',
  'titan-thingamabob': '오래된 Titan 장소 가까이에서 주기적으로 짹짹거리는 구입 불가 물건입니다.',
  saddlebags: '소지 한도를 2 늘립니다. 약제사와 동행 중인 길동무는 각각 한 세트의 효과만 받을 수 있습니다.',
  'waxed-satchel': '가방이 젖는 것을 막아 영약재를 버리지 않고 수로를 헤엄칠 수 있습니다.',
  stilts: 'Bog에서 이동을 시작하면 그 이동 동안 속도 1을 더합니다.'
};

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

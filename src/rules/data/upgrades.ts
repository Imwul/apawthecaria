import { canonicalMetadata } from '../source';
import type { CanonicalRuleRecord } from '../types';

export type ToolUpgradeTrigger = 'forage' | 'gather' | 'ailment-start' | 'treatment';

export interface ToolUpgradeDefinition extends CanonicalRuleRecord {
  id: string;
  canonicalName: string;
  baseToolId: 'mortar-and-pestle' | 'belt-knife' | 'camp-kettle';
  weight: number;
  trigger: ToolUpgradeTrigger;
  effect: string;
  sourcePage: number;
  ruleIds: string[];
}

export const TOOL_UPGRADES: readonly ToolUpgradeDefinition[] = [
  { id: 'steel-lined-mortar', canonicalName: 'Steel-Lined Mortar and Pestle', baseToolId: 'mortar-and-pestle', weight: 1 / 3, trigger: 'gather', effect: 'First GRIND/CRUSH Part gathered while Helping Local Beasts increases all Timers by 1.', ...canonicalMetadata(66), ruleIds: ['TOOL-003'] },
  { id: 'granite-mortar', canonicalName: 'Granite Mortar and Pestle', baseToolId: 'mortar-and-pestle', weight: 1, trigger: 'treatment', effect: 'POUND Plant BREW Parts into weightless Powders or Teas, up to Carry score.', ...canonicalMetadata(66), ruleIds: ['TOOL-003'] },
  { id: 'pairing-knife', canonicalName: 'Pairing Knife', baseToolId: 'belt-knife', weight: 0, trigger: 'forage', effect: 'Allows Foraging Points with no Weight.', ...canonicalMetadata(66), ruleIds: ['TOOL-003'] },
  { id: 'silver-sickle', canonicalName: 'Silver Sickle', baseToolId: 'belt-knife', weight: 2 / 3, trigger: 'forage', effect: 'Gain 1 additional Foraging Point whenever Foraging Points are gained.', ...canonicalMetadata(66), ruleIds: ['TOOL-003'] },
  { id: 'steel-axe', canonicalName: 'Steel Axe', baseToolId: 'belt-knife', weight: 1, trigger: 'ailment-start', effect: 'Gain 3 Foraging Points when an Ailment starts.', ...canonicalMetadata(66), ruleIds: ['TOOL-003'] },
  { id: 'efficient-copper-kettle', canonicalName: 'Efficient Copper Kettle', baseToolId: 'camp-kettle', weight: 2 / 3, trigger: 'gather', effect: 'Add 1 to one Timer when gathering a BOIL/BREW Reagent.', ...canonicalMetadata(66), ruleIds: ['TOOL-003'] },
  { id: 'double-boiler', canonicalName: 'Double Boiler', baseToolId: 'camp-kettle', weight: 1, trigger: 'treatment', effect: 'Increase one BOIL/BREW Reagent Potency by 1 when it is the only BOIL/BREW Reagent in the Remedy.', ...canonicalMetadata(66), ruleIds: ['TOOL-003'] }
];

export const TOOL_UPGRADE_BY_ID = new Map(TOOL_UPGRADES.map(row => [row.id, row]));

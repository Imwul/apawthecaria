import { canonicalMetadata } from '../source';
import type { CanonicalRuleRecord } from '../types';

export type AilmentWordingOperator = 'may' | 'must' | 'cannot' | 'unless' | 'if' | 'otherwise';
export type AilmentWordingResolution = 'requirement' | 'automatic' | 'structured-choice' | 'manual-narrative';

export interface AilmentWordingClause extends CanonicalRuleRecord {
  id: string;
  ailmentId: string;
  operator: AilmentWordingOperator;
  canonicalMeaning: string;
  resolution: AilmentWordingResolution;
  consumer: string;
  ruleIds: ['AILMENT-005'];
}

const clause = (
  page: number,
  ailmentId: string,
  id: string,
  operator: AilmentWordingOperator,
  canonicalMeaning: string,
  resolution: AilmentWordingResolution,
  consumer: string
): AilmentWordingClause => ({
  id: `${ailmentId}:${id}`,
  ailmentId,
  operator,
  canonicalMeaning,
  resolution,
  consumer,
  ruleIds: ['AILMENT-005'],
  ...canonicalMetadata(page)
});

// A compact normative concordance for every gameplay-changing conditional on pp.104-115.
// Descriptive uses of words such as "may scar" are intentionally excluded.
export const AILMENT_WORDING_CLAUSES: readonly AilmentWordingClause[] = [
  clause(104, 'ailment-bad-idea', 'no-foul', 'cannot', 'The Remedy contains no FOUL.', 'requirement', 'treatmentEngine BAD_IDEA_NO_FOUL'),
  clause(104, 'ailment-bad-idea', 'potency-three', 'if', 'Using Potency 3 Reagents grants one Basic Tool upgrade or reduces one Tool Weight by one third.', 'structured-choice', 'ailmentEffectEngine Inspiration'),
  clause(104, 'ailment-bite-the-hand-that-cures', 'find-first', 'must', 'Find the patient as BR 8 in the current or an adjacent Location before administering the Remedy.', 'automatic', 'patientEngine and foraging flow'),
  clause(104, 'ailment-bite-the-hand-that-cures', 'found-without-remedy', 'if', 'If found but untreated, apply the drawn Ailment consequence without Reputation loss.', 'automatic', 'ailmentEffectEngine AT_LEAST_THEYRE_HOME'),
  clause(105, 'ailment-brand-care', 'treat', 'if', 'Choosing treatment loses 2 Reputation.', 'structured-choice', 'ailmentEffectEngine brandCareChoice'),
  clause(105, 'ailment-brand-care', 'refuse', 'if', 'Refusing treatment gains 2 Reputation and ends this patient.', 'structured-choice', 'ailmentEffectEngine brandCareChoice'),
  clause(105, 'ailment-broken-beaks-and-thinning-fangs', 'silver', 'if', 'Silver Shards may make a prosthetic and grant 3 additional Reputation.', 'structured-choice', 'manual printed-effect transaction'),
  clause(105, 'ailment-broken-beaks-and-thinning-fangs', 'stay', 'may', 'After failure, mark 1 Day and draw another Ailment to stay and help; otherwise the patient perishes.', 'structured-choice', 'manual printed-effect transaction'),
  clause(106, 'ailment-fight-marks', 'both-and-joy', 'if', 'Treat both patients and forage JOY 3 to unlock reconciliation.', 'manual-narrative', 'manual printed-effect transaction'),
  clause(106, 'ailment-fight-marks', 'double-loss', 'if', 'If both patients succumb, apply Reputation loss twice.', 'automatic', 'multi-ailment failure transaction'),
  clause(107, 'ailment-forager-s-twitch', 'follow-up-card', 'if', 'A Club or Spade diagnosis draw adds WOUND 1; Heart or Diamond does not.', 'automatic', 'ailmentEffectEngine diagnosis card'),
  clause(107, 'ailment-groundhog-syndrome', 'three-patients', 'must', 'Treat three concurrent patients to quell the panic.', 'automatic', 'patientEngine repeatCount 3'),
  clause(107, 'ailment-groundhog-syndrome', 'warm-season-ban', 'cannot', 'Spring or Summer failure blocks Barter and Social events here and at the nearest Settlement until the end of next Season.', 'structured-choice', 'manual printed-effect transaction'),
  clause(107, 'ailment-groundhog-syndrome', 'cold-season-ban', 'cannot', 'Autumn or Winter failure blocks Plant and Insect Foraging within 2 Paths until the end of next Season.', 'structured-choice', 'manual printed-effect transaction'),
  clause(108, 'ailment-herbivorous-tendencies', 'settlement-service', 'if', 'If this Location is a Settlement, permanently remove one regional Service.', 'structured-choice', 'manual printed-effect transaction'),
  clause(108, 'ailment-hunted', 'spade-current', 'if', 'While Foraging at the current Location, a Spade summons the Behemoth, ends the event, reduces the Timer by 1, and grants no FP.', 'automatic', 'ailmentEffectEngine Hunted forage trigger'),
  clause(109, 'ailment-long-drop', 'unfound', 'if', 'Not finding the patient resolves the Unfound outcome rather than treatment.', 'manual-narrative', 'manual printed-effect transaction'),
  clause(109, 'ailment-mawfoam', 'bite-card', 'if', 'After making the Remedy, draw a card; a Spade bite requires another Mawfoam Remedy.', 'automatic', 'ailmentEffectEngine treatment follow-up'),
  clause(110, 'ailment-monthly-chore', 'stay-clean', 'may', 'After failure, staying to clean marks 1 Day and prevents Reputation loss.', 'structured-choice', 'manual printed-effect transaction'),
  clause(110, 'ailment-paw-rot', 'preserved', 'if', 'A PRESERVED Remedy enables the future grateful-patient Trinket.', 'structured-choice', 'manual printed-effect transaction'),
  clause(110, 'ailment-paw-rot', 'return-only', 'must', 'On the next visit, Paw Rot is the only Ailment that may be resolved.', 'structured-choice', 'manual follow-up condition'),
  clause(111, 'ailment-pinned-by-pine', 'free-patient', 'if', 'A Steel Axe or local Settlement help prevents the accelerated Timer loss.', 'automatic', 'ailmentEffectEngine PINNED_BY_PINE'),
  clause(111, 'ailment-pinned-by-pine', 'extra-timer-loss', 'otherwise', 'Without the Axe or help, every Timer decrease is increased by 1.', 'automatic', 'timer engine special state'),
  clause(111, 'ailment-quagmire-s-scale', 'poison-escalation', 'if', 'If unresolved when the Timer reaches 2, POISON 1 becomes POISON 3.', 'automatic', 'ailmentEffectEngine QUAGMIRE_SCALE'),
  clause(111, 'ailment-quagmire-s-scale', 'forced-overstay', 'must', 'Failure causes Overstay even when other Ailments were solved.', 'automatic', 'leaveEngine forced overstay'),
  clause(111, 'ailment-seasonshift', 'trim-fur', 'may', 'For a thick coat, cutting back fur may add 2 to the Timer.', 'structured-choice', 'manual printed-effect transaction'),
  clause(112, 'ailment-smokesnout', 'fire-brigade', 'may', 'Choose to reduce the Timer by 2 to fight the fire and gain 4 Reputation.', 'structured-choice', 'manual printed-effect transaction'),
  clause(112, 'ailment-soured-dough', 'four-timers', 'must', 'Treat four separate Ailments with four Timers and individual rewards.', 'automatic', 'patientEngine repeatCount 4'),
  clause(112, 'ailment-soured-dough', 'any-failure', 'if', 'If any patient is not cured, the next Remedy earns 0 Trinkets.', 'structured-choice', 'manual follow-up condition'),
  clause(112, 'ailment-stingshock', 'two-doses', 'if', 'Two Remedy doses grant Emergency Averted and 3 Reputation.', 'automatic', 'treatmentEngine doseCount'),
  clause(113, 'ailment-snail-ails', 'settlement-ban', 'cannot', 'Failure prevents visiting the nearest Settlement until next Season.', 'structured-choice', 'manual follow-up condition'),
  clause(113, 'ailment-the-runs', 'low-foul', 'if', 'FOUL 1 or less cures the patient, pays Trinkets, and also applies the consequence.', 'automatic', 'treatmentEngine foul branch'),
  clause(113, 'ailment-the-runs', 'high-foul', 'if', 'FOUL 2 or more cures the patient and combines FOUL with FAIR.', 'automatic', 'treatmentEngine foul branch'),
  clause(113, 'ailment-the-runs', 'woeful-waters', 'must', 'Mark the nearest Settlement and resolve Woeful Waters on the next visit.', 'structured-choice', 'manual follow-up condition'),
  clause(113, 'ailment-tickbitten-twice-shy', 'return-pair', 'must', 'On the next visit to the marked Settlement, replace the draw with two concurrent Tickbitten cases.', 'structured-choice', 'manual follow-up condition'),
  clause(114, 'ailment-titan-touched', 'before-zero', 'if', 'A Remedy before Timer 0 adds a nearby Titan Ruin joined by two Paths.', 'structured-choice', 'manual printed-effect transaction'),
  clause(114, 'ailment-trowel-trouble', 'potency-three', 'if', 'Potency 3 Reagents add a reasonable Path from this Location to another.', 'structured-choice', 'manual printed-effect transaction'),
  clause(115, 'ailment-wake', 'barter', 'if', 'Each Barter records what beasts say and increases this Ailment Timer by 1.', 'automatic', 'barterEngine Wake trigger'),
  clause(115, 'ailment-wake', 'cooked', 'if', 'A COOKED Remedy grants 2 additional Reputation and a memorial journal.', 'structured-choice', 'manual printed-effect transaction'),
  clause(115, 'ailment-wingbreak', 'setting', 'may', 'Set the wing with a long sturdy item or by donating a proper Tool.', 'requirement', 'requirements BONE_SETTING_ITEM'),
  clause(115, 'ailment-wingbreak', 'barter-rarity', 'if', 'Failure increases all Reagent Part Barter Rarity by 2 until the end of this Season.', 'structured-choice', 'manual follow-up condition'),
  clause(115, 'ailment-wormridden', 'foul-rule', 'if', 'FOUL cancels FAIR for this Ailment but adds no FOUL penalty.', 'automatic', 'treatmentEngine Wormridden branch')
];


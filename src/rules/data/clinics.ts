import { canonicalMetadata } from '../source';
import type { CanonicalRuleRecord } from '../types';

export interface ClinicAgendaDefinition extends CanonicalRuleRecord {
  id: string;
  canonicalName: string;
  requirement: string;
  effect: string;
  sourcePage: number;
  ruleIds: string[];
}

const agenda = (page: number, row: Omit<ClinicAgendaDefinition, keyof CanonicalRuleRecord | 'ruleIds'>): ClinicAgendaDefinition => ({ ...row, ...canonicalMetadata(page), ruleIds: ['CLINIC-003', 'CLINIC-004', 'CLINIC-005'] });

export const CLINIC_AGENDAS: readonly ClinicAgendaDefinition[] = [
  agenda(46, { id: 'pantry', canonicalName: 'Pantry', requirement: 'Reputation 15+', effect: 'Hibernate at Clinics; below 15 Reputation costs 15 Trinkets per occupant.' }),
  agenda(46, { id: 'library', canonicalName: 'Library', requirement: 'Visited Summit and completed Reconnecting with Guildmates', effect: 'Draw twice and choose when identifying an Ailment.' }),
  agenda(46, { id: 'hive-boxes', canonicalName: 'Hive Boxes', requirement: 'Visited Spoolkeep', effect: 'Store spare Companions and swap them at any Clinic.' }),
  agenda(46, { id: 'gardens', canonicalName: 'Gardens', requirement: 'Visited Noonhill', effect: 'Grow one Plant per Clinic; gather once per Ailment in Spring, Summer or Autumn.' }),
  agenda(46, { id: 'greenhouses', canonicalName: 'Greenhouses', requirement: 'Gardens and visited Glasswall', effect: 'Clinic Gardens remain available in Winter.' }),
  agenda(47, { id: 'sodden-logs', canonicalName: 'Sodden Logs', requirement: 'Visited Odoak', effect: 'Choose an Insect; gather once per Ailment outside Winter and reduce Timers by 1.' }),
  agenda(47, { id: 'taproom', canonicalName: 'Taproom', requirement: 'Visited Vessel', effect: 'Gain 1 Trinket per Clinic at Season end.' }),
  agenda(47, { id: 'hostel', canonicalName: 'Hostel', requirement: 'Taproom', effect: 'Taprooms generate 2 Trinkets per Clinic instead.' }),
  agenda(47, { id: 'mailbox', canonicalName: 'Mailbox', requirement: 'None', effect: 'Receive calls for help through the Guild mailbox.' }),
  agenda(47, { id: 'goodwill-stand', canonicalName: 'Goodwill Stand', requirement: 'None', effect: 'Donate Items; gain 1 Reputation per 1 Weight at Season end.' })
];

export const CLINIC_AGENDA_BY_ID = new Map(CLINIC_AGENDAS.map(row => [row.id, row]));

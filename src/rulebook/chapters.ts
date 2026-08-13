import type { RulebookReferenceEntry } from './types';

type ChapterSpec = Omit<RulebookReferenceEntry, 'id' | 'kind' | 'runtimeStatus' | 'details' | 'relatedIds' | 'searchText'> & { id: string };

const chapter = (spec: ChapterSpec): RulebookReferenceEntry => ({
  ...spec,
  id: `chapter:${spec.id}`,
  kind: 'rule',
  runtimeStatus: 'reference-only',
  details: [{ label: '범위', value: `p.${spec.sourcePage}${spec.endPage && spec.endPage !== spec.sourcePage ? `-${spec.endPage}` : ''}` }],
  relatedIds: [],
  searchText: `${spec.title} ${spec.summary} ${spec.ruleIds.join(' ')}`.toLowerCase()
});

export const RULEBOOK_CHAPTERS: RulebookReferenceEntry[] = [
  chapter({ id: 'introduction', title: 'Introduction', summary: '플레이 방식, 카드 값, 저널링, 안전과 원칙.', sourcePage: 6, endPage: 7, ruleIds: ['CORE-001'] }),
  chapter({ id: 'overview', title: 'Overview', summary: '전체 캠페인의 흐름과 주요 행동.', sourcePage: 8, endPage: 9, ruleIds: ['CORE-001'] }),
  chapter({ id: 'character', title: 'Introducing Yourself', summary: 'Apothecary, Travel Style, Equipment, Guild와 Familiar 생성.', sourcePage: 10, endPage: 17, ruleIds: ['CHARACTER-001', 'CHARACTER-002', 'CHARACTER-005'] }),
  chapter({ id: 'journey', title: 'Starting a Journey', summary: '목적지, 이유, 목표, Urgency와 Calendar 설정.', sourcePage: 18, endPage: 21, ruleIds: ['JOURNEY-001', 'JOURNEY-002'] }),
  chapter({ id: 'travel', title: 'Travelling', summary: 'Region, Path, Waterway, Move, Speed, Carry와 Soar.', sourcePage: 22, endPage: 25, ruleIds: ['TRAVEL-001', 'TRAVEL-002'] }),
  chapter({ id: 'ailment-basics', title: 'Explaining Ailments', summary: 'Severity, Timer, 복수 질환과 진단 절차.', sourcePage: 26, ruleIds: ['AILMENT-001', 'AILMENT-003', 'AILMENT-005'] }),
  chapter({ id: 'reagent-basics', title: 'Identifying Reagents', summary: 'Tag, Potency, Preparation과 Remedy 구성.', sourcePage: 27, ruleIds: ['REAGENT-001', 'TREATMENT-001'] }),
  chapter({ id: 'patients', title: 'Helping Local Beasts', summary: '환자 생성, 채집, 거래, 치료와 떠날 준비.', sourcePage: 28, endPage: 37, ruleIds: ['PATIENT-001', 'FORAGE-001', 'BARTER-001', 'LEAVE-006'] }),
  chapter({ id: 'journey-end', title: 'Ending a Journey', summary: '목표 결론, 보상, 평판과 다음 여정.', sourcePage: 38, endPage: 39, ruleIds: ['JOURNEY-006'] }),
  chapter({ id: 'downtime', title: 'Downtime', summary: '계절 사이 활동, General Practice, 수입과 영구 지도 효과.', sourcePage: 40, endPage: 43, ruleIds: ['DOWNTIME-001', 'SEASON-001'] }),
  chapter({ id: 'clinics', title: 'Clinics', summary: 'Clinic 설립, Agenda, 이용 조건과 계절 효과.', sourcePage: 44, endPage: 47, ruleIds: ['CLINIC-001', 'CLINIC-005'] }),
  chapter({ id: 'co-op', title: 'Co-op Play', summary: '선택형 협동 플레이북과 공동 캠페인 안내.', sourcePage: 48, endPage: 55, ruleIds: [] }),
  chapter({ id: 'general-almanack', title: 'General Almanack', summary: 'Trinkets, Guild Services, Tools, Upgrades, Wagon과 Companions.', sourcePage: 56, endPage: 73, ruleIds: ['ALMANACK-004', 'ALMANACK-005', 'ALMANACK-006'] }),
  chapter({ id: 'travel-encounters', title: 'Travel Encounters', summary: 'Bog, Forest, Loch, Meadow, Mountain, Soar와 Titan 이동 조우.', sourcePage: 74, endPage: 99, ruleIds: ['TRAVEL-009'] }),
  chapter({ id: 'ailment-codex', title: 'Named Ailments', summary: '45개 Named Ailment의 조건, 성공, 실패와 특수 규칙.', sourcePage: 102, endPage: 115, ruleIds: ['AILMENT-003', 'AILMENT-005'] }),
  chapter({ id: 'barrows', title: 'Barrow Delves', summary: '8종 Behemoth Barrow의 진입, 도전, 선택과 귀환.', sourcePage: 116, endPage: 125, ruleIds: ['BARROW-001'] }),
  chapter({ id: 'reagents', title: 'Reagents', summary: '83개 Reagent와 189개 Part/Preparation.', sourcePage: 126, endPage: 151, ruleIds: ['REAGENT-001'] }),
  chapter({ id: 'foraging-encounters', title: 'Foraging Encounters', summary: '6개 Region의 계절별 채집 조우.', sourcePage: 152, endPage: 187, ruleIds: ['FORAGE-001'] }),
  chapter({ id: 'social-encounters', title: 'Social Encounters', summary: 'Settlement와 City에서 만나는 Social encounter.', sourcePage: 188, endPage: 217, ruleIds: ['SOCIAL-001'] }),
  chapter({ id: 'sheets', title: 'Character Sheets', summary: '캠페인 기록지와 참고 시트.', sourcePage: 218, endPage: 220, ruleIds: [] })
];

export const CHAPTER_FOR_PAGE = (page: number) => RULEBOOK_CHAPTERS.find(entry => page >= entry.sourcePage && page <= (entry.endPage || entry.sourcePage));

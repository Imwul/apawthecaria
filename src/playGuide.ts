import { getCampaignNextAction, type CampaignContinuityState } from './campaignContinuity';
import type { PendingBarterState } from './rules/barterEngine';
import type { PendingEncounterState, PendingForagingState } from './rules/gameplay';
import type { PatientState } from './rules/state';
import type { RulebookReferenceRequest } from './rulebook/types';
import type { JournalTab } from './sessionNavigation';

/** A read-only projection. The existing engines and action hub own all actions. */
export interface PlayGuideState extends CampaignContinuityState {
  bio?: { name?: string; familiarName?: string };
  activeAilment?: { name?: string; timer?: number; foragingPoints?: number } | null;
  pendingEncounter?: PendingEncounterState | null;
  pendingForaging?: PendingForagingState | null;
  pendingBarter?: PendingBarterState | null;
  patients?: PatientState[];
  bag?: Array<{ type?: string; canonicalReagentId?: string; provenance?: { source?: string } }>;
  patientArchive?: Array<{ treatmentResult?: string; success?: boolean; remedyParts?: string[] }>;
  patientCasebook?: Array<{ outcome?: string; remedy?: string[] }>;
  pendingPatientArchive?: { outcome?: string; remedy?: string[] } | null;
  journeyChronicles?: unknown[];
  completedSeasons?: number;
  visitedLocations?: string[];
}

export interface GuideTarget {
  tab: JournalTab;
  targetId?: string;
  actionId?: string;
}

export interface GuideNextAction extends GuideTarget {
  title: string;
  reason: string;
  label: string;
  urgent?: boolean;
  reference: RulebookReferenceRequest;
}

export interface GuideStep {
  title: string;
  body: string;
  target?: GuideTarget;
}

export interface GuidePage {
  title: string;
  steps: GuideStep[];
  tip: string;
  reference: RulebookReferenceRequest;
}

const reference = (entryId: string, page: number, title: string): RulebookReferenceRequest => ({ entryId, page, title });
export const getGuideNextAction = (state: PlayGuideState): GuideNextAction => getCampaignNextAction(state);

const moveSteps: GuideStep[] = [
  { title: '여정 채비', body: '목적지·목표·기한을 정하고 출발합니다. 여정 목표는 여행 중 기록과 획득, 치료로 채워갑니다.' },
  { title: '이동하고 만남 해결하기', body: '현재 속도에 맞는 경로를 확정하고 이동 카드를 뽑습니다. 도착지의 이동·사회 조우를 먼저 해결합니다.', target: { tab: 'play', targetId: 'route-planning-panel' } },
  { title: '진료하고 약재 찾기', body: '환자의 요구 약효와 치료 기한을 확인합니다. 부족한 부위를 채집하거나 거래하고 조제 도구를 선택합니다.', target: { tab: 'play', targetId: 'patient-clinic-panel' } },
  { title: '치료, 기록, 다음 걸음', body: '처방을 적용하고 진료 기록을 마감합니다. 떠날 준비를 마치고 이동을 반복하며, 목적지에서 결말과 휴식기로 이어갑니다.' }
];

export const GUIDE_PAGES: Record<JournalTab, GuidePage> = {
  play: {
    title: '한 번의 여정은 이렇게 흘러가요', steps: moveSteps,
    tip: '여정의 달력은 일, 환자의 치료 기한은 시간입니다. 이동은 보통 달력 1일, 채집·거래는 환자 치료 기한에 영향을 줍니다.',
    reference: reference('chapter:overview', 8, '전체 플레이 순서')
  },
  ailments: {
    title: '진료 수첩에서 처방 읽기', steps: [
      { title: '현재 환자부터', body: '오늘의 여행에서 환자 카드를 뽑아 진단합니다. 이 수첩은 질환을 찾아보고 치료 조건을 대조하는 곳입니다.', target: { tab: 'play', targetId: 'patient-clinic-panel' } },
      { title: '요구 약효와 기한', body: '태그 옆 숫자는 필요한 약효의 세기입니다. “그리고”는 모두, “또는”은 제시된 대안 중 하나를 맞춥니다. 복수 질환은 각 치료 기한을 확인합니다.' },
      { title: '특수 조건까지 확인', body: '추가 재료, 별도 복용 횟수, 성공·실패의 후속 지시가 있는지 읽고 현재 조제대로 돌아갑니다.', target: { tab: 'play', targetId: 'treatment-workspace' } }
    ],
    tip: '일반 약효는 같은 태그를 두 개 넣어도 합산하지 않습니다. PAIN 1 두 개는 PAIN 1이고, PAIN 2 재료가 있어야 PAIN 2가 됩니다. 촉매 조제는 별도 조건을 따릅니다.',
    reference: reference('procedure:treatment', 27, '질환과 요구 약효')
  },
  reagents: {
    title: '필요한 부위를 찾아보세요', steps: [
      { title: '약효로 찾기', body: '환자에게 필요한 태그를 검색하거나 필터로 골라 해당 약효를 가진 영약재를 찾습니다.' },
      { title: '지금 구할 수 있는지', body: '현재 지역과 계절의 가용성, 희귀도, 부위의 계절 제한을 확인합니다. 같은 영약재라도 부위마다 약효와 조제법이 다릅니다.' },
      { title: '도구와 시간 확인', body: '필요한 부위와 조제 도구를 기록한 뒤 오늘의 여행에서 채집·거래합니다. 도감 열람 자체로 약재를 얻지는 않습니다.', target: { tab: 'play', targetId: 'patient-acquisition-panel' } }
    ],
    tip: '일반 채집은 현재 장소 1시간, 인접 지역 2시간이며, 추가 부위마다 1시간이 더 듭니다. 영약재 확보와 채집 조우를 해결한 뒤 치료 기한을 반영합니다. 바로 치료할 재료가 모였으면 먼저 조제합니다.',
    reference: reference('procedure:foraging', 32, '영약재 찾기와 채집 시간')
  },
  bio: {
    title: '배낭을 펼쳐 다음 걸음 준비하기', steps: [
      { title: '약제사와 길동무', body: '이동 방식은 기본 속도와 소지 한도를 정합니다. 길동무의 도움과 장비 효과도 함께 확인합니다.' },
      { title: '가방의 부위와 도구', body: '재료의 약효·조제법·남은 사용 횟수를 살핍니다. 분쇄에는 절구, 끓이기·우리기에는 주전자처럼 알맞은 도구가 필요합니다.' },
      { title: '무게부터 점검', body: '총 무게가 소지 한도를 넘으면 이동 속도가 1이 됩니다. 마차·수납 장비·수로 보호를 확인한 뒤 길로 돌아갑니다.', target: { tab: 'play', targetId: 'route-planning-panel' } }
    ],
    tip: '장신구는 거래와 서비스에 쓰는 자원이고 길드 명성은 약제사의 평판입니다. 구매·보상·직접 판정의 결과를 적용할 때 각각의 변화를 확인하세요.',
    reference: reference('procedure:tools', 62, '도구와 여행 장비')
  },
  map: {
    title: '지도는 경로를 고르는 곳이에요', steps: [
      { title: '출발과 도착 구분', body: '현재 위치에서 이어진 경로를 차례로 고릅니다. 여정의 목적지와 이번 이동의 도착지는 다를 수 있습니다.' },
      { title: '속도를 채우는 경로', body: '이번 이동은 현재 속도만큼 경로 비용을 써야 합니다. 너무 가깝거나 먼 도착지, 물길·호수·비행 제한은 경로 안내에서 확인합니다.' },
      { title: '확정하고 카드 뽑기', body: '경로 초안을 확인한 뒤 오늘의 여행에서 이동을 적용합니다. 지도에서 지점을 보는 것만으로 이동하거나 날짜가 흐르지는 않습니다.', target: { tab: 'play', targetId: 'route-planning-panel' } }
    ],
    tip: '물길을 지날 때 보호 장비가 없으면 젖는 약재를 잃을 수 있습니다. 일반적으로 호수의 야생 장소에는 멈출 수 없으므로 정착지·도시 또는 허용 장비를 확인하세요.',
    reference: reference('procedure:move', 22, '이동과 물길')
  },
  almanack: {
    title: '필요한 규칙만 펼쳐보세요', steps: [
      { title: '이름이나 용어로 검색', body: '도구, 서비스, 동반자, 질환, 영약재와 조우를 이름이나 규칙 용어로 찾습니다.' },
      { title: '조건과 효과 읽기', body: '가격뿐 아니라 이용 장소, 사용할 수 있는 시점, 여정·계절별 제한과 소비 여부를 확인합니다.' },
      { title: '실제 행동으로 돌아가기', body: '구매와 사용은 오늘의 여행에서 현재 장소의 기능을 통해 진행합니다. 직접 판정이 남으면 결과와 후속 작업을 끝까지 기록합니다.', target: { tab: 'play', targetId: 'downtime-panel' } }
    ],
    tip: '자동으로 적용되는 결과와 플레이어의 선택이 필요한 결과가 함께 있습니다. 선택이 필요한 경우 판정 창의 설명과 입력 항목을 따라 진행하세요.',
    reference: reference('chapter:general-almanack', 56, '장비·서비스·동반자')
  },
  patientArchive: {
    title: '한 명의 진료를 끝까지 남기기', steps: [
      { title: '환자와 처방 돌아보기', body: '지난 환자의 질환, 처방, 성공·실패와 그때의 이야기를 찾아봅니다.' },
      { title: '남은 기록 마감', body: '현재 진료의 기록이 대기 중이면 오늘의 여행에서 마지막 메모를 작성하고 마감합니다.', target: { tab: 'play', targetId: 'pending-archive-panel' } },
      { title: '경험을 다음 처방으로', body: '이전에 썼던 부위와 도구를 참고하되, 새 환자의 요구 태그·기한·특수 조건을 다시 확인합니다.', target: { tab: 'ailments' } }
    ],
    tip: '실패한 치료에도 후속 결과가 있습니다. 치료 기한이 끝난 경우 결과와 필요한 후속 판정을 해결한 뒤 떠날 준비를 합니다.',
    reference: reference('procedure:leave', 36, '진료 마감과 떠날 준비')
  },
  livingArchive: {
    title: '숫자 사이에 이야기를 남겨보세요', steps: [
      { title: '표본과 기념품 살펴보기', body: '길에서 모은 발견과 장신구의 사연을 펼쳐봅니다.' },
      { title: '만남의 흔적 연결하기', body: '장소, 환자, 영약재와 조우의 기록을 따라 그날의 장면을 돌아봅니다.' },
      { title: '아직 말하지 않은 기억', body: '짧은 문장이나 사진으로 남기고 싶은 장면이 있으면 일지에 적습니다.', target: { tab: 'journals' } }
    ],
    tip: '게임이 계산한 결과에 더해 누가 있었고 어떤 일이 기억에 남았는지를 적어보세요. 이야기 기록을 요구하는 여정 목표는 해당 목표의 증거도 확인합니다.',
    reference: reference('chapter:introduction', 7, '이야기와 일지')
  },
  journals: {
    title: '일지는 길 위의 기억이에요', steps: [
      { title: '장소와 장면', body: '언제 어디에서 누구를 만났는지, 선택 뒤 어떤 일이 일어났는지를 짧게 적습니다.' },
      { title: '여정 목표와 연결', body: '길동무·갈등·지역 관찰처럼 기록이 필요한 목표가 있다면 오늘의 여행에서 해당 목표의 진행을 함께 확인합니다.', target: { tab: 'play', targetId: 'active-journey-panel' } },
      { title: '다음 장면으로', body: '기록을 마치면 길잡이가 안내하는 현재 작업으로 돌아갑니다. 판정 창에 남은 선택이 있다면 먼저 마무리합니다.' }
    ],
    tip: '어떤 결말을 고르든 실제 일어난 일과 선택을 남길 수 있습니다. 직접 쓴 문장과 게임이 남긴 결과가 함께 여행 기록을 이룹니다.',
    reference: reference('chapter:introduction', 7, '일지 쓰기')
  }
};

export interface GuideMilestone extends GuideTarget {
  id: string;
  title: string;
  body: string;
  complete: boolean;
  current: boolean;
}

export const getFirstPlayMilestones = (state: PlayGuideState): GuideMilestone[] => {
  const closed = state.journey?.status === 'completed' || state.journey?.status === 'abandoned'
    || Boolean(state.journeyChronicles?.length || state.completedSeasons);
  const treated = Boolean(state.patients?.some(patient => patient.treatmentHistory?.some(row => row.outcome === 'success'))
    || state.patientArchive?.some(record => record.success || record.treatmentResult === 'success')
    || state.patientCasebook?.some(record => record.outcome === 'success') || state.pendingPatientArchive?.outcome === 'success');
  const acquired = Boolean(state.bag?.some(item => item.type === 'reagent'
      && ['forage', 'barter'].includes(item.provenance?.source || '')) || treated
    || state.patients?.some(patient => patient.reagentsGathered?.length)
    || state.patientArchive?.some(record => record.remedyParts?.length)
    || state.patientCasebook?.some(record => record.remedy?.length) || state.pendingPatientArchive?.remedy?.length);
  const metPatient = Boolean(state.patients?.length || state.activeAilment || state.patientArchive?.length
    || state.patientCasebook?.length || state.pendingPatientArchive);
  const beganJourney = Boolean(state.journey && state.journey.status !== 'setup' || state.journeyActive || closed);
  const steps = [
    { id: 'character', title: '나의 약제사', body: '이름, 동물, 이동 방식과 길동무를 정합니다.', complete: Boolean(state.bio?.name?.trim()), tab: 'bio' as JournalTab },
    { id: 'journey', title: '여정 채비', body: '목적지·목표·기한을 정하고 출발합니다.', complete: beganJourney, tab: 'play' as JournalTab, targetId: 'journey-start-panel' },
    { id: 'patient', title: '이동과 만남', body: '이동 조우를 해결하고 현지 환자를 진단합니다.', complete: metPatient, tab: 'play' as JournalTab, targetId: 'patient-clinic-panel' },
    { id: 'reagents', title: '약재 찾기', body: '요구 약효를 가진 부위를 채집하거나 거래합니다.', complete: acquired, tab: 'reagents' as JournalTab },
    { id: 'close', title: '치료와 여정 마감', body: '조제·진료·떠날 준비를 반복하고 목적지에서 결말을 기록합니다.', complete: closed, tab: 'play' as JournalTab, targetId: 'action-hub' }
  ];
  const next = steps.findIndex(step => !step.complete);
  return steps.map((step, index) => ({ ...step, current: index === next }));
};

export interface GuideTerm {
  id: string;
  title: string;
  aliases: string[];
  description: string;
  example?: string;
  reference: RulebookReferenceRequest;
}

export const GUIDE_TERMS: GuideTerm[] = [
  { id: 'card', title: '카드 값', aliases: ['A', 'J', 'Q', 'K', 'M', '모나크', 'Monarch'], description: 'A는 1, 숫자 카드는 그대로, J는 11, Q와 K는 모두 M(12)로 봅니다. 표에 따라 숫자 대신 무늬를 읽기도 합니다.', reference: reference('table:card-values', 6, '카드 값') },
  { id: 'journey', title: '여정', aliases: ['Journey', '목표', '목적지'], description: '목적지와 이유, 목표, 기한을 정하고 여러 번 이동하는 하나의 여행입니다. 목적지에서 실제 달성과 기록을 확인하고 결말을 고릅니다.', reference: reference('procedure:journey-start', 18, '여정') },
  { id: 'move', title: '이동 속도와 경로', aliases: ['Move', 'Speed', 'Path', '이동'], description: '이번 이동은 현재 속도만큼 경로 비용을 사용합니다. 이동을 적용하면 도착 장소의 조우를 이어서 해결합니다.', reference: reference('procedure:move', 22, '이동 속도와 경로') },
  { id: 'carry', title: '소지 한도', aliases: ['Carry', 'Weight', '무게', '배낭'], description: '가방에 실을 수 있는 무게입니다. 총 무게가 한도를 넘으면 이동 속도는 1이며 비행할 수 없습니다.', reference: reference('procedure:move', 22, '소지 한도') },
  { id: 'timer', title: '치료 기한', aliases: ['Timer', '타이머', '시간', 'Calendar', '달력'], description: '질환을 치료할 수 있는 남은 시간입니다. 여정의 달력(일)과 별도로 움직이며 채집·거래·조우로 변합니다. 0이 되면 질환의 실패 결과를 해결합니다.', reference: reference('procedure:diagnosis', 26, '치료 기한과 달력') },
  { id: 'tag', title: '약효 태그와 세기', aliases: ['Tag', 'Potency', '포텐시', '약효', 'PAIN', 'WOUND'], description: '태그는 약효의 종류, 옆 숫자는 세기입니다. 일반 태그는 조합한 재료 중 가장 높은 값만 사용합니다.', example: 'PAIN 1 + PAIN 1 → PAIN 1. PAIN 2 + PAIN 1 → PAIN 2.', reference: reference('procedure:treatment', 27, '약효 태그와 세기') },
  { id: 'fair-foul', title: '좋은 성질과 불쾌한 성질', aliases: ['FAIR', 'FOUL', '향미', '공정', '불쾌', '페어', '파울'], description: '치료제의 좋은 성질(FAIR)과 불쾌한 성질(FOUL)입니다. 각각 더한 뒤 서로 상쇄하며 보상과 일부 질환의 특수 조건에 영향을 줍니다.', example: '좋은 성질 3과 불쾌한 성질 1을 가진 치료제의 순수 좋은 성질은 2입니다.', reference: reference('procedure:treatment', 27, '좋은 성질과 불쾌한 성질') },
  { id: 'part', title: '영약재, 부위, 조제', aliases: ['Reagent', 'Part', 'Preparation', 'Remedy', '약재', '치료제'], description: '영약재는 재료의 종류, 부위는 꽃·뿌리 같은 실제 재료, 조제는 그 부위를 사용하는 방법입니다. 같은 영약재도 부위·조제법에 따라 태그와 필요한 도구가 달라집니다.', reference: reference('chapter:reagent-basics', 27, '영약재와 조제') },
  { id: 'rarity', title: '희귀도', aliases: ['Rarity', 'BR', 'Base Rarity', '가용성'], description: '영약재를 구하기 위한 기준값입니다. 지역, 계절, 도구와 특수 효과로 바뀌며, 구할 수 없는 지역·계절도 있습니다.', reference: reference('procedure:foraging', 32, '희귀도') },
  { id: 'fp', title: '채집 포인트', aliases: ['FP', 'Foraging Points', '포인트'], description: '사용 가능한 허리칼(Belt Knife)이나 그 개조 도구가 있을 때 채집 실패로 1점을 얻습니다. 칼이 없거나 부서졌다면 일반 실패점수를 얻지 못하며, 길동무·조우의 별도 점수는 해당 효과에 따릅니다. 카드가 희귀도보다 낮으면 차이만큼 쓸 수 있고, 포인트 자체가 희귀도 이상이면 쓰지 않고 채집할 수 있습니다.', example: '희귀도 6, 카드 4, FP 2라면 2를 써서 채집합니다. FP 6이면 소비하지 않습니다.', reference: reference('procedure:foraging', 32, '채집 포인트') },
  { id: 'barter', title: '물물교환', aliases: ['Barter', 'Bartering', '거래'], description: '현재 또는 인접 정착지·도시에서 영약재 부위를 구합니다. 사회 조우 뒤 거래 카드를 판정하고 필요한 대가를 지불합니다. 한 환자의 질환에 정착지 1회, 도시 3회 제한을 확인하세요.', reference: reference('procedure:bartering', 34, '물물교환') },
  { id: 'reputation', title: '길드 명성과 장신구', aliases: ['Guild Reputation', 'Reputation', 'Trinket', 'Trinkets', '평판', '돈'], description: '명성은 약제사의 평판이고 장신구는 교환 자원입니다. 치료 보상, 거래, 서비스와 선택의 결과로 변하며 각각 따로 기록합니다.', reference: reference('chapter:general-almanack', 56, '길드 명성과 장신구') },
  { id: 'moving-on', title: '길 떠나기(Moving On)', aliases: ['떠날 준비', 'Preparing to Leave', 'Scrounging', '여분 채집'], description: '진료 결과와 남은 조우를 마감하는 절차입니다. 남은 시간으로 여분 채집을 하거나 길 떠나기(Moving On)를 선택해 다음 이동을 준비할 수 있습니다.', reference: reference('procedure:leave', 36, '길 떠나기') },
  { id: 'scrounging', title: '여분 채집', aliases: ['Scrounging', '남은 시간', '여분 약재'], description: '치료를 마치고 모든 치료 기한이 0보다 클 때 남은 시간을 씁니다. 카드 채집은 현재 지역 1시간·인접 지역 2시간, 약효 2 이하 부위를 직접 확보하면 현재 지역 3시간·인접 지역 4시간입니다. 필수 조우를 마친 뒤 언제든 길을 떠날 수 있습니다.', reference: reference('procedure:leave', 37, '여분 채집 비용과 조건') },
  { id: 'make-do', title: '대용품 쓰기', aliases: ['Make Do', 'MakeDo', '대용품', '대체 약효'], description: '필요한 약효보다 1 높은 세기의 대용품을 실제 채집하거나 거래하여 확보합니다. 더 강한 대용품이 이 질환을 어떻게 가라앉히는지 이야기로 남깁니다. 탐색 조건을 정하는 것만으로 배낭에 생기지는 않습니다.', reference: reference('procedure:treatment', 30, '대용품 쓰기(Make Do)') },
  { id: 'replacement', title: '대안 영약재 만들기', aliases: ['Replacement', '대안', '대체 재료'], description: '필요한 약효를 제공하는 새 영약재의 이름과 부위를 정합니다. 기본 희귀도는 12, 무게는 2/3입니다. 채집이나 거래에 성공해 실제로 확보한 뒤 도감과 일지에 기록합니다.', reference: reference('procedure:treatment', 30, '대안 영약재(Replacement)') },
  { id: 'downtime', title: '휴식기', aliases: ['Downtime', '계절', 'Season'], description: '여정 뒤 활동 하나를 고르고 혜택을 적용하는 시간입니다. 활동을 마치면 계절 정산을 통해 수입과 계절 효과를 반영하고 다음 여정을 준비합니다.', reference: reference('procedure:downtime', 40, '휴식기') },
  { id: 'barrow', title: '거수 고분', aliases: ['Behemoth', 'Barrow', 'Delve', '고분', '탐사'], description: '거수가 남긴 고분에서는 일반 진료 대신 고분 도전을 진행합니다. 도전마다 시간, 선택과 결과가 다르므로 현재 도전의 안내를 따릅니다.', reference: reference('procedure:barrows', 116, '거수 고분') },
  { id: 'catalyse', title: '촉매 조제', aliases: ['CATALYSE', 'Catalysed', '증류기', '유리 증류기'], description: '유리 증류기를 사용하면 같은 태그를 가진 두 영약재의 해당 약효를 합칠 수 있습니다. 일반 조제와 달리 도구와 촉매 대상을 지정해야 합니다.', reference: reference('tool:glass-alembic', 63, '촉매 조제') }
];

export const searchGuideTerms = (query: string): GuideTerm[] => {
  const words = query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  return GUIDE_TERMS.filter(term => {
    const text = [term.title, ...term.aliases, term.description, term.example || ''].join(' ').toLocaleLowerCase();
    return words.every(word => text.includes(word));
  });
};

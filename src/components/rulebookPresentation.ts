import {
  localizeCanonicalToolName,
  localizePreparationMethod,
  localizeRegionLabel,
  localizeSeasonLabel
} from '../localization/gameplayKo';
import type { PersonalRulebookState, RulebookReferenceKind } from '../rulebook/types';

export const RULEBOOK_KIND_LABELS: Record<RulebookReferenceKind, string> = {
  rule: '챕터',
  procedure: '절차',
  encounter: '조우',
  ailment: '질환',
  'printed-effect': '원문 효과',
  remedy: '처방 재료',
  ingredient: '영약재',
  tag: '약효 태그',
  tool: '도구',
  service: '서비스',
  clinic: '약제소',
  wagon: '마차',
  companion: '동료',
  barrow: '고분',
  downtime: '휴식기',
  region: '지역',
  season: '계절',
  table: '표',
  example: '예시',
  guidance: '플레이 지침',
  source: '원문 페이지'
};

export const RULEBOOK_STATUS_LABELS: Record<string, string> = {
  canonical: '정식 규칙',
  automatic: '자동 처리',
  manual: '직접 판정',
  ambiguous: '원문 확인 필요',
  'reference-only': '원문 참고',
  pending: '판정 대기',
  resolved: '해결 완료',
  override: '예외 기록'
};

export const RULEBOOK_DETAIL_LABELS: Record<string, string> = {
  'Canonical name': '원문 이름',
  Type: '분류',
  Category: '범주',
  'Base Rarity': '기본 희귀도',
  Preparation: '조제법',
  Region: '지역',
  Season: '계절',
  Ingredient: '영약재',
  Potency: '약효',
  Weight: '무게',
  Uses: '사용 횟수',
  'Required Tool': '필요 도구',
  Restrictions: '특수 조건',
  Location: '구입 위치',
  Cost: '가격',
  Effect: '효과',
  Trigger: '발동 조건',
  Severity: '중증도',
  Timer: '남은 시간',
  Requirement: '필요 약효',
  Stacks: '중첩 여부',
  Replacement: '대체 도구',
  'Base Tool': '기본 도구',
  'Canonical consumer': '앱 적용 경로',
  'Related remedies': '관련 처방 재료',
  'Related ailments': '관련 질환',
  'Canonical handling': '앱 처리 방식',
  'Source section': '원문 구간',
  Target: '적용 대상',
  Duration: '지속 기간',
  'Map effect': '지도 변화',
  Class: '거수 분류',
  'Next Season': '다음 계절',
  Travel: '이동 조우',
  Foraging: '채집 조우'
};

type ConsultationCategory = PersonalRulebookState['consultations'][number]['category'];

export const CONSULTATION_CATEGORY_LABELS: Record<ConsultationCategory, string> = {
  'rule wording': '규칙 문구',
  encounter: '조우',
  ailment: '질환',
  remedy: '처방',
  table: '표',
  map: '지도',
  season: '계절',
  example: '예시',
  guidance: '플레이 지침',
  terminology: '용어'
};

const directDetailValueLabels: Record<string, string> = {
  ANIMAL: '동물',
  PLANT: '식물',
  INSECT: '곤충',
  EARTH: '광물',
  TITAN: '티탄',
  remedy: '처방',
  trade: '거래품',
  lesser: '가벼움',
  intermediate: '보통',
  severe: '심각함',
  dire: '위급함',
  Yes: '예',
  No: '아니요',
  none: '없음',
  true: '해당',
  false: '해당 없음',
  travel: '이동',
  foraging: '채집',
  social: '사교',
  narrative: '서사 선택',
  'structured-choice': '구조화된 선택',
  deterministic: '자동 판정',
  'external-player': '플레이어가 직접 처리',
  reagent: '영약재',
  journey: '여정',
  upgrade: '개조',
  move: '이동',
  'map-edge': '지도 연결',
  'map-node': '지도 위치',
  settlement: '정착지',
  'pending-delivery': '전달할 때까지',
  'once-per-journey': '여정마다 한 번',
  'until-destination': '목적지까지',
  instant: '즉시',
  'three-moves': '이동 3회',
  'until-next-spring': '다음 봄까지',
  'add-path': '경로 추가',
  'convert-waterways': '수로 변경',
  'temporary-region': '지역 일시 변경',
  'remove-threat': '위협 제거',
  Towering: '거대한 체구',
  Many: '무리',
  Violent: '사나움',
  Demanding: '까다로움'
};

const availabilityLabels: Record<string, string> = {
  Common: '흔함',
  Rare: '드묾',
  Unavailable: '없음'
};

const locationLabels: Record<string, string> = {
  'Starting / special': '시작 장비 또는 특수 획득',
  Any: '모든 장소',
  'Any City': '모든 도시',
  'Any Settlement or City': '모든 정착지와 도시',
  'Bog Settlement': '늪지 정착지',
  'Forest Settlement': '숲 정착지',
  'Loch Settlement': '호수 정착지',
  'Meadow Settlement': '초원 정착지',
  'Mountain Settlement': '산맥 정착지'
};

const localizeToolList = (value: string): string => value
  .split(',')
  .map(item => localizeCanonicalToolName(item.trim()))
  .join(' · ');

export const formatRulebookDetailValue = (label: string, value: string): string => {
  if (label === 'Cost' && value === 'Not sold') return '판매하지 않음';
  if (label === 'Location') return value.split(',').map(item => locationLabels[item.trim()] || item.trim()).join(' · ');
  if (label === 'Region' || label === 'Season') {
    if (!value.includes(':')) {
      if (label === 'Season' && value === 'Any Season') return '모든 계절';
      return label === 'Region' ? localizeRegionLabel(value) : localizeSeasonLabel(value);
    }
    return value.split(' / ').map(pair => {
      const [id, availability] = pair.split(':').map(part => part.trim());
      const localizedId = label === 'Region' ? localizeRegionLabel(id) : localizeSeasonLabel(id);
      return `${localizedId}: ${availabilityLabels[availability] || availability}`;
    }).join(' · ');
  }
  if (label === 'Preparation') return value.split(',').map(item => localizePreparationMethod(item.trim())).join(' · ');
  if (label === 'Required Tool' || label === 'Base Tool' || label === 'Replacement') {
    return value === 'none' || value === '아님' ? '없음' : localizeToolList(value);
  }
  if (label === 'Weight') {
    const weight = Number(value);
    if (!Number.isFinite(weight)) return value;
    if (Math.abs(weight - 1 / 3) < 0.001) return '1/3';
    if (Math.abs(weight - 2 / 3) < 0.001) return '2/3';
    return Number.isInteger(weight) ? String(weight) : weight.toFixed(1);
  }
  if (label === 'Next Season') return localizeSeasonLabel(value);
  return directDetailValueLabels[value] || value;
};

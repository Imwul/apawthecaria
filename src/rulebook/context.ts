import { localizeRegionLabel, localizeSeasonLabel } from '../localization/gameplayKo';
import { getCampaignNextAction } from '../campaignContinuity';
import type { JournalTab } from '../sessionNavigation';
import type { RulebookReferenceRequest } from './types';

export const referenceForJournalTab = (tab: JournalTab, state: any): RulebookReferenceRequest => {
  if (tab === 'play') return getCampaignNextAction(state).reference;
  if (tab === 'ailments') return { page: 26, query: state.activeAilment?.name || 'Ailment', title: '질환과 진료 조건' };
  if (tab === 'reagents') return { page: 27, entryId: 'chapter:reagents', title: '영약재 부위와 조제' };
  if (tab === 'bio') return { page: 10, entryId: 'chapter:character', title: '약제사와 여행 채비' };
  if (tab === 'map') return { entryId: `region:${state.currentRegion}`, page: 23, title: `${localizeRegionLabel(state.currentRegion)} 이동 규칙`, context: [{ label: '현재 위치', value: state.currentLocationName || '미기록' }, { label: '현재 계절', value: localizeSeasonLabel(state.currentSeason) }] };
  if (tab === 'almanack') return { page: 56, entryId: 'chapter:general-almanack', title: '도구·서비스·길동무' };
  if (tab === 'patientArchive') return { page: 28, entryId: 'chapter:patients', title: '환자와 진료 기록' };
  if (tab === 'livingArchive') return { page: 7, entryId: 'chapter:introduction', title: '기억과 저널링' };
  return { page: 7, entryId: 'chapter:introduction', title: '저널링과 캠페인 기록' };
};

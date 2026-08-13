import { localizeRegionLabel, localizeSeasonLabel } from '../localization/gameplayKo';
import type { JournalTab } from '../components/JournalExperience';
import type { RulebookReferenceRequest } from './types';

export const referenceForJournalTab = (tab: JournalTab, state: any): RulebookReferenceRequest => {
  if (tab === 'play' && (state.activePatientId || state.activeAilment)) return { entryId: 'procedure:treatment', page: 27, title: '현재 Treatment 맥락' };
  if (tab === 'play') return { entryId: state.journeyActive ? 'procedure:move' : 'procedure:journey-start', page: state.journeyActive ? 22 : 18, title: state.journeyActive ? '현재 이동 맥락' : 'Journey 시작 맥락' };
  if (tab === 'ailments') return { page: 26, query: state.activeAilment?.name || 'Ailment', title: '진료와 Ailment' };
  if (tab === 'reagents') return { page: 27, entryId: 'chapter:reagents', title: 'Reagent와 Preparation' };
  if (tab === 'bio') return { page: 10, entryId: 'chapter:character', title: 'Apothecary 만들기' };
  if (tab === 'map') return { entryId: `region:${state.currentRegion}`, page: 23, title: `${localizeRegionLabel(state.currentRegion)} 이동 규칙`, context: [{ label: '현재 위치', value: state.currentLocationName || '미기록' }, { label: '현재 계절', value: localizeSeasonLabel(state.currentSeason) }] };
  if (tab === 'almanack') return { page: 56, entryId: 'chapter:general-almanack', title: 'General Almanack' };
  if (tab === 'patientArchive') return { page: 28, entryId: 'chapter:patients', title: '환자와 진료 기록' };
  if (tab === 'livingArchive') return { page: 7, entryId: 'chapter:introduction', title: '기억과 저널링' };
  return { page: 7, entryId: 'chapter:introduction', title: '저널링과 캠페인 기록' };
};

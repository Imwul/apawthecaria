import { describe, expect, it } from 'vitest';
import { getPatientArrivalPreview } from './patientArrivalPreview';

describe('patient arrival preview', () => {
  it('separates impression and diagnosis while retaining every ailment and follow-up note', () => {
    expect(getPatientArrivalPreview({
      title: '새 환자: 토끼',
      text: '첫인상: 낯을 가리는 · 풍성한 털\n병증: 첫 열병 (가벼움, 8시간)\n부상 (중함, 4시간)\n\n남은 후속 판정'
    })).toEqual({ impression: '낯을 가리는 · 풍성한 털', diagnosis: '첫 열병 (가벼움, 8시간)\n부상 (중함, 4시간)\n\n남은 후속 판정' });
  });
  it('does not reinterpret player-written or unlabelled writing', () => {
    const entry = { title: '새 환자: 나의 이야기', text: '첫인상: 나의 문장\n병증: 비유로 쓴 문장' };
    expect(getPatientArrivalPreview({ ...entry, authorship: 'player' })).toBeNull();
    expect(getPatientArrivalPreview({ ...entry, semantic: { version: 1, category: 'player-memory', origin: 'player', memory: entry.text } })).toBeNull();
    expect(getPatientArrivalPreview({ title: '그날 만난 환자', text: entry.text })).toBeNull();
    expect(getPatientArrivalPreview({ title: '새 환자: 토끼', text: '라벨이 없는 오래된 기록' })).toBeNull();
    expect(getPatientArrivalPreview(null)).toBeNull();
  });
});

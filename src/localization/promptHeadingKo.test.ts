import { describe, expect, it } from 'vitest';
import { localizePromptHeading } from './encounterTitleKo';

describe('localizePromptHeading', () => {
  it('swaps leading English encounter names for their Korean titles', () => {
    expect(localizePromptHeading('What Remains · 빌린 도구를 돌려줄까요?')).toBe('남겨진 것 · 빌린 도구를 돌려줄까요?');
    expect(localizePromptHeading('Damselfly 동료 칸 만들기')).toBe('실잠자리 동료 칸 만들기');
    expect(localizePromptHeading('Right Place, Wrong Time · 가장 가까운 정착지')).toBe('잘못 찾아온 순간 · 가장 가까운 정착지');
    expect(localizePromptHeading('Password · p.184')).toBe('암호 · p.184');
  });

  it('leaves proper nouns and Korean text alone', () => {
    expect(localizePromptHeading('Knowers에게 Sketch를 건넬까요?')).toBe('Knowers에게 Sketch를 건넬까요?');
    expect(localizePromptHeading('Obridge · 물물교환')).toBe('Obridge · 물물교환');
    expect(localizePromptHeading('여행 기록 선택')).toBe('여행 기록 선택');
  });
});

import { describe, expect, it } from 'vitest';

import {
  guildReputationRank,
  normalizeCanonicalGuildReputationTerms,
  normalizeGuildReputationTerms
} from './guildReputation';

describe('Guild Reputation presentation', () => {
  it('uses the four printed rank names at their canonical thresholds', () => {
    expect([0, 14, 15, 24, 25, 34, 35, 50].map(guildReputationRank)).toEqual([
      'Unknown', 'Unknown',
      'Established', 'Established',
      'Upstanding', 'Upstanding',
      'Trusted', 'Trusted'
    ]);
  });

  it('normalizes Korean, possessive, and hybrid names without touching ordinary fame prose', () => {
    expect(normalizeGuildReputationTerms('길드 명성 1을 얻습니다.')).toBe('Guild Reputation 1을 얻습니다.');
    expect(normalizeGuildReputationTerms('길드의 신뢰도가 25 이상입니다.')).toBe('Guild Reputation이 25 이상입니다.');
    expect(normalizeGuildReputationTerms("The Guild's Reputation is Trusted.")).toBe('Guild Reputation is Trusted.');
    expect(normalizeGuildReputationTerms('Guild 길드 명성를 1 잃습니다.')).toBe('Guild Reputation을 1 잃습니다.');
    expect(normalizeGuildReputationTerms('명성 2를 얻고 1 평판을 잃습니다.'))
      .toBe('Guild Reputation 2를 얻고 Guild Reputation 1을 잃습니다.');
    expect(normalizeGuildReputationTerms('명성을 추가로 얻습니다.')).toBe('Guild Reputation을 추가로 얻습니다.');
    expect(normalizeGuildReputationTerms('그 음유시인은 오래된 명성을 자랑합니다.')).toBe('그 음유시인은 오래된 명성을 자랑합니다.');
  });

  it('canonicalizes shortened rule-owned copy with the exact English stat name', () => {
    expect(normalizeCanonicalGuildReputationTerms('Reputation 2 \u00b7 \uD3C9\uD310\uACFC \uC2E0\uB8B0\uB3C4'))
      .toBe('Guild Reputation 2 \u00b7 Guild Reputation\uACFC Guild Reputation');
    expect(normalizeCanonicalGuildReputationTerms('\uBA85\uC131\uC774 \uC2E0\uB9DD \uC788\uC74C\uC774\uBA74 \uAC70\uB798\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4.'))
      .toBe('Guild Reputation\uC774 Upstanding\uC774\uBA74 \uAC70\uB798\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4.');
  });

  it('restores printed English rank labels only when they describe Guild Reputation', () => {
    expect(normalizeGuildReputationTerms('길드 명성이 신망 있음이면 거래할 수 있습니다.'))
      .toBe('Guild Reputation이 Upstanding이면 거래할 수 있습니다.');
    expect(normalizeGuildReputationTerms('길드 명성이 자리 잡음 이하입니다.'))
      .toBe('Guild Reputation이 Established 이하입니다.');
    expect(normalizeGuildReputationTerms('길드 명성이 신뢰받음 이상입니다.'))
      .toBe('Guild Reputation이 Trusted 이상입니다.');
    expect(normalizeGuildReputationTerms('그 짐승은 마을에서 신뢰받음')).toBe('그 짐승은 마을에서 신뢰받음');
  });
});

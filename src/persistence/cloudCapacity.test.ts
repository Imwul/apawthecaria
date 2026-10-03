import { describe, expect, it } from 'vitest';
import { cloudCapacityIssueForPayload, cloudCapacityMessage } from './cloudCapacity';
import { CLOUD_PAYLOAD_SAFE_BYTES } from './cloudSlots';

describe('cloud capacity recovery presentation', () => {
  it('uses UTF-8 bytes and the same inclusive boundary as cloud upload', () => {
    expect(cloudCapacityIssueForPayload('a'.repeat(CLOUD_PAYLOAD_SAFE_BYTES - 1))).toBeNull();
    expect(cloudCapacityIssueForPayload('a'.repeat(CLOUD_PAYLOAD_SAFE_BYTES))?.payloadBytes).toBe(CLOUD_PAYLOAD_SAFE_BYTES);
    expect(cloudCapacityIssueForPayload('가'.repeat(Math.ceil(CLOUD_PAYLOAD_SAFE_BYTES / 3)))).not.toBeNull();
  });
  it('distinguishes a preserved device copy from failure of both destinations', () => {
    const issue = { payloadBytes: CLOUD_PAYLOAD_SAFE_BYTES, limitBytes: CLOUD_PAYLOAD_SAFE_BYTES };
    expect(cloudCapacityMessage(issue, true)).toContain('기기에는 저장했습니다.');
    expect(cloudCapacityMessage(issue, false)).toContain('기기 저장도 확인이 필요합니다.');
    expect(cloudCapacityMessage(issue, true)).toContain('백업 파일은 기록 불러오기로 복구');
  });
});

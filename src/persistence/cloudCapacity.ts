import { CLOUD_PAYLOAD_SAFE_BYTES, cloudPayloadByteLength, formatCloudPayloadBytes } from './cloudSlots';

export interface CloudCapacityIssue { payloadBytes: number; limitBytes: number }

export const cloudCapacityIssueForPayload = (payload: string): CloudCapacityIssue | null => {
  const payloadBytes = cloudPayloadByteLength(payload);
  return payloadBytes >= CLOUD_PAYLOAD_SAFE_BYTES ? { payloadBytes, limitBytes: CLOUD_PAYLOAD_SAFE_BYTES } : null;
};

export const cloudCapacityMessage = (issue: CloudCapacityIssue, localSaved: boolean) =>
  `기록 ${formatCloudPayloadBytes(issue.payloadBytes)} / 클라우드 한도 ${formatCloudPayloadBytes(issue.limitBytes)}. ${localSaved ? '기기에는 저장했습니다.' : '기기 저장도 확인이 필요합니다.'} 먼저 JSON 백업을 내려받으세요. 사진 등 큰 자료를 별도로 보관한 뒤 기록에서 정리하면 다음 자동 저장 때 클라우드를 다시 시도합니다. 백업 파일은 기록 불러오기로 복구할 수 있습니다.`;

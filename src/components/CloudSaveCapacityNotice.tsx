import { cloudCapacityMessage, type CloudCapacityIssue } from '../persistence/cloudCapacity';

export default function CloudSaveCapacityNotice({ issue, localSaved, onBackup, onManageCloud }: {
  issue: CloudCapacityIssue;
  localSaved: boolean;
  onBackup: () => void;
  onManageCloud: () => void;
}) {
  return <aside className="cloud-capacity-notice" role="status" aria-label="클라우드 저장 용량 안내">
    <strong>클라우드 용량 초과 · {localSaved ? '기기 기록은 보존됨' : '백업 필요'}</strong>
    <p>{cloudCapacityMessage(issue, localSaved)}</p>
    <div><button type="button" onClick={onBackup}>JSON 백업 내려받기</button><button type="button" onClick={onManageCloud}>클라우드 기록 확인</button></div>
  </aside>;
}

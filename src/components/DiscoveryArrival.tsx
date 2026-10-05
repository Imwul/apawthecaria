import { FieldIcon } from './FieldIcon';

export function DiscoveryArrival({ specimen = false }: { specimen?: boolean }) {
  return <span className="specimen-arrival" role="status"><FieldIcon kind="reagents" />{specimen ? '새 표본을 수첩에 남겼어요' : '새 발견을 수첩에 남겼어요'}</span>;
}

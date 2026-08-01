# Phase 5 Report — Canonical Closure and Production Readiness

## 목적

Phase 4 직후 계획할 후속 작업을 이번 실행에서 함께 진행했다. 목표는 새 기능 확장이 아니라 canonical state가 실제 이동·휴식기·저장·참조 화면에서 다시 legacy 계산으로 갈라지지 않게 닫는 것이었다.

## 완료

- Wagon Carry/Speed/Soar/Loch 판정이 `WagonState`와 `resolveWagonCapabilities()`를 직접 사용한다.
- Wasp milestone은 즉시 Reagent 지급 대신 저장 가능한 INSECT Foraging transaction을 연다. 여러 10-Path milestone도 횟수를 보존한다.
- Honeybee는 canonical Beehive/Honey Preparation identity와 Uses/Weight를 가진 아이템을 생성한다.
- Rumour는 actual map 좌표·graph 거리·Region 후보만 사용하고 자유 텍스트 target을 제거했다.
- Bandolier는 표시 이름이 아니라 canonical Reagent identity를 우선 사용한다.
- Almanack 긴 목록을 단계 렌더링해 초기 DOM 부담을 줄였다.
- 360px에서 회전 stamp가 만든 4px overflow를 수정했다.
- Phase 5 회귀 테스트 5개를 추가해 전체 80개 테스트가 됐다.

## 보수적 판정

이번 단계에서도 resolver만 있는 Trinket/Floodplain은 `Logic-only`, legacy 전용 입력이 남은 Barrow/Tool/Replacement는 `Partial`로 유지했다. `Incorrect/Missing/UI-only` 0은 완전 자동화가 아니라, 잘못된 결과를 계속 확정하는 경로를 제거하고 미완성 부분을 명시적 manual/partial 상태로 바꿨다는 뜻이다.

## 다음 권장 순서

1. Barrow 8종 전용 입력 UI를 canonical state machine에 직접 연결
2. Replacement BR 12의 Forage/Barter commit UI 연결
3. Tool/Upgrade trigger를 공통 Travel/Forage/Treatment transaction으로 통합
4. 치료 선택 draft 복원
5. 355 manual printed effect 중 숫자·조건만으로 결정 가능한 항목 자동화

# Apawthecaria 1.0.0 Known Limitations

아래 1.0.0 인증 내용은 당시 검증 범위의 기록이며, 모든 규칙의 완전한 구현을 보증하지 않는다. 2026-09-27 재점검에서 실제 안내 오역과 서비스·보상 예외 누락을 발견해 수정했다. 최신 검증 범위는 [펜 드로잉 업데이트 검증](WOODLAND_REVIEW_2026-09-27.md)을 따른다.

## 2026-09-27 재점검에서 유지하는 한계

- 원문 220쪽은 추출 텍스트를 사용했다. 이번 검증은 원본 PDF의 표·도판을 육안으로 전수 대조한 검증이 아니다.
- 한국어 절차 안내와 도감은 제공하지만 원문 전체의 문장별 완역을 완료했다고 판정하지 않는다.
- `Titan Touched`의 새 유적과 두 경로, `Trowel Troubles`의 새 경로는 플레이어가 지도를 결정하는 후속 처리가 남는다. 단순한 결과 안내가 지도 구조의 자동 변경을 보장하지 않는다.
- `Snail Ails`의 정착지 격리, `Titan Touched`의 다음 계절까지 희귀도 증가, `Tickbitten` 재방문 환자 강제 생성은 안내를 복구했지만 이번 테스트로 모든 소비 경로의 자동 적용까지 입증하지 않았다. 서사 전용 규칙으로 취급해 완료 판정을 내리면 안 된다.
- `Woeful Waters`는 p.113에서 지시하지만 처방·타이머가 원문에 없다. 앱이 임의의 공식 수치를 만들지 않는다.
- `Crestfallen`, `Nervefright`, `Seasonshift`의 개별 항목과 뽑기 표 등급이 다르다. 뽑기 표를 유지하며 진료 수첩에 차이를 알린다. 마차 가격 p.43/p.68 충돌도 한국어 안내에 유지한다.
- 실제 Google 계정의 다중 기기 동기화 및 모바일 소프트웨어 키보드는 이번에 직접 재현하지 않았다. 관련 자동화 테스트나 좁은 브라우저 화면 검증을 이 실기 검증과 동일시하지 않는다.

## Non-blocking Digital Or Evidence Limitations (A 12)

| Rule ID | Reason retained |
|---|---|
| `CORE-001` | 정상 canonical 판정은 M=12이며 잔여 범위는 compatibility helper 증거다. |
| `CHARACTER-003` | 시작 장비는 플레이 가능하고 남은 범위는 이후 구매와의 전체 identity-path 동치 증거다. |
| `CHARACTER-004` | 평판 소비자는 실행되며 단일 통합 resolver 증거만 남는다. |
| `PATIENT-005` | 복수 Timer 캠페인은 통과했고 드문 service-time adapter 증거만 남는다. |
| `CLINIC-004` | 전역 Agenda와 3 Paths service area는 실행되며 모든 표시 consumer의 동치 증거만 남는다. |
| `SERVICE-004` | canonical Service는 M=12이며 잔여 범위는 compatibility presentation이다. |
| `TABLE-006` | runtime 표는 존재하며 독립 분포 freeze validator만 남는다. |
| `SAVE-001` | 저장·reload·continue는 통과했고 browser storage 중단 주입 증거만 남는다. |
| `SAVE-006` | revision ordering은 실행되며 같은 revision의 자동 field merge는 디지털 한계다. |
| `SAVE-007` | 큰 save는 로컬 보존되며 cloud-limit 안내가 console 중심이다. |
| `OFFLINE-003` | canonical pending draw는 재현되며 legacy 임시 modal seed만 남는다. |
| `UX-002` | desktop/mobile은 통과했고 자동 visual regression 기반선만 남는다. |

## Intentional Narrative Or Player Choice (B 11)

| Rule ID | Reason retained |
|---|---|
| `CORE-002` | 원문이 서술, 플레이어 선택, 기록 여부 또는 manual printed outcome을 요구한다. 앱은 필요한 원문 맥락·입력·후속 상태를 제공하되 결론을 자동으로 만들지 않는다. |
| `CORE-003` | 원문이 서술, 플레이어 선택, 기록 여부 또는 manual printed outcome을 요구한다. 앱은 필요한 원문 맥락·입력·후속 상태를 제공하되 결론을 자동으로 만들지 않는다. |
| `CORE-004` | 원문이 서술, 플레이어 선택, 기록 여부 또는 manual printed outcome을 요구한다. 앱은 필요한 원문 맥락·입력·후속 상태를 제공하되 결론을 자동으로 만들지 않는다. |
| `CHARACTER-001` | 원문이 서술, 플레이어 선택, 기록 여부 또는 manual printed outcome을 요구한다. 앱은 필요한 원문 맥락·입력·후속 상태를 제공하되 결론을 자동으로 만들지 않는다. |
| `CHARACTER-007` | 원문이 서술, 플레이어 선택, 기록 여부 또는 manual printed outcome을 요구한다. 앱은 필요한 원문 맥락·입력·후속 상태를 제공하되 결론을 자동으로 만들지 않는다. |
| `TRAVEL-009` | 원문이 서술, 플레이어 선택, 기록 여부 또는 manual printed outcome을 요구한다. 앱은 필요한 원문 맥락·입력·후속 상태를 제공하되 결론을 자동으로 만들지 않는다. |
| `AILMENT-003` | 원문이 서술, 플레이어 선택, 기록 여부 또는 manual printed outcome을 요구한다. 앱은 필요한 원문 맥락·입력·후속 상태를 제공하되 결론을 자동으로 만들지 않는다. |
| `AILMENT-007` | 원문이 서술, 플레이어 선택, 기록 여부 또는 manual printed outcome을 요구한다. 앱은 필요한 원문 맥락·입력·후속 상태를 제공하되 결론을 자동으로 만들지 않는다. |
| `REMEDY-008` | 원문이 서술, 플레이어 선택, 기록 여부 또는 manual printed outcome을 요구한다. 앱은 필요한 원문 맥락·입력·후속 상태를 제공하되 결론을 자동으로 만들지 않는다. |
| `FORAGE-006` | 원문이 서술, 플레이어 선택, 기록 여부 또는 manual printed outcome을 요구한다. 앱은 필요한 원문 맥락·입력·후속 상태를 제공하되 결론을 자동으로 만들지 않는다. |
| `ALMANACK-003` | 원문이 서술, 플레이어 선택, 기록 여부 또는 manual printed outcome을 요구한다. 앱은 필요한 원문 맥락·입력·후속 상태를 제공하되 결론을 자동으로 만들지 않는다. |

## Source Ambiguity (C 1)

| Rule ID | Reason retained |
|---|---|
| `DOWNTIME-007` | p43의 Wagon commission 20 Trinkets와 p68의 Base Unit 15 Trinkets 충돌을 문서화하고 p43 절차를 일관되게 사용한다. |

전체 campaign replay의 외부 룰북 참조는 0회였다. 상세 판정 근거는 [RELEASE_1_0_CERTIFICATION.md](RELEASE_1_0_CERTIFICATION.md)에 보존한다.

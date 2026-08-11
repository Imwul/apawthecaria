# Apawthecaria 1.0.0 Release Certification

## Certification

**Can the application now be released as Version 1.0?**

**YES, WITH KNOWN LIMITATIONS**

**Can a player complete an entire campaign while only consulting the rulebook for intentionally narrative or GM-decided moments?**

**YES**

Phase 10은 지정된 Release Blocker만 제거했다. 새로운 Rule, UI, House Rule, narrative 자동화는 추가하지 않았고 Printed Effect의 기존 B/C 분류와 347개 manual resolution을 유지했다.

Phase 11은 같은 20개 ID를 독립 재검증해 수로 UI 덮어쓰기, Service 선택 소비와 Journey lifecycle, Clinic Agenda 우회, Companion ID/Hive 위치, preparation의 `PRESERVED` 기록을 보강했다. 판정 집계는 바꾸지 않았다.

## Release Blockers

Before **20** → After **0**.

| Rule ID | Result | Closure evidence |
|---|---|---|
| `CHARACTER-002` | PASS | 현재 Travel Style의 Speed·Carry·Soar만 원작 모드에 적용된다. |
| `CHARACTER-005` | PASS | Familiar 12종의 고유 trigger와 Passenger 역할이 실제 gameplay consumer에 연결된다. |
| `TRAVEL-002` | PASS | 수동 수로 덮어쓰기 없이 route의 각 Path/Waterway edge와 연속 수로 비용·젖음·정지를 구간별로 판정한다. |
| `CLINIC-001` | PASS | 누적 일수 대신 완료 Season 4회, Wild 치료, 비용을 resolver가 검증한다. |
| `CLINIC-005` | PASS | 10 Agenda의 해금 조건과 Pantry·Library·Garden·Mailbox 등의 stateful action을 resolver가 검증한다. |
| `ALMANACK-004` | PASS | 17 Guild Service의 즉시·Move·선택 소비·도착·여정/계절 후속이 닫힌다. |
| `ALMANACK-005` | PASS | 18 Tool의 조건·파손·소모·준비·행동 trigger가 gameplay에 연결된다. |
| `ALMANACK-006` | PASS | 7 Upgrade의 고유 trigger가 실제 Forage/Gather/Patient/Treatment/POUND에서 실행된다. |
| `SERVICE-001` | PASS | Forecast가 정확히 3 Move를 소비하고 Weather의 부정적 Foraging 효과만 막는다. |
| `SERVICE-002` | PASS | Shortcut/Hitch/Survey/Bridge/Taxi의 대상과 이동 종료를 graph transaction이 검증한다. |
| `SERVICE-005` | PASS | Retrieval과 Send Package의 pending delivery가 도착/확인 transaction으로 완료된다. |
| `TOOL-003` | PASS | Canvas Tent, Comb, Instruments, Crossbow/Bolts, Stilts, Knitting이 공통 Tool 경로를 사용한다. |
| `TOOL-005` | PASS | Granite POUND를 포함한 Upgrade effect가 Inventory 직접 변경 없이 resolver를 사용한다. |
| `WAGON-001` | PASS | Carry·Speed·Waterway span·Soar 비용이 Travel 결과를 결정한다. |
| `WAGON-002` | PASS | 10 Expansion과 Passenger·Clay Pots의 Journey/Move lifecycle이 유지된다. |
| `WAGON-004` | PASS | Sealed·Shadow·Experimental 효과가 정확한 이동/도착 시점에 적용된다. |
| `COMPANION-001` | PASS | 9 Companion의 canonical ID와 rarity·timer·encounter·season·milestone 효과가 상태 값으로 실행된다. |
| `COMPANION-005` | PASS | Beetle/Pond Skimmer의 Journey 1회, Cranky 소모, 10 Paths 보상을 trigger가 강제한다. |
| `UX-001` | PASS | 이번 blocker 범위의 버튼은 canonical result 또는 명시적 manual transaction으로 끝난다. |
| `AILMENT-005` | PASS | p104-115 조건절, Hunted 자동 예외, preparation의 `PRESERVED` 결과를 검증한다. |

## Remaining Partial

남은 `Partial`은 **24개**이며 모두 Release Blocker가 아니다. 분류는 **A 12 / B 11 / C 1**, 실제 플레이의 외부 룰북 의존은 모두 `NO`다.

### Non-blocking Evidence Or Digital Limits (A 12)

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

### Intentional Narrative Or Player Choice (B 11)

`CORE-002`, `CORE-003`, `CORE-004`, `CHARACTER-001`, `CHARACTER-007`, `TRAVEL-009`, `AILMENT-003`, `AILMENT-007`, `REMEDY-008`, `FORAGE-006`, `ALMANACK-003`.

이 항목들은 원문이 서술, 플레이어 선택, 기록 여부 또는 manual printed outcome을 요구한다. 앱은 필요한 원문 맥락·입력·후속 상태를 제공하되 결론을 자동으로 만들지 않는다.

### Intentional Ambiguous (C 1)

`DOWNTIME-007`: p43의 Wagon commission 20 Trinkets와 p68의 Base Unit 15 Trinkets 충돌을 문서화하고 p43 절차를 일관되게 사용한다.

## Rulebook Dependency

전체 campaign replay 중 외부 룰북을 펼친 횟수: **0회**.

Journey → Travel → Forage → Patient → Treatment → Printed Effect → Barter → Barrow → Downtime → Season → Archive → Reload → Continue를 self-contained canonical data와 in-app manual resolution만으로 완료했다. Narrative와 player-decided 순간도 앱 안의 원문 맥락과 기록 입력으로 해결했다.

## Classification Integrity

- Printed Effect registry: `358/358`.
- Manual narrative: `347/347` 유지.
- B classification: `11 → 11`.
- C classification: `1 → 1`.
- 새 House Rule: `0`.
- 새 narrative automation: `0`.
- schema: `v8` 유지; legacy migration 유지.

## Verification

| Check | Result |
|---|---|
| Full tests | PASS, 13 files / 139 tests |
| Phase 10 blockers | PASS, 8/8 tests |
| Rule validator | PASS, 4/4 tests |
| TypeScript | PASS |
| Lint | PASS, errors 0 / warnings 0 |
| Build | PASS |
| Migration/save regression | PASS, 5 files / 55 tests |
| Desktop | PASS, document overflow 0, fresh console errors 0 |
| Mobile | PASS, document overflow 0; bookmarks use intentional horizontal scroll |
| Long campaign replay | PASS, 5/5 RC scenarios |

Initial entry는 2.57 kB (gzip 1.34 kB), App async chunk는 554.13 kB (gzip 148.51 kB)다. 500 kB 초과 경고 한 건은 남지만 Release Blocker는 아니다.

## Final Recommendation

**Version 1.0: Ready.**

현재 앱은 legacy gameplay path나 외부 룰북 재참조 없이 canonical campaign을 완료할 수 있다. 남은 Partial은 문서화된 비차단 제한, 의도적 narrative 처리, 판본 내 모호성뿐이다.

## Production Packaging Status

Gameplay certification은 유지된다. Patient의 gameplay-critical native `prompt()`는 controlled input으로 교체됐지만, actual-UI clean campaign에서 active Journey를 저장 후 다시 열면 ending transaction을 시작할 수 없는 문제가 남았다. 사용자 요청에 따라 release candidate는 `main`과 production에 배포했으며, `v1.0.0` tag는 만들지 않았다. 상세 결과는 `RELEASE_CHECKLIST_1.0.0.md`에 기록한다.

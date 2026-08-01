# Printed Effect Status

## 범위와 판정

- 기준: *Apawthecaria*, First Edition, Third Printing (May 2023)
- Registry: `src/rules/printedEffects.ts`
- 총 항목: 358 (Encounter 313 + Named Ailment 45)
- `implemented`는 executor와 상태 변화가 연결된 항목만 뜻한다.
- `manual`은 원문을 생략했다는 뜻이 아니라, 선택·지도·후속 서술을 자동 수치로 창작하지 않고 명시적 미해결 상태로 보존한다는 뜻이다.

## 상태 집계

| Status | Count |
|---|---:|
| implemented | 3 |
| manual | 355 |
| ambiguous | 0 |
| not-applicable | 0 |
| source-conflict | 0 |

## Phase 4 + Phase 5 처리 방식

- 자동화 수는 의도적으로 `3`을 유지했다. Barrow/Service/Tool 엔진 추가를 Encounter/Ailment printed effect 자동화로 과장하지 않았다.
- manual effect는 원문 요약, Rule ID, source page, 강제 조건, 선택, canonical action, 결과 요약과 journal note를 저장한다.
- 비어 있는 결과/저널은 완료할 수 없고, 보류한 draft는 schema v5에서 재개된다.
- `resolved`와 `GM override`는 서로 다른 상태와 transaction ID로 기록된다.

## Travel Encounters

항목 수: 103

| Owner ID | Status | Trigger | Source | Executor | Test |
|---|---|---|---:|---|---|
| `travel-bog-a-2` | manual | encounter | p74 | `executeEncounter` | - |
| `travel-bog-3-4` | manual | encounter | p74 | `executeEncounter` | - |
| `travel-bog-5-6` | manual | encounter | p75 | `executeEncounter` | - |
| `travel-bog-7-8` | manual | encounter | p75 | `executeEncounter` | - |
| `travel-bog-9-10-spring` | manual | encounter | p75 | `executeEncounter` | - |
| `travel-bog-9-10-summer` | manual | encounter | p76 | `executeEncounter` | - |
| `travel-bog-9-10-autumn` | manual | encounter | p76 | `executeEncounter` | - |
| `travel-bog-9-10-winter` | manual | encounter | p76 | `executeEncounter` | - |
| `travel-bog-j-spring` | manual | encounter | p75 | `executeEncounter` | - |
| `travel-bog-j-summer` | manual | encounter | p76 | `executeEncounter` | - |
| `travel-bog-j-autumn` | manual | encounter | p77 | `executeEncounter` | - |
| `travel-bog-j-winter` | manual | encounter | p77 | `executeEncounter` | - |
| `travel-bog-m-spring` | manual | encounter | p75 | `executeEncounter` | - |
| `travel-bog-m-summer` | manual | encounter | p76 | `executeEncounter` | - |
| `travel-bog-m-autumn` | manual | encounter | p77 | `executeEncounter` | - |
| `travel-bog-m-winter` | implemented | encounter | p77 | `executeEncounter` | TRAVEL-009 warning rows |
| `travel-forest-a-2` | manual | encounter | p78 | `executeEncounter` | TRAVEL-008/TRAVEL-009 warning rows |
| `travel-forest-3-4` | manual | encounter | p78 | `executeEncounter` | - |
| `travel-forest-5-6` | manual | encounter | p78 | `executeEncounter` | - |
| `travel-forest-7-8` | manual | encounter | p78 | `executeEncounter` | - |
| `travel-forest-9-10-spring` | manual | encounter | p79 | `executeEncounter` | - |
| `travel-forest-9-10-summer` | manual | encounter | p79 | `executeEncounter` | - |
| `travel-forest-9-10-autumn` | manual | encounter | p80 | `executeEncounter` | - |
| `travel-forest-9-10-winter` | manual | encounter | p81 | `executeEncounter` | - |
| `travel-forest-j-spring` | manual | encounter | p79 | `executeEncounter` | - |
| `travel-forest-j-summer` | manual | encounter | p79 | `executeEncounter` | - |
| `travel-forest-j-autumn` | manual | encounter | p80 | `executeEncounter` | - |
| `travel-forest-j-winter` | manual | encounter | p81 | `executeEncounter` | - |
| `travel-forest-m-spring` | manual | encounter | p79 | `executeEncounter` | - |
| `travel-forest-m-summer` | manual | encounter | p79 | `executeEncounter` | - |
| `travel-forest-m-autumn` | manual | encounter | p80 | `executeEncounter` | - |
| `travel-forest-m-winter` | manual | encounter | p81 | `executeEncounter` | - |
| `travel-loch-a-2` | manual | encounter | p82 | `executeEncounter` | - |
| `travel-loch-3-4` | manual | encounter | p82 | `executeEncounter` | - |
| `travel-loch-5-6` | manual | encounter | p82 | `executeEncounter` | - |
| `travel-loch-7-8` | manual | encounter | p83 | `executeEncounter` | - |
| `travel-loch-9-10-spring` | manual | encounter | p83 | `executeEncounter` | - |
| `travel-loch-9-10-summer` | manual | encounter | p83 | `executeEncounter` | - |
| `travel-loch-9-10-autumn` | manual | encounter | p84 | `executeEncounter` | - |
| `travel-loch-9-10-winter` | manual | encounter | p85 | `executeEncounter` | - |
| `travel-loch-j-spring` | manual | encounter | p83 | `executeEncounter` | - |
| `travel-loch-j-summer` | manual | encounter | p84 | `executeEncounter` | - |
| `travel-loch-j-autumn` | manual | encounter | p84 | `executeEncounter` | - |
| `travel-loch-j-winter` | manual | encounter | p85 | `executeEncounter` | - |
| `travel-loch-m-spring` | manual | encounter | p83 | `executeEncounter` | - |
| `travel-loch-m-summer` | manual | encounter | p84 | `executeEncounter` | - |
| `travel-loch-m-autumn` | manual | encounter | p85 | `executeEncounter` | - |
| `travel-loch-m-winter` | manual | encounter | p85 | `executeEncounter` | - |
| `travel-meadow-a-2` | manual | encounter | p86 | `executeEncounter` | TRAVEL-009 warning rows |
| `travel-meadow-3-4` | manual | encounter | p86 | `executeEncounter` | - |
| `travel-meadow-5-6` | manual | encounter | p86 | `executeEncounter` | - |
| `travel-meadow-7-8` | manual | encounter | p86 | `executeEncounter` | - |
| `travel-meadow-9-10-spring` | manual | encounter | p87 | `executeEncounter` | - |
| `travel-meadow-9-10-summer` | manual | encounter | p87 | `executeEncounter` | - |
| `travel-meadow-9-10-autumn` | manual | encounter | p88 | `executeEncounter` | - |
| `travel-meadow-9-10-winter` | manual | encounter | p89 | `executeEncounter` | - |
| `travel-meadow-j-spring` | manual | encounter | p87 | `executeEncounter` | - |
| `travel-meadow-j-summer` | manual | encounter | p87 | `executeEncounter` | - |
| `travel-meadow-j-autumn` | manual | encounter | p88 | `executeEncounter` | - |
| `travel-meadow-j-winter` | manual | encounter | p89 | `executeEncounter` | - |
| `travel-meadow-m-spring` | manual | encounter | p87 | `executeEncounter` | - |
| `travel-meadow-m-summer` | manual | encounter | p88 | `executeEncounter` | - |
| `travel-meadow-m-autumn` | manual | encounter | p88 | `executeEncounter` | - |
| `travel-meadow-m-winter` | manual | encounter | p89 | `executeEncounter` | - |
| `travel-mountain-a-2` | manual | encounter | p90 | `executeEncounter` | - |
| `travel-mountain-3-4` | manual | encounter | p90 | `executeEncounter` | - |
| `travel-mountain-5-6` | manual | encounter | p90 | `executeEncounter` | - |
| `travel-mountain-7-8` | manual | encounter | p90 | `executeEncounter` | - |
| `travel-mountain-9-10-spring` | manual | encounter | p91 | `executeEncounter` | - |
| `travel-mountain-9-10-summer` | manual | encounter | p92 | `executeEncounter` | - |
| `travel-mountain-9-10-autumn` | manual | encounter | p93 | `executeEncounter` | - |
| `travel-mountain-9-10-winter` | manual | encounter | p93 | `executeEncounter` | TRAVEL-009 warning rows |
| `travel-mountain-j-spring` | manual | encounter | p91 | `executeEncounter` | - |
| `travel-mountain-j-summer` | manual | encounter | p92 | `executeEncounter` | - |
| `travel-mountain-j-autumn` | manual | encounter | p93 | `executeEncounter` | - |
| `travel-mountain-j-winter` | manual | encounter | p93 | `executeEncounter` | - |
| `travel-mountain-m-spring` | manual | encounter | p91 | `executeEncounter` | - |
| `travel-mountain-m-summer` | manual | encounter | p92 | `executeEncounter` | - |
| `travel-mountain-m-autumn` | manual | encounter | p93 | `executeEncounter` | - |
| `travel-mountain-m-winter` | manual | encounter | p93 | `executeEncounter` | - |
| `travel-soar-a-2` | manual | encounter | p94 | `executeEncounter` | - |
| `travel-soar-3-4` | manual | encounter | p94 | `executeEncounter` | - |
| `travel-soar-5-6` | manual | encounter | p94 | `executeEncounter` | - |
| `travel-soar-7-8` | manual | encounter | p95 | `executeEncounter` | - |
| `travel-soar-9-10-spring` | manual | encounter | p95 | `executeEncounter` | - |
| `travel-soar-9-10-summer` | manual | encounter | p96 | `executeEncounter` | TRAVEL-009 warning rows |
| `travel-soar-9-10-autumn` | manual | encounter | p96 | `executeEncounter` | TRAVEL-009 warning rows |
| `travel-soar-9-10-winter` | manual | encounter | p97 | `executeEncounter` | TRAVEL-009 warning rows |
| `travel-soar-j-spring` | manual | encounter | p96 | `executeEncounter` | - |
| `travel-soar-j-summer` | manual | encounter | p96 | `executeEncounter` | - |
| `travel-soar-j-autumn` | manual | encounter | p97 | `executeEncounter` | - |
| `travel-soar-j-winter` | implemented | encounter | p97 | `executeEncounter` | TRAVEL-009 warning rows |
| `travel-soar-m-spring` | manual | encounter | p96 | `executeEncounter` | - |
| `travel-soar-m-summer` | manual | encounter | p97 | `executeEncounter` | - |
| `travel-soar-m-autumn` | manual | encounter | p97 | `executeEncounter` | - |
| `travel-soar-m-winter` | manual | encounter | p97 | `executeEncounter` | TRAVEL-009 warning rows |
| `travel-titan-a-2` | manual | encounter | p98 | `executeEncounter` | - |
| `travel-titan-3-4` | manual | encounter | p98 | `executeEncounter` | - |
| `travel-titan-5-6` | manual | encounter | p98 | `executeEncounter` | - |
| `travel-titan-7-8` | manual | encounter | p99 | `executeEncounter` | - |
| `travel-titan-9-10` | manual | encounter | p99 | `executeEncounter` | - |
| `travel-titan-j` | manual | encounter | p99 | `executeEncounter` | - |
| `travel-titan-m` | manual | encounter | p99 | `executeEncounter` | - |

## Foraging Encounters

항목 수: 144

| Owner ID | Status | Trigger | Source | Executor | Test |
|---|---|---|---:|---|---|
| `foraging-bog-a` | manual | encounter | p154 | `executeEncounter` | - |
| `foraging-bog-2` | manual | encounter | p154 | `executeEncounter` | - |
| `foraging-bog-3` | manual | encounter | p154 | `executeEncounter` | - |
| `foraging-bog-4` | manual | encounter | p155 | `executeEncounter` | - |
| `foraging-bog-5` | manual | encounter | p155 | `executeEncounter` | - |
| `foraging-bog-6` | manual | encounter | p155 | `executeEncounter` | - |
| `foraging-bog-7` | manual | encounter | p155 | `executeEncounter` | - |
| `foraging-bog-8` | manual | encounter | p155 | `executeEncounter` | - |
| `foraging-bog-9-spring` | manual | encounter | p156 | `executeEncounter` | - |
| `foraging-bog-9-summer` | manual | encounter | p157 | `executeEncounter` | - |
| `foraging-bog-9-autumn` | manual | encounter | p158 | `executeEncounter` | - |
| `foraging-bog-9-winter` | manual | encounter | p159 | `executeEncounter` | - |
| `foraging-bog-10-spring` | manual | encounter | p156 | `executeEncounter` | - |
| `foraging-bog-10-summer` | manual | encounter | p157 | `executeEncounter` | - |
| `foraging-bog-10-autumn` | manual | encounter | p158 | `executeEncounter` | - |
| `foraging-bog-10-winter` | manual | encounter | p159 | `executeEncounter` | - |
| `foraging-bog-j-spring` | manual | encounter | p156 | `executeEncounter` | - |
| `foraging-bog-j-summer` | manual | encounter | p157 | `executeEncounter` | - |
| `foraging-bog-j-autumn` | manual | encounter | p158 | `executeEncounter` | - |
| `foraging-bog-j-winter` | manual | encounter | p159 | `executeEncounter` | - |
| `foraging-bog-m-spring` | manual | encounter | p156 | `executeEncounter` | - |
| `foraging-bog-m-summer` | manual | encounter | p157 | `executeEncounter` | - |
| `foraging-bog-m-autumn` | manual | encounter | p158 | `executeEncounter` | - |
| `foraging-bog-m-winter` | manual | encounter | p159 | `executeEncounter` | - |
| `foraging-forest-a` | manual | encounter | p160 | `executeEncounter` | - |
| `foraging-forest-2` | manual | encounter | p160 | `executeEncounter` | - |
| `foraging-forest-3` | manual | encounter | p160 | `executeEncounter` | - |
| `foraging-forest-4` | manual | encounter | p160 | `executeEncounter` | - |
| `foraging-forest-5` | manual | encounter | p161 | `executeEncounter` | - |
| `foraging-forest-6` | manual | encounter | p161 | `executeEncounter` | - |
| `foraging-forest-7` | manual | encounter | p161 | `executeEncounter` | - |
| `foraging-forest-8` | manual | encounter | p161 | `executeEncounter` | - |
| `foraging-forest-9-spring` | manual | encounter | p162 | `executeEncounter` | - |
| `foraging-forest-9-summer` | manual | encounter | p163 | `executeEncounter` | - |
| `foraging-forest-9-autumn` | manual | encounter | p164 | `executeEncounter` | - |
| `foraging-forest-9-winter` | manual | encounter | p165 | `executeEncounter` | - |
| `foraging-forest-10-spring` | manual | encounter | p162 | `executeEncounter` | - |
| `foraging-forest-10-summer` | manual | encounter | p163 | `executeEncounter` | - |
| `foraging-forest-10-autumn` | manual | encounter | p164 | `executeEncounter` | - |
| `foraging-forest-10-winter` | manual | encounter | p165 | `executeEncounter` | - |
| `foraging-forest-j-spring` | manual | encounter | p162 | `executeEncounter` | - |
| `foraging-forest-j-summer` | manual | encounter | p163 | `executeEncounter` | - |
| `foraging-forest-j-autumn` | manual | encounter | p164 | `executeEncounter` | - |
| `foraging-forest-j-winter` | manual | encounter | p165 | `executeEncounter` | - |
| `foraging-forest-m-spring` | manual | encounter | p162 | `executeEncounter` | - |
| `foraging-forest-m-summer` | manual | encounter | p163 | `executeEncounter` | - |
| `foraging-forest-m-autumn` | manual | encounter | p164 | `executeEncounter` | - |
| `foraging-forest-m-winter` | manual | encounter | p165 | `executeEncounter` | - |
| `foraging-loch-a` | manual | encounter | p166 | `executeEncounter` | - |
| `foraging-loch-2` | manual | encounter | p166 | `executeEncounter` | - |
| `foraging-loch-3` | manual | encounter | p166 | `executeEncounter` | - |
| `foraging-loch-4` | manual | encounter | p167 | `executeEncounter` | - |
| `foraging-loch-5` | manual | encounter | p167 | `executeEncounter` | - |
| `foraging-loch-6` | manual | encounter | p167 | `executeEncounter` | - |
| `foraging-loch-7` | manual | encounter | p167 | `executeEncounter` | - |
| `foraging-loch-8` | manual | encounter | p167 | `executeEncounter` | - |
| `foraging-loch-9-spring` | manual | encounter | p168 | `executeEncounter` | - |
| `foraging-loch-9-summer` | manual | encounter | p169 | `executeEncounter` | - |
| `foraging-loch-9-autumn` | manual | encounter | p170 | `executeEncounter` | - |
| `foraging-loch-9-winter` | manual | encounter | p171 | `executeEncounter` | - |
| `foraging-loch-10-spring` | manual | encounter | p168 | `executeEncounter` | - |
| `foraging-loch-10-summer` | manual | encounter | p169 | `executeEncounter` | - |
| `foraging-loch-10-autumn` | manual | encounter | p169 | `executeEncounter` | - |
| `foraging-loch-10-winter` | manual | encounter | p170 | `executeEncounter` | - |
| `foraging-loch-j-spring` | manual | encounter | p168 | `executeEncounter` | - |
| `foraging-loch-j-summer` | manual | encounter | p170 | `executeEncounter` | - |
| `foraging-loch-j-autumn` | manual | encounter | p171 | `executeEncounter` | - |
| `foraging-loch-j-winter` | implemented | encounter | p171 | `executeEncounter` | FORAGE-006 warning rows |
| `foraging-loch-m-spring` | manual | encounter | p168 | `executeEncounter` | - |
| `foraging-loch-m-summer` | manual | encounter | p169 | `executeEncounter` | - |
| `foraging-loch-m-autumn` | manual | encounter | p170 | `executeEncounter` | - |
| `foraging-loch-m-winter` | manual | encounter | p171 | `executeEncounter` | - |
| `foraging-meadow-a` | manual | encounter | p172 | `executeEncounter` | - |
| `foraging-meadow-2` | manual | encounter | p172 | `executeEncounter` | - |
| `foraging-meadow-3` | manual | encounter | p172 | `executeEncounter` | - |
| `foraging-meadow-4` | manual | encounter | p172 | `executeEncounter` | - |
| `foraging-meadow-5` | manual | encounter | p173 | `executeEncounter` | - |
| `foraging-meadow-6` | manual | encounter | p173 | `executeEncounter` | - |
| `foraging-meadow-7` | manual | encounter | p173 | `executeEncounter` | - |
| `foraging-meadow-8` | manual | encounter | p173 | `executeEncounter` | - |
| `foraging-meadow-9-spring` | manual | encounter | p174 | `executeEncounter` | - |
| `foraging-meadow-9-summer` | manual | encounter | p175 | `executeEncounter` | - |
| `foraging-meadow-9-autumn` | manual | encounter | p176 | `executeEncounter` | - |
| `foraging-meadow-9-winter` | manual | encounter | p177 | `executeEncounter` | - |
| `foraging-meadow-10-spring` | manual | encounter | p174 | `executeEncounter` | - |
| `foraging-meadow-10-summer` | manual | encounter | p175 | `executeEncounter` | - |
| `foraging-meadow-10-autumn` | manual | encounter | p176 | `executeEncounter` | - |
| `foraging-meadow-10-winter` | manual | encounter | p177 | `executeEncounter` | - |
| `foraging-meadow-j-spring` | manual | encounter | p174 | `executeEncounter` | - |
| `foraging-meadow-j-summer` | manual | encounter | p175 | `executeEncounter` | - |
| `foraging-meadow-j-autumn` | manual | encounter | p176 | `executeEncounter` | - |
| `foraging-meadow-j-winter` | manual | encounter | p177 | `executeEncounter` | - |
| `foraging-meadow-m-spring` | manual | encounter | p174 | `executeEncounter` | - |
| `foraging-meadow-m-summer` | manual | encounter | p175 | `executeEncounter` | - |
| `foraging-meadow-m-autumn` | manual | encounter | p176 | `executeEncounter` | - |
| `foraging-meadow-m-winter` | manual | encounter | p177 | `executeEncounter` | - |
| `foraging-mountain-a` | manual | encounter | p178 | `executeEncounter` | - |
| `foraging-mountain-2` | manual | encounter | p178 | `executeEncounter` | - |
| `foraging-mountain-3` | manual | encounter | p178 | `executeEncounter` | - |
| `foraging-mountain-4` | manual | encounter | p178 | `executeEncounter` | - |
| `foraging-mountain-5` | manual | encounter | p179 | `executeEncounter` | - |
| `foraging-mountain-6` | manual | encounter | p179 | `executeEncounter` | - |
| `foraging-mountain-7` | manual | encounter | p179 | `executeEncounter` | - |
| `foraging-mountain-8` | manual | encounter | p179 | `executeEncounter` | - |
| `foraging-mountain-9-spring` | manual | encounter | p180 | `executeEncounter` | - |
| `foraging-mountain-9-summer` | manual | encounter | p181 | `executeEncounter` | - |
| `foraging-mountain-9-autumn` | manual | encounter | p182 | `executeEncounter` | - |
| `foraging-mountain-9-winter` | manual | encounter | p183 | `executeEncounter` | - |
| `foraging-mountain-10-spring` | manual | encounter | p180 | `executeEncounter` | - |
| `foraging-mountain-10-summer` | manual | encounter | p181 | `executeEncounter` | - |
| `foraging-mountain-10-autumn` | manual | encounter | p182 | `executeEncounter` | - |
| `foraging-mountain-10-winter` | manual | encounter | p183 | `executeEncounter` | - |
| `foraging-mountain-j-spring` | manual | encounter | p180 | `executeEncounter` | - |
| `foraging-mountain-j-summer` | manual | encounter | p181 | `executeEncounter` | - |
| `foraging-mountain-j-autumn` | manual | encounter | p182 | `executeEncounter` | - |
| `foraging-mountain-j-winter` | manual | encounter | p183 | `executeEncounter` | - |
| `foraging-mountain-m-spring` | manual | encounter | p180 | `executeEncounter` | - |
| `foraging-mountain-m-summer` | manual | encounter | p181 | `executeEncounter` | - |
| `foraging-mountain-m-autumn` | manual | encounter | p182 | `executeEncounter` | - |
| `foraging-mountain-m-winter` | manual | encounter | p183 | `executeEncounter` | - |
| `foraging-titan-a` | manual | encounter | p184 | `executeEncounter` | - |
| `foraging-titan-2` | manual | encounter | p184 | `executeEncounter` | - |
| `foraging-titan-3` | manual | encounter | p184 | `executeEncounter` | - |
| `foraging-titan-4` | manual | encounter | p185 | `executeEncounter` | - |
| `foraging-titan-5` | manual | encounter | p185 | `executeEncounter` | - |
| `foraging-titan-6` | manual | encounter | p186 | `executeEncounter` | - |
| `foraging-titan-7` | manual | encounter | p186 | `executeEncounter` | - |
| `foraging-titan-8` | manual | encounter | p186 | `executeEncounter` | - |
| `foraging-titan-9-spring` | manual | encounter | p186 | `executeEncounter` | - |
| `foraging-titan-9-summer` | manual | encounter | p186 | `executeEncounter` | - |
| `foraging-titan-9-autumn` | manual | encounter | p186 | `executeEncounter` | - |
| `foraging-titan-9-winter` | manual | encounter | p186 | `executeEncounter` | - |
| `foraging-titan-10-spring` | manual | encounter | p187 | `executeEncounter` | - |
| `foraging-titan-10-summer` | manual | encounter | p187 | `executeEncounter` | - |
| `foraging-titan-10-autumn` | manual | encounter | p187 | `executeEncounter` | - |
| `foraging-titan-10-winter` | manual | encounter | p187 | `executeEncounter` | - |
| `foraging-titan-j-spring` | manual | encounter | p187 | `executeEncounter` | - |
| `foraging-titan-j-summer` | manual | encounter | p187 | `executeEncounter` | - |
| `foraging-titan-j-autumn` | manual | encounter | p187 | `executeEncounter` | - |
| `foraging-titan-j-winter` | manual | encounter | p187 | `executeEncounter` | - |
| `foraging-titan-m-spring` | manual | encounter | p187 | `executeEncounter` | - |
| `foraging-titan-m-summer` | manual | encounter | p187 | `executeEncounter` | - |
| `foraging-titan-m-autumn` | manual | encounter | p187 | `executeEncounter` | - |
| `foraging-titan-m-winter` | manual | encounter | p187 | `executeEncounter` | - |

## Social Encounters

항목 수: 66

| Owner ID | Status | Trigger | Source | Executor | Test |
|---|---|---|---:|---|---|
| `social-bog-settlement-♥` | manual | encounter | p190 | `executeEncounter` | - |
| `social-bog-settlement-♦` | manual | encounter | p190 | `executeEncounter` | - |
| `social-bog-noonhill-♥` | manual | encounter | p191 | `executeEncounter` | - |
| `social-bog-noonhill-♦` | manual | encounter | p191 | `executeEncounter` | - |
| `social-bog-spring-♣` | manual | encounter | p192 | `executeEncounter` | - |
| `social-bog-spring-♠` | manual | encounter | p192 | `executeEncounter` | - |
| `social-bog-summer-♣` | manual | encounter | p192 | `executeEncounter` | - |
| `social-bog-autumn-♣` | manual | encounter | p193 | `executeEncounter` | - |
| `social-bog-summer-♠` | manual | encounter | p193 | `executeEncounter` | - |
| `social-bog-autumn-♠` | manual | encounter | p193 | `executeEncounter` | - |
| `social-bog-winter-♣` | manual | encounter | p193 | `executeEncounter` | - |
| `social-bog-winter-♠` | manual | encounter | p193 | `executeEncounter` | - |
| `social-forest-settlement-♥` | manual | encounter | p194 | `executeEncounter` | - |
| `social-forest-settlement-♦` | manual | encounter | p194 | `executeEncounter` | - |
| `social-forest-odoak-♦` | manual | encounter | p195 | `executeEncounter` | - |
| `social-forest-odoak-♥` | manual | encounter | p195 | `executeEncounter` | - |
| `social-forest-spring-♣` | manual | encounter | p196 | `executeEncounter` | - |
| `social-forest-spring-♠` | manual | encounter | p196 | `executeEncounter` | - |
| `social-forest-summer-♣` | manual | encounter | p196 | `executeEncounter` | - |
| `social-forest-summer-♠` | manual | encounter | p196 | `executeEncounter` | - |
| `social-forest-autumn-♠` | manual | encounter | p197 | `executeEncounter` | - |
| `social-forest-autumn-♣` | manual | encounter | p197 | `executeEncounter` | - |
| `social-forest-winter-♠` | manual | encounter | p197 | `executeEncounter` | - |
| `social-forest-winter-♣` | manual | encounter | p197 | `executeEncounter` | - |
| `social-loch-settlement-♦` | manual | encounter | p198 | `executeEncounter` | - |
| `social-loch-settlement-♥` | manual | encounter | p198 | `executeEncounter` | - |
| `social-loch-newdam-♥` | manual | encounter | p199 | `executeEncounter` | - |
| `social-loch-newdam-♦` | manual | encounter | p199 | `executeEncounter` | - |
| `social-loch-vessel-♥` | manual | encounter | p201 | `executeEncounter` | - |
| `social-loch-vessel-♦` | manual | encounter | p201 | `executeEncounter` | - |
| `social-loch-spring-♣` | manual | encounter | p202 | `executeEncounter` | - |
| `social-loch-spring-♠` | manual | encounter | p202 | `executeEncounter` | - |
| `social-loch-summer-♠` | manual | encounter | p202 | `executeEncounter` | - |
| `social-loch-summer-♣` | manual | encounter | p202 | `executeEncounter` | - |
| `social-loch-autumn-♣` | manual | encounter | p203 | `executeEncounter` | - |
| `social-loch-autumn-♠` | manual | encounter | p203 | `executeEncounter` | - |
| `social-loch-winter-♠` | manual | encounter | p203 | `executeEncounter` | - |
| `social-loch-winter-♣` | manual | encounter | p203 | `executeEncounter` | - |
| `social-meadow-settlement-♥` | manual | encounter | p204 | `executeEncounter` | - |
| `social-meadow-settlement-♦` | manual | encounter | p204 | `executeEncounter` | - |
| `social-meadow-summit-♥` | manual | encounter | p205 | `executeEncounter` | - |
| `social-meadow-summit-♦` | manual | encounter | p205 | `executeEncounter` | - |
| `social-meadow-spring-♠` | manual | encounter | p206 | `executeEncounter` | - |
| `social-meadow-spring-♣` | manual | encounter | p206 | `executeEncounter` | - |
| `social-meadow-summer-♠` | manual | encounter | p206 | `executeEncounter` | - |
| `social-meadow-summer-♣` | manual | encounter | p206 | `executeEncounter` | - |
| `social-meadow-autumn-♣` | manual | encounter | p207 | `executeEncounter` | - |
| `social-meadow-autumn-♠` | manual | encounter | p207 | `executeEncounter` | - |
| `social-meadow-winter-♣` | manual | encounter | p207 | `executeEncounter` | - |
| `social-meadow-winter-♠` | manual | encounter | p207 | `executeEncounter` | - |
| `social-mountain-settlement-♥` | manual | encounter | p208 | `executeEncounter` | - |
| `social-mountain-settlement-♦` | manual | encounter | p208 | `executeEncounter` | - |
| `social-mountain-spoolkeep-♥` | manual | encounter | p209 | `executeEncounter` | - |
| `social-mountain-spoolkeep-♦` | manual | encounter | p209 | `executeEncounter` | - |
| `social-mountain-spring-♣` | manual | encounter | p210 | `executeEncounter` | - |
| `social-mountain-summer-♣` | manual | encounter | p210 | `executeEncounter` | - |
| `social-mountain-spring-♠` | manual | encounter | p210 | `executeEncounter` | - |
| `social-mountain-summer-♠` | manual | encounter | p210 | `executeEncounter` | - |
| `social-mountain-autumn-♠` | manual | encounter | p211 | `executeEncounter` | - |
| `social-mountain-autumn-♣` | manual | encounter | p211 | `executeEncounter` | - |
| `social-mountain-winter-♣` | manual | encounter | p211 | `executeEncounter` | - |
| `social-mountain-winter-♠` | manual | encounter | p211 | `executeEncounter` | - |
| `social-glasswall-♥` | manual | encounter | p213 | `executeEncounter` | - |
| `social-glasswall-♦` | manual | encounter | p213 | `executeEncounter` | - |
| `social-glasswall-♣` | manual | encounter | p213 | `executeEncounter` | - |
| `social-glasswall-♠` | manual | encounter | p213 | `executeEncounter` | - |

## Named Ailments

항목 수: 45

| Owner ID | Status | Trigger | Source | Executor | Test |
|---|---|---|---:|---|---|
| `ailment-anxious-scratching` | manual | treatment-success | p104 | `resolveTreatmentTransaction / resolveAilmentPrintedEffect` | - |
| `ailment-dullsweats` | manual | treatment-success | p106 | `resolveTreatmentTransaction / resolveAilmentPrintedEffect` | - |
| `ailment-firstfever` | manual | treatment-success | p106 | `resolveTreatmentTransaction / resolveAilmentPrintedEffect` | - |
| `ailment-fond-farewell` | manual | treatment-success | p106 | `resolveTreatmentTransaction / resolveAilmentPrintedEffect` | - |
| `ailment-forgeclawed` | manual | treatment-success | p107 | `resolveTreatmentTransaction / resolveAilmentPrintedEffect` | - |
| `ailment-monthly-chore` | manual | treatment-success | p110 | `resolveTreatmentTransaction / resolveAilmentPrintedEffect` | - |
| `ailment-paw-rot` | manual | treatment-success | p110 | `resolveTreatmentTransaction / resolveAilmentPrintedEffect` | - |
| `ailment-safety-stench` | manual | treatment-success | p111 | `resolveTreatmentTransaction / resolveAilmentPrintedEffect` | - |
| `ailment-sunstruck` | manual | treatment-success | p113 | `resolveTreatmentTransaction / resolveAilmentPrintedEffect` | - |
| `ailment-the-runs` | manual | treatment-success | p113 | `resolveTreatmentTransaction / resolveAilmentPrintedEffect` | - |
| `ailment-tickbitten-twice-shy` | manual | treatment-success | p113 | `resolveTreatmentTransaction / resolveAilmentPrintedEffect` | - |
| `ailment-waen-drops` | manual | treatment-success | p114 | `resolveTreatmentTransaction / resolveAilmentPrintedEffect` | - |
| `ailment-blocked-ears` | manual | treatment-success | p105 | `resolveTreatmentTransaction / resolveAilmentPrintedEffect` | - |
| `ailment-brand-care` | manual | diagnosis | p105 | `resolveTreatmentTransaction / resolveAilmentPrintedEffect` | AILMENT-003 special choice |
| `ailment-crestfallen` | manual | treatment-success | p106 | `resolveTreatmentTransaction / resolveAilmentPrintedEffect` | - |
| `ailment-forager-s-twitch` | manual | diagnosis | p107 | `resolveTreatmentTransaction / resolveAilmentPrintedEffect` | AILMENT-003 special diagnosis |
| `ailment-midge-munched` | manual | treatment-success | p109 | `resolveTreatmentTransaction / resolveAilmentPrintedEffect` | - |
| `ailment-migration-migraine` | manual | treatment-success | p109 | `resolveTreatmentTransaction / resolveAilmentPrintedEffect` | - |
| `ailment-night-shift` | manual | treatment-success | p110 | `resolveTreatmentTransaction / resolveAilmentPrintedEffect` | - |
| `ailment-soured-dough` | manual | treatment-success | p112 | `resolveTreatmentTransaction / resolveAilmentPrintedEffect` | AILMENT-003/AILMENT-005 special failure |
| `ailment-stingshock` | manual | treatment-success | p112 | `resolveTreatmentTransaction / resolveAilmentPrintedEffect` | AILMENT-003/AILMENT-007 special success |
| `ailment-trowel-trouble` | manual | treatment-success | p114 | `resolveTreatmentTransaction / resolveAilmentPrintedEffect` | - |
| `ailment-wormridden` | manual | treatment-success | p115 | `resolveTreatmentTransaction / resolveAilmentPrintedEffect` | AILMENT-003/AILMENT-007 special success |
| `ailment-bad-idea` | manual | treatment-success | p104 | `resolveTreatmentTransaction / resolveAilmentPrintedEffect` | AILMENT-003/AILMENT-007 special success |
| `ailment-bite-the-hand-that-cures` | manual | treatment-success | p104 | `resolveTreatmentTransaction / resolveAilmentPrintedEffect` | - |
| `ailment-bloodthirst` | manual | treatment-success | p105 | `resolveTreatmentTransaction / resolveAilmentPrintedEffect` | - |
| `ailment-broken-beaks-and-thinning-fangs` | manual | treatment-success | p105 | `resolveTreatmentTransaction / resolveAilmentPrintedEffect` | - |
| `ailment-herbivorous-tendencies` | manual | treatment-success | p108 | `resolveTreatmentTransaction / resolveAilmentPrintedEffect` | - |
| `ailment-nervefright` | manual | treatment-success | p110 | `resolveTreatmentTransaction / resolveAilmentPrintedEffect` | - |
| `ailment-pinned-by-pine` | manual | timer-change | p111 | `resolveTreatmentTransaction / resolveAilmentPrintedEffect` | AILMENT-003 special timer |
| `ailment-quagmire-s-scale` | manual | timer-change | p111 | `resolveTreatmentTransaction / resolveAilmentPrintedEffect` | AILMENT-003/AILMENT-005 special timer |
| `ailment-seasonshift` | manual | treatment-success | p111 | `resolveTreatmentTransaction / resolveAilmentPrintedEffect` | - |
| `ailment-smokesnout` | manual | treatment-success | p112 | `resolveTreatmentTransaction / resolveAilmentPrintedEffect` | - |
| `ailment-snail-ails` | manual | treatment-success | p113 | `resolveTreatmentTransaction / resolveAilmentPrintedEffect` | - |
| `ailment-fight-marks` | manual | treatment-success | p106 | `resolveTreatmentTransaction / resolveAilmentPrintedEffect` | AILMENT-003/AILMENT-004 special success |
| `ailment-foul-deceiver` | manual | treatment-success | p107 | `resolveTreatmentTransaction / resolveAilmentPrintedEffect` | - |
| `ailment-groundhog-syndrome` | manual | treatment-success | p107 | `resolveTreatmentTransaction / resolveAilmentPrintedEffect` | AILMENT-003/AILMENT-005 special failure |
| `ailment-hunted` | manual | treatment-success | p108 | `resolveTreatmentTransaction / resolveAilmentPrintedEffect` | - |
| `ailment-living-with-a-black-beast` | manual | treatment-success | p108 | `resolveTreatmentTransaction / resolveAilmentPrintedEffect` | - |
| `ailment-lockjaw` | manual | treatment-success | p108 | `resolveTreatmentTransaction / resolveAilmentPrintedEffect` | - |
| `ailment-long-drop` | manual | treatment-success | p109 | `resolveTreatmentTransaction / resolveAilmentPrintedEffect` | - |
| `ailment-mawfoam` | manual | treatment-success | p109 | `resolveTreatmentTransaction / resolveAilmentPrintedEffect` | - |
| `ailment-titan-touched` | manual | treatment-success | p114 | `resolveTreatmentTransaction / resolveAilmentPrintedEffect` | - |
| `ailment-wake` | manual | barter | p115 | `resolveTreatmentTransaction / resolveAilmentPrintedEffect` | AILMENT-003/AILMENT-007 special success |
| `ailment-wingbreak` | manual | treatment-success | p115 | `resolveTreatmentTransaction / resolveAilmentPrintedEffect` | - |

## Manual 처리 계약

각 `manual` row는 런타임 registry에 `manualResolution.reason`, 결정할 내용, 선택지, 결정 후 상태 변화, Rule ID와 source page를 보존한다. 현재 기본 전사는 owner별 source와 prompt를 연결하지만 355개 행의 고유 선택지·상태 변화 자동화는 남아 있다.

자동화 범위와 남은 제한은 `RULE_ENGINE_STATUS.md`, 변경 근거는 `PHASE3_REPORT.md`를 따른다.

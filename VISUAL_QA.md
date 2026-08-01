# Visual QA

## Environment

- Date: 2026-08-02
- Browser: Codex in-app browser, Vite development build
- Widths: 360, 390, 768, 1024, 1440, 1920px

## Results

| Check | Result |
|---|---|
| Document horizontal overflow | Pass at all six widths; 360px stamp overflow fixed |
| Map | Pass; labels use opaque high-contrast backing and map remains internally pannable |
| Dashboard/navigation | Pass; current state and pending action remain visible |
| Patient/Treatment/Inventory | Pass; no viewport clipping in sampled states |
| Almanack | Pass; search/filter labels, source page, locked state and 80-row staged rendering |
| Keyboard/focus | Pass for native navigation, buttons, inputs and visible focus styles |
| Reduced Motion | Pass; global reduced-motion media query present |
| Touch target | Pass; interactive controls use 44px minimum |
| Console | Fresh 5179 URL produced no current error/warning; one historical 5177 HMR dependency message was excluded after clean navigation |

## Screenshots

- `output/visual-qa/desktop-1440-dashboard.png`
- `output/visual-qa/desktop-1440-journey-content.png`
- `output/visual-qa/desktop-1440-map-content.png`
- `output/visual-qa/desktop-1440-patient-content.png`
- `output/visual-qa/desktop-1440-inventory-content.png`
- `output/visual-qa/desktop-1440-almanack-content.png`
- `output/visual-qa/desktop-1440-archive.png`
- `output/visual-qa/mobile-390-dashboard.png`

Barrow, Manual Effect, Clinic은 현재 저장의 활성 상태가 없어 빈/비활성 패널로 확인했다. 강제로 게임 state를 조작해 성공 화면을 연출하지 않았다.

## Residual Issues

- App main chunk가 약 607 kB라 500 kB 경고가 남는다.
- Barrow 전용 입력 화면과 일부 legacy Downtime 화면은 정보 밀도가 높다.
- automated screenshot comparison은 없으며 이번 검증은 breakpoint별 smoke와 저장된 기준 이미지다.

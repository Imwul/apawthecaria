import type { JournalTab } from '../sessionNavigation';

type IconKind = JournalTab | 'search' | 'download' | 'upload' | 'camera' | 'cloud' | 'exit' | 'reset' | 'card' | 'edit' | 'bookmark' | 'home' | 'coin' | 'paw' | 'clock' | 'tools' | 'warning' | 'gift';

// Solid ink silhouettes keep utility controls visually consistent on every OS.
const shapes: Record<IconKind, string> = {
  play: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm4.7 5.3-3 6.4-6.4 3 3-6.4 6.4-3Zm-4.7 3.4a1.3 1.3 0 1 0 0 2.6 1.3 1.3 0 0 0 0-2.6Z',
  map: 'M2 5 8 2v17l-6 3V5Zm10-3 4 3v17l-4-3V2Zm6 3 6-3v17l-6 3V5Z',
  ailments: 'M8 2h8v3H8V2ZM5 4h2v3h10V4h2v18H5V4Zm6 6v3H8v2h3v3h2v-3h3v-2h-3v-3h-2Z',
  reagents: 'M11 13C3 14 2 8 3 3c7 0 10 4 8 10Zm2-2c0-7 4-9 9-9 0 6-4 10-9 9Zm-1 3 7-2c0 6-4 8-8 7l-3 4H5l7-9Z',
  bio: 'M7 6V4a5 5 0 0 1 10 0v2h3l2 15H2L4 6h3Zm2 0h6V4a3 3 0 0 0-6 0v2Zm-2 6v5h10v-5H7Z',
  almanack: 'M2 3h5v19H2V3Zm7 2h4v17H9V5Zm6-2 4-1 5 19-4 1-5-19Z',
  patientArchive: 'M2 5h8l3 3h9v14H2V5Zm2-3h17v4h-8l-3-3H4V2Z',
  livingArchive: 'M11 22v-8C3 15 1 9 3 5c5-1 8 2 8 5 0-6 4-8 9-8 2 6-1 12-7 12v8h-2Z',
  journals: 'M2 22 6 15 17 3c4-3 7 1 4 4L9 18l-7 4Zm2 0h16v2H4v-2Z',
  search: 'M10 2a8 8 0 1 0 4.7 14.5l5.8 5.8 2-2-5.8-5.8A8 8 0 0 0 10 2Zm0 3a5 5 0 1 1 0 10 5 5 0 0 1 0-10Z',
  download: 'M10 2h4v9h4l-6 6-6-6h4V2ZM3 16h3v4h12v-4h3v7H3v-7Z',
  upload: 'm12 2 6 6h-4v9h-4V8H6l6-6ZM3 16h3v4h12v-4h3v7H3v-7Z',
  camera: 'M8 3h8l2 4h4v15H2V7h4l2-4Zm4 6a5 5 0 1 0 0 10 5 5 0 0 0 0-10Zm0 3a2 2 0 1 1 0 4 2 2 0 0 1 0-4Z',
  cloud: 'M6 19a5 5 0 0 1-1-10 7 7 0 0 1 13-2 6 6 0 0 1 0 12H6Z',
  exit: 'M2 2h10v7H9V5H5v14h4v-4h3v7H2V2Zm14 5 7 5-7 5v-3H8v-4h8V7Z',
  reset: 'M4 2v5a9 9 0 1 1-2 9l3-1a6 6 0 1 0 2-7h4v3H1V2h3Z',
  card: 'M5 1h14v22H5V1Zm7 5-4 6 4 6 4-6-4-6Z',
  edit: 'm3 15 12-12 6 6L9 21l-7 1 1-7Zm14-14 3-1 4 4-1 3-6-6Z',
  bookmark: 'M5 2h14v21l-7-5-7 5V2Z',
  home: 'm12 2 11 9h-3v11h-6v-7h-4v7H4V11H1L12 2Z',
  coin: 'M12 1a11 11 0 1 0 0 22 11 11 0 0 0 0-22Zm0 3a8 8 0 1 1 0 16 8 8 0 0 1 0-16ZM9 7h6v3h-3v4h3v3H9V7Z',
  paw: 'M5 4c4-1 5 5 2 6-4 1-5-5-2-6Zm7-3c4 0 4 6 1 7-4 0-5-6-1-7Zm7 3c4 1 1 7-2 6-4-1-2-7 2-6ZM4 11c4-1 5 5 2 6-4 1-5-5-2-6Zm8-1c3 0 4 4 7 6 4 5-1 7-5 5-4 2-9 0-5-5 2-2 1-6 3-6Z',
  clock: 'M12 1a11 11 0 1 0 0 22 11 11 0 0 0 0-22Zm1 4v6l5 3-2 2-6-4V5h3Z',
  tools: 'M21 1a7 7 0 0 0-9 8L2 19a3 3 0 0 0 4 4L16 13a7 7 0 0 0 7-9l-4 4-3-3 5-4Z',
  warning: 'M12 1 0 23h24L12 1Zm-2 7h4l-1 8h-2l-1-8Zm0 10h4v3h-4v-3Z',
  gift: 'M11 7C1 9 0-1 7 1c3 1 4 3 5 5 1-2 2-4 5-5 7-2 6 8-4 6v3h10v5H1v-5h10V7Zm-4-4c-4 0-1 4 3 3L7 3Zm10 0-3 3c4 1 7-3 3-3ZM3 16h8v7H3v-7Zm10 0h8v7h-8v-7Z'
};

export function FieldIcon({ kind }: { kind: IconKind }) {
  return <svg className="field-icon" viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" focusable="false" fill="currentColor"><path fillRule="evenodd" d={shapes[kind]} /></svg>;
}

import type { JournalTab } from '../sessionNavigation';

// Small ink drawings, not a second set of interactive controls.
const strokes: Record<JournalTab, string> = {
  play: 'M12 6C8 3 4 4 2 5v15c4-2 7-1 10 1 3-2 6-3 10-1V5c-3-1-6-2-10 1Zm0 0v15M5 8l4 1M5 12l4 1m6-4 4-1m-4 5 4-1',
  ailments: 'M7 3h10v3H7zM7 4H4v18h16V4h-3M9 10h6m-3-3v6M7 17h10M7 20h6',
  reagents: 'M5 23c4-7 7-12 14-20M12 13C4 14 2 10 3 5c7 0 10 3 9 8Zm1-2c0-7 4-9 9-9 0 5-3 9-9 9Zm-5 8c6 1 10-2 11-6-6-1-9 1-11 6Z',
  bio: 'M7 6V4c0-4 10-4 10 0v2M5 7c3-2 11-2 14 0l2 14c-5 2-13 2-18 0L5 7Zm0 0 2 7h10l2-7M8 18h8m-4-7v5',
  map: 'm2 5 7-3 6 3 7-3v18l-7 3-6-3-7 3V5Zm7-3v18m6-15v18M5 14c3-8 10 4 14-5',
  almanack: 'M3 2h5v20H3zm5 3h5v17H8zm6-1 5-1 4 18-5 1-4-18ZM4 6h3m2 4h3m4-3 4-1',
  patientArchive: 'M3 4h7l3 3h8v15H3V4Zm0 8h18M7 2h14v5M8 16h8m-6 3h4',
  livingArchive: 'M12 23V10m0 8L6 13m6 3 5-4M9 10C2 8 4 2 9 5c-1-6 7-6 6 0 6-2 8 5 1 6m-4 8c-5 1-8-1-9-4 5-1 8 1 9 4Zm0 1c4 1 8-1 9-5-5 0-8 2-9 5Z',
  journals: 'M3 23 19 3c3-2 4 0 3 3-1 5-6 11-13 13L3 23Zm6-5V9m3 5 7-2M1 23h12'
};

export function FieldIcon({ kind }: { kind: JournalTab }) {
  return <svg className="field-icon" viewBox="0 0 26 26" width="26" height="26" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"><path d={strokes[kind]} /></svg>;
}

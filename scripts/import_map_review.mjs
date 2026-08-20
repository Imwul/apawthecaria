import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const [, , savePath, outputPath = 'src/map/detection/manualMapReview.json'] = process.argv;

if (!savePath) {
  throw new Error('Usage: node scripts/import_map_review.mjs <campaign-save.json> [output.json]');
}

const source = JSON.parse(await readFile(resolve(savePath), 'utf8'));
if (!Array.isArray(source.customMapLocations)) {
  throw new Error('Campaign save does not contain map review data.');
}

const regionLabels = {
  Bog: '수렁',
  Forest: '숲',
  Loch: '호수·강',
  Meadow: '초원',
  Mountain: '산맥',
  Wilds: '야생'
};

let unnamedIndex = 0;
const hasReviewedStartingOdoak = source.customMapLocations.some(row => row?.id === 'starting_oak_road');
const locations = source.customMapLocations.flatMap(row => {
  if (!row || typeof row.id !== 'string' || !row.id.trim()) return [];
  const x = Number(row.x);
  const y = Number(row.y);
  if (!Number.isFinite(x) || !Number.isFinite(y)) return [];
  // Older builds carried a duplicate `starting_oak_road` id for the printed
  // Odoak marker and could later persist a fallback `odoak` stop at (50, 50).
  // The player's reviewed starting marker is the real Odoak correction.
  const id = hasReviewedStartingOdoak && row.id === 'starting_oak_road'
    ? 'odoak'
    : hasReviewedStartingOdoak && row.id === 'odoak'
      ? 'starting_oak_road'
      : row.id;
  const hidesLegacyOdoakDuplicate = hasReviewedStartingOdoak && row.id === 'odoak';
  const isAdded = id.startsWith('mark_') || id.startsWith('custom_');
  const kind = typeof row.kind === 'string' ? row.kind : undefined;
  const region = typeof row.region === 'string' ? row.region : undefined;
  const rawLabel = typeof row.label === 'string' ? row.label.trim() : '';
  const label = rawLabel || (isAdded
    ? `${kind === 'ruin' ? '티탄 유적' : regionLabels[region] || '야생'} 추가 표시 ${++unnamedIndex}`
    : row.id);
  return [{
    id,
    label,
    x,
    y,
    ...(region ? { region } : {}),
    ...(kind ? { kind } : {}),
    hidden: hidesLegacyOdoakDuplicate || row.hidden === true,
    added: isAdded
  }];
});

const reviewedAtMs = Math.max(0, ...source.customMapLocations.map(row => Number(row?.createdAt) || 0));
const output = {
  version: 1,
  coordinateSpace: 'percent-0-100',
  reviewedAt: reviewedAtMs ? new Date(reviewedAtMs).toISOString() : null,
  source: 'player-reviewed-node-editor',
  locations
};

await writeFile(resolve(outputPath), `${JSON.stringify(output, null, 2)}\n`, 'utf8');
console.log(`Imported ${locations.length} reviewed node locations. Connection data was intentionally excluded.`);

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const crypto = require('crypto');

const tree = 'e15cf39aa3a23c8b23b59b52e012e320de493fd6';
const parent1 = '57291908d3bdc2d089ca407a02b137fe1d083a01';
const parent2 = '7348add8f19c4f4e0c46d39cd5649fe66eea2a34';
const authorName = '이준형';
const authorEmail = 'imwul@users.noreply.github.com';
const timestamp = Math.floor(Date.now() / 1000);
const timezone = '+0900';

const message = 'feat: display reagent preparation & application details in Almanac and Specimen Herbarium';

const content = `tree ${tree}\n` +
  `parent ${parent1}\n` +
  `parent ${parent2}\n` +
  `author ${authorName} <${authorEmail}> ${timestamp} ${timezone}\n` +
  `committer ${authorName} <${authorEmail}> ${timestamp} ${timezone}\n` +
  `\n` +
  `${message}\n`;

const header = `commit ${Buffer.byteLength(content)}\0`;
const fullBuffer = Buffer.concat([Buffer.from(header), Buffer.from(content)]);

// SHA-1
const sha1 = crypto.createHash('sha1').update(fullBuffer).digest('hex');
console.log('Generated Commit SHA:', sha1);

// Compress
const compressed = zlib.deflateSync(fullBuffer);

// Write to .git/objects/xx/xxxxxxx
const dir = path.join('.git', 'objects', sha1.slice(0, 2));
const file = path.join(dir, sha1.slice(2));

if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}
fs.writeFileSync(file, compressed);
console.log('Wrote object file to:', file);

// Update branch ref
const refPath = path.join('.git', 'refs', 'heads', 'codex', 'rulebook-webapp-fixes');
fs.writeFileSync(refPath, sha1 + '\n');
console.log('Updated ref', refPath, 'to', sha1);

// Cleanup merge files
const mergeFiles = [
  path.join('.git', 'MERGE_HEAD'),
  path.join('.git', 'MERGE_MODE'),
  path.join('.git', 'MERGE_MSG'),
  path.join('.git', 'AUTO_MERGE')
];
for (const f of mergeFiles) {
  if (fs.existsSync(f)) {
    fs.unlinkSync(f);
    console.log('Cleaned up merge file:', f);
  }
}
console.log('Commit completed successfully!');

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const crypto = require('crypto');
const { execSync } = require('child_process');

const message = process.argv[2] || 'chore: update';

try {
  // 1. Get Tree SHA
  const tree = execSync('git write-tree', { encoding: 'utf-8' }).trim();
  console.log('Tree SHA:', tree);

  // 2. Get Parent Commit SHA
  const parent = execSync('git rev-parse HEAD', { encoding: 'utf-8' }).trim();
  console.log('Parent SHA:', parent);

  const authorName = '이준형';
  const authorEmail = 'imwul@users.noreply.github.com';
  const timestamp = Math.floor(Date.now() / 1000);
  const timezone = '+0900';

  const content = `tree ${tree}\n` +
    `parent ${parent}\n` +
    `author ${authorName} <${authorEmail}> ${timestamp} ${timezone}\n` +
    `committer ${authorName} <${authorEmail}> ${timestamp} ${timezone}\n` +
    `\n` +
    `${message}\n`;

  const header = `commit ${Buffer.byteLength(content)}\0`;
  const fullBuffer = Buffer.concat([Buffer.from(header), Buffer.from(content)]);

  // 3. SHA-1
  const sha1 = crypto.createHash('sha1').update(fullBuffer).digest('hex');
  console.log('Generated Commit SHA:', sha1);

  // 4. Compress
  const compressed = zlib.deflateSync(fullBuffer);

  // 5. Write to .git/objects/xx/xxxxxxx
  const dir = path.join('.git', 'objects', sha1.slice(0, 2));
  const file = path.join(dir, sha1.slice(2));

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(file, compressed);
  console.log('Wrote object file to:', file);

  // 6. Update branch ref
  const refPath = path.join('.git', 'refs', 'heads', 'codex', 'rulebook-webapp-fixes');
  fs.writeFileSync(refPath, sha1 + '\n');
  console.log('Updated ref', refPath, 'to', sha1);

  console.log('Commit completed successfully!');
} catch (err) {
  console.error('Error creating commit:', err);
  process.exit(1);
}

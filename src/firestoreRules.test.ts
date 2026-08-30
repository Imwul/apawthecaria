// @ts-expect-error Vitest runs this source audit in Node; the app build intentionally exposes browser types only.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const rules = readFileSync('firestore.rules', 'utf8');

describe('cloud save ownership rules', () => {
  it('requires stored ownership for account child documents', () => {
    expect(rules).toContain('function canReadExistingOwnSave(documentId)');
    expect(rules).toContain('isOwnChildSaveDocument(documentId)');
    expect(rules).toContain('resource.data.ownerUid == request.auth.uid');
    expect(rules).toContain('request.resource.data.ownerUid == request.auth.uid');
    expect(rules).not.toContain('function isOwnSaveDocument(documentId)');
  });

  it('keeps the exact account document accessible for legacy migration', () => {
    expect(rules).toContain("documentId == 'uid_' + request.auth.uid");
    expect(rules).toContain('isOwnPrimarySaveDocument(documentId)');
    expect(rules).toContain('!exists(/databases/$(database)/documents/saves/$(documentId))');
    expect(rules).toContain("!('ownerUid' in resource.data)");
    expect(rules).toContain('resource.data.ownerUid == request.auth.uid');
  });

  it('checks both existing and incoming ownership when child payloads are changed', () => {
    const normalized = rules.replace(/\s+/g, ' ');
    expect(normalized).toMatch(/isOwnChildSaveDocument\(documentId\) && resource\.data\.ownerUid == request\.auth\.uid/);
    expect(normalized).toMatch(/isOwnChildSaveDocument\(documentId\)[\s\S]*resource\.data\.ownerUid == request\.auth\.uid[\s\S]*request\.resource\.data\.ownerUid == request\.auth\.uid/);
    expect(normalized).toMatch(/allow delete:[\s\S]*isOwnChildSaveDocument\(documentId\)[\s\S]*resource\.data\.ownerUid == request\.auth\.uid/);
  });

  it('creates new payloads below an exact account path instead of a prefix-matchable flat id', () => {
    const normalized = rules.replace(/\s+/g, ' ');
    expect(normalized).toContain("accountDocumentId == 'uid_' + request.auth.uid");
    expect(normalized).toContain("accountCollection == 'payloads' || accountCollection == 'maps'");
    // Reading a missing new-format manifest must yield a normal not-found so
    // the client can try the legacy flat payload path. Exact account scoping
    // provides the read boundary; mutations still verify ownerUid.
    expect(normalized).toContain('allow read: if isOwnAccountCollection();');
    expect(normalized).toMatch(/allow delete: if isOwnAccountCollection\(\) && resource\.data\.ownerUid == request\.auth\.uid/);
    expect(normalized).toMatch(/allow create: if isOwnAccountCollection\(\) && request\.resource\.data\.ownerUid == request\.auth\.uid/);
    expect(normalized).not.toMatch(/allow create:[\s\S]*?isOwnPrimarySaveDocument\(documentId\) \|\| isOwnChildSaveDocument\(documentId\)/);
  });
});

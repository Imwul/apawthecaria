// @ts-expect-error Node is used only by Vitest to execute the actual browser handler.
import { readFileSync } from 'node:fs';
// @ts-expect-error Node is used only by Vitest to execute the actual browser handler.
import { fileURLToPath } from 'node:url';
import { describe, expect, it, vi } from 'vitest';
import * as ts from 'typescript';
import { isRecognizableCampaignSave } from './campaignSave';

const source = readFileSync(fileURLToPath(new URL('../App.tsx', import.meta.url)), 'utf8');
const start = source.indexOf('  const handleImportData =');
const end = source.indexOf('\n  return (', start);
const actualHandler = ts.transpileModule(source.slice(start, end), {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.None }
}).outputText;

type Reader = { onload?: (event: { target: { result: string } }) => void; onerror?: () => void; readAsText: (file: object) => void };
const fixture = () => {
  const readers: Reader[] = [];
  const setImportNotice = vi.fn();
  const onCampaignImported = vi.fn();
  const migrateCampaignSave = vi.fn(value => ({ ok: true, state: value }));
  const journalViewAliveRef = { current: true };
  const journalImportSequenceRef = { current: 0 };
  class FakeReader {
    onload?: Reader['onload'];
    onerror?: Reader['onerror'];
    readAsText = vi.fn();
    constructor() { readers.push(this); }
  }
  const handle = new Function('dependencies', `
    const { FileReader, setImportNotice, onCampaignImported, migrateCampaignSave, isRecognizableCampaignSave, journalViewAliveRef, journalImportSequenceRef } = dependencies;
    ${actualHandler}
    return handleImportData;
  `)({ FileReader: FakeReader, setImportNotice, onCampaignImported, migrateCampaignSave, isRecognizableCampaignSave, journalViewAliveRef, journalImportSequenceRef });
  const event = { target: { value: 'C:\\fakepath\\qa.json', files: [{}] } };
  return { handle, event, readers, setImportNotice, onCampaignImported, migrateCampaignSave, journalViewAliveRef };
};

describe('Journal backup import recovery', () => {
  it('clears the selected file before reading so a failed same-file selection can retry', () => {
    const setup = fixture();
    setup.handle(setup.event);
    expect(setup.event.target.value).toBe('');
    setup.readers[0].onload?.({ target: { result: '{broken' } });
    expect(setup.onCampaignImported).not.toHaveBeenCalled();
    setup.event.target.value = 'C:\\fakepath\\qa.json';
    setup.handle(setup.event);
    setup.readers[1].onload?.({ target: { result: '{"bio":{"name":"Recovered"}}' } });
    expect(setup.onCampaignImported).toHaveBeenCalledOnce();
    expect(setup.onCampaignImported).toHaveBeenCalledWith({ bio: { name: 'Recovered' } });
  });

  it('reports a file read error and preserves the current campaign', () => {
    const setup = fixture();
    setup.handle(setup.event);
    setup.readers[0].onerror?.();
    expect(setup.setImportNotice).toHaveBeenCalledWith({ text: '세이브 파일을 읽지 못했습니다. 현재 기록은 그대로 둡니다.' });
    expect(setup.migrateCampaignSave).not.toHaveBeenCalled();
    expect(setup.onCampaignImported).not.toHaveBeenCalled();
  });

  it('does nothing after a cancelled file chooser', () => {
    const setup = fixture();
    setup.handle({ target: { value: '', files: [] } });
    expect(setup.readers).toEqual([]);
    expect(setup.onCampaignImported).not.toHaveBeenCalled();
  });

  it('ignores a superseded read when the earlier large file completes after the latest selection', () => {
    const setup = fixture();
    setup.handle(setup.event);
    setup.handle(setup.event);
    setup.readers[1].onload?.({ target: { result: '{"bio":{"name":"Latest"}}' } });
    setup.readers[0].onload?.({ target: { result: '{"bio":{"name":"Earlier"}}' } });
    setup.readers[0].onerror?.();
    expect(setup.onCampaignImported).toHaveBeenCalledOnce();
    expect(setup.onCampaignImported).toHaveBeenCalledWith({ bio: { name: 'Latest' } });
    expect(setup.setImportNotice).not.toHaveBeenCalled();
  });

  it('does not import or display an error after leaving the Journal view', () => {
    const setup = fixture();
    setup.handle(setup.event);
    setup.journalViewAliveRef.current = false;
    setup.readers[0].onload?.({ target: { result: '{"bio":{"name":"Earlier"}}' } });
    setup.readers[0].onerror?.();
    expect(setup.onCampaignImported).not.toHaveBeenCalled();
    expect(setup.setImportNotice).not.toHaveBeenCalled();
  });
});

describe('header backup import ordering', () => {
  it('keeps the latest selection when native file reads finish in reverse order', () => {
    const headerStart = source.indexOf('  const handleCampaignImportFile =');
    const headerEnd = source.indexOf('\n\n  useEffect(', headerStart);
    const headerHandler = ts.transpileModule(source.slice(headerStart, headerEnd), {
      compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.None }
    }).outputText;
    const readers: FakeReader[] = [];
    class FakeReader {
      result = '';
      onload?: () => void;
      onerror?: () => void;
      readAsText = vi.fn();
      constructor() { readers.push(this); }
    }
    const applyImportedCampaignState = vi.fn();
    const showAlert = vi.fn();
    const handle = new Function('dependencies', `
      const { FileReader, campaignImportSequenceRef, isRecognizableCampaignSave, migrateCampaignSave, applyImportedCampaignState, showAlert } = dependencies;
      ${headerHandler}
      return handleCampaignImportFile;
    `)({
      FileReader: FakeReader,
      campaignImportSequenceRef: { current: 0 },
      isRecognizableCampaignSave,
      migrateCampaignSave: (value: unknown) => ({ ok: true, state: value }),
      applyImportedCampaignState,
      showAlert
    });
    handle({ target: { files: [{}], value: 'earlier.json' } });
    handle({ target: { files: [{}], value: 'latest.json' } });
    readers[1].result = '{"bio":{"name":"Latest"}}';
    readers[1].onload?.();
    readers[0].result = '{"bio":{"name":"Earlier"}}';
    readers[0].onload?.();
    readers[0].onerror?.();
    expect(applyImportedCampaignState).toHaveBeenCalledOnce();
    expect(applyImportedCampaignState).toHaveBeenCalledWith({ bio: { name: 'Latest' } });
    expect(showAlert).not.toHaveBeenCalled();
  });
});

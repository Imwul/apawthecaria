// @ts-expect-error Node is used by Vitest to execute the actual App handlers.
import { readFileSync } from 'node:fs';
// @ts-expect-error Node is used by Vitest to execute the actual App handlers.
import { fileURLToPath } from 'node:url';
import { describe, expect, it, vi } from 'vitest';
import * as ts from 'typescript';
import { createPlayerMemorySemantic } from './journalSemantics';

const source = readFileSync(fileURLToPath(new URL('./App.tsx', import.meta.url)), 'utf8');
const handler = (name: string, next: string) => ts.transpileModule(
  source.slice(source.indexOf(`  const ${name} =`), source.indexOf(`  const ${next} =`, source.indexOf(`  const ${name} =`))),
  { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.None } }
).outputText;

const newPhotoHandler = handler('handleNewJournalPhotos', 'handleRemovePendingPhoto');
const existingPhotoHandler = handler('handleAddPhotosToJournal', 'handleRemoveJournalPhoto');
const saveHandler = handler('handleAddJournal', 'handleRemoveJournal');
const photo = { id: 'photo:one', name: 'field.png', dataUrl: 'data:image/png;base64,qa' };

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<T>((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}

const fixture = () => {
  const dependencies = {
    pendingPhotoReadsRef: { current: 0 },
    journalViewAliveRef: { current: true },
    setPreparingPhotos: vi.fn(),
    setNewPhotos: vi.fn(),
    prepareJournalPhotos: vi.fn(),
    showAlert: vi.fn(),
    updateState: vi.fn(),
    createPlayerMemorySemantic,
    newTitle: 'Field memory', newText: 'A photo belongs with this memory', newPhotos: [photo],
    setNewTitle: vi.fn(), setNewText: vi.fn(), setSavedJournalId: vi.fn()
  };
  const actual = new Function('d', `
    const { pendingPhotoReadsRef, journalViewAliveRef, setPreparingPhotos, setNewPhotos,
      prepareJournalPhotos, showAlert, updateState, newTitle, newText, newPhotos,
      setNewTitle, setNewText, setSavedJournalId, createPlayerMemorySemantic } = d;
    ${newPhotoHandler}
    ${existingPhotoHandler}
    ${saveHandler}
    return { add: handleNewJournalPhotos, attach: handleAddPhotosToJournal, save: handleAddJournal };
  `)(dependencies);
  return { ...dependencies, ...actual };
};

describe('journal attachment readiness and view ownership', () => {
  it('blocks submission while a real photo preparation boundary is pending and keeps the draft', async () => {
    const setup = fixture();
    const read = deferred<object[]>();
    setup.prepareJournalPhotos.mockReturnValue(read.promise);
    const work = setup.add({ length: 1 });
    setup.save({ preventDefault: vi.fn() });
    expect(setup.pendingPhotoReadsRef.current).toBe(1);
    expect(setup.setPreparingPhotos).toHaveBeenLastCalledWith(true);
    expect(setup.updateState).not.toHaveBeenCalled();
    expect(setup.setNewTitle).not.toHaveBeenCalled();
    read.resolve([photo]);
    await work;
    expect(setup.setNewPhotos.mock.calls[0][0]([])).toEqual([photo]);
    expect(setup.pendingPhotoReadsRef.current).toBe(0);
    expect(setup.setPreparingPhotos).toHaveBeenLastCalledWith(false);
  });

  it('keeps saving blocked until every concurrent selection has finished', async () => {
    const setup = fixture();
    const first = deferred<object[]>();
    const second = deferred<object[]>();
    setup.prepareJournalPhotos.mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise);
    const a = setup.add({ length: 1 });
    const b = setup.add({ length: 1 });
    second.resolve([photo]);
    await b;
    expect(setup.pendingPhotoReadsRef.current).toBe(1);
    expect(setup.setPreparingPhotos).toHaveBeenLastCalledWith(true);
    setup.save({ preventDefault: vi.fn() });
    expect(setup.updateState).not.toHaveBeenCalled();
    first.resolve([]);
    await a;
    expect(setup.setPreparingPhotos).toHaveBeenLastCalledWith(false);
  });

  it('releases the save boundary and reports a failed read without clearing the text', async () => {
    const setup = fixture();
    setup.prepareJournalPhotos.mockRejectedValue(new Error('Unreadable image'));
    await setup.add({ length: 1 });
    expect(setup.showAlert).toHaveBeenCalledWith('Unreadable image');
    expect(setup.pendingPhotoReadsRef.current).toBe(0);
    expect(setup.setPreparingPhotos).toHaveBeenLastCalledWith(false);
    expect(setup.setNewPhotos).not.toHaveBeenCalled();
    expect(setup.setNewText).not.toHaveBeenCalled();
  });

  it('does not start work or show a loading state when the picker is cancelled', async () => {
    const setup = fixture();
    await setup.add(null);
    await setup.add({ length: 0 });
    expect(setup.prepareJournalPhotos).not.toHaveBeenCalled();
    expect(setup.setPreparingPhotos).not.toHaveBeenCalled();
  });

  it('ignores a draft photo that finishes after leaving its view', async () => {
    const setup = fixture();
    const read = deferred<object[]>();
    setup.prepareJournalPhotos.mockReturnValue(read.promise);
    const work = setup.add({ length: 1 });
    setup.journalViewAliveRef.current = false;
    read.resolve([photo]);
    await work;
    expect(setup.setNewPhotos).not.toHaveBeenCalled();
    expect(setup.pendingPhotoReadsRef.current).toBe(0);
  });

  it('does not apply an existing-journal photo or read error to a replacement view', async () => {
    const setup = fixture();
    const read = deferred<object[]>();
    setup.prepareJournalPhotos.mockReturnValue(read.promise);
    const work = setup.attach('shared-legacy-id', { length: 1 });
    setup.journalViewAliveRef.current = false;
    read.resolve([photo]);
    await work;
    expect(setup.updateState).not.toHaveBeenCalled();
    setup.prepareJournalPhotos.mockRejectedValue(new Error('Late error'));
    await setup.attach('shared-legacy-id', { length: 1 });
    expect(setup.showAlert).not.toHaveBeenCalled();
  });

  it('preserves existing attachments when a live journal receives a new photo', async () => {
    const setup = fixture();
    setup.prepareJournalPhotos.mockResolvedValue([photo]);
    await setup.attach('journal:one', { length: 1 });
    const before = { journals: [{ id: 'journal:one', photos: [{ id: 'older' }] }, { id: 'other', photos: [] }] };
    const after = setup.updateState.mock.calls[0][0](before);
    expect(after.journals[0].photos).toEqual([{ id: 'older' }, photo]);
    expect(after.journals[1]).toBe(before.journals[1]);
    expect(before.journals[0].photos).toEqual([{ id: 'older' }]);
  });

  it('allows the normal save once preparation is ready', () => {
    const setup = fixture();
    setup.save({ preventDefault: vi.fn() });
    expect(setup.updateState).toHaveBeenCalledOnce();
    const previous = { id: 'earlier', title: 'Earlier memory', text: 'Keep this', photos: [] };
    const before = { journeyActive: false, journey: null, journals: [previous] };
    const after = setup.updateState.mock.calls[0][0](before);
    expect(after.journals[0]).toMatchObject({
      title: setup.newTitle,
      text: setup.newText,
      photos: [photo],
      semantic: { category: 'player-memory', memory: setup.newText }
    });
    expect(after.journals[1]).toBe(previous);
    expect(before.journals).toEqual([previous]);
    expect(setup.setNewTitle).toHaveBeenCalledWith('');
    expect(setup.setNewText).toHaveBeenCalledWith('');
    expect(setup.setNewPhotos).toHaveBeenCalledWith([]);
  });
});

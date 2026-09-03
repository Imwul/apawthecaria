/** A mounted campaign may write only the device context it actually loaded.
 * Revision/fingerprint cloud guards cannot establish slot ownership: a newer
 * save (including an edited clone) can legitimately pass those guards. */
export const createCampaignWriteOwnership = (readContext: () => readonly (string | null)[]) => {
  let ownedContext = readContext();
  let stale = false;

  const isCurrent = () => {
    if (stale) return false;
    const current = readContext();
    stale = current.length !== ownedContext.length
      || current.some((value, index) => value !== ownedContext[index]);
    return !stale;
  };

  return {
    isCurrent,
    checkpoint: () => {
      const context = ownedContext;
      return () => isCurrent() && ownedContext === context;
    },
    // Storage events also catch A -> B -> A switches. Once stale, only a full
    // reload may acquire the new context; neither an edit nor a slot action may.
    invalidate: () => { stale = true; },
    write: <T>(mutation: () => T): T => {
      if (!isCurrent()) throw new Error('stale-campaign-tab');
      // This callback must be synchronous. Adopt only our own completed local
      // write, never arbitrary shared state after an asynchronous operation.
      const result = mutation();
      ownedContext = readContext();
      return result;
    }
  };
};

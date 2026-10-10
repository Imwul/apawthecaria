import type { RulebookReferenceEntry } from './types';

export interface RulebookSourceSelection {
  page: number;
  endPage?: number;
}

const isBookPage = (page: number | undefined): page is number =>
  typeof page === 'number' && Number.isInteger(page) && page >= 1 && page <= 220;

/** The opening reference may target a page within its range. Related entries
 * start at their own first page; returning to the first history item restores
 * its requested page rather than silently losing the original shortcut. */
export const selectRulebookSource = (
  entry: Pick<RulebookReferenceEntry, 'sourcePage' | 'endPage'> | null,
  requestedPage: number | undefined,
  trailIndex: number
): RulebookSourceSelection => {
  const initialReference = trailIndex <= 0;
  if (!entry) return { page: initialReference && isBookPage(requestedPage) ? requestedPage : 6 };
  const endPage = entry.endPage || entry.sourcePage;
  const page = initialReference && isBookPage(requestedPage)
    && requestedPage >= entry.sourcePage && requestedPage <= endPage
    ? requestedPage
    : entry.sourcePage;
  return { page, endPage: entry.endPage };
};

export type ReviewDirectionV664 = "previous" | "next" | "first" | "last";

export interface ReviewNavigationV664 {
  currentKey: string | null;
  index: number;
  total: number;
  previousKey: string | null;
  nextKey: string | null;
  canGoPrevious: boolean;
  canGoNext: boolean;
  hasSelection: boolean;
  announcement: string;
}

function uniqueKeysV664(keys: readonly string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const key of keys) {
    if (!key || seen.has(key)) continue;
    seen.add(key);
    result.push(key);
  }
  return result;
}

export function reviewNavigationV664(
  visibleKeys: readonly string[],
  requestedKey: string | null,
): ReviewNavigationV664 {
  const keys = uniqueKeysV664(visibleKeys);
  const requestedIndex = requestedKey === null
    ? -1 : keys.indexOf(requestedKey);
  const index = keys.length === 0 ? -1
    : requestedIndex < 0 ? 0 : requestedIndex;
  const currentKey = index < 0 ? null : keys[index];
  const previousKey = index > 0 ? keys[index - 1] : null;
  const nextKey = index >= 0 && index < keys.length - 1
    ? keys[index + 1] : null;
  return {
    currentKey,
    index,
    total: keys.length,
    previousKey,
    nextKey,
    canGoPrevious: previousKey !== null,
    canGoNext: nextKey !== null,
    hasSelection: currentKey !== null,
    announcement: currentKey === null
      ? "当前筛选没有对象"
      : `第 ${index + 1} 项，共 ${keys.length} 项`,
  };
}

export function stepReviewNavigationV664(
  visibleKeys: readonly string[],
  requestedKey: string | null,
  direction: ReviewDirectionV664,
): string | null {
  const keys = uniqueKeysV664(visibleKeys);
  if (keys.length === 0) return null;
  const navigation = reviewNavigationV664(keys, requestedKey);
  if (direction === "first") return keys[0];
  if (direction === "last") return keys[keys.length - 1];
  if (direction === "previous") {
    return navigation.previousKey ?? navigation.currentKey;
  }
  return navigation.nextKey ?? navigation.currentKey;
}

export function isReviewSelectionVisibleV664(
  visibleKeys: readonly string[],
  selectedKey: string | null,
): boolean {
  return selectedKey !== null
    && uniqueKeysV664(visibleKeys).includes(selectedKey);
}

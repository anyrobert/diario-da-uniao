export interface CleanupResult {
  cleaned: string;
  duplicatedChunksRemoved: number;
  duplicatedCharsRemoved: number;
}

const MIN_DUPLICATE_CHARS = 120;
const MIN_DUPLICATE_RATIO = 0.2;

function getMinDuplicateLength(textLength: number): number {
  return Math.max(MIN_DUPLICATE_CHARS, Math.floor(textLength * MIN_DUPLICATE_RATIO));
}

function findDuplicatedSuffixStart(content: string): number {
  if (content.length < MIN_DUPLICATE_CHARS * 2) {
    return -1;
  }

  const minDuplicateLength = getMinDuplicateLength(content.length);
  const firstPossibleStart = Math.floor(content.length / 2);
  const lastPossibleStart = content.length - minDuplicateLength;

  for (let start = firstPossibleStart; start <= lastPossibleStart; start++) {
    const suffix = content.slice(start);
    const prefix = content.slice(0, start);

    if (prefix.includes(suffix)) {
      return start;
    }
  }

  return -1;
}

export function removeDuplicatedText(content: string): CleanupResult {
  const originalHasCRLF = content.includes("\r\n");
  const normalized = content.replaceAll("\r\n", "\n");
  const hasTrailingNewline = normalized.endsWith("\n");

  const duplicatedSuffixStart = findDuplicatedSuffixStart(normalized);
  if (duplicatedSuffixStart < 0) {
    return {
      cleaned: content,
      duplicatedChunksRemoved: 0,
      duplicatedCharsRemoved: 0,
    };
  }

  const duplicatedCharsRemoved = normalized.length - duplicatedSuffixStart;
  let cleaned = normalized.slice(0, duplicatedSuffixStart).trimEnd();

  if (hasTrailingNewline && cleaned.length > 0) {
    cleaned += "\n";
  }

  const restoredLineEndings = originalHasCRLF ? cleaned.replaceAll("\n", "\r\n") : cleaned;

  return {
    cleaned: restoredLineEndings,
    duplicatedChunksRemoved: 1,
    duplicatedCharsRemoved,
  };
}


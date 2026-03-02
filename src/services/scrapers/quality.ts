import { Highlight } from "../../types/index.ts";
import { formatToBrazilianDate, isBrazilianDate, roundMs } from "./helpers.ts";
import { HighlightQualityIssue, HighlightQualityReport } from "./types.ts";

export const evaluateHighlightsQuality = (
  highlights: Highlight[],
  targetDate?: string,
): HighlightQualityReport => {
  const expectedDate = targetDate ? formatToBrazilianDate(targetDate) : undefined;
  const seenUrls = new Set<string>();
  const issues: HighlightQualityIssue[] = [];

  highlights.forEach((highlight, index) => {
    const reasons: string[] = [];

    if (!highlight.section || highlight.section.trim().length < 3) {
      reasons.push("section is too short");
    }

    if (!highlight.text || highlight.text.trim().length < 20) {
      reasons.push("text is too short");
    }

    if (!highlight.date || !isBrazilianDate(highlight.date)) {
      reasons.push("date has invalid format");
    }

    if (expectedDate && highlight.date !== expectedDate) {
      reasons.push("date does not match requested target date");
    }

    if (!highlight.url) {
      reasons.push("url is empty");
    } else {
      try {
        new URL(highlight.url);
      } catch {
        reasons.push("url is invalid");
      }
    }

    if (highlight.url && seenUrls.has(highlight.url)) {
      reasons.push("url is duplicated");
    }
    seenUrls.add(highlight.url);

    if (reasons.length > 0) {
      issues.push({ index, reasons });
    }
  });

  const total = highlights.length;
  const invalid = issues.length;
  const valid = total - invalid;

  return {
    total,
    valid,
    invalid,
    completenessScore: total === 0 ? 0 : roundMs(valid / total),
    issues,
  };
};

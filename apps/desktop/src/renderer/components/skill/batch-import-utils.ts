/**
 * Derive a lowercase hyphenated slug from a skill name or filename. Mirrors the
 * loose slug transform used by the skill scan path: collapse non-alphanumerics
 * to single hyphens and trim leading/trailing hyphens. Returns "" when no
 * usable segment remains.
 */
export function slugifyBatchSkillName(value: string): string {
  const slug = (value || "")
    .toLowerCase()
    .replace(/\.zip$/i, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug;
}

/** Resolve the real filesystem path of a dropped file via the Electron bridge. */
export function resolveDroppedFilePath(file: File): string {
  return window.electron?.getPathForFile?.(file) ?? "";
}

/** True when a dropped file path points at a `.zip` archive. */
export function isSkillArchivePath(file: File): boolean {
  const path = resolveDroppedFilePath(file);
  if (!path) return false;
  return /\.zip$/i.test(path) || /\.zip$/i.test(file.name);
}

/**
 * Parse a free-form textarea into unique, plausibly-valid git/https URLs.
 * Splits on whitespace, commas, and newlines; keeps entries that look like URLs.
 */
export function parseBatchUrls(text: string): string[] {
  return Array.from(
    new Set(
      (text || "")
        .split(/[\s,]+/)
        .map((entry) => entry.trim())
        .filter((entry) => /^(https?|git|ssh):\/\//i.test(entry)),
    ),
  );
}

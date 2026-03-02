import { AppConfig } from "../types/index.ts";
import { isAbsolute, join, fromFileUrl } from "@std/path";
import { getOptionalEnv } from "../utils/env.ts";

const projectRootDir = fromFileUrl(new URL("../..", import.meta.url));

const resolveNotesDir = (): string => {
  const notesDir = getOptionalEnv("NOTES_DIR");
  if (!notesDir) {
    return join(projectRootDir, "notes");
  }

  return isAbsolute(notesDir) ? notesDir : join(projectRootDir, notesDir);
};

const resolveCacheDir = (): string => {
  const tempRoot = getOptionalEnv("TMPDIR") ?? getOptionalEnv("TMP") ?? getOptionalEnv("TEMP") ??
    "/tmp";
  return join(tempRoot, "diario-da-uniao-cache");
};

export const createConfig = (): AppConfig => {
  return {
    aiModel: {
      model: getOptionalEnv("AI_MODEL") ?? "",
      temperature: 0.7,
      maxTokens: 2000,
    },
    cacheDir: resolveCacheDir(),
    notesDir: resolveNotesDir(),
  };
};

export const config = createConfig(); 
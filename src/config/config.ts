import { AppConfig } from "../types/index.ts";
import { getOptionalEnv } from "../utils/env.ts";

export const createConfig = (): AppConfig => {
  return {
    aiModel: {
      model: getOptionalEnv("AI_MODEL") ?? "",
      temperature: 0.7,
      maxTokens: 2000,
    },
    cacheDir: getOptionalEnv("CACHE_DIR") ?? "_cache",
    notesDir: getOptionalEnv("NOTES_DIR") ?? "notes",
  };
};

export const config = createConfig(); 
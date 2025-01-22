import { AppConfig } from "../types/index.ts";

export const createConfig = (): AppConfig => {
  return {
    aiModel: {
      model: Deno.env.get("AI_MODEL") ?? "granite-3.1-8b-instruct",
      temperature: 0.7,
      maxTokens: 2000,
    },
    cacheDir: Deno.env.get("CACHE_DIR") ?? "_cache",
    notesDir: Deno.env.get("NOTES_DIR") ?? "notes",
  };
};

export const config = createConfig(); 
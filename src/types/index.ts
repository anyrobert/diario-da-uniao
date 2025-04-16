export interface Highlight {
  date: string;
  text: string;
  url: string;
  section: string;
}

export interface CompiledHighlight extends Highlight {
  summary: string;
}

export interface NoteComposition {
  date: string;
  highlights: CompiledHighlight[];
}


export interface AIModelConfig {
  model: string;
  temperature?: number;
  maxTokens?: number;
}

export interface AppConfig {
  aiModel: AIModelConfig;
  cacheDir: string;
  notesDir: string;
}

export interface ScraperService {
  getHighlights(date: string): Promise<Highlight[]>;
}

export interface CacheService {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T): Promise<void>;
}

export interface CompilerService {
  compileHighlights(highlights: Highlight[]): Promise<string>;
}
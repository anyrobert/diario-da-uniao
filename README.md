# DOU Daily Digest

A Deno-powered CLI tool that automatically fetches, summarizes, and compiles highlights from
Brazil's Official Gazette (Diário Oficial da União).

## Features

- Scrapes daily highlights from the official DOU website
- Supports multiple scraping strategies with fallback (`consulta` and highlights page)
- Uses GPT-4 to generate concise summaries in Brazilian Portuguese
- Outputs formatted Markdown files with dated entries
- Supports both automatic daily updates and specific date queries

## Key Components

- Web scraping using Deno DOM
- OpenAI integration for intelligent summarization
- Markdown composition
- File system management for storing daily digests

## Usage

Be sure to have a `notes` folder created before running the scripts.

```bash
# Get today's digest
./dou.sh

# Get digest for a specific date
./dou.sh --date=2025-01-31

# Force a specific scraping strategy order
SCRAPER_SOURCE_ORDER=consulta,highlights ./dou.sh --date=2025-01-31

# Keep only the highlights-page strategy
SCRAPER_SOURCE_ORDER=highlights ./dou.sh --date=2025-01-31

# Remove duplicated text inside note files (dry run)
deno task dedupe:notes --dry-run

# Apply duplicate cleanup
deno task dedupe:notes
```

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
# Install global `dou` command (one-time)
./scripts/install-dou.sh

# Show all CLI options
dou --help

# Get today's digest
dou

# Get digest for a specific date
dou --date=2025-01-31

# Force a specific scraping strategy order (flags)
dou --source-order=consulta,highlights --date=2025-01-31

# Keep only the highlights-page strategy (flags)
dou --source-order=highlights --date=2025-01-31

# Print raw scraper output as JSON
dou --raw

# Raw output using only consulta strategy
dou --source-order=consulta --date=2025-01-31 --raw

# Raw output using only highlights strategy
dou --source-order=highlights --date=2025-01-31 --raw

# Customize consulta query and limit without env variables
dou --source-order=consulta --consulta-query="* " --consulta-limit=50 --date=2025-01-31

# Remove duplicated text inside note files (dry run)
deno task dedupe:notes --dry-run

# Apply duplicate cleanup
deno task dedupe:notes
```

Environment variables are still supported as fallback:
`SCRAPER_SOURCE_ORDER`, `SCRAPER_CONSULTA_QUERY`, `SCRAPER_CONSULTA_LIMIT`, `AI_MODEL`, and
`NOTES_DIR`.

Cache files are always stored in a temp folder (`$TMPDIR`/`$TMP`/`$TEMP`), so running `dou` from
other directories does not create local `_cache` folders.

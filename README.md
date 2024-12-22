# DOU Daily Digest

A Deno-powered CLI tool that automatically fetches, summarizes, and compiles highlights from Brazil's Official Gazette (Diário Oficial da União). 

## Features
- Scrapes daily highlights from the official DOU website
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
./dou.sh 2024-03-20

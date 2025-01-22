#! /bin/sh
cd $(dirname $0)
deno run --allow-env --allow-net --allow-read --allow-write --env-file=.env ./src/main.ts $1
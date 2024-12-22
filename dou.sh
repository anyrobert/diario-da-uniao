#! /bin/sh
cd $(dirname $0)
deno run --allow-env --allow-net --allow-read --allow-write --env-file=.env ./main.ts $1
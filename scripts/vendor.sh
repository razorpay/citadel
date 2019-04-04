#!/bin/bash
mkdir -p "$1"

for i in $2; do
  cat "$i"
  printf '\n'
done > "$1/vendor.js"
echo $files

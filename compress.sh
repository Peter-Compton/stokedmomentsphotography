#!/bin/bash
# Compress all images to web quality
SITE_DIR="$(cd "$(dirname "$0")" && pwd)"

for dir in engagements bridals temple ceremony reception family creative; do
  echo "Processing $dir..."
  count=0
  for f in "$SITE_DIR/images/$dir"/*; do
    [ -f "$f" ] || continue
    ext="${f##*.}"
    ext_lower=$(echo "$ext" | tr '[:upper:]' '[:lower:]')
    if [ "$ext_lower" = "jpg" ] || [ "$ext_lower" = "jpeg" ] || [ "$ext_lower" = "png" ]; then
      sips --resampleHeightWidthMax 1600 -s formatOptions 80 "$f" > /dev/null 2>&1
      count=$((count + 1))
    fi
  done
  echo "  Compressed $count photos"
done

echo "Processing hero..."
sips --resampleHeightWidthMax 2400 -s formatOptions 80 "$SITE_DIR/images/hero.jpg" > /dev/null 2>&1

echo ""
du -sh "$SITE_DIR/images/"
echo "Done!"

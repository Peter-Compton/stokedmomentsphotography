#!/bin/bash
# Build script: copies photos and generates images.js manifest
# Compatible with macOS default bash (no associative arrays)

SITE_DIR="$(cd "$(dirname "$0")" && pwd)"
PHOTO_DIR="$(dirname "$SITE_DIR")"

MAX_PHOTOS=30

echo "Building image galleries..."

copy_photos() {
  local key="$1"
  local src_folder="$2"
  local src="$PHOTO_DIR/$src_folder"
  local dest="$SITE_DIR/images/$key"

  rm -rf "$dest"
  mkdir -p "$dest"

  if [ ! -d "$src" ]; then
    echo "  WARNING: Source not found: $src"
    return
  fi

  local count=0
  local total=0
  local tmpfile=$(mktemp)

  find "$src" -maxdepth 1 \( -iname "*.jpg" -o -iname "*.jpeg" -o -iname "*.png" -o -iname "*.webp" \) -print0 | sort -z | tr '\0' '\n' > "$tmpfile"
  total=$(wc -l < "$tmpfile")

  if [ "$total" -le "$MAX_PHOTOS" ]; then
    while IFS= read -r f; do
      [ -f "$f" ] && cp "$f" "$dest/" && ((count++))
    done < "$tmpfile"
  else
    local step=$(( total / MAX_PHOTOS ))
    local i=0
    while IFS= read -r f; do
      if [ $(( i % step )) -eq 0 ] && [ "$count" -lt "$MAX_PHOTOS" ]; then
        [ -f "$f" ] && cp "$f" "$dest/" && ((count++))
      fi
      ((i++))
    done < "$tmpfile"
  fi

  rm -f "$tmpfile"
  echo "  $key: copied $count photos (from $total total)"
}

# Copy each category
copy_photos "engagements" "favorite engagments"
copy_photos "bridals" "favorite bridals"
copy_photos "temple" "favorite temple photos"
copy_photos "ceremony" "favorite civil ceremonies"
copy_photos "reception" "favorite reception"
copy_photos "family" "family photos"
copy_photos "creative" "creatives"

# Generate images.js manifest
echo "registerImages({" > "$SITE_DIR/images.js"

first_cat=true
for key in engagements bridals temple ceremony reception family creative; do
  dest="$SITE_DIR/images/$key"

  if [ "$first_cat" = true ]; then
    first_cat=false
  else
    echo "," >> "$SITE_DIR/images.js"
  fi

  printf "  \"$key\": [" >> "$SITE_DIR/images.js"
  first_file=true
  for f in "$dest"/*; do
    [ -f "$f" ] || continue
    fname=$(basename "$f")
    if [ "$first_file" = true ]; then
      first_file=false
    else
      printf "," >> "$SITE_DIR/images.js"
    fi
    printf "\"%s\"" "$fname" >> "$SITE_DIR/images.js"
  done
  printf "]" >> "$SITE_DIR/images.js"
done

echo "" >> "$SITE_DIR/images.js"
echo "});" >> "$SITE_DIR/images.js"

echo ""
echo "Done! images.js manifest generated."
echo "Open index.html in your browser to see the site."

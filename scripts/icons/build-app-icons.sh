#!/usr/bin/env bash
# Regenerates the app-icon set in client/images from the vendored Material
# Symbols `asterisk` glyph (client/images/app-icon/asterisk.svg, Apache-2.0,
# see client/images/app-icon/NOTICE). Offline + deterministic: ImageMagick only.
# Colours = m3e default palette for seed #6750a4 (client/styles/vendor/
# tailwind-m3e-web/src/seed.css): primary 40, primary-container 90,
# on-primary-container 10.
# Usage: scripts/icons/build-app-icons.sh   (bash 3.2 safe)
set -euo pipefail
cd "$(dirname "$0")/../.."
img=client/images
src=$img/app-icon/asterisk.svg
PRIMARY='#6750a4'
CONTAINER='#eaddff'
ON_CONTAINER='#21005d'

# glyph path data, taken verbatim from the vendored svg
path_d=$(sed -n 's/.*<path[^>]* d="\([^"]*\)".*/\1/p' "$src")
[ -n "$path_d" ] || { echo "no path in $src" >&2; exit 1; }

# icon_svg <bg|none> <fill> <glyph-fraction-of-canvas> -> svg on stdout
# The glyph's own extent is 18/24 (=75%) of its 24-unit viewBox, so a viewBox
# of 18/fraction units centred on (12,12) puts the glyph at <fraction>.
icon_svg() {
  local bg=$1 fill=$2 frac=$3 side half
  side=$(awk -v f="$frac" 'BEGIN{printf "%.4f", 18/f}')
  half=$(awk -v s="$side" 'BEGIN{printf "%.4f", s/2}')
  local x0 y0
  x0=$(awk -v h="$half" 'BEGIN{printf "%.4f", 12-h}')
  y0=$x0
  printf '<svg xmlns="http://www.w3.org/2000/svg" viewBox="%s %s %s %s">' "$x0" "$y0" "$side" "$side"
  if [ "$bg" != none ]; then
    printf '<rect x="%s" y="%s" width="%s" height="%s" fill="%s"/>' "$x0" "$y0" "$side" "$side" "$bg"
  fi
  printf '<path fill="%s" d="%s"/></svg>' "$fill" "$path_d"
}

# raster <svg-text> <px> <out.png>
raster() {
  local tmp; tmp=$(mktemp -t appicon.XXXXXX).svg
  printf '%s' "$1" >"$tmp"
  magick -background none -density "$(( $2 * 96 / 24 ))" "$tmp" -resize "${2}x${2}" -strip "PNG32:$3"
  rm -f "$tmp"
}

# any-purpose: 75% glyph on transparent (PWA manifest + og/authorize logo)
any=$(icon_svg none "$PRIMARY" 0.75)
raster "$any" 512 $img/app-icon/icon-512.png
raster "$any" 192 $img/app-icon/icon-192.png
raster "$any" 1024 $img/logo-dock.png
raster "$any" 512 $img/logo.png
raster "$any" 96  $img/logo-dock-96x96.png
raster "$any" 96  $img/favicon-96x96.png

# maskable: glyph <=61% (inside the 80% safe zone) on primary-container
mask=$(icon_svg "$CONTAINER" "$ON_CONTAINER" 0.61)
raster "$mask" 512 $img/app-icon/maskable-512.png
raster "$mask" 192 $img/app-icon/maskable-192.png

# apple-touch: opaque (iOS rounds it itself), 60% glyph
apple=$(icon_svg "$CONTAINER" "$ON_CONTAINER" 0.60)
raster "$apple" 180 $img/apple-touch-icon.png

# favicon.svg: plain vector; favicon.ico: 16/32/48
icon_svg none "$PRIMARY" 0.9 >$img/favicon.svg
fav=$(icon_svg none "$PRIMARY" 0.9)
tmpd=$(mktemp -d)
for s in 16 32 48; do raster "$fav" $s $tmpd/$s.png; done
magick $tmpd/16.png $tmpd/32.png $tmpd/48.png $img/favicon.ico
rm -rf "$tmpd"
echo "app icons regenerated"

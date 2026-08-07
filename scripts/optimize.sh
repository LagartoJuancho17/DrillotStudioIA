#!/usr/bin/env bash
# scripts/optimize.sh
#
# Optimiza los assets de /public/img/lab/:
#   - Imágenes  → WebP con calidad 82 (ffmpeg)
#   - Videos    → H.264 1280px, sin audio, faststart (ffmpeg)
#
# Uso:
#   ./scripts/optimize.sh            # todos los proyectos
#   ./scripts/optimize.sh f1Storm    # solo ese slug
#
# Requisitos: ffmpeg en PATH (brew install ffmpeg)

set -euo pipefail

LAB_DIR="$(dirname "$0")/../public/img/lab"
LAB_DIR="$(realpath "$LAB_DIR")"

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'

# ── Verificar ffmpeg ──────────────────────────────────────────────────────────
if ! command -v ffmpeg &>/dev/null; then
  echo -e "${RED}Error: ffmpeg no encontrado. Instalalo con:${NC}"
  echo "  brew install ffmpeg"
  exit 1
fi

# ── Selección de slugs ────────────────────────────────────────────────────────
if [[ $# -gt 0 ]]; then
  slugs=("$@")
else
  mapfile -t slugs < <(find "$LAB_DIR" -maxdepth 1 -mindepth 1 -type d -exec basename {} \;)
fi

total_saved=0

# ── Funciones ─────────────────────────────────────────────────────────────────
optimize_image() {
  local src="$1"
  local dst="${src%.*}.webp"

  # Saltar si ya es webp
  [[ "${src##*.}" == "webp" ]] && return 0
  # Saltar si ya existe el .webp y es más nuevo que el original
  [[ -f "$dst" && "$dst" -nt "$src" ]] && return 0

  local size_before
  size_before=$(stat -f%z "$src" 2>/dev/null || stat --printf="%s" "$src")

  ffmpeg -y -i "$src" -q:v 5 -compression_level 6 "$dst" \
    -loglevel error 2>/dev/null

  local size_after
  size_after=$(stat -f%z "$dst" 2>/dev/null || stat --printf="%s" "$dst")

  local saved=$(( size_before - size_after ))
  total_saved=$(( total_saved + saved ))

  local pct=0
  (( size_before > 0 )) && pct=$(( saved * 100 / size_before ))

  echo -e "  ${GREEN}✓${NC} $(basename "$src") → $(basename "$dst")  (${pct}% más liviano)"
}

optimize_video() {
  local src="$1"
  local tmp="${src%.mp4}._tmp.mp4"

  local size_before
  size_before=$(stat -f%z "$src" 2>/dev/null || stat --printf="%s" "$src")

  # Si ya está por debajo de 5 MB, no recomprimir
  if (( size_before < 5242880 )); then
    echo -e "  ${YELLOW}~${NC} $(basename "$src") ya pesa $(( size_before / 1024 )) KB, saltando"
    return 0
  fi

  ffmpeg -y -i "$src" \
    -an \
    -vf "scale=1280:-2" \
    -c:v libx264 \
    -crf 27 \
    -preset slow \
    -pix_fmt yuv420p \
    -movflags +faststart \
    "$tmp" \
    -loglevel error 2>/dev/null

  local size_after
  size_after=$(stat -f%z "$tmp" 2>/dev/null || stat --printf="%s" "$tmp")

  if (( size_after < size_before )); then
    mv "$tmp" "$src"
    local saved=$(( size_before - size_after ))
    total_saved=$(( total_saved + saved ))
    local pct=$(( saved * 100 / size_before ))
    echo -e "  ${GREEN}✓${NC} $(basename "$src")  (${pct}% más liviano, $(( size_after / 1024 )) KB)"
  else
    rm -f "$tmp"
    echo -e "  ${YELLOW}~${NC} $(basename "$src") ya está bien comprimido"
  fi
}

human_size() {
  local bytes=$1
  if (( bytes >= 1048576 )); then
    printf "%.1f MB" "$(echo "scale=1; $bytes/1048576" | bc)"
  else
    printf "%d KB" "$(( bytes / 1024 ))"
  fi
}

# ── Loop principal ────────────────────────────────────────────────────────────
for slug in "${slugs[@]}"; do
  folder="$LAB_DIR/$slug"
  if [[ ! -d "$folder" ]]; then
    echo -e "${RED}No existe: $folder${NC}"
    continue
  fi

  echo ""
  echo -e "${YELLOW}── $slug ──────────────────────────────${NC}"

  while IFS= read -r -d '' img; do
    optimize_image "$img"
  done < <(find "$folder" -maxdepth 1 -type f \( -iname "*.jpg" -o -iname "*.jpeg" -o -iname "*.png" \) -print0)

  while IFS= read -r -d '' vid; do
    optimize_video "$vid"
  done < <(find "$folder" -maxdepth 1 -type f -iname "*.mp4" -print0)
done

echo ""
echo -e "${GREEN}Listo.${NC} Espacio liberado: $(human_size $total_saved)"
echo ""
echo "Próximo paso: actualizá las referencias en labProjects.js a los nuevos .webp"

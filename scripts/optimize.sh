#!/usr/bin/env bash
# scripts/optimize.sh
# Runs full image (.webp, max 1920px) and video (720p, H.264 CRF 27, no audio, +faststart) optimization
set -euo pipefail

python3 "$(dirname "$0")/optimize_all.py"

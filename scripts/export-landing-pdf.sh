#!/bin/bash
#
# Render the ad landing pages to PDF, for review.
#
# NOTE: renders the LIVE pages, which read from Strapi — so unlike the .docx
# exporter this one always reflects what is actually serving.
#
#   npm run export:lp-pdf
#
# Headless Chrome rather than a text converter, so the PDF shows the real
# rendered page. globals.css has an @media print block that hides the floating
# WhatsApp button and the sticky action bar — both are position:fixed and would
# otherwise be stamped onto every sheet.
#
# A fresh --user-data-dir per page is not optional: reusing one profile makes
# the second invocation hang on the profile lock.
set -u
cd "$(dirname "$0")/.."

# Renders the live pages, so the dev server must be up:
#   npm start   (or npm run dev)  on the port below
PORT="${PORT:-3002}"
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
OUT="content/landing/pdf"
mkdir -p "$OUT"
for s in litigation-in-court set-up-companies contracts-drafting-and-review \
         corporate-matters-and-disputes labour-disputes real-estate-disputes \
         legal-consultations real-estate-advice; do
  P=$(mktemp -d)
  perl -e 'alarm 60; exec @ARGV' -- "$CHROME" --headless --disable-gpu --no-sandbox \
      --user-data-dir="$P" --no-pdf-header-footer --virtual-time-budget=8000 \
      --print-to-pdf="$OUT/$s.pdf" "http://localhost:$PORT/legal-services/$s" >/dev/null 2>&1
  rm -rf "$P"
  [ -s "$OUT/$s.pdf" ] && echo "ok   $s" || echo "FAIL $s"
done
echo DONE

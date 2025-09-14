#!/bin/bash
# ===== BADGENODE | AUDIT A CASCATA (READ-ONLY) =====
# Scopo: inventario completo, referenze, duplicati, orfani. ZERO modifiche ai sorgenti.
# Output: report .txt (inventario, orfani, duplicati, riepilogo).
# Rollback: non necessario (read-only).

set -euo pipefail
ts=$(date +%Y%m%d-%H%M%S)
RUN_ID="AUDIT-$ts-$RANDOM"
echo "==> RUN_ID: $RUN_ID"

# ── cartelle e report
OUT_DIR=".audit_reports_$ts"
mkdir -p "$OUT_DIR"
SUMMARY="$OUT_DIR/AUDIT_CASCADE_RIEPILOGO.txt"
INV="$OUT_DIR/AUDIT_INVENTARIO.txt"
ORPH="$OUT_DIR/AUDIT_ORFANI.txt"
DUP="$OUT_DIR/AUDIT_DUPLICATI.txt"
HINT="$OUT_DIR/AUDIT_LINEE_GUIDA_PULIZIA.txt"

# ── helper portabili
sha_bin=""
if command -v sha1sum >/dev/null 2>&1; then sha_bin="sha1sum"; elif command -v shasum >/dev/null 2>&1; then sha_bin="shasum"; else sha_bin=""; fi

is_text(){ file -b --mime-type "$1" 2>/dev/null | grep -qE 'text/|application/javascript|application/json|image/svg\+xml'; }

ref_search(){
  local needle="$1"
  # cerca solo in html/js/css (escludi backup e .git)
  find . -type f \( -name "*.html" -o -name "*.js" -o -name "*.css" \) \
    -not -path "./.backups/*" -not -path "./.git/*" -not -path "$OUT_DIR/*" -print0 \
    | xargs -0 grep -nH -F "$needle" 2>/dev/null || true
}

# ── 1) INVERTARIO BASE
echo "# ===== INVENTARIO FILE CHIAVE =====" > "$INV"
for dir in assets/scripts assets/styles assets/icons assets images public .; do
  [ -d "$dir" ] || continue
  echo "" >> "$INV"
  echo "## $dir" >> "$INV"
  find "$dir" -type f -not -path "./.backups/*" -not -path "./.git/*" \
    -not -path "$OUT_DIR/*" -maxdepth 3 -print | sed 's#^\./##' >> "$INV"
done

# ── 2) ANALISI REFERENZE + DUPLICATI
echo "# ===== ANALISI DUPLICATI (sha1) =====" > "$DUP"
# Use temporary files for associative arrays compatibility
tmp_sha="/tmp/audit_sha_$$"
tmp_list="/tmp/audit_list_$$"
> "$tmp_sha"
> "$tmp_list"
while IFS= read -r -d '' f; do
  # escludi i report, backup e git
  case "$f" in
    ./.backups/*|./.git/*|./$OUT_DIR/*) continue;;
  esac
  # hash solo file "piccoli/moderati" e di testo/asset comuni
  if [ -n "$sha_bin" ] && [ "$(wc -c < "$f" 2>/dev/null || echo 0)" -le 5242880 ]; then
    if is_text "$f" || echo "$f" | grep -qE '\.(js|css|html|svg|png|jpg|jpeg|webp|ico|txt)$'; then
      sh="$($sha_bin "$f" 2>/dev/null | awk '{print $1}')"
      [ -n "$sh" ] || continue
      echo "$f|$sh" >> "$tmp_sha"
      echo "$sh|$f" >> "$tmp_list"
    fi
  fi
done < <(find . -type f -print0)

# Process duplicates using sort and uniq
dup_found=false
sort "$tmp_list" | cut -d'|' -f1 | uniq -d | while read -r sh; do
  if [ -n "$sh" ]; then
    dup_found=true
    echo "sha1=$sh" >> "$DUP"
    grep "^$sh|" "$tmp_list" | cut -d'|' -f2 | while read -r ff; do
      echo "  - ${ff#./}" >> "$DUP"
    done
    echo "" >> "$DUP"
  fi
done

# Check if any duplicates were found
if ! sort "$tmp_list" | cut -d'|' -f1 | uniq -d | grep -q .; then
  echo "(nessun duplicato rilevato tra i file analizzati)" >> "$DUP"
fi

# Clean up temp files
rm -f "$tmp_sha" "$tmp_list"

# ── 3) CROSS-REF: quali file sono referenziati?
echo "# ===== ANALISI ORFANI (non referenziati in HTML/JS/CSS) =====" > "$ORPH"
echo "Regola: se un file non compare in nessun *.html/*.js/*.css (esclusi backup), lo segnaliamo come 'CANDIDATO-ARCHIVIO'." >> "$ORPH"
echo "" >> "$ORPH"

candidates_total=0
analyze_file(){
  local f="$1"
  local bn; bn="$(basename "$f")"
  # salta i report e file di testo amministrativi
  if echo "$f" | grep -qE '\.(txt|md)$'; then return 0; fi
  # salta _headers e file di config di deploy
  if echo "$f" | grep -qE 'public/_headers$|^\.audit_reports_|^\.backups/'; then return 0; fi
  # cerca referenze
  refs="$(ref_search "$bn")"
  if [ -z "$refs" ]; then
    echo "CANDIDATO-ARCHIVIO: ${f#./}" >> "$ORPH"
    candidates_total=$((candidates_total+1))
  fi
}

while IFS= read -r -d '' f; do
  case "$f" in
    ./.backups/*|./.git/*|./$OUT_DIR/*) continue;;
  esac
  # consideriamo asset e codice
  if echo "$f" | grep -qE '\.(js|css|svg|png|jpg|jpeg|webp|ico|html)$'; then
    analyze_file "$f"
  fi
done < <(find . -type f -print0)

echo "" >> "$ORPH"
echo "Totale candidati orfani: $candidates_total" >> "$ORPH"

# ── 4) RIEPILOGO + SUGGERIMENTI
total_html=$(find . -type f -name "*.html" -not -path "./.backups/*" | wc -l | tr -d ' ')
total_js=$(find . -type f -name "*.js" -not -path "./.backups/*" | wc -l | tr -d ' ')
total_css=$(find . -type f -name "*.css" -not -path "./.backups/*" | wc -l | tr -d ' ')
total_icons=$(find assets/icons 2>/dev/null -type f | wc -l | tr -d ' ' || echo 0)
total_imgs=$(find assets 2>/dev/null -type f \( -name "*.png" -o -name "*.jpg" -o -name "*.jpeg" -o -name "*.webp" -o -name "*.svg" \) | wc -l | tr -d ' ' || echo 0)
total_txt=$(find . -type f -name "*.txt" -not -path "./.backups/*" -not -path "./.git/*" -not -path "./$OUT_DIR/*" | wc -l | tr -d ' ')

echo "# ===== AUDIT A CASCATA — RIEPILOGO =====" > "$SUMMARY"
cat <<R >> "$SUMMARY"
Data: $ts
RUN_ID: $RUN_ID

[INVENTARIO]
- HTML: $total_html
- JS: $total_js
- CSS: $total_css
- Icone in assets/icons: $total_icons
- Immagini in assets/: $total_imgs
- File .txt (report/note): $total_txt

[OUTPUT REPORT]
- Inventario file: $INV
- Candidati orfani: $ORPH
- Duplicati (sha1): $DUP
- Linee guida pulizia: $HINT

[PROSSIMI STEP CONSERVATIVI]
1) Rivedi "$ORPH": spunta cosa archiviare davvero (alcuni possono essere import dinamici).
2) Rivedi "$DUP": se ci sono duplicati, scegli una sola copia da tenere.
3) Se concordi, nel prossimo step ti preparo un prompt che:
   - sposta i file scelti in ".archives/$ts/" (non li cancella),
   - aggiorna un "CHANGELOG_PULIZIA.txt",
   - lascia un report finale.

R

# ── 5) LINEE GUIDA PULIZIA (suggerimenti non vincolanti)
cat > "$HINT" <<'TXT'
Linee guida per la pulizia (conservativa):
- Tenere SEMPRE: *.html principali, assets/scripts/* usati, assets/styles/* linkati, public/_headers.
- Archiviare: report .txt vecchi non più utili (mantenere solo gli ultimi della serie), screenshot temporanei, script di test.
- Verificare prima di archiviare: file JS potenzialmente caricati via import() dinamico (controlla i log/console).
- Icone/immagini: rimuovere o archiviare quelle non referenziate da HTML/CSS.
- Backup: non toccare .backups/ (storico rollback); valutare un pruning vecchio nel tempo, separatamente.

Flusso consigliato:
1) Audit (questo step, read-only)
2) Selezione: spunta manuale dei candidati (ti preparo un prompt di "move-to-archives")
3) Osservazione: un giro di test rapido
4) Solo se tutto ok: eventuale rimozione definitiva in un secondo momento

TXT

echo "==> COMPLETATO."
echo "Report generati in: $OUT_DIR"

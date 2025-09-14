#!/bin/bash
# ===== BADGENODE | PROJECT STRUCTURE SNAPSHOT (READ-ONLY) =====
# Scopo: generare la struttura ESATTA di cartelle/sottocartelle e file del progetto,
#        con dimensioni e conteggi, in un unico report .txt.
# Sicuro: read-only. Non tocca i sorgenti.
# NOTE: puoi includere o escludere alcune cartelle rumorose con le variabili qui sotto.

set -euo pipefail

# ---- Configurazione (puoi cambiarle prima di lanciare) ----
INCLUDE_BACKUPS="${INCLUDE_BACKUPS:-0}"         # 0 = escludi .backups ; 1 = includi
INCLUDE_NODE_MODULES="${INCLUDE_NODE_MODULES:-0}" # 0 = escludi node_modules ; 1 = includi
INCLUDE_GIT="${INCLUDE_GIT:-0}"                 # 0 = escludi .git ; 1 = includi
MAX_DEPTH="${MAX_DEPTH:-0}"                     # 0 = nessun limite, >0 = profondità massima (es. 5)

ts="$(date +%Y%m%d-%H%M%S)"
OUT="PROJECT_STRUCTURE_${ts}.txt"

echo "# ===== PROJECT STRUCTURE SNAPSHOT =====" > "$OUT"
echo "# Data: $ts" >> "$OUT"
echo "# Root: $(pwd)" >> "$OUT"
echo "" >> "$OUT"

# ---- Costruisci lista esclusioni per find ----
EXCLUDES=()
[ "$INCLUDE_BACKUPS" = "0" ]      && EXCLUDES+=( -path "./.backups" -prune -o )
[ "$INCLUDE_NODE_MODULES" = "0" ] && EXCLUDES+=( -path "./node_modules" -prune -o )
[ "$INCLUDE_GIT" = "0" ]          && EXCLUDES+=( -path "./.git" -prune -o )

# ---- Riepilogo dimensioni/contatori
echo "## Riepilogo" >> "$OUT"
# Numero file/cartelle (con esclusioni)
if [ ${#EXCLUDES[@]} -gt 0 ]; then
  FILES_COUNT=$(find . "${EXCLUDES[@]}" -type f -print | wc -l | tr -d ' ')
  DIRS_COUNT=$(find . "${EXCLUDES[@]}" -type d -print | wc -l | tr -d ' ')
else
  FILES_COUNT=$(find . -type f | wc -l | tr -d ' ')
  DIRS_COUNT=$(find . -type d | wc -l | tr -d ' ')
fi
echo "- Cartelle: $DIRS_COUNT" >> "$OUT"
echo "- File: $FILES_COUNT" >> "$OUT"
echo "" >> "$OUT"

# ---- Funzione TREE portabile (senza dipendenza da `tree`)
# Stampa una vista ad albero con dimensione (byte) di ogni file.
{
  echo "## Struttura (albero con dimensioni)"
  echo ""
  # Genera elenco con profondità opzionale
  if [ "$MAX_DEPTH" -gt 0 ] 2>/dev/null; then
    if [ ${#EXCLUDES[@]} -gt 0 ]; then
      LIST=$(find . -mindepth 1 -maxdepth "$MAX_DEPTH" "${EXCLUDES[@]}" -print | LC_ALL=C sort)
    else
      LIST=$(find . -mindepth 1 -maxdepth "$MAX_DEPTH" -print | LC_ALL=C sort)
    fi
  else
    if [ ${#EXCLUDES[@]} -gt 0 ]; then
      LIST=$(find . -mindepth 1 "${EXCLUDES[@]}" -print | LC_ALL=C sort)
    else
      LIST=$(find . -mindepth 1 -print | LC_ALL=C sort)
    fi
  fi

  # Converte in albero usando una versione semplificata
  echo "$LIST" | while IFS= read -r path; do
    # Calcola profondità
    depth=$(echo "$path" | tr -cd '/' | wc -c)
    depth=$((depth - 1))
    
    # Crea indent
    indent=""
    for ((i=0; i<depth; i++)); do
      indent="$indent  "
    done
    
    # Nome file/directory
    name=$(basename "$path")
    
    # Dimensione per file
    if [ -f "$path" ]; then
      size=$(wc -c < "$path" 2>/dev/null || echo 0)
      echo "$indent- $name ($size B)"
    elif [ -d "$path" ]; then
      echo "$indent+ $name/"
    fi
  done
} >> "$OUT"

echo "" >> "$OUT"
echo "## Elenco completo (per ricerca testuale)" >> "$OUT"
if [ "$MAX_DEPTH" -gt 0 ] 2>/dev/null; then
  if [ ${#EXCLUDES[@]} -gt 0 ]; then
    find . -mindepth 1 -maxdepth "$MAX_DEPTH" "${EXCLUDES[@]}" -type f -print | LC_ALL=C sort | sed 's#^\./##' >> "$OUT"
  else
    find . -mindepth 1 -maxdepth "$MAX_DEPTH" -type f -print | LC_ALL=C sort | sed 's#^\./##' >> "$OUT"
  fi
else
  if [ ${#EXCLUDES[@]} -gt 0 ]; then
    find . -mindepth 1 "${EXCLUDES[@]}" -type f -print | LC_ALL=C sort | sed 's#^\./##' >> "$OUT"
  else
    find . -mindepth 1 -type f -print | LC_ALL=C sort | sed 's#^\./##' >> "$OUT"
  fi
fi

echo "" >> "$OUT"
echo "## Note" >> "$OUT"
echo "- Variabili usate: INCLUDE_BACKUPS=$INCLUDE_BACKUPS, INCLUDE_NODE_MODULES=$INCLUDE_NODE_MODULES, INCLUDE_GIT=$INCLUDE_GIT, MAX_DEPTH=$MAX_DEPTH" >> "$OUT"
echo "- Per includere tutto, rilancia: INCLUDE_BACKUPS=1 INCLUDE_NODE_MODULES=1 INCLUDE_GIT=1 bash $(basename "$0" 2>/dev/null || echo snapshot.sh)" >> "$OUT"

echo "==> Report generato: $OUT"

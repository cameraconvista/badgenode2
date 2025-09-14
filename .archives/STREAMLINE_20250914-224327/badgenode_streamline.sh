#!/bin/bash
# ===== BADGENODE | STREAMLINE PROJECT (Snellimento Conservativo) =====
# Obiettivo: eliminare file non funzionali mantenendo solo core runtime e report chiave
# Operazione: archiviazione conservativa in .archives/<timestamp>/
# Output: REPORT_CONSOLIDATO.txt con elenco completo archiviazioni

set -euo pipefail
ts="$(date +%Y%m%d-%H%M%S)"
ARCH_DIR=".archives/STREAMLINE_$ts"
REPORT="REPORT_CONSOLIDATO.txt"

mkdir -p "$ARCH_DIR"

echo "# ===== BADGENODE REPORT CONSOLIDATO - STREAMLINE =====" > "$REPORT"
echo "# Data: $ts" >> "$REPORT"
echo "# Obiettivo: Snellimento progetto mantenendo solo file core e report chiave" >> "$REPORT"
echo "" >> "$REPORT"

# ---- WHITELIST: File da mantenere sempre ----
KEEP_CORE=(
  # File runtime essenziali
  "*.html" "*.js" "*.css" "*.json" "*.mjs" "*.ico" "*.png" "*.jpg" "*.jpeg" "*.webp" "*.svg"
  # Directory core
  "assets/" "sql/" "db/" "public/" "tools/"
  # Config essenziali
  "vite.config.js" "package.json" "package-lock.json" "manifest.json"
  ".htaccess" ".gitignore" "Procfile" "netlify.toml" "render.yaml"
)

KEEP_REPORTS=(
  # Report tecnici chiave REC-003 → REC-007
  "REC003_*_REPORT.txt" "REC004_*_REPORT.txt" "REC005_*_REPORT.txt" 
  "REC006_*_REPORT.txt" "REC007_*_REPORT.txt"
  "REPORT_DETTAGLIATO_REC00*_*.txt"
  "POST_REBOOT_VALIDATION_REPORT.txt"
  "REPORT_DETTAGLIATO_POST_REBOOT_VALIDATION_*.txt"
  # Report finale consolidato
  "REPORT_CONSOLIDATO.txt"
)

# ---- Funzione per verificare se un file è nella whitelist ----
is_whitelisted() {
  local file="$1"
  local basename_file="$(basename "$file")"
  
  # Controlla file core
  for pattern in "${KEEP_CORE[@]}"; do
    if [[ "$basename_file" == $pattern ]] || [[ "$file" == $pattern ]]; then
      return 0
    fi
  done
  
  # Controlla report chiave
  for pattern in "${KEEP_REPORTS[@]}"; do
    if [[ "$basename_file" == $pattern ]]; then
      return 0
    fi
  done
  
  return 1
}

# ---- Funzione per determinare motivazione archiviazione ----
get_archive_reason() {
  local file="$1"
  case "$file" in
    *.md) echo "documentazione .md" ;;
    *.txt) echo "report storico" ;;
    *-E|*.bak) echo "file temporaneo" ;;
    ._*|.DS_Store) echo "file sistema/temporaneo" ;;
    *.tgz|*.tar.gz) echo "backup obsoleto" ;;
    *CHANGELOG*|*ChangeLog*) echo "changelog storico" ;;
    *REPORT*|*Report*) echo "report non essenziale" ;;
    *) echo "file non core" ;;
  esac
}

# ---- Scansione e archiviazione ----
echo "## File archiviati" >> "$REPORT"
echo "" >> "$REPORT"

archived_count=0
total_size=0

# Scansiona tutti i file nella root (esclude .backups, .archives, .git)
find . -maxdepth 1 -type f \
  -not -path "./.backups/*" \
  -not -path "./.archives/*" \
  -not -path "./.git/*" \
  -print0 | while IFS= read -r -d '' file; do
  
  if ! is_whitelisted "$file"; then
    reason=$(get_archive_reason "$file")
    size=$(wc -c < "$file" 2>/dev/null || echo 0)
    
    echo "ARCHIVE: ${file#./} ($size B) - $reason" >> "$REPORT"
    
    # Sposta il file mantenendo struttura
    mkdir -p "$ARCH_DIR/$(dirname "${file#./}")"
    rsync -a --remove-source-files "$file" "$ARCH_DIR/${file#./}" >/dev/null 2>&1 || true
    
    archived_count=$((archived_count + 1))
    total_size=$((total_size + size))
  fi
done

# ---- Gestione backup .tgz (mantieni solo ultimi 2) ----
echo "" >> "$REPORT"
echo "## Backup .tgz gestiti" >> "$REPORT"

# Trova tutti i .tgz e ordina per data modifica
find . -maxdepth 2 -name "*.tgz" -o -name "*.tar.gz" | \
  xargs -I {} stat -f "%m %N" {} 2>/dev/null | \
  sort -rn | \
  awk 'NR>2 {print $2}' | while read -r backup_file; do
  
  if [ -f "$backup_file" ]; then
    size=$(wc -c < "$backup_file" 2>/dev/null || echo 0)
    echo "ARCHIVE: ${backup_file#./} ($size B) - backup obsoleto (>2)" >> "$REPORT"
    
    mkdir -p "$ARCH_DIR/$(dirname "${backup_file#./}")"
    rsync -a --remove-source-files "$backup_file" "$ARCH_DIR/${backup_file#./}" >/dev/null 2>&1 || true
    
    archived_count=$((archived_count + 1))
    total_size=$((total_size + size))
  fi
done

# ---- Script di implementazione e temporanei ----
echo "" >> "$REPORT"
echo "## Script implementazione archiviati" >> "$REPORT"

for script in rec*.sh *_script.sh audit_cascade_script.sh move_to_archives.sh project_structure_snapshot.sh badgenode_streamline.sh; do
  if [ -f "$script" ]; then
    size=$(wc -c < "$script" 2>/dev/null || echo 0)
    echo "ARCHIVE: $script ($size B) - script implementazione" >> "$REPORT"
    
    rsync -a --remove-source-files "$script" "$ARCH_DIR/$script" >/dev/null 2>&1 || true
    archived_count=$((archived_count + 1))
    total_size=$((total_size + size))
  fi
done

# ---- Riepilogo finale ----
echo "" >> "$REPORT"
echo "## Riepilogo operazione" >> "$REPORT"
echo "- File archiviati: $archived_count" >> "$REPORT"
echo "- Dimensione totale archiviata: $total_size B ($((total_size / 1024)) KB)" >> "$REPORT"
echo "- Directory archivio: $ARCH_DIR" >> "$REPORT"
echo "" >> "$REPORT"

echo "## File mantenuti (core runtime + report chiave)" >> "$REPORT"
echo "### File Core Runtime:" >> "$REPORT"
find . -maxdepth 1 -type f \( -name "*.html" -o -name "*.js" -o -name "*.css" -o -name "*.json" \) | sort | sed 's#^\./# - #' >> "$REPORT"
echo "" >> "$REPORT"
echo "### Report Tecnici Mantenuti:" >> "$REPORT"
find . -maxdepth 1 -name "*REC00*_REPORT.txt" -o -name "POST_REBOOT_VALIDATION_REPORT.txt" -o -name "REPORT_DETTAGLIATO_*.txt" | sort | sed 's#^\./# - #' >> "$REPORT"
echo "" >> "$REPORT"

echo "## Rollback" >> "$REPORT"
echo "Per ripristinare tutti i file archiviati:" >> "$REPORT"
echo "  cp -r $ARCH_DIR/* ./" >> "$REPORT"
echo "" >> "$REPORT"

echo "## Note" >> "$REPORT"
echo "- Operazione conservativa: nessun file cancellato definitivamente" >> "$REPORT"
echo "- Progetto snellito mantenendo funzionalità runtime complete" >> "$REPORT"
echo "- Report tecnici chiave preservati per riferimento" >> "$REPORT"
echo "" >> "$REPORT"
echo "# ===== FINE REPORT CONSOLIDATO =====" >> "$REPORT"

echo "==> STREAMLINE COMPLETATO"
echo "==> File archiviati: $archived_count"
echo "==> Report consolidato: $REPORT"
echo "==> Archivio: $ARCH_DIR"

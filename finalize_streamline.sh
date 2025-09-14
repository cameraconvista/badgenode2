#!/bin/bash
# ===== BADGENODE | FINALIZE STREAMLINE (Archiviazione Reale) =====
# Obiettivo: Spostare fisicamente i file già identificati nel REPORT_CONSOLIDATO
# Operazione: Move conservativo in .archives/FINALIZE_<timestamp>/

set -euo pipefail
ts="$(date +%Y%m%d-%H%M%S)"
ARCH_DIR=".archives/FINALIZE_$ts"
REPORT="REPORT_CONSOLIDATO.txt"
ROLLBACK_SCRIPT="ROLLBACK.sh"

mkdir -p "$ARCH_DIR"

echo "==> FINALIZE STREAMLINE STARTED"
echo "==> Archive dir: $ARCH_DIR"

# Contatori
archived_count=0
total_size=0
errors=()

# Funzione per spostare file con gestione duplicati
move_file_safe() {
  local src="$1"
  local dst="$2"
  
  if [ ! -f "$src" ]; then
    return 0  # File già non esiste, skip
  fi
  
  # Crea directory di destinazione
  mkdir -p "$(dirname "$dst")"
  
  # Gestisci duplicati
  if [ -f "$dst" ]; then
    local epoch=$(date +%s)
    dst="${dst}__dup-${epoch}"
  fi
  
  # Sposta file
  if mv "$src" "$dst" 2>/dev/null; then
    local size=$(wc -c < "$dst" 2>/dev/null || echo 0)
    archived_count=$((archived_count + 1))
    total_size=$((total_size + size))
    echo "MOVED: $src -> $dst ($size B)"
    return 0
  else
    errors+=("Failed to move: $src")
    return 1
  fi
}

# Leggi il REPORT_CONSOLIDATO esistente e sposta i file elencati
echo "==> Processing files from existing REPORT_CONSOLIDATO.txt"
if [ -f "$REPORT" ]; then
  grep "^ARCHIVE:" "$REPORT" | while IFS= read -r line; do
    # Estrai il nome file dalla riga ARCHIVE: filename (size B) - reason
    filename=$(echo "$line" | sed 's/^ARCHIVE: //' | sed 's/ ([^)]*) - .*//')
    
    if [ -f "$filename" ]; then
      move_file_safe "$filename" "$ARCH_DIR/$filename"
    fi
  done
fi

# Gestione _headers/_redirects in root
echo "==> Checking _headers/_redirects in root"
if [ -f "public/_headers" ]; then
  # public/_headers esiste, possiamo archiviare quelli in root
  for f in _headers _redirects; do
    if [ -f "$f" ]; then
      move_file_safe "$f" "$ARCH_DIR/$f"
    fi
  done
fi

# Gestione backup .tgz (mantieni solo ultimi 2)
echo "==> Managing backup .tgz files"
if [ -d "backups" ]; then
  mkdir -p "$ARCH_DIR/backups"
  
  # Trova tutti i .tgz e ordina per data modifica (più recenti prima)
  find backups/ -name "*.tgz" -o -name "*.tar.gz" | \
    xargs -I {} stat -f "%m %N" {} 2>/dev/null | \
    sort -rn | \
    awk 'NR>2 {print $2}' | while read -r backup_file; do
    
    if [ -f "$backup_file" ]; then
      move_file_safe "$backup_file" "$ARCH_DIR/$backup_file"
    fi
  done
fi

# Archivia script di implementazione rimanenti
echo "==> Archiving remaining implementation scripts"
for script in *.sh; do
  if [ -f "$script" ] && [ "$script" != "ROLLBACK.sh" ] && [ "$script" != "finalize_streamline.sh" ]; then
    case "$script" in
      rec*.sh|*_script.sh|audit_*.sh|move_*.sh|project_*.sh|badgenode_*.sh|hotfix_*.sh|github_*.sh|status_*.sh)
        move_file_safe "$script" "$ARCH_DIR/$script"
        ;;
    esac
  fi
done

# Archivia file .md rimanenti
echo "==> Archiving remaining .md files"
find . -maxdepth 1 -name "*.md" -type f | while read -r md_file; do
  move_file_safe "$md_file" "$ARCH_DIR/${md_file#./}"
done

# Archivia file .txt non essenziali rimanenti
echo "==> Archiving non-essential .txt files"
find . -maxdepth 1 -name "*.txt" -type f | while read -r txt_file; do
  basename_file=$(basename "$txt_file")
  
  # Skip file da mantenere
  case "$basename_file" in
    REPORT_CONSOLIDATO.txt|POST_REBOOT_VALIDATION_*.txt|REPORT_DETTAGLIATO_REC00*.txt|REC003_*.txt|REC004_*.txt|REC005_*.txt|REC006_*.txt|REC007_*.txt)
      continue
      ;;
    *)
      move_file_safe "$txt_file" "$ARCH_DIR/${txt_file#./}"
      ;;
  esac
done

# Archivia file temporanei rimanenti
echo "==> Archiving remaining temporary files"
find . -maxdepth 1 \( -name ".*" -o -name "*-E" -o -name "*.bak" \) -type f | while read -r temp_file; do
  case "$temp_file" in
    ./.git*|./.archives*|./.backups*) continue ;;
    *) move_file_safe "$temp_file" "$ARCH_DIR/${temp_file#./}" ;;
  esac
done

# Rigenera REPORT_CONSOLIDATO.txt
echo "==> Regenerating REPORT_CONSOLIDATO.txt"
cat > "$REPORT" <<EOF
# ===== BADGENODE REPORT CONSOLIDATO - FINALIZE STREAMLINE =====
# Data: $ts
# Obiettivo: Archiviazione finale file non core, mantenimento solo runtime essenziale

## Riepilogo operazione
- File archiviati: $archived_count
- Dimensione totale archiviata: $total_size B ($((total_size / 1024)) KB)
- Directory archivio: $ARCH_DIR

## File archiviati
EOF

# Elenca tutti i file nell'archivio
find "$ARCH_DIR" -type f | sort | while read -r archived_file; do
  rel_path="${archived_file#$ARCH_DIR/}"
  size=$(wc -c < "$archived_file" 2>/dev/null || echo 0)
  
  # Determina motivazione
  case "$rel_path" in
    *.md) reason="documentazione .md" ;;
    *.txt) reason="report storico" ;;
    *.sh) reason="script implementazione" ;;
    *-E|*.bak) reason="file temporaneo" ;;
    ._*|.DS_Store) reason="file sistema" ;;
    *.tgz|*.tar.gz) reason="backup obsoleto" ;;
    *) reason="file non core" ;;
  esac
  
  echo "ARCHIVE: $rel_path ($size B) - $reason" >> "$REPORT"
done

# File mantenuti
cat >> "$REPORT" <<EOF

## File mantenuti (core runtime + report chiave)
### File Core Runtime:
EOF

find . -maxdepth 1 -type f \( -name "*.html" -o -name "*.js" -o -name "*.css" -o -name "*.json" \) | sort | sed 's#^\./# - #' >> "$REPORT"

cat >> "$REPORT" <<EOF

### Directory Core:
EOF
for dir in assets public sql db tools; do
  if [ -d "$dir" ]; then
    echo " - $dir/" >> "$REPORT"
  fi
done

cat >> "$REPORT" <<EOF

### Report Tecnici Mantenuti:
EOF
find . -maxdepth 1 \( -name "POST_REBOOT_VALIDATION_*.txt" -o -name "REPORT_DETTAGLIATO_REC00*.txt" -o -name "REC003_*.txt" -o -name "REC004_*.txt" -o -name "REC005_*.txt" -o -name "REC006_*.txt" -o -name "REC007_*.txt" \) | sort | sed 's#^\./# - #' >> "$REPORT"

cat >> "$REPORT" <<EOF

## Rollback
Per ripristinare tutti i file archiviati:
  bash ROLLBACK.sh

## Errori (se presenti)
EOF

if [ ${#errors[@]} -gt 0 ]; then
  for error in "${errors[@]}"; do
    echo " - $error" >> "$REPORT"
  done
else
  echo " - Nessun errore" >> "$REPORT"
fi

cat >> "$REPORT" <<EOF

## Note
- Operazione conservativa: nessun file cancellato definitivamente
- Progetto completamente snellito mantenendo funzionalità runtime
- Report tecnici chiave preservati per riferimento
- Backup ultimi 2 .tgz mantenuti

# ===== FINE REPORT CONSOLIDATO =====
EOF

# Crea ROLLBACK.sh
echo "==> Creating ROLLBACK.sh"
cat > "$ROLLBACK_SCRIPT" <<EOF
#!/bin/bash
# ===== BADGENODE ROLLBACK SCRIPT =====
# Ripristina tutti i file archiviati da $ARCH_DIR

set -euo pipefail

if [ ! -d "$ARCH_DIR" ]; then
  echo "ERROR: Archive directory $ARCH_DIR not found"
  exit 1
fi

echo "==> Restoring files from $ARCH_DIR"
cp -r "$ARCH_DIR"/* ./
echo "==> Rollback completed"
echo "==> Files restored from archive to current directory"
EOF

chmod +x "$ROLLBACK_SCRIPT"

# Post-check
echo "==> Post-check"
echo "Remaining .md/.txt files in root:"
find . -maxdepth 1 -type f \( -name "*.md" -o -name "*.txt" \) | sort

echo ""
if [ -f "public/_headers" ]; then
  echo "OK public/_headers exists"
else
  echo "WARNING: public/_headers not found"
fi

echo ""
echo "==> FINALIZE STREAMLINE COMPLETED"
echo "==> Archived: $archived_count files ($((total_size / 1024)) KB)"
echo "==> Archive: $ARCH_DIR"
echo "==> Report: $REPORT"
echo "==> Rollback: $ROLLBACK_SCRIPT"

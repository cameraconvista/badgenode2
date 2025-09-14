#!/bin/bash
# ===== BADGENODE | MOVE-TO-ARCHIVES (pulizia conservativa) =====
# Scopo: archiviare rumore evidente senza toccare file runtime.
# Default: DRY-RUN (non sposta nulla, mostra solo cosa farebbe).
# Per eseguire davvero: rilancia con CONFIRM_MOVE=1 ./move_to_archives.sh
# Tutto finisce in .archives/<ts>/ e viene scritto un report .txt.
# Genera report semplice su file txt

set -euo pipefail
ts="$(date +%Y%m%d-%H%M%S)"
ARCH_DIR=".archives/$ts"
REPORT="ARCHIVE_REPORT_$ts.txt"
DRYRUN="${CONFIRM_MOVE:-0}"

mkdir -p "$ARCH_DIR"

echo "# ===== BADGENODE MOVE-TO-ARCHIVES REPORT =====" > "$REPORT"
echo "# Data: $ts" >> "$REPORT"
echo "" >> "$REPORT"
echo "Modalità: $([ "$DRYRUN" = "1" ] && echo ESECUZIONE || echo DRY-RUN)" >> "$REPORT"
echo "" >> "$REPORT"
echo "I seguenti elementi sono CANDIDATI all'archiviazione:" >> "$REPORT"
echo "" >> "$REPORT"

# ----- Regole conservative -----
# 1) Cartelle di audit generate (read-only) -> sempre archiviate
# 2) Report testuali rumorosi: *_REPORT.txt, REPORT_DETTAGLIATO_*.txt (mantieni i 3 più recenti per ogni prefisso)
# 3) File temporanei: *-E, .DS_Store
# 4) NON toccare: .backups/, public/_headers, file HTML/JS/CSS attivi

# 1) Cartelle di audit
find . -maxdepth 1 -type d -name ".audit_reports_*" -print0 | while IFS= read -r -d '' d; do
  echo "DIR AUDIT: ${d#./}" >> "$REPORT"
  if [ "$DRYRUN" = "1" ]; then
    mkdir -p "$ARCH_DIR/${d#./}"
    rsync -a --remove-source-files "$d"/ "$ARCH_DIR/${d#./}"/ >/dev/null 2>&1 || true
    rmdir "$d" 2>/dev/null || true
  fi
done

# 2) Report testuali (conserva ultimi 3 per ciascun prefisso base)
list_reports() {
  find . -type f \( -name "*_REPORT.txt" -o -name "REPORT_DETTAGLIATO_*.txt" \) \
    -not -path "./.archives/*" -not -path "./.backups/*" -print0
}
# raccogli e ordina per mtime
TMP_LIST="$(mktemp)"
list_reports | xargs -0 stat -f "%m %N" 2>/dev/null | sort -rn > "$TMP_LIST" || true

# costruisci gruppi per prefisso (prima dell'eventuale data)
# prefisso euristico: tronca a prima cifra lunga (REC|REPORT_DETTAGLIATO)
awk -v dry="$DRYRUN" -v arch="$ARCH_DIR" -v rep="$REPORT" '
BEGIN{FS=" "}
/^[0-9]+ /{
  # timestamp e percorso (con spazi possibili)
  ts=$1; $1="";
  sub(/^ /,""); path=$0
  # prefisso: prendi nome file senza dir
  n=path; sub(/^.*\//,"",n)
  pref=n
  sub(/_[0-9]{8}.*/,"",pref)       # es. *_20250914...
  sub(/-20[0-9]{6}.*/,"",pref)     # es. *-20250914...
  sub(/_RUN_ID_.*/,"",pref)
  g[pref]=g[pref] "|" path
  t[pref]=t[pref] "|" ts
}
END{
  for (p in g){
    split(g[p], files, "|")
    split(t[p], times, "|")
    # rimuovi vuoto iniziale
    start=(files[1]==""?2:1)
    kept=0
    for (i=start; i<=length(files); i++){
      f=files[i]; if(f=="") continue
      kept++
      if (kept<=3){
        print "KEEP (ultimi3): " substr(f,3) >> rep
      } else {
        print "ARCHIVE: " substr(f,3) >> rep
        if (dry=="1"){
          cmd="mkdir -p \"" arch "/" substr(f,3); sub(/\/[^\/]*$/,"",cmd); cmd=cmd "\""
          system(cmd)
          system("mkdir -p \"" arch "/" substr(f,3) "\" >/dev/null 2>&1")
          # sposta mantenendo struttura
          system("rsync -a --remove-source-files \"" f "\" \"" arch "/" substr(f,3) "\" >/dev/null 2>&1 || true")
        }
      }
    }
  }
}
' "$TMP_LIST"
rm -f "$TMP_LIST"

# 3) File temporanei chiari: *-E, .DS_Store
find . -type f \( -name "*-E" -o -name ".DS_Store" \) \
  -not -path "./.archives/*" -not -path "./.backups/*" -print0 | while IFS= read -r -d '' f; do
  echo "TEMP: ${f#./}" >> "$REPORT"
  if [ "$DRYRUN" = "1" ]; then
    mkdir -p "$ARCH_DIR/$(dirname "${f#./}")"
    rsync -a --remove-source-files "$f" "$ARCH_DIR/${f#./}" >/dev/null 2>&1 || true
  fi
done

echo "" >> "$REPORT"
echo "NOTE:" >> "$REPORT"
echo "- DRY-RUN mostra anche le azioni che verrebbero eseguite." >> "$REPORT"
echo "- Per eseguire davvero lo spostamento: CONFIRM_MOVE=1 bash $(basename "$0" 2>/dev/null || echo move_to_archives.sh)" >> "$REPORT"
echo "- Tutto è reversibile: i file sono in $ARCH_DIR/" >> "$REPORT"

# Stampa sintesi a terminale
echo "==> Modalità: $([ "$DRYRUN" = "1" ] && echo ESECUZIONE || echo DRY-RUN)"
echo "==> Report: $REPORT"
if [ "$DRYRUN" != "1" ]; then
  echo ">>> NESSUNO SPOSTAMENTO ESEGUITO. Controlla il report e, se ok, rilancia con:"
  echo "CONFIRM_MOVE=1 bash move_to_archives.sh"
fi

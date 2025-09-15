# BADGENODE

Sistema di gestione timbrature per dipendenti con login via PIN, calcolo ore lavorate, storico, esportazione dati e sincronizzazione Supabase.

## ⚠️ NOTA IMPORTANTE - Icon Paths
**SEMPRE usare percorsi assoluti per le icone: `/assets/icons/file.png`**

Questo evita problemi di caricamento in produzione e garantisce compatibilità cross-browser.

## 🔄 Backup Automatico

Sistema di backup automatico per configurazioni e codice sorgente:

```bash
npm run esegui-backup
```

**Caratteristiche**:
- Rotazione automatica: mantiene solo le ultime 3 copie
- Esclusioni intelligenti: node_modules, dist, .git, cache
- Output: `/backups/backup-YYYYMMDD-HHMMSS.tgz`
- Compressione tar.gz nativa

**Nota**: Il backup database è gestito separatamente via retention policy PostgreSQL.

Vedi: `ICON_PATH_STANDARDS.md` per dettagli completi.

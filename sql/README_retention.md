
# Retention Automatica Timbrature - 6 Mesi

## 📋 Panoramica

Sistema automatico per mantenere solo le timbrature degli ultimi 6 mesi, con cancellazione giornaliera alle 03:00 UTC.

### ⚙️ Componenti Installati
- **Funzione**: `public.cleanup_timbrature_6m()`
- **Job schedulato**: `cleanup-timbrature-6m` (cron giornaliero)
- **Retention period**: 6 mesi
- **Esecuzione**: Ogni giorno alle 03:00 UTC

---

## 🚀 Installazione

### 1. Applica Migrazione SQL
```sql
-- In Supabase SQL Editor, esegui il contenuto completo di:
-- sql/retention_timbrature_6m.sql
```

### 2. Verifica Installazione
```sql
-- Controlla che il job sia attivo
SELECT 
  jobname,
  schedule,
  command,
  active
FROM cron.job 
WHERE jobname = 'cleanup-timbrature-6m';

-- Verifica esistenza funzione
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_name = 'cleanup_timbrature_6m';
```

---

## 🔍 Monitoraggio

### Verifica Job Attivi
```sql
-- Lista tutti i job pg_cron
SELECT * FROM cron.job ORDER BY jobname;

-- Solo il nostro job
SELECT jobname, schedule, active, command
FROM cron.job 
WHERE jobname = 'cleanup-timbrature-6m';
```

### Test Manuale (SICURO)
```sql
-- Esegui cleanup manuale per test (non cancella dati se < 6 mesi)
SELECT * FROM public.cleanup_timbrature_6m();

-- Risultato atteso:
-- deleted_count | execution_time | oldest_date_deleted
-- 0             | 2025-01-27...  | null
```

### Controllo Storico Timbrature
```sql
-- Verifica range date presenti
SELECT 
  MIN(data) as data_piu_vecchia,
  MAX(data) as data_piu_recente,
  COUNT(*) as totale_timbrature
FROM timbrature;

-- Timbrature per mese (ultimi 12 mesi)
SELECT 
  DATE_TRUNC('month', data) as mese,
  COUNT(*) as timbrature_nel_mese
FROM timbrature 
WHERE data >= CURRENT_DATE - INTERVAL '12 months'
GROUP BY DATE_TRUNC('month', data)
ORDER BY mese DESC;
```

---

## 🛡️ Sicurezza e Backup

### Pre-Retention Backup (RACCOMANDATO)
```sql
-- Crea backup timbrature prima dell'attivazione
CREATE TABLE backup_timbrature_pre_retention AS 
SELECT * FROM timbrature 
WHERE data < CURRENT_DATE - INTERVAL '6 months';

-- Verifica backup
SELECT COUNT(*) FROM backup_timbrature_pre_retention;
```

### Simulazione Cancellazione (SAFE TEST)
```sql
-- Vedi cosa verrebbe cancellato SENZA cancellare
SELECT 
  COUNT(*) as timbrature_da_cancellare,
  MIN(data) as prima_data_cancellata,
  MAX(data) as ultima_data_cancellata
FROM timbrature 
WHERE data < CURRENT_DATE - INTERVAL '6 months';
```

---

## 🔄 Rollback Completo

### Rimozione Retention (SE NECESSARIO)
```sql
-- 1. Disattiva job schedulato
SELECT cron.unschedule('cleanup-timbrature-6m');

-- 2. Rimuovi funzione
DROP FUNCTION IF EXISTS public.cleanup_timbrature_6m();

-- 3. Verifica rimozione
SELECT 'RETENTION RIMOSSA' as status
WHERE NOT EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'cleanup-timbrature-6m'
);
```

### Ripristino Dati (SE ESISTE BACKUP)
```sql
-- Solo se hai fatto backup pre-retention
INSERT INTO timbrature 
SELECT * FROM backup_timbrature_pre_retention;

-- Pulisci backup temporaneo
DROP TABLE IF EXISTS backup_timbrature_pre_retention;
```

---

## 📊 Logs e Debugging

### Log Supabase
I log delle esecuzioni sono visibili in:
- **Supabase Dashboard** → **Logs** → filtra per `cleanup_timbrature_6m`

### Log Manuale
```sql
-- Cronologia esecuzioni (se esiste tabella log)
SELECT * FROM cron.job_run_details 
WHERE jobname = 'cleanup-timbrature-6m'
ORDER BY start_time DESC 
LIMIT 10;
```

### Debug Job Issues
```sql
-- Verifica permessi funzione
SELECT routine_name, routine_schema, security_type
FROM information_schema.routines 
WHERE routine_name = 'cleanup_timbrature_6m';

-- Controlla estensione pg_cron
SELECT * FROM pg_extension WHERE extname = 'pg_cron';
```

---

## ⚠️ Note Importanti

### Comportamento Sistema
- ✅ **Automatico**: Nessun intervento manuale richiesto
- ✅ **Sicuro**: Cancella solo dati > 6 mesi
- ✅ **Reversibile**: Rollback completo disponibile
- ✅ **Non invasivo**: Non tocca altre tabelle
- ✅ **Monitorabile**: Log completi disponibili

### Raccomandazioni
1. **Backup regolari**: Configura backup automatici Supabase
2. **Monitor**: Controlla esecuzione job settimanalmente
3. **Test periodici**: Verifica funzione ogni 3 mesi
4. **Documentazione**: Aggiorna questo README per modifiche

### Troubleshooting Comune
- **Job non parte**: Verifica estensione `pg_cron` attiva
- **Permessi**: Funzione ha `SECURITY DEFINER` per esecuzione automatica
- **Timezone**: Schedule in UTC, converte automaticamente timezone locale
- **Performance**: Cancellazione su indice `idx_timbrature_data` (rapida)

---

## 📝 Modifiche Future

### Cambiare Retention Period
```sql
-- Modifica funzione per retention diversa (es. 12 mesi)
CREATE OR REPLACE FUNCTION public.cleanup_timbrature_6m()
-- Cambia: INTERVAL '6 months' → INTERVAL '12 months'
```

### Cambiare Orario Esecuzione
```sql
-- Reschedula job per orario diverso
SELECT cron.unschedule('cleanup-timbrature-6m');
SELECT cron.schedule(
  'cleanup-timbrature-6m',
  '0 2 * * *',  -- Nuovo orario: 02:00 invece di 03:00
  'SELECT public.cleanup_timbrature_6m();'
);
```

---

**Data installazione**: Da definire dopo applicazione SQL  
**Versione retention**: 1.0  
**Prossima revisione**: 3 mesi dopo installazione


# Quick Install - Retention Timbrature 6 Mesi

## 🎯 Installazione Rapida (5 minuti)

### 1. Apri Supabase SQL Editor
- Vai al tuo progetto Supabase
- **SQL Editor** nel menu laterale

### 2. Esegui Script
```sql
-- Copia e incolla TUTTO il contenuto di:
-- sql/retention_timbrature_6m.sql
-- 
-- Clicca "Run" per eseguire
```

### 3. Verifica Successo
```sql
-- Dovrebbe restituire 1 riga con job attivo
SELECT jobname, active FROM cron.job 
WHERE jobname = 'cleanup-timbrature-6m';
```

### 4. Test Sicuro (Opzionale)
```sql
-- Test che non cancella dati reali
SELECT * FROM public.cleanup_timbrature_6m();
-- Risultato atteso: deleted_count = 0
```

## ✅ Installazione Completata!

- **Sistema attivo**: Retention automatica ogni giorno alle 03:00
- **Retention period**: 6 mesi
- **Rollback**: Disponibile in `README_retention.md`
- **Monitoring**: Dashboard Supabase → Logs

## 🚨 Se Qualcosa Va Storto

**Rollback immediato**:
```sql
SELECT cron.unschedule('cleanup-timbrature-6m');
DROP FUNCTION IF EXISTS public.cleanup_timbrature_6m();
```

---

**Fine installazione** - Il sistema è ora attivo e autogestito.

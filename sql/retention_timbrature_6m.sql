
-- RETENTION AUTOMATICA TIMBRATURE - 6 MESI
-- File: sql/retention_timbrature_6m.sql
-- Versione: 1.0
-- Data: 2025-01-27

-- ========================================
-- FUNZIONE DI CLEANUP TIMBRATURE
-- ========================================

CREATE OR REPLACE FUNCTION public.cleanup_timbrature_6m()
RETURNS TABLE(
  deleted_count INTEGER,
  execution_time TIMESTAMP WITH TIME ZONE,
  oldest_date_deleted DATE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_rows INTEGER := 0;
  oldest_deleted DATE;
BEGIN
  -- Log inizio operazione
  RAISE NOTICE 'Avvio cleanup timbrature - retention 6 mesi alle %', NOW();
  
  -- Trova la data più vecchia che verrà eliminata (per logging)
  SELECT MIN(data) INTO oldest_deleted
  FROM timbrature 
  WHERE data < (CURRENT_DATE - INTERVAL '6 months');
  
  -- Esegui cancellazione timbrature oltre 6 mesi
  DELETE FROM public.timbrature 
  WHERE data < (CURRENT_DATE - INTERVAL '6 months');
  
  -- Ottieni numero righe cancellate
  GET DIAGNOSTICS deleted_rows = ROW_COUNT;
  
  -- Log risultato
  IF deleted_rows > 0 THEN
    RAISE NOTICE 'Cleanup completato: % timbrature eliminate (più vecchie del %)', 
                 deleted_rows, CURRENT_DATE - INTERVAL '6 months';
  ELSE
    RAISE NOTICE 'Cleanup completato: nessuna timbratura da eliminare';
  END IF;
  
  -- Restituisci risultati per monitoring
  RETURN QUERY SELECT 
    deleted_rows::INTEGER,
    NOW()::TIMESTAMP WITH TIME ZONE,
    oldest_deleted::DATE;
END;
$$;

-- ========================================
-- COMMENTI E PERMESSI
-- ========================================

COMMENT ON FUNCTION public.cleanup_timbrature_6m() IS 
'Funzione automatica per eliminare timbrature più vecchie di 6 mesi. Eseguita giornalmente alle 03:00 via pg_cron.';

-- Grant permessi per esecuzione automatica
GRANT EXECUTE ON FUNCTION public.cleanup_timbrature_6m() TO postgres;

-- ========================================
-- SCHEDULAZIONE JOB GIORNALIERO
-- ========================================

-- Abilita estensione pg_cron se non presente
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Crea job giornaliero alle 03:00 UTC
SELECT cron.schedule(
  'cleanup-timbrature-6m',           -- nome job
  '0 3 * * *',                       -- cron schedule: ogni giorno alle 03:00
  'SELECT public.cleanup_timbrature_6m();'  -- comando da eseguire
);

-- ========================================
-- VERIFICA INSTALLAZIONE
-- ========================================

-- Mostra job schedulati
SELECT 
  jobname,
  schedule,
  command,
  nodename,
  nodeport,
  database,
  username,
  active
FROM cron.job 
WHERE jobname = 'cleanup-timbrature-6m';

-- Test manuale della funzione (OPZIONALE - non eseguire in produzione)
-- SELECT * FROM public.cleanup_timbrature_6m();

-- ========================================
-- BLOCCO ROLLBACK (COMMENTATO - DA USARE SE NECESSARIO)
-- ========================================

/*
-- ⚠️  ROLLBACK COMPLETO - DECOMMENTARE SOLO SE NECESSARIO

-- 1. Rimuovi job schedulato
SELECT cron.unschedule('cleanup-timbrature-6m');

-- 2. Rimuovi funzione
DROP FUNCTION IF EXISTS public.cleanup_timbrature_6m();

-- 3. Verifica rimozione
SELECT jobname FROM cron.job WHERE jobname = 'cleanup-timbrature-6m';
-- Dovrebbe restituire 0 righe

-- 4. Log rollback
SELECT 'ROLLBACK COMPLETATO: retention automatica rimossa' AS status;
*/

-- ========================================
-- INFORMAZIONI FINALI
-- ========================================

SELECT 
  'RETENTION AUTOMATICA INSTALLATA' AS status,
  'Job attivo: cleanup-timbrature-6m' AS job_name,
  'Orario esecuzione: 03:00 UTC giornaliero' AS schedule,
  'Retention period: 6 mesi' AS retention,
  NOW() AS installed_at;

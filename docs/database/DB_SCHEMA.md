# Database Schema - BadgeNode

## Schema Generale

### Architettura Database
- **DBMS**: PostgreSQL 15+ (Supabase managed)
- **Schema**: `public` (default)
- **Encoding**: UTF-8
- **Timezone**: UTC con conversione locale lato client

## Tabelle Principali

### `public.utenti`
**Scopo**: Anagrafica dipendenti attivi

| Colonna | Tipo | Constraint | Descrizione |
|---------|------|------------|-------------|
| `pin` | `integer` | **PK, NOT NULL** | PIN univoco dipendente (4 cifre) |
| `nome` | `text` | `NOT NULL` | Nome dipendente |
| `cognome` | `text` | `NOT NULL` | Cognome dipendente |
| `ore_contrattuali` | `numeric(5,2)` | `DEFAULT 160` | Ore mensili contratto |
| `attivo` | `boolean` | `DEFAULT true` | Stato attivazione |
| `created_at` | `timestamptz` | `DEFAULT now()` | Timestamp creazione |

**Constraint**:
```sql
-- PIN deve essere 4 cifre
CHECK (pin >= 1000 AND pin <= 9999)
-- Nome e cognome non vuoti
CHECK (length(trim(nome)) > 0 AND length(trim(cognome)) > 0)
```

### `public.timbrature`
**Scopo**: Registrazioni entrata/uscita dipendenti

| Colonna | Tipo | Constraint | Descrizione |
|---------|------|------------|-------------|
| `id` | `bigserial` | **PK** | Identificativo univoco auto-increment |
| `pin` | `integer` | **FK, NOT NULL** | Riferimento a `utenti.pin` |
| `tipo` | `text` | `NOT NULL` | Tipo timbratura: 'entrata' \| 'uscita' |
| `data` | `date` | `NOT NULL` | Data timbratura (YYYY-MM-DD) |
| `ore` | `time` | `NOT NULL` | Orario timbratura (HH:MM:SS) |
| `giornologico` | `text` | `NOT NULL` | Giorno settimana (Lunedì, Martedì, ...) |
| `created_at` | `timestamptz` | `DEFAULT now()` | Timestamp inserimento |

**Constraint**:
```sql
-- Tipo deve essere entrata o uscita
CHECK (tipo IN ('entrata', 'uscita'))
-- Giorno logico valido
CHECK (giornologico IN ('Lunedì','Martedì','Mercoledì','Giovedì','Venerdì','Sabato','Domenica'))
-- Data non futura
CHECK (data <= CURRENT_DATE)
```

### `public.ex_dipendenti`
**Scopo**: Archivio dipendenti cessati

| Colonna | Tipo | Constraint | Descrizione |
|---------|------|------------|-------------|
| `pin` | `integer` | **PK** | PIN ex-dipendente |
| `nome` | `text` | `NOT NULL` | Nome |
| `cognome` | `text` | `NOT NULL` | Cognome |
| `ore_contrattuali` | `numeric(5,2)` | | Ore contratto originali |
| `data_cessazione` | `date` | `NOT NULL` | Data fine rapporto |
| `motivo_cessazione` | `text` | | Causale cessazione |
| `created_at` | `timestamptz` | | Data creazione originale |
| `archived_at` | `timestamptz` | `DEFAULT now()` | Data archiviazione |

## Relazioni Principali

### Foreign Keys
```sql
-- timbrature → utenti
ALTER TABLE public.timbrature 
ADD CONSTRAINT fk_timbrature_pin 
FOREIGN KEY (pin) REFERENCES public.utenti(pin) 
ON DELETE CASCADE ON UPDATE CASCADE;
```

### Relazioni Logiche
- **1:N** `utenti` → `timbrature` (un dipendente ha molte timbrature)
- **1:1** `utenti` ↔ `ex_dipendenti` (migrazione dati alla cessazione)

## Viste Materializzate

### `public.v_timbrature_utenti`
**Scopo**: JOIN ottimizzato per ridurre round-trip API

```sql
CREATE OR REPLACE VIEW public.v_timbrature_utenti AS
SELECT 
  t.id,
  t.pin,
  t.tipo,
  t.data,
  t.ore,
  t.giornologico,
  t.created_at,
  u.nome,
  u.cognome,
  u.ore_contrattuali
FROM public.timbrature t
JOIN public.utenti u ON u.pin = t.pin;
```

**Utilizzo**:
- ✅ Caricamento dati storico con anagrafica completa
- ✅ Export PDF/Excel con nome dipendente
- ✅ Report mensili aggregati

### Vista Proposta: `v_giorni_completi`
**Scopo**: Genera tutti i giorni del mese anche senza timbrature

```sql
-- Vista per riempire giorni mancanti (da implementare)
CREATE OR REPLACE VIEW public.v_giorni_completi AS
WITH date_series AS (
  SELECT generate_series(
    date_trunc('month', CURRENT_DATE),
    date_trunc('month', CURRENT_DATE) + interval '1 month' - interval '1 day',
    interval '1 day'
  )::date AS data
),
utenti_attivi AS (
  SELECT pin, nome, cognome FROM public.utenti WHERE attivo = true
)
SELECT 
  ua.pin,
  ua.nome,
  ua.cognome,
  ds.data,
  COALESCE(t.ore_entrata, '00:00:00'::time) as ore_entrata,
  COALESCE(t.ore_uscita, '00:00:00'::time) as ore_uscita,
  COALESCE(t.ore_totali, '0.00'::numeric) as ore_totali
FROM utenti_attivi ua
CROSS JOIN date_series ds
LEFT JOIN (
  -- Aggregazione timbrature per giorno
  SELECT pin, data,
    MIN(CASE WHEN tipo = 'entrata' THEN ore END) as ore_entrata,
    MAX(CASE WHEN tipo = 'uscita' THEN ore END) as ore_uscita,
    -- Calcolo ore lavorate (da implementare)
    0.00 as ore_totali
  FROM public.timbrature
  GROUP BY pin, data
) t ON ua.pin = t.pin AND ds.data = t.data;
```

## Indici di Performance

### Indici Esistenti
```sql
-- Primary Keys (automatici)
CREATE UNIQUE INDEX utenti_pkey ON public.utenti (pin);
CREATE UNIQUE INDEX timbrature_pkey ON public.timbrature (id);

-- Indici consigliati per performance
CREATE INDEX IF NOT EXISTS idx_timbrature_pin_data 
ON public.timbrature (pin, data);

CREATE INDEX IF NOT EXISTS idx_timbrature_created_at 
ON public.timbrature (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_utenti_attivo 
ON public.utenti (attivo) WHERE attivo = true;
```

### Strategia Indicizzazione
- **Composite Index**: `(pin, data)` per query storico mensile
- **Partial Index**: Solo utenti attivi per performance
- **Descending Index**: `created_at DESC` per timbrature recenti

## Ottimizzazioni Essenziali

### Partitioning (Futuro)
Per tabelle con molti dati storici:
```sql
-- Partitioning per anno (da valutare con crescita dati)
CREATE TABLE timbrature_2025 PARTITION OF timbrature
FOR VALUES FROM ('2025-01-01') TO ('2026-01-01');
```

### Archiving Strategy
- **Retention Policy**: Mantenere 2 anni di timbrature attive
- **Cold Storage**: Archiviare dati più vecchi in tabelle separate
- **Soft Delete**: Preferire flag `deleted_at` invece di DELETE fisico

### Query Optimization
```sql
-- Query ottimizzata per storico mensile
SELECT * FROM v_timbrature_utenti 
WHERE pin = $1 
  AND data >= $2 
  AND data <= $3
ORDER BY data, ore;

-- Usa sempre range di date specifiche, evita scan completi
-- Limita risultati con LIMIT quando possibile
-- Preferisci EXISTS a IN per subquery
```

## Constraint di Business Logic

### Validazioni Applicative
- **PIN Univocità**: Controllo duplicati prima inserimento
- **Sequenza Timbrature**: Entrata prima di uscita nello stesso giorno
- **Orari Logici**: Entrata < Uscita, orari lavorativi realistici
- **Weekend/Festivi**: Validazione giorni lavorativi (opzionale)

### Trigger Proposti
```sql
-- Trigger per validazione sequenza timbrature
CREATE OR REPLACE FUNCTION validate_timbratura_sequence()
RETURNS TRIGGER AS $$
BEGIN
  -- Verifica che non ci siano già 2 timbrature per lo stesso giorno
  IF (SELECT COUNT(*) FROM timbrature 
      WHERE pin = NEW.pin AND data = NEW.data) >= 2 THEN
    RAISE EXCEPTION 'Massimo 2 timbrature per giorno';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

## Backup & Maintenance

### Maintenance Tasks
- **VACUUM ANALYZE**: Settimanale su tabelle principali
- **REINDEX**: Mensile per ottimizzare indici
- **Statistics Update**: Automatico con autovacuum

### Monitoring Queries
```sql
-- Dimensioni tabelle
SELECT schemaname, tablename, 
       pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables WHERE schemaname = 'public';

-- Performance query lente
SELECT query, mean_time, calls 
FROM pg_stat_statements 
ORDER BY mean_time DESC LIMIT 10;
```

---

*Documentazione aggiornata: Settembre 2025*

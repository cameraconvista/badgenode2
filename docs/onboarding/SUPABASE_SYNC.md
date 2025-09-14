# Supabase - Sincronizzazione Database

## Configurazione Connessione

### Client Singleton
Il progetto utilizza un pattern singleton per il client Supabase, configurato in `assets/scripts/supabase-client.js`:

```
URL: https://txmjqrnitfsiytbytxlc.supabase.co
Autenticazione: Chiave anonima con RLS attivo
Sessione: Persistente con auto-refresh token
```

### Configurazione Runtime
- **Fallback Config**: Configurazione hardcoded per sviluppo locale
- **Environment Variables**: Supporto per SUPABASE_URL e SUPABASE_ANON_KEY
- **Error Handling**: Gestione errori PGRST116 (nessun dato) e chiavi invalide

## Tabelle Principali

### `public.utenti`
**Scopo**: Anagrafica dipendenti attivi
```sql
Colonne principali:
- pin (PK, integer) - PIN univoco dipendente
- nome (text) - Nome dipendente  
- cognome (text) - Cognome dipendente
- ore_contrattuali (numeric) - Ore lavoro mensili contratto
- attivo (boolean) - Stato attivazione
- created_at (timestamp) - Data creazione record
```

### `public.timbrature`
**Scopo**: Registrazioni entrata/uscita dipendenti
```sql
Colonne principali:
- id (PK, bigint) - Identificativo univoco timbratura
- pin (FK, integer) - Riferimento a utenti.pin
- tipo (text) - 'entrata' | 'uscita'
- data (date) - Data timbratura (YYYY-MM-DD)
- ore (time) - Orario timbratura (HH:MM:SS)
- giornologico (text) - Giorno settimana italiano
- created_at (timestamp) - Timestamp inserimento
```

### `public.ex_dipendenti`
**Scopo**: Archivio dipendenti cessati
```sql
Struttura identica a utenti con:
- data_cessazione (date) - Data fine rapporto
- motivo_cessazione (text) - Causale cessazione
```

## Viste Database

### `public.v_timbrature_utenti`
**Scopo**: JOIN ottimizzato timbrature + anagrafica per ridurre round-trip
```sql
SELECT t.*, u.nome, u.cognome, u.ore_contrattuali
FROM timbrature t 
JOIN utenti u ON u.pin = t.pin
```

**Utilizzo**: 
- ✅ Pagina storico per caricamento dati completi
- ✅ Report mensili con informazioni dipendente
- ✅ Export PDF/Excel con nome completo

## Sincronizzazioni Real-time

### Subscription Attive
Il progetto utilizza Supabase Real-time per aggiornamenti automatici:

```javascript
// Esempio subscription timbrature
supabase
  .channel('timbrature-changes')
  .on('postgres_changes', { 
    event: '*', 
    schema: 'public', 
    table: 'timbrature' 
  }, handleTimbratureChange)
  .subscribe()
```

### Eventi Monitorati
- ✅ **INSERT timbrature**: Nuove registrazioni entrata/uscita
- ✅ **UPDATE utenti**: Modifiche anagrafica dipendenti
- ✅ **DELETE**: Rimozione record (soft delete preferito)

## Row Level Security (RLS)

### Policy Attive
Supabase RLS è configurato per:

```sql
-- Lettura pubblica per applicazione
CREATE POLICY "Enable read access for all users" ON public.utenti
FOR SELECT USING (true);

-- Inserimento timbrature per tutti
CREATE POLICY "Enable insert for all users" ON public.timbrature  
FOR INSERT WITH CHECK (true);
```

### Sicurezza Applicativa
- **PIN Validation**: Controllo esistenza utente prima inserimento
- **Tipo Validation**: Solo 'entrata'/'uscita' accettati
- **Date Validation**: Controllo formato date lato client

## Trigger Database

### Trigger Automatici
Supabase gestisce automaticamente:
- **created_at**: Timestamp automatico su INSERT
- **updated_at**: Aggiornamento automatico su UPDATE (se configurato)

### Trigger Personalizzati
Non sono attualmente implementati trigger custom, ma potrebbero essere aggiunti per:
- ⚠️ Validazione orari sovrapposti
- ⚠️ Calcolo automatico ore lavorate
- ⚠️ Notifiche anomalie timbrature

## Storage Bucket

### Configurazione
Al momento non sono utilizzati bucket Storage, ma potrebbero servire per:
- ⚠️ Upload foto profilo dipendenti
- ⚠️ Archiviazione report PDF generati
- ⚠️ Backup dati storici

## Ottimizzazioni Performance

### Indexing Strategico
```sql
-- Index consigliati per performance
CREATE INDEX IF NOT EXISTS idx_timbrature_pin_data 
ON public.timbrature (pin, data);

CREATE INDEX IF NOT EXISTS idx_timbrature_created_at 
ON public.timbrature (created_at DESC);
```

### Query Optimization
- **Limit/Offset**: Paginazione per tabelle grandi
- **Date Ranges**: Filtri temporali specifici invece di scan completi
- **Select Specific**: Solo colonne necessarie, evitare SELECT *

## Error Handling

### Codici Errore Comuni
```javascript
// Gestione errori standardizzata
PGRST116: "Nessun dato trovato"
PGRST301: "Violazione constraint"
23505: "Violazione unique constraint (PIN duplicato)"
```

### Retry Logic
- **Connection Timeout**: Retry automatico fino a 3 tentativi
- **Rate Limiting**: Backoff esponenziale su 429
- **Network Errors**: Fallback su cache locale quando possibile

## Backup & Recovery

### Backup Automatici
Supabase gestisce:
- ✅ **Daily Backups**: Backup giornalieri automatici
- ✅ **Point-in-time Recovery**: Ripristino a timestamp specifico
- ✅ **Cross-region Replication**: Replica geografica dati

### Backup Locali
Il progetto include script per backup locale:
```bash
# Backup completo progetto
tar -czf backup-$(date +%Y%m%d-%H%M%S).tgz --exclude='.git' .
```

---

*Documentazione aggiornata: Settembre 2025*

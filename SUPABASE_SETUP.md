
# SUPABASE_SETUP.md

## Setup e Sincronizzazione Supabase - BADGEBOX

### 🚀 Configurazione Iniziale Supabase

#### 1. Creazione Progetto
```bash
# Vai su https://supabase.com
# Sign up/Login → New Project
# Scegli organization → Create project
# Attendi provisioning (2-3 minuti)
```

#### 2. Configurazione Database
Esegui lo script completo nel **SQL Editor** di Supabase:

```sql
-- COPIA INTERO CONTENUTO DI setup-database.sql
-- Include creazione tabelle + indici + constraints + RLS

-- Verifica creazione tabelle
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name IN ('utenti', 'timbrature', 'dipendenti_archiviati')
ORDER BY table_name, ordinal_position;
```

#### 3. Configurazione Row Level Security (RLS)
```sql
-- ✅ Già incluso in setup-database.sql

-- Verifica RLS attiva
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('utenti', 'timbrature', 'dipendenti_archiviati');
```

### 🔑 Gestione Credenziali

#### Recupero API Keys
```bash
# Supabase Dashboard → Settings → API
# 
# 📋 Copia questi valori:
# Project URL:    https://xxxxx.supabase.co
# Anon public:    eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
# Service role:   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (NON usare in frontend!)
```

#### Configurazione Client (Implementata)
File **assets/scripts/supabase-client.js** (già configurato):
```javascript
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

export const supabaseClient = createClient(
  "https://txmjqrnitfsiytbytxlc.supabase.co",  // ✅ Project URL attuale
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."  // ✅ Anon key attuale
);
```

#### Aggiornamento Configurazione
Per cambiare progetto Supabase, aggiorna **4 file**:

1. **assets/scripts/supabase-client.js** (principale)
2. **index.html** (script inline timbrature)
3. **utenti.html** (script inline gestione)
4. **ex-dipendenti.html** (script inline archivio)

### 🔄 Sincronizzazione Schema Database

#### Da Replit a Supabase
```sql
-- 1. Esporta schema locale (se presente)
pg_dump --schema-only your_local_db > schema_export.sql

-- 2. Applica su Supabase (SQL Editor)
-- Copia contenuto schema_export.sql
```

#### Modifica Schema Esistente
```sql
-- ✅ Pattern per aggiungere colonne
ALTER TABLE utenti 
ADD COLUMN IF NOT EXISTS nuova_colonna VARCHAR;

-- ✅ Pattern per modificare colonne  
ALTER TABLE dipendenti_archiviati
ALTER COLUMN file_excel_path TYPE TEXT;

-- ✅ Pattern per aggiungere indici
CREATE INDEX IF NOT EXISTS idx_nome_indice 
ON tabella(campo1, campo2);
```

#### Backup Schema
```bash
# Dal Dashboard Supabase
# Settings → Database → Backup → Create backup
# Frequenza: Prima di ogni modifica schema
```

### 🛠️ Comandi Utili Implementati

#### Verifiche Database
```sql
-- Conteggio record per tabella
SELECT 
  'utenti' as tabella, COUNT(*) as records FROM utenti
UNION ALL
SELECT 
  'timbrature', COUNT(*) FROM timbrature  
UNION ALL
SELECT 
  'dipendenti_archiviati', COUNT(*) FROM dipendenti_archiviati;

-- Performance query più pesanti
EXPLAIN ANALYZE
SELECT * FROM timbrature t
JOIN utenti u ON t.pin = u.pin
WHERE t.data BETWEEN '2024-01-01' AND '2024-12-31';

-- Spazio occupato tabelle
SELECT 
  schemaname,
  tablename,
  attname,
  n_distinct,
  most_common_vals
FROM pg_stats 
WHERE tablename IN ('utenti', 'timbrature', 'dipendenti_archiviati');
```

#### Operazioni Maintenance
```sql
-- Pulizia dati test
DELETE FROM timbrature WHERE pin = 99; -- PIN test

-- Reset sequence (se necessario)
SELECT setval('utenti_id_seq', (SELECT MAX(id) FROM utenti));

-- Aggiorna statistiche tabelle
ANALYZE utenti;
ANALYZE timbrature;
ANALYZE dipendenti_archiviati;
```

### 🔧 Troubleshooting Database

#### Errori Comuni e Soluzioni

##### Errore: "relation does not exist"
```sql
-- Verifica esistenza tabelle
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';

-- Se mancanti, riesegui setup-database.sql
```

##### Errore: "duplicate key value violates unique constraint"
```sql
-- Verifica duplicati PIN
SELECT pin, COUNT(*) 
FROM utenti 
GROUP BY pin 
HAVING COUNT(*) > 1;

-- Risoluzione: aggiorna PIN duplicati
UPDATE utenti SET pin = 
  (SELECT COALESCE(MAX(pin), 0) + 1 FROM utenti u2 WHERE u2.id != utenti.id)
WHERE pin IN (SELECT pin FROM utenti GROUP BY pin HAVING COUNT(*) > 1);
```

##### Errore: "permission denied for table"
```sql
-- Verifica e ripristina RLS
ALTER TABLE utenti ENABLE ROW LEVEL SECURITY;
-- Crea policy se necessaria
CREATE POLICY "Enable all operations" ON utenti FOR ALL USING (true);
```

#### Connection Issues
```javascript
// ✅ Test connessione implementato
async function testConnessione() {
  try {
    const { data, error } = await supabaseClient
      .from('utenti')
      .select('count', { count: 'exact' });
      
    if (error) throw error;
    console.log('✅ Connessione OK:', data);
    return true;
  } catch (error) {
    console.error('❌ Connessione fallita:', error);
    return false;
  }
}
```

### 📊 Monitoring e Analytics

#### Real-time Monitoring
```javascript
// ✅ Implementato logging operazioni
console.log(`✅ Archiviazione completata per PIN ${pin}:`);
console.log(`   • Nome: ${dipendente.nome} ${dipendente.cognome}`);
console.log(`   • Timbrature archiviate: ${timbrature.length}`);
console.log(`   • PIN liberato: ${pin}`);
console.log(`   • File Excel: ${nomeFileExcel}`);
```

#### Performance Analytics
```sql
-- Query più costose
SELECT query, calls, total_time, mean_time
FROM pg_stat_statements
ORDER BY total_time DESC
LIMIT 10;

-- Lock monitoring  
SELECT * FROM pg_locks 
WHERE NOT GRANTED;
```

### 🔄 Migration Strategy

#### Schema Changes Workflow
```bash
# 1. Backup pre-migration
# Supabase Dashboard → Settings → Database → Backup

# 2. Test migration su staging
# SQL Editor → Run migration script  

# 3. Verifica integrità
SELECT COUNT(*) FROM utenti;
SELECT COUNT(*) FROM timbrature;

# 4. Update application code
# Aggiorna references a nuovi campi/tabelle

# 5. Deploy
git push origin main
```

#### Data Migration Pattern
```sql
-- ✅ Safe migration pattern
BEGIN;

-- Crea nuova struttura
ALTER TABLE utenti ADD COLUMN nuovo_campo VARCHAR;

-- Migra dati esistenti  
UPDATE utenti SET nuovo_campo = 'default_value' WHERE nuovo_campo IS NULL;

-- Valida migrazione
SELECT COUNT(*) FROM utenti WHERE nuovo_campo IS NULL;
-- Se = 0, procedi, altrimenti ROLLBACK

COMMIT;
```

### 🛡️ Security Best Practices

#### Database Security Checklist
```
✅ Row Level Security attiva su tutte le tabelle
✅ Anon key limitata a operazioni frontend necessarie
✅ Service key NON esposta in frontend
✅ Constraints attivi per validazione dati
✅ Backup automatici configurati
✅ SSL/TLS enforced su tutte le connessioni
```

#### API Security Implementation
```javascript
// ✅ Client configurato con sicurezza
const supabaseClient = createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY    // ✅ Solo anon key pubblica
  // NO service key in frontend!
);

// ✅ Error handling che non espone dettagli
export function gestisciErroreSupabase(error) {
  console.error('Errore Supabase:', error); // Full log per dev
  
  // Mapping sicuro per utenti
  switch (error?.code) {
    case 'PGRST116': return 'Nessun dato trovato';
    case '23505': return 'PIN già esistente';
    default: return 'Errore durante operazione'; // Generic message
  }
}
```

### 📱 Real-time Features (Future)

#### Preparazione Real-time
```javascript
// TODO: Real-time subscriptions
const subscription = supabaseClient
  .channel('timbrature-changes')
  .on('postgres_changes', 
    { event: 'INSERT', schema: 'public', table: 'timbrature' },
    (payload) => {
      console.log('🔔 Nuova timbratura:', payload.new);
      // Aggiorna UI in real-time
    }
  )
  .subscribe();
```

#### Offline Support Strategy
```javascript
// TODO: Service Worker + IndexedDB
// Cache essenziale:
// - Lista dipendenti attivi
// - Timbrature giorno corrente
// - Sync queue per operazioni offline
```

### 🎯 Production Deployment

#### Environment Variables
```bash
# Per produzione, usa environment variables
export SUPABASE_URL="https://xxx.supabase.co"
export SUPABASE_ANON_KEY="your_anon_key"

# Template .env (NON committare)
SUPABASE_URL=https://txmjqrnitfsiytbytxlc.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiI...
```

#### Production Checklist
```
✅ Database backup recente
✅ API keys corrette per produzione
✅ RLS policies verificate
✅ Performance acceptable su queries
✅ Monitoring alerts configurati
✅ SSL certificato valido
```

### 📞 Supporto Supabase

#### Risorse Utili
- **Documentazione**: [supabase.com/docs](https://supabase.com/docs)
- **Community**: [Discord Supabase](https://discord.supabase.com)
- **Status**: [status.supabase.com](https://status.supabase.com)
- **GitHub**: [github.com/supabase](https://github.com/supabase)

#### Debug Tools
- **Dashboard Logs**: Real-time error tracking
- **SQL Editor**: Query testing e optimization
- **API Playground**: Test endpoints
- **Performance Tab**: Slow query identification

```

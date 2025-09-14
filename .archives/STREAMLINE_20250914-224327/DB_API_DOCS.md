
# DB_API_DOCS.md

## Schema Database e API - BADGEBOX

### 📊 Database Schema (PostgreSQL - Supabase)

#### Tabella `utenti` - Dipendenti Attivi
```sql
CREATE TABLE utenti (
  id BIGSERIAL PRIMARY KEY,
  pin INTEGER UNIQUE NOT NULL,
  nome VARCHAR NOT NULL,
  cognome VARCHAR NOT NULL,
  email VARCHAR,
  telefono VARCHAR,
  descrizione_contratto TEXT,
  ore_contrattuali DECIMAL(4,2) DEFAULT 8.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  CONSTRAINT pin_range CHECK (pin >= 1 AND pin <= 99)
);

-- Indici per performance
CREATE UNIQUE INDEX idx_utenti_pin ON utenti(pin);
CREATE INDEX idx_utenti_nome_cognome ON utenti(nome, cognome);
```

**Relazioni**: 
- PIN → Chiave naturale per timbrature
- **1:N** con timbrature (un utente, molte timbrature)

#### Tabella `timbrature` - Registrazioni Entrata/Uscita
```sql
CREATE TABLE timbrature (
  id BIGSERIAL PRIMARY KEY,
  pin INTEGER NOT NULL REFERENCES utenti(pin),
  data DATE NOT NULL,
  ore TIME NOT NULL,
  tipo VARCHAR(8) NOT NULL CHECK (tipo IN ('ENTRATA', 'USCITA')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Indici per query frequenti
CREATE INDEX idx_timbrature_pin_data ON timbrature(pin, data);
CREATE INDEX idx_timbrature_data_ore ON timbrature(data, ore);
CREATE INDEX idx_timbrature_tipo ON timbrature(tipo);

-- Constraint business logic
CREATE UNIQUE INDEX idx_no_duplicate_entries ON timbrature(pin, data, tipo);
```

**Business Logic**:
- **Anti-duplicazione**: Previene ENTRATA/USCITA duplicate nello stesso giorno
- **Giorno logico**: 8:00-5:00 (timbrature 00:00-04:59 appartengono al giorno precedente)
- **Calcolo ore**: Differenza tra prima ENTRATA e ultima USCITA del giorno

#### Tabella `dipendenti_archiviati` - Ex Dipendenti
```sql
CREATE TABLE dipendenti_archiviati (
  id BIGSERIAL PRIMARY KEY,
  pin INTEGER NOT NULL,
  nome VARCHAR NOT NULL,
  cognome VARCHAR NOT NULL,
  email VARCHAR,
  telefono VARCHAR,
  descrizione_contratto TEXT,
  ore_contrattuali DECIMAL(4,2),
  data_archiviazione TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  file_excel_path TEXT,
  timbrature_totali INTEGER DEFAULT 0,
  ore_lavorate_totali DECIMAL(8,2) DEFAULT 0.00
);

-- Indici per ricerche archivio
CREATE INDEX idx_archiviati_data ON dipendenti_archiviati(data_archiviazione DESC);
CREATE INDEX idx_archiviati_nome_cognome ON dipendenti_archiviati(nome, cognome);
```

**Processo Archiviazione**:
1. Backup completo dati dipendente
2. Generazione Excel con storico timbrature
3. Calcolo statistiche finali
4. Spostamento record da `utenti` a `dipendenti_archiviati`
5. PIN liberato per riutilizzo

### 🚀 API Endpoints (Supabase Client)

#### Configurazione Client
```javascript
// assets/scripts/supabase-client.js
const supabaseClient = createClient(
  "https://txmjqrnitfsiytbytxlc.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
);
```

#### Operazioni Utenti

##### GET - Lista Dipendenti Attivi
```javascript
const { data: utenti, error } = await supabase
  .from("utenti")
  .select("*")
  .order("pin", { ascending: true });
```

##### POST - Nuovo Dipendente
```javascript
const { data, error } = await supabase
  .from("utenti")
  .insert({
    pin: numeroPIN,
    nome: nome.trim(),
    cognome: cognome.trim(),
    email: email?.trim(),
    telefono: telefono?.trim(),
    descrizione_contratto: descrizione?.trim(),
    ore_contrattuali: parseFloat(oreContrattuali)
  });
```

##### PUT - Modifica Dipendente
```javascript
const { data, error } = await supabase
  .from("utenti")
  .update({
    nome: datiAggiornati.nome,
    cognome: datiAggiornati.cognome,
    // ... altri campi
  })
  .eq("pin", pin);
```

#### Operazioni Timbrature

##### GET - Storico Timbrature
```javascript
// Con range date specifico
const { data: timbrature, error } = await supabase
  .from("timbrature")
  .select("*")
  .eq("pin", parseInt(pin))
  .gte("data", dataInizio)
  .lte("data", dataFine)
  .order("data", { ascending: true })
  .order("ore", { ascending: true });
```

##### POST - Nuova Timbratura
```javascript
const { data, error } = await supabase
  .from("timbrature")
  .insert({
    pin: parseInt(pinInserito),
    data: dataOdierna,
    ore: oraAttuale,
    tipo: tipoTimbratura // 'ENTRATA' | 'USCITA'
  });
```

##### PUT - Modifica Timbratura
```javascript
const { data, error } = await supabase
  .from("timbrature")
  .update({
    data: nuovaData,
    ore: nuovaOra,
    tipo: nuovoTipo
  })
  .eq("id", idTimbratura);
```

##### DELETE - Elimina Timbratura
```javascript
const { data, error } = await supabase
  .from("timbrature")
  .delete()
  .eq("id", idTimbratura);
```

#### Operazioni Archivio

##### POST - Archivia Dipendente
```javascript
// 1. Recupera dati completi
const { data: dipendente } = await supabase
  .from("utenti")
  .select("*")
  .eq("pin", pin)
  .single();

// 2. Recupera tutte le timbrature
const { data: timbrature } = await supabase
  .from("timbrature")
  .select("*")
  .eq("pin", pin);

// 3. Calcola statistiche
const oreTotali = calcolaOreTotali(timbrature);

// 4. Inserisci in archivio
const { data, error } = await supabase
  .from("dipendenti_archiviati")
  .insert({
    pin: dipendente.pin,
    nome: dipendente.nome,
    cognome: dipendente.cognome,
    email: dipendente.email,
    telefono: dipendente.telefono,
    descrizione_contratto: dipendente.descrizione_contratto,
    ore_contrattuali: dipendente.ore_contrattuali,
    file_excel_path: nomeFileExcel,
    timbrature_totali: timbrature.length,
    ore_lavorate_totali: oreTotali
  });

// 5. Elimina da tabella attivi
await supabase.from("utenti").delete().eq("pin", pin);
```

##### GET - Lista Ex Dipendenti
```javascript
const { data: exDipendenti, error } = await supabase
  .from("dipendenti_archiviati")
  .select("*")
  .order("data_archiviazione", { ascending: false });
```

##### DELETE - Elimina Definitivamente
```javascript
const { data, error } = await supabase
  .from("dipendenti_archiviati")
  .delete()
  .eq("pin", pin);
```

### 🔍 Query Patterns Ottimizzate

#### Range Date con Performance
```javascript
// Query con indici ottimizzati
const { data } = await supabase
  .from("timbrature")
  .select("data, ore, tipo")
  .eq("pin", pin)
  .gte("data", "2024-01-01")
  .lte("data", "2024-01-31")
  .order("data", { ascending: true })
  .order("ore", { ascending: true });
```

#### Aggregazioni Calcolate
```javascript
// Calcolo ore giornaliere
function calcolaOreGiorno(timbratureGiorno) {
  const entrate = timbratureGiorno.filter(t => t.tipo === 'ENTRATA');
  const uscite = timbratureGiorno.filter(t => t.tipo === 'USCITA');
  
  if (entrate.length === 0 || uscite.length === 0) return 0;
  
  const primaEntrata = entrate[0].ore;
  const ultimaUscita = uscite[uscite.length - 1].ore;
  
  return calcolaOre(primaEntrata, ultimaUscita);
}
```

### 🛡️ Validation & Security

#### Input Validation
```javascript
// PIN validation
function validatePIN(pin) {
  const numPin = parseInt(pin);
  return numPin >= 1 && numPin <= 99;
}

// Date validation
function validateDateRange(dataInizio, dataFine) {
  const inicio = new Date(dataInizio);
  const fine = new Date(dataFine);
  return inicio <= fine && fine <= new Date();
}

// File upload validation
function validateFileUpload(file) {
  const maxSize = 5 * 1024 * 1024; // 5MB
  const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg'];
  
  if (file.size > maxSize) {
    throw new Error("File troppo grande. Massimo 5MB.");
  }
  
  if (!allowedTypes.includes(file.type)) {
    throw new Error("Tipo file non supportato.");
  }
  
  return true;
}
```

#### Error Handling Standard
```javascript
// Gestione errori Supabase
export function gestisciErroreSupabase(error) {
  console.error('Errore Supabase:', error);
  switch (error?.code) {
    case 'PGRST116': return 'Nessun dato trovato';
    case '23505': return 'PIN già esistente';
    case '23503': return 'PIN non valido';
    default: return error?.message || 'Errore sconosciuto';
  }
}
```

### 📋 Business Logic Rules

#### Timbrature Logic
1. **Anti-duplicazione**: Max 1 ENTRATA e 1 USCITA per giorno
2. **Giorno logico**: 8:00-5:00 (timbrature notturne → giorno precedente)
3. **Validazione sequenza**: ENTRATA deve precedere USCITA
4. **Calcolo automatico**: Ore = Ultima USCITA - Prima ENTRATA

#### Archiviazione Logic
1. **Backup completo**: Tutti i dati dipendente in Excel
2. **Liberazione PIN**: Rende disponibile PIN per nuovi dipendenti
3. **Conservazione storico**: Dati mantenuti in `dipendenti_archiviati`
4. **Irreversibilità**: Archiviazione non può essere annullata

#### Export Logic
- **PDF**: Layout business con header aziendale
- **Excel**: Dati completi con formattazione
- **WhatsApp**: Formato text ottimizzato per mobile

### 🔄 Data Lifecycle

```
Nuovo Dipendente → Utenti Attivi → Timbrature Giornaliere →
Storico Accumulo → Archiviazione → Ex Dipendenti → Eliminazione
```

### 📱 Frontend State Management

#### Modali State
```javascript
// Pattern per gestione modali
window.apriModal = (tipo) => document.getElementById(`modal${tipo}`).style.display = "flex";
window.chiudiModal = (tipo) => document.getElementById(`modal${tipo}`).style.display = "none";
```

#### URL Parameters
```javascript
// Storico dipendente
const urlParams = new URLSearchParams(window.location.search);
const pin = urlParams.get("pin"); // Da utenti.html

// Navigation pattern
window.location.href = `storico.html?pin=${pin}`;
```

### 🎯 Performance Metrics

#### Target Performance
- **Page Load**: < 2s su 3G
- **Database Query**: < 500ms
- **File Export**: < 5s per 1 anno dati
- **Mobile Response**: < 100ms touch feedback

#### Monitoring Points
```javascript
// Performance logging
console.time('pagina-load');
// ...operazione...
console.timeEnd('pagina-load');

// Database performance
console.time('query-timbrature');
const data = await recuperaTimbrature(pin, start, end);
console.timeEnd('query-timbrature');
```

```

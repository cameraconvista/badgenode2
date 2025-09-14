# API Reference - PostgREST Endpoints

## Base Configuration

### Endpoint Base
```
URL: https://txmjqrnitfsiytbytxlc.supabase.co/rest/v1/
Authorization: Bearer [SUPABASE_ANON_KEY]
Content-Type: application/json
```

### Headers Standard
```javascript
{
  'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  'Content-Type': 'application/json',
  'Prefer': 'return=representation' // Per INSERT/UPDATE con risposta
}
```

## Endpoints Principali

### Gestione Utenti

#### GET `/utenti` - Lista Dipendenti Attivi
```javascript
// Tutti gli utenti attivi
GET /utenti?attivo=eq.true&order=cognome.asc,nome.asc

// Utente specifico per PIN
GET /utenti?pin=eq.1234&select=*

// Solo campi necessari
GET /utenti?select=pin,nome,cognome,ore_contrattuali
```

**Parametri Comuni**:
- `attivo=eq.true` - Solo dipendenti attivi
- `order=cognome.asc` - Ordinamento per cognome
- `select=pin,nome,cognome` - Campi specifici
- `limit=50` - Limitazione risultati

#### POST `/utenti` - Nuovo Dipendente
```javascript
POST /utenti
{
  "pin": 1234,
  "nome": "Mario",
  "cognome": "Rossi", 
  "ore_contrattuali": 160,
  "attivo": true
}
```

#### PATCH `/utenti` - Modifica Dipendente
```javascript
PATCH /utenti?pin=eq.1234
{
  "nome": "Mario",
  "cognome": "Rossi",
  "ore_contrattuali": 168
}
```

#### DELETE `/utenti` - Disattivazione (Soft Delete)
```javascript
PATCH /utenti?pin=eq.1234
{
  "attivo": false
}
```

### Gestione Timbrature

#### GET `/timbrature` - Storico Timbrature
```javascript
// Timbrature per dipendente e periodo
GET /timbrature?pin=eq.1234&data=gte.2025-09-01&data=lte.2025-09-30&order=data.asc,ore.asc

// Con JOIN anagrafica (vista ottimizzata)
GET /v_timbrature_utenti?pin=eq.1234&data=gte.2025-09-01&data=lte.2025-09-30

// Ultime timbrature
GET /timbrature?order=created_at.desc&limit=10
```

**Filtri Temporali**:
- `data=gte.2025-09-01` - Data maggiore/uguale
- `data=lte.2025-09-30` - Data minore/uguale  
- `created_at=gte.2025-09-15T00:00:00` - Timestamp specifico

#### POST `/timbrature` - Nuova Timbratura
```javascript
POST /timbrature
{
  "pin": 1234,
  "tipo": "entrata",
  "data": "2025-09-15",
  "ore": "08:30:00",
  "giornologico": "Domenica"
}
```

**Validazioni**:
- `tipo`: Solo 'entrata' o 'uscita'
- `data`: Formato YYYY-MM-DD
- `ore`: Formato HH:MM:SS
- `pin`: Deve esistere in tabella utenti

#### GET `/timbrature` - Query Avanzate
```javascript
// Timbrature per tipo
GET /timbrature?tipo=eq.entrata&data=eq.2025-09-15

// Aggregazioni (count)
GET /timbrature?pin=eq.1234&select=data&data=gte.2025-09-01&data=lte.2025-09-30

// Range orario
GET /timbrature?ore=gte.08:00:00&ore=lte.18:00:00
```

### Vista Ottimizzata

#### GET `/v_timbrature_utenti` - JOIN Timbrature + Anagrafica
```javascript
// Dati completi per export
GET /v_timbrature_utenti?pin=eq.1234&data=gte.2025-09-01&data=lte.2025-09-30&select=*

// Campi specifici per performance
GET /v_timbrature_utenti?select=pin,nome,cognome,data,ore,tipo&pin=eq.1234
```

**Vantaggi**:
- ✅ Singola query invece di 2 separate
- ✅ Riduce round-trip API
- ✅ Dati completi per report/export

### Ex-Dipendenti

#### GET `/ex_dipendenti` - Archivio Cessati
```javascript
// Lista ex-dipendenti
GET /ex_dipendenti?order=data_cessazione.desc

// Ricerca per nome
GET /ex_dipendenti?or=(nome.ilike.*mario*,cognome.ilike.*mario*)
```

#### POST `/ex_dipendenti` - Archiviazione
```javascript
POST /ex_dipendenti
{
  "pin": 1234,
  "nome": "Mario",
  "cognome": "Rossi",
  "ore_contrattuali": 160,
  "data_cessazione": "2025-09-15",
  "motivo_cessazione": "Dimissioni volontarie"
}
```

## Query Patterns Comuni

### Filtri PostgREST

#### Operatori di Confronto
```javascript
// Uguaglianza
?pin=eq.1234

// Maggiore/Minore
?data=gte.2025-09-01  // >=
?data=lte.2025-09-30  // <=
?data=gt.2025-09-01   // >
?data=lt.2025-09-30   // <

// Pattern matching
?nome=ilike.*mario*   // ILIKE '%mario%'
?cognome=like.Ros*    // LIKE 'Ros%'

// IN / NOT IN
?pin=in.(1234,5678)
?tipo=not.in.(test)
```

#### Operatori Logici
```javascript
// AND (default)
?pin=eq.1234&attivo=eq.true

// OR
?or=(pin.eq.1234,pin.eq.5678)
?or=(nome.ilike.*mario*,cognome.ilike.*mario*)

// NOT
?not.attivo=eq.false  // attivo != false
```

### Ordinamento e Paginazione
```javascript
// Ordinamento
?order=cognome.asc,nome.asc
?order=created_at.desc

// Paginazione
?limit=50&offset=0    // Prima pagina
?limit=50&offset=50   // Seconda pagina

// Range header (alternativa)
Headers: { 'Range': '0-49' }  // Primi 50 record
```

### Selezione Campi
```javascript
// Campi specifici
?select=pin,nome,cognome

// Campi rinominati
?select=pin,full_name:nome||' '||cognome

// Aggregazioni
?select=pin,count:id.count()

// JOIN con altre tabelle (se configurato)
?select=*,utenti(nome,cognome)
```

## Esempi Pratici

### Caricamento Pagina Storico
```javascript
// 1. Carica lista utenti per dropdown
const utenti = await supabase
  .from('utenti')
  .select('pin,nome,cognome')
  .eq('attivo', true)
  .order('cognome', { ascending: true });

// 2. Carica timbrature per utente e periodo
const timbrature = await supabase
  .from('v_timbrature_utenti')
  .select('*')
  .eq('pin', selectedPin)
  .gte('data', startDate)
  .lte('data', endDate)
  .order('data', { ascending: true })
  .order('ore', { ascending: true });
```

### Inserimento Timbratura
```javascript
// Validazione utente esistente
const { data: utente } = await supabase
  .from('utenti')
  .select('pin,nome,cognome')
  .eq('pin', inputPin)
  .eq('attivo', true)
  .single();

if (!utente) throw new Error('PIN non valido');

// Inserimento timbratura
const { data, error } = await supabase
  .from('timbrature')
  .insert({
    pin: inputPin,
    tipo: tipoTimbratura,
    data: new Date().toISOString().split('T')[0],
    ore: new Date().toTimeString().split(' ')[0],
    giornologico: giornoSettimana
  })
  .select();
```

### Export Dati Completi
```javascript
// Dati per export PDF/Excel
const exportData = await supabase
  .from('v_timbrature_utenti')
  .select(`
    pin,nome,cognome,ore_contrattuali,
    data,ore,tipo,giornologico
  `)
  .eq('pin', selectedPin)
  .gte('data', startDate)
  .lte('data', endDate)
  .order('data', { ascending: true });
```

## Error Handling

### Codici Errore PostgREST
```javascript
// Gestione errori standardizzata
switch(error.code) {
  case 'PGRST116':
    return 'Nessun dato trovato';
  case '23505':
    return 'PIN già esistente';
  case '23503':
    return 'Dipendente non trovato';
  case 'PGRST301':
    return 'Violazione vincoli database';
  default:
    return error.message || 'Errore di sistema';
}
```

### Retry Logic
```javascript
async function apiCallWithRetry(apiCall, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await apiCall();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
}
```

## Performance Tips

### Ottimizzazioni Query
- ✅ **Usa select specifici**: Evita `select=*` quando non necessario
- ✅ **Filtra sempre**: Non caricare mai tutte le righe senza filtri
- ✅ **Ordina lato server**: Usa `order=` invece di sort JavaScript
- ✅ **Pagina i risultati**: Usa `limit=` per dataset grandi
- ✅ **Usa viste ottimizzate**: Preferisci `v_timbrature_utenti` per JOIN

### Caching Strategy
```javascript
// Cache in-memory per dati statici
const utentiCache = new Map();

async function getUtenti() {
  if (utentiCache.has('active')) {
    return utentiCache.get('active');
  }
  
  const utenti = await supabase.from('utenti')...;
  utentiCache.set('active', utenti);
  
  // Invalida cache dopo 5 minuti
  setTimeout(() => utentiCache.delete('active'), 300000);
  
  return utenti;
}
```

---

*Documentazione aggiornata: Settembre 2025*


# FEATURES_MANUAL.md

## Manuale Funzionalità BADGEBOX

### 🏠 Homepage - Sistema Timbrature (index.html)

#### Interfaccia Principale
**Layout**: Tastiera numerica 3x4 + display PIN + pulsanti azione

**Componenti**:
- **Display PIN**: Mostra PIN inserito (max 2 cifre)
- **Keypad**: Numeri 1-9, 0, C (cancella), ← (backspace)  
- **Azioni**: ENTRATA (verde) / USCITA (rossa)
- **Info**: Data/ora in tempo reale, messaggi status

#### Funzionalità Timbrature
```javascript
// Processo timbratura implementato:
PIN Input → Validazione → Controllo Dipendente Esistente →
Verifica Anti-Duplicazione → Registrazione Database →
Feedback Visuale con Orario
```

**Validazioni Attive**:
- PIN numerico 1-99
- Dipendente deve esistere in tabella `utenti`
- Max 1 ENTRATA + 1 USCITA per giorno
- Giorno logico 8:00-5:00 (timbrature 00:00-04:59 → giorno precedente)

**PIN Speciale Admin**:
- **1909**: Accesso diretto gestione dipendenti (`utenti.html`)

### 👥 Gestione Dipendenti (utenti.html)

#### Lista Dipendenti Attivi
**Visualizzazione**: Tabella con PIN, Nome, Cognome, Azioni

**Azioni per Riga**:
- **✏️ Modifica**: Modal dettagli completo dipendente
- **📦 Archivia**: Backup completo + spostamento archivio
- **❌ Elimina**: Eliminazione definitiva con conferma

#### Modal Nuovo Dipendente
**Campi Obbligatori**:
- PIN (numerico 1-99, univoco)
- Nome, Cognome

**Campi Opzionali**:
- Email, Telefono
- Descrizione contratto
- Ore contrattuali (default: 8.00)
- Upload file (CV, documenti - max 5MB)

#### Modal Modifica Dipendente  
**Features**:
- Pre-compilazione dati esistenti
- Modifica tutti i campi
- Nuovo upload file (sostituisce precedente)
- Validazione real-time

#### Archiviazione Automatica
**Processo implementato**:
```javascript
// 1. Recupera dati completi dipendente + timbrature
// 2. Genera Excel con storico completo
// 3. Calcola statistiche finali (ore totali, giorni lavorati)
// 4. Inserisce in dipendenti_archiviati
// 5. Elimina da utenti (libera PIN)
// 6. Conferma con dettagli operazione
```

**Output Excel Include**:
- Dati anagrafici completi
- Storico timbrature completo
- Calcoli ore giornaliere
- Statistiche riassuntive

### 🗂️ Archivio Ex Dipendenti (ex-dipendenti.html)

#### Visualizzazione Archivio
**Tabella**: Nome, Cognome, Data Archiviazione, Azioni

**Azioni Disponibili**:
- **💾 Scarica Excel**: Download del file generato durante archiviazione
- **❌ Elimina Definitivo**: Rimozione completa da database (irreversibile)

**Navigazione**:
- **← Torna ai Dipendenti**: Return to `utenti.html`

**Nota Importante**: 
- **Rimossa funzione "Ripristina"**: Ex dipendenti non possono essere ripristinati
- **PIN liberato**: Disponibile per nuovi dipendenti

### 📊 Storico Timbrature (storico.html)

#### Accesso alla Pagina
**URL Pattern**: `storico.html?pin=XX` (da link in `utenti.html`)

#### Filtri Temporali
**Opzioni Predefinite**:
- **Mese Corrente**: Dal 1° del mese ad oggi
- **Mese Precedente**: Mese completo precedente
- **Personalizzato**: Range date libero

**Calendario Popup**:
- Click su icona 📅 → Calendario interattivo
- Navigazione mese/anno
- Evidenziazione giorno corrente
- Selezione rapida data

#### Tabella Timbrature
**Colonne**:
- **Data**: Formato italiano DD/MM/YYYY
- **Entrata**: Orario prima timbratura ENTRATA
- **Uscita**: Orario ultima timbratura USCITA  
- **Ore Giornaliere**: Calcolo automatico Uscita - Entrata
- **Azioni**: Modifica ✏️ ed Elimina 🗑️

**Calcoli Automatici**:
- **Ore giorno**: Differenza tra prima entrata e ultima uscita
- **Totale mensile**: Somma ore di tutti i giorni del periodo
- **Giorni lavorati**: Conta giorni con timbrature

#### Modifica Timbrature
**Modal Modifica**:
- **Data**: Picker con validazione
- **Ora**: Input time con format HH:MM
- **Tipo**: Select ENTRATA/USCITA
- **Azioni**: Salva modifiche, Elimina record

**Validazioni**:
- Data non futura
- Ora formato valido
- Tipo timbratura coerente

#### Export e Condivisione

##### 📄 Esportazione PDF  
**Features implementate**:
- Header aziendale "CAMERA CON VISTA Bistrot"
- Dati dipendente e periodo
- Tabella timbrature formattata
- Totale ore mensili
- Timestamp generazione
- Nome file: `Nome_Cognome_timbrature_YYYY-MM-DD_YYYY-MM-DD.pdf`

##### 📊 Esportazione Excel
**Features implementate**:
- Lazy loading libreria SheetJS (performance)
- Header informativo completo
- Dati tabellari con formattazione
- Colonne auto-sized
- Nome file: `Nome_Cognome_timbrature_YYYY-MM-DD_YYYY-MM-DD.xlsx`

##### 📱 Condivisione WhatsApp
**Format implementato**:
```
CAMERA CON VISTA Bistrot

*RIEPILOGO MENSILE:*

👤 *Nome Cognome* (PIN: XX)
📅 Periodo: dal DD/MM/YYYY al DD/MM/YYYY

Ore totali: XX.XX

DETTAGLIO TIMBRATURE

Data      Entrata    Uscita
01/01/24  09:00      17:30
02/01/24  08:30      18:00
...
```

### 🎛️ Funzionalità Avanzate

#### Sistema Anti-Duplicazione
**Implementazione**:
- Constraint database: `UNIQUE(pin, data, tipo)`
- Check frontend prima dell'invio
- Messaggio specifico: "ENTRATA già registrata oggi alle HH:MM"

**Business Logic**:
```javascript
// Verifica ultima timbratura stesso giorno
const ultimaTimbratura = timbratureOggi[timbratureOggi.length - 1];
if (ultimaTimbratura && ultimaTimbratura.tipo === tipo) {
  alert(`${tipo} già registrata oggi alle ${ultimaTimbratura.ore}`);
  return;
}
```

#### Calendario Dinamico
**Features**:
- **Popup positioning**: Dinamico vicino all'icona
- **Navigazione**: Mesi/anni con frecce
- **Selezione**: Click su giorno
- **Evidenziazione**: Giorno corrente e selezionato
- **Responsive**: Adatta a screen size
- **Z-index management**: Overlay corretto

#### Upload File Intelligente
**Implementato in modali dipendenti**:
- **Drag & Drop**: Area di rilascio file
- **Click to browse**: Input file nascosto
- **Preview**: Nome file e dimensione
- **Validation**: Tipo file e size limit
- **Remove**: Pulsante rimozione file selezionato

### 📱 Ottimizzazioni Mobile

#### PWA Features Implementate
**Manifest**:
```json
{
  "name": "BADGEBOX - Camera con Vista",
  "short_name": "BADGEBOX",
  "display": "standalone",
  "orientation": "portrait-primary",
  "theme_color": "#1a365d",
  "background_color": "#0f172a"
}
```

**Install Prompts**:
- Browser automatici (Chrome, Safari)
- Add to Home Screen supportato
- Icone ottimizzate multi-risoluzione

#### Responsive Design
**Breakpoints implementati**:
```css
/* Mobile first approach */
@media (max-width: 360px) {
  /* Ultra small mobile - Keypad 55px buttons */
}

@media (min-width: 361px) and (max-width: 480px) {
  /* Standard mobile - Keypad 75px buttons */  
}

@media (min-width: 481px) and (max-width: 768px) {
  /* Large mobile/small tablet */
}

@media (orientation: landscape) and (max-height: 600px) {
  /* Landscape mobile ottimizzato */
}
```

### 🔧 Configurazioni Sistema

#### Vite Dev Server
**Configurazione attiva**:
- **Porta**: 5173 (standard Vite)
- **Host**: 0.0.0.0 (accessibile esternamente)  
- **HMR**: WebSocket Secure (WSS) per HTTPS compatibility
- **Hot reload**: Automatico per HTML/CSS/JS

#### Database Performance
**Indici implementati**:
```sql
-- Query timbrature per dipendente/periodo (storico.html)
CREATE INDEX idx_timbrature_pin_data ON timbrature(pin, data);

-- Ricerche per PIN (tutte le pagine)
CREATE UNIQUE INDEX idx_utenti_pin ON utenti(pin);

-- Ordinamento archivio per data  
CREATE INDEX idx_archiviati_data ON dipendenti_archiviati(data_archiviazione DESC);
```

### 🎯 User Experience Features

#### Feedback Visuale Implementato
```javascript
// ✅ Loading states per operazioni async
btn.textContent = "Generando Excel...";
btn.disabled = true;

// ✅ Success/Error messages
alert(`✅ Dipendente ${nome} ${cognome} archiviato con successo!`);

// ✅ Console logging per debug
console.log(`✅ Archiviazione completata per PIN ${pin}:`);
console.log(`   • Nome: ${nome} ${cognome}`);
console.log(`   • Timbrature archiviate: ${count}`);
```

#### Navigazione Fluida
**Pattern implementato**:
- **Back buttons**: "Torna ai Dipendenti", "Torna Utenti"
- **Deep linking**: URL con parametri per storico
- **Breadcrumb**: Visual feedback posizione corrente

#### Touch Optimizations
```css
/* ✅ Touch targets implementati */
.keypad-button {
  min-width: 44px;   /* Apple HIG minimum */
  min-height: 44px;
  font-size: 22px;   /* Leggibile su mobile */
}

/* ✅ Touch feedback */
.action-button:active {
  transform: scale(0.95);
  transition: transform 0.1s;
}
```

### 🔄 Data Lifecycle Management

#### Flusso Completo Dipendente
```
1. Creazione → utenti.html (Modal nuovo)
2. Timbrature → index.html (Keypad + azioni)  
3. Storico → storico.html (Visualizzazione + export)
4. Archiviazione → utenti.html (Backup + trasferimento)
5. Archivio → ex-dipendenti.html (Consultazione + export)
6. Eliminazione → ex-dipendenti.html (Rimozione definitiva)
```

#### Gestione PIN
**Sistema implementato**:
- **Range**: 1-99 (99 dipendenti max)
- **Univocità**: Constraint database
- **Liberazione**: Automatica durante archiviazione
- **Riutilizzo**: PIN disponibile immediatamente per nuovi dipendenti

#### Data Retention
**Policy implementata**:
- **Timbrature attive**: Conservate indefinitamente
- **Dipendenti archiviati**: Backup permanente con Excel
- **File upload**: Conservati fino eliminazione dipendente

### 🎨 UI/UX Design System

#### Color Scheme Implementato
```css
/* Dark theme applicato */
--bg-primary: #0f172a;      /* Background principale */
--bg-secondary: #1e293b;    /* Background cards */
--accent-blue: #3b82f6;     /* Accenti e pulsanti */
--accent-green: #10b981;    /* Successo e ENTRATA */
--accent-red: #ef4444;      /* Errori e USCITA */
--border-color: #334155;    /* Bordi e separatori */
```

#### Typography Scale
```css
/* Font system implementato */
font-family: 'Segoe UI', system-ui, sans-serif;

h1: 28px / bold     /* Titoli pagina */
h2: 20px / semibold /* Sezioni */
body: 16px / normal /* Testo standard */
small: 14px / normal /* Helper text */
.pin-display: 32px / monospace /* PIN display */
```

#### Component Library
**Buttons**:
- `.action-button`: Pulsanti principali (48px height)
- `.keypad-button`: Tastiera numerica (responsive size)
- `.modal-button`: Pulsanti modali (standard height)

**Modals**:
- `.modal-overlay`: Backdrop semi-trasparente
- `.modal-content`: Container centrato responsive
- `.modal-header`: Titolo con X chiusura

**Tables**:
- `.responsive-table`: Scroll orizzontale mobile
- `.table-actions`: Pulsanti azione ottimizzati touch

### 🔧 Configurabilità Sistema

#### Parametri Personalizzabili
```javascript
// Facilmente modificabili nel codice:
const PIN_ADMIN = "1909";              // PIN accesso gestione
const MAX_FILE_SIZE = 5 * 1024 * 1024; // Limite upload file
const ORE_CONTRATTUALI_DEFAULT = 8.00; // Default ore contratto
const GIORNO_LOGICO_CUTOFF = "05:00";  // Cutoff giorno lavorativo
```

#### Customizzazione Business
**Intestazione Aziendale** (PDF/Excel):
```javascript
// Modificabile in storico-logic.js
doc.text("CAMERA CON VISTA Bistrot", 105, 20, { align: "center" });

// WhatsApp template
const messaggio = `CAMERA CON VISTA Bistrot\n\n*RIEPILOGO MENSILE:*\n\n...`;
```

### 🎛️ Amministrazione Sistema

#### Gestione Dati via Browser
**Console Commands** (per admin):
```javascript
// Reset dipendente test
await supabaseClient.from('timbrature').delete().eq('pin', 99);

// Backup dati specifici
const backup = await supabaseClient.from('utenti').select('*');
console.log('Backup utenti:', backup.data);

// Statistiche sistema
const stats = await Promise.all([
  supabaseClient.from('utenti').select('*', { count: 'exact', head: true }),
  supabaseClient.from('timbrature').select('*', { count: 'exact', head: true }),
  supabaseClient.from('dipendenti_archiviati').select('*', { count: 'exact', head: true })
]);
console.log('Statistiche:', stats.map(s => s.count));
```

#### Monitor Performance
```javascript
// Built-in performance logging
console.time('operazione');
await operazioneComplessa();
console.timeEnd('operazione');

// Memory usage tracking (DevTools)
console.log('Memory:', performance.memory);
```

### 🚀 Features Avanzate

#### Offline Capability (Preparato)
**Struttura per future implementazione**:
- Service Worker configurabile
- IndexedDB per cache locale  
- Sync queue per operazioni offline

#### Real-time Updates (Preparato)
**Supabase Subscriptions**:
```javascript
// TODO: Real-time notifications
const channel = supabaseClient
  .channel('timbrature-live')
  .on('postgres_changes', 
    { event: 'INSERT', schema: 'public', table: 'timbrature' },
    (payload) => {
      // Update UI in tempo reale
      console.log('🔔 Nuova timbratura:', payload.new);
    }
  );
```

#### Backup Automatico
**Script `backup-current-system.js`**:
- Backup configurazioni sistema
- Export stato database
- Archivio timestampato
- Restore instructions

### 📊 Analytics e Reporting

#### Dashboard Metrics (Implementabile)
```javascript
// Statistiche business implementabili
async function generateDashboard() {
  const oggi = new Date().toISOString().split('T')[0];
  
  const dipendentiAttivi = await supabaseClient.from('utenti').select('count');
  const timbratureOggi = await supabaseClient
    .from('timbrature')
    .select('count')
    .eq('data', oggi);
    
  return {
    dipendentiAttivi: dipendentiAttivi.count,
    timbratureOggi: timbratureOggi.count
  };
}
```

#### Export Analytics
**Tracking implementato**:
```javascript
// Log automatico export operations
console.log(`📊 Export Excel: ${nomeFile}`);
console.log(`📄 Export PDF: ${nomeFile}`);  
console.log(`📱 Share WhatsApp per PIN ${pin}`);
```

### 🎯 Limitazioni e Constraint

#### Limitazioni Correnti
- **Dipendenti massimi**: 99 (limitazione PIN 2 cifre)
- **File upload**: 5MB per dipendente
- **Offline**: Non implementato (online-only)
- **Multi-tenant**: Singola organizzazione

#### Constraint Database
```sql
-- Implementati e attivi
CHECK (pin >= 1 AND pin <= 99)           -- Range PIN
CHECK (tipo IN ('ENTRATA', 'USCITA'))    -- Tipi timbratura
UNIQUE(pin, data, tipo)                   -- Anti-duplicazione
```

### 🔮 Roadmap Features

#### Prossimi Sviluppi
1. **Service Worker**: Offline capability
2. **Real-time**: Live updates timbrature
3. **Dashboard**: Statistiche e analytics
4. **Multi-tenant**: Supporto multiple aziende
5. **API REST**: Endpoint per integrazioni esterne

#### Miglioramenti UX
1. **Notifiche push**: Reminder timbrature
2. **Geolocalizzazione**: Validazione posizione timbratura  
3. **Biometric**: Touch ID/Face ID per sicurezza
4. **Voice commands**: Comandi vocali per accessibility

```

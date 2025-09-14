
# GOVERNANCE.md

## Governance e Qualità del Codice - BADGEBOX

### 📋 Standards di Qualità Implementati

#### Naming Conventions Attive
```javascript
// ✅ Funzioni: camelCase descrittivo implementato
async function caricaUtentiAttivi() {}
window.archiviaUtente = (pin) => {}
async function recuperaTimbrature(pin, dataInizio, dataFine) {}

// ✅ Variabili: camelCase significativo
const nomeCompleto = `${dipendente.nome} ${dipendente.cognome}`;
const dataFormattata = new Date().toLocaleDateString('it-IT');
const urlParams = new URLSearchParams(window.location.search);

// ✅ Costanti: UPPERCASE_SNAKE_CASE
const PIN_ADMIN = "1909";
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

// ✅ ID HTML: kebab-case implementato
<div id="lista-dipendenti"></div>
<button id="btn-esporta"></button>
<div id="modalNuovoDipendente"></div>
<tbody id="storico-body"></tbody>
```

#### Database Schema Standards Implementati
```sql
-- ✅ Tabelle: snake_case plurale
CREATE TABLE dipendenti_archiviati;
CREATE TABLE timbrature;

-- ✅ Campi: snake_case descrittivo
ore_contrattuali DECIMAL(4,2)
data_archiviazione TIMESTAMP
file_excel_path TEXT
descrizione_contratto TEXT

-- ✅ Relazioni: PIN come chiave naturale
pin INTEGER REFERENCES utenti(pin)
```

### 🔍 Code Quality Rules Applicate

#### JavaScript Best Practices Implementate
```javascript
// ✅ Async/Await pattern standard
export async function recuperaTimbrature(pin, dataInizio, dataFine) {
  try {
    const { data, error } = await supabaseClient
      .from("timbrature")
      .select("*")
      .eq("pin", parseInt(pin))
      .gte("data", dataInizio)
      .lte("data", dataFine)
      .order("data", { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Errore recupero timbrature:", error);
    throw error;
  }
}

// ✅ Destructuring Supabase implementato
const { data: utenti, error: errorUtenti } = await supabase
  .from("utenti")
  .select("*");

// ✅ Validazioni input esplicite
if (!nome || !cognome || !oreContrattuali) {
  alert("Compila tutti i campi obbligatori");
  return;
}

// ✅ Error handling specifico
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

#### Module Organization Implementata
```javascript
// ✅ Separation of Concerns applicata
calendar-utils.js     // Solo utilità calendario e date
timbrature-data.js    // Solo operazioni CRUD timbrature
timbrature-render.js  // Solo rendering HTML e calcoli display
storico-logic.js      // Orchestrazione pagina + event handling
supabase-client.js    // Database client + error utilities

// ✅ Import/Export pattern standard
export { aggiungiOpzionePersonalizzato, aggiornaRange };
import { caricaDati, pulisciCache } from './timbrature-data.js';
import { renderizzaTabella } from './timbrature-render.js';
```

#### HTML Structure Standards Implementati
```html
<!-- ✅ Semantic HTML applicato -->
<main class="container">
  <header>
    <h1 id="intestazione">Storico Timbrature</h1>
  </header>
  
  <section class="filters-section">
    <select id="filtro-mese">
      <option value="corrente">Mese Corrente</option>
      <option value="precedente">Mese Precedente</option>
    </select>
  </section>
  
  <section class="data-section">
    <table>
      <tbody id="storico-body"></tbody>
    </table>
  </section>
</main>

<!-- ✅ Accessibilità implementata -->
<button 
  title="Archivia dipendente"
  onclick="archiviaUtente('${pin}')"
  style="background: none; border: none; font-size: 20px;"
>
  📦
</button>

<!-- ✅ Form validation attiva -->
<input 
  type="number" 
  required
  min="1" 
  max="99"
  placeholder="PIN (1-99)"
  id="nuovo-pin"
>
```

### 📐 Architecture Guidelines Applicate

#### Separation of Concerns Implementata
```
Frontend (HTML)           →  Presentation Layer
  ├── index.html         →  Timbrature interface
  ├── utenti.html        →  CRUD dipendenti  
  ├── storico.html       →  Data visualization
  └── ex-dipendenti.html →  Archive management

Scripts (JS)              →  Business Logic Layer  
  ├── supabase-client.js →  Database abstraction
  ├── timbrature-data.js →  Data operations
  ├── storico-logic.js   →  Page orchestration
  └── calendar-utils.js  →  Date utilities

Supabase                  →  Data Persistence Layer
  ├── utenti            →  Active employees
  ├── timbrature        →  Time records
  └── dipendenti_archiviati → Archive
```

#### Module Communication Pattern
```javascript
// ✅ Unidirezionale data flow
HTML Event → Logic Script → Data Module → Supabase → 
Response → Render Module → DOM Update

// Esempio implementato:
// storico.html click → storico-logic.js → timbrature-data.js → 
// supabase → timbrature-render.js → DOM update
```

### 🔄 File Management Rules Implementate

#### Rotazione e Backup Attivi
```bash
# ✅ Backup pre-modifica implementato
npm run esegui-backup
# Genera backup timestampato con configurazioni

# ✅ Versioning pattern
git add . && git commit -m "feat: eliminazione pulsante ripristina dipendente"
git add . && git commit -m "fix: correzione WebSocket WSS per HTTPS"
```

#### File Organization Attuale
```
✅ Moduli organizzati:     assets/scripts/*.js
✅ Stili separati:        assets/styles/*.css  
✅ Icone ottimizzate:     assets/icons/*.png + public/assets/icons/*.png
✅ Docs centralizzate:    *.md nella root
✅ Config separate:       .github-config.json, netlify.toml
✅ Icon paths standard:   SEMPRE /assets/icons/ (slash iniziale obbligatorio)
```

#### CRITICAL Standards - Icon Paths
```
❌ NEVER USE: src="assets/icons/file.png"
✅ ALWAYS USE: src="/assets/icons/file.png"

Motivo: Vite dev server serve solo da public/ con percorsi assoluti
Violazione causa: Icone invisibili in development, funzionanti solo in production
```

#### Size Limits Implementati
- **HTML/CSS/JS**: Sotto 500KB (✅ rispettato)
- **Icone**: Ottimizzate < 200KB (✅ rispettato)
- **Upload utente**: 5MB limit implementato nel codice

### 🧪 Testing Standards Applicati

#### Manual Testing Checklist Corrente
```
✅ Timbratura entrata/uscita funzionante
✅ Validazione anti-duplicazione attiva (constraint DB)
✅ Responsive design mobile/tablet ottimizzato
✅ PWA installabile (manifest configurato)
✅ Export Excel/PDF completamente funzionanti
✅ Archiviazione dipendente completa (con Excel generato)
✅ Navigazione tra pagine fluida
✅ Calendario popup interattivo
✅ Modifica/eliminazione timbrature operative
✅ Gestione ex dipendenti (senza ripristino)
```

#### Error Handling Pattern Implementato
```javascript
// ✅ Pattern standard in tutti i moduli
async function operazioneDatabase() {
  const btn = document.getElementById("btn-azione");
  const originalText = btn.textContent;
  btn.textContent = "Elaborando...";
  btn.disabled = true;
  
  try {
    const { data, error } = await supabase.from('tabella').select();
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('❌ Errore operazione:', error);
    const messaggioUtente = gestisciErroreSupabase(error);
    alert('Errore: ' + messaggioUtente);
    throw error;
  } finally {
    btn.textContent = originalText;
    btn.disabled = false;
  }
}
```

### 📊 Performance Guidelines Implementate

#### Frontend Optimization Applicate
```javascript
// ✅ Lazy loading implementato
let XLSXLib = null;
document.getElementById("btn-esporta")?.addEventListener("click", async () => {
  if (!XLSXLib) {
    console.log('📥 Caricamento libreria Excel...');
    XLSXLib = await import("https://cdn.sheetjs.com/xlsx-0.20.0/package/xlsx.mjs");
  }
  // ... uso libreria
});

// ✅ Cache DOM queries
const tbody = document.getElementById("storico-body");
const selectFiltro = document.getElementById("filtro-mese");

// ✅ Event delegation per performance
document.addEventListener('click', (e) => {
  if (e.target.matches('.action-button')) {
    handleAction(e.target.dataset.action);
  }
});
```

#### Database Optimization Implementata
```sql
-- ✅ Indici per query frequenti attivi
CREATE INDEX idx_timbrature_pin_data ON timbrature(pin, data);
CREATE INDEX idx_utenti_pin ON utenti(pin);
CREATE INDEX idx_archiviati_data ON dipendenti_archiviati(data_archiviazione DESC);

-- ✅ Query ottimizzate implementate
SELECT * FROM timbrature 
WHERE pin = $1 AND data BETWEEN $2 AND $3
ORDER BY data, ore; -- Usa indice composto
```

### 🛡️ Security Standards Implementati

#### Frontend Security Attiva
```javascript
// ✅ Input sanitization implementata
function sanitizeInput(input) {
  return input?.toString().trim().replace(/[<>]/g, '') || '';
}

// ✅ PIN validation implementata
function validatePIN(pin) {
  const numPin = parseInt(pin);
  return numPin >= 1 && numPin <= 99;
}

// ✅ File validation implementata
function handleFile(file) {
  if (file.size > 5 * 1024 * 1024) {
    alert("File troppo grande. Massimo 5MB.");
    return;
  }
  // ...processing
}

// ✅ Admin PIN protection
if (pinInserito === "1909") {
  window.location.href = "utenti.html";
  return;
}
```

#### Database Security Implementata
- **✅ RLS attiva**: Row Level Security configurata su Supabase
- **✅ Constraints**: CHECK constraints per integrità PIN
- **✅ API Keys**: Solo anon key esposta (sicura per frontend)
- **✅ Unique constraints**: Prevenzione duplicati PIN

### 📝 Documentation Standards Implementati

#### Code Comments Pattern
```javascript
// ✅ Commenti funzionali implementati

// CALCOLO GIORNO LOGICO ESTESO (8:00-5:00)
// Se è tra 00:00 e 04:59, appartiene al giorno lavorativo precedente
const giornoLogico = ora < "05:00" ? 
  new Date(data.getTime() - 24*60*60*1000) : data;

// ✅ Documenta business rules
// Blocca timbrature consecutive dello stesso tipo
if (ultimoTipo === tipo) {
  alert(`${tipo} già registrata oggi alle ${ultimaOra}`);
  return;
}
```

#### Git Commit Messages Standard
```bash
# ✅ Implementati nel progetto
feat: eliminazione pulsante e funzione ripristina dipendente
fix: correzione WebSocket WSS per HTTPS compatibility  
style: miglioramento responsive mobile storico
docs: aggiornamento documentazione completa progetto
refactor: riorganizzazione moduli assets/scripts
```

### 🔄 Quality Assurance Process

#### Pre-Commit Checklist
```
□ Codice testato manualmente su tutte le pagine
□ Responsive verificato su mobile/tablet  
□ Console browser senza errori critici
□ Export PDF/Excel funzionanti
□ Database operations CRUD complete
□ PWA installability verificata
□ Performance accettabile (< 2s load)
□ Commit message descrittivo
```

#### Code Review Guidelines
```javascript
// ✅ Pattern da verificare sempre

// 1. Error handling completo
try {
  // operation
} catch (error) {
  console.error('❌ Errore:', error);
  // User feedback
} finally {
  // Cleanup sempre necessario
}

// 2. UI feedback per operazioni async
btn.disabled = true;
// async operation
btn.disabled = false;

// 3. Input validation esplicita
if (!input || !isValid(input)) {
  alert("Input non valido");
  return;
}
```

### 🛠️ Development Workflow Implementato

#### Replit Environment
```bash
# ✅ Workflow attivo: "Run Dev Server"
pkill -f "vite|node.*5173|npm.*dev" || true
sleep 2
npm run dev
# Server attivo su porta 5173 con HMR WSS
```

#### Local Development
```javascript
// ✅ Vite config ottimizzata
export default {
  server: {
    host: '0.0.0.0',
    port: 5173,
    hmr: {
      protocol: 'wss', // ✅ HTTPS compatibility
      host: '0.0.0.0'
    }
  }
}
```

### 📐 Architecture Enforcement

#### Module Boundaries Implementate
```
✅ Data Layer:
  supabase-client.js     → Database abstraction only
  timbrature-data.js     → CRUD operations only

✅ Business Layer:
  storico-logic.js       → Page orchestration + event handling
  calendar-utils.js      → Date manipulation utilities

✅ Presentation Layer:  
  timbrature-render.js   → HTML generation only
  storico-styles.css     → Visual styling only
```

#### Dependency Direction Enforced
```
HTML → Logic Scripts → Data Modules → Supabase
   ↑       ↑              ↑
   ↑       ↑              └── supabase-client.js
   ↑       └── calendar-utils.js, render modules  
   └── style.css, icons
```

### 🔍 Code Review Automation

#### ESLint Configuration (Proposta)
```json
{
  "extends": ["eslint:recommended"],
  "parserOptions": {
    "ecmaVersion": 2022,
    "sourceType": "module"
  },
  "rules": {
    "no-console": "warn",
    "prefer-const": "error",
    "no-var": "error",
    "camelcase": ["error", { "properties": "never" }],
    "async-await/space-after-async": "error"
  }
}
```

#### Pre-commit Hooks (Implementabili)
```bash
#!/bin/sh
# .git/hooks/pre-commit

# Backup automatico pre-commit
npm run esegui-backup

# Verifica sintassi JS
npm run lint

# Test quick suite
npm run test:quick
```

### 🧪 Testing Framework Implementato

#### Unit Testing Pattern
```javascript
// Test utilities in browser console
async function testModuloTimbrature() {
  console.log('🧪 Test modulo timbrature...');
  
  try {
    // Test recupero dati
    const data = await recuperaTimbrature(1, "2024-01-01", "2024-01-31");
    console.log('✅ Recupero dati:', data.length, 'records');
    
    // Test calcoli
    const ore = calcolaOreMensili(data);
    console.log('✅ Calcolo ore:', ore);
    
  } catch (error) {
    console.error('❌ Test fallito:', error);
  }
}
```

#### Integration Testing
```javascript
// Test completo workflow archiviazione
async function testArchiviazioneCompleta() {
  const testPIN = 98; // PIN di test
  
  console.time('archiviazione-completa');
  
  try {
    await archiviaUtente(testPIN);
    console.log('✅ Archiviazione completata');
  } catch (error) {
    console.error('❌ Archiviazione fallita:', error);
  } finally {
    console.timeEnd('archiviazione-completa');
  }
}
```

### 📊 Performance Monitoring Implementato

#### Frontend Metrics
```javascript
// ✅ Performance logging attivo
console.time('pagina-load');
// Load operations...
console.timeEnd('pagina-load');

// ✅ Lazy loading con monitoring
if (!XLSXLib) {
  console.log('📥 Caricamento libreria Excel...');
  const start = Date.now();
  XLSXLib = await import("...");
  console.log(`📦 Libreria caricata in ${Date.now() - start}ms`);
}
```

#### Database Performance
```javascript
// ✅ Query timing implementato
console.time('query-timbrature');
const timbrature = await recuperaTimbrature(pin, start, end);
console.timeEnd('query-timbrature');

console.log(`📊 Recuperate ${timbrature.length} timbrature`);
```

### 🔐 Security Enforcement Implementato

#### Input Validation Layer
```javascript
// ✅ Multi-layer validation implementata

// Frontend validation
const pin = parseInt(pinInput);
if (!validatePIN(pin)) {
  alert("PIN deve essere tra 1 e 99");
  return;
}

// Database constraints (ultima difesa)
CONSTRAINT pin_range CHECK (pin >= 1 AND pin <= 99)
```

#### Error Disclosure Rules
```javascript
// ✅ Safe error messages implementate
catch (error) {
  // Log completo per sviluppatori
  console.error('❌ Errore dettagliato:', error);
  
  // Messaggio utente filtrato
  const messaggioSicuro = gestisciErroreSupabase(error);
  alert(messaggioSicuro); // Non espone dettagli interni
}
```

### 📈 Maintenance Automation

#### Automated Cleanup (Da Implementare)
```javascript
// TODO: Script pulizia automatica
async function puliziaAutomatica() {
  // Rimuovi timbrature > 2 anni
  // Comprimi dati archiviati vecchi
  // Ottimizza indici database
  // Backup automatico mensile
}
```

#### Health Checks Implementabili
```javascript
async function healthCheck() {
  const checks = [
    () => supabaseClient.from('utenti').select('count', { count: 'exact' }),
    () => verificaConnessioni(),
    () => testPerformanceQuery()
  ];
  
  const risultati = await Promise.allSettled(checks.map(check => check()));
  return risultati;
}
```

### 🎯 Quality Gates

#### Definition of Done
```
✅ Funzionalità testata manualmente
✅ Responsive design verificato  
✅ Error handling implementato
✅ Console browser senza errori
✅ Performance accettabile
✅ Codice documentato
✅ Pattern architetturale rispettato
✅ Commit message descrittivo
```

#### Release Criteria
```
✅ Tutti i test manuali passano
✅ Backup sistema completato
✅ Database migrations applicate
✅ Documentazione aggiornata
✅ Performance benchmarks rispettati
✅ Security checklist completata
```

### 🔧 Tools Integration

#### Vite Development
- **✅ HMR**: Hot Module Replacement attivo
- **✅ ESM**: ES6 modules supportati nativamente
- **✅ WSS**: WebSocket sicuro per HTTPS

#### Supabase Dashboard
- **✅ Real-time monitoring**: Query performance
- **✅ Error tracking**: Log errors automatico
- **✅ Schema visualization**: ERD database

#### Browser DevTools
- **✅ Console logging**: Pattern standardizzato
- **✅ Network monitoring**: API calls tracking
- **✅ Application tab**: PWA manifest verification

```


# SCRIPTS_OVERVIEW.md

## Overview Script e Moduli - BADGEBOX

### 📁 assets/scripts/ - Moduli JavaScript Principali

#### 🗓️ calendar-utils.js
**Funzione**: Gestione utilità calendario e range date

**Funzioni Esportate**:
```javascript
export function aggiungiOpzionePersonalizzato(selectElement)
// Aggiunge opzione "Personalizzato" al select filtro

export function aggiornaRange(periodo, campoInizio, campoFine)
// Aggiorna range date basato su periodo predefinito
// Periodi: 'corrente', 'precedente', 'personalizzato'
```

**Utilizzo**:
- Pagina storico per filtri temporali
- Sincronizzazione input date con select predefiniti

#### 📅 calendario-popup.js
**Funzione**: Calendario interattivo popup per selezione date

**Classe Principale**:
```javascript
class CalendarioPopup {
  constructor() // Inizializza calendario
  mostra(campo, iconaElemento) // Mostra popup vicino icona
  nascondi() // Chiude calendario
  creaCalendario() // Genera HTML calendario
  impostaData(data) // Imposta data selezionata
  aggiornaCalendario() // Refresh vista calendario
}
```

**Features**:
- Navigazione mese/anno
- Evidenziazione giorno corrente
- Selezione data con click
- Posizionamento dinamico
- Responsive design

#### ✏️ modale-modifica.js
**Funzione**: Gestione modal modifica/eliminazione timbrature

**Funzioni Principali**:
```javascript
function apriModaleModifica(timbratura)
// Apre modal con dati precompilati

async function salvaModifiche()
// Salva modifiche timbratura su Supabase

async function eliminaTimbratura()
// Elimina timbratura con conferma
```

**Validazioni**:
- Data/ora format checking
- Tipo timbratura (ENTRATA/USCITA)
- Conferma eliminazione

#### 📊 storico-logic.js
**Funzione**: Logica business completa pagina storico

**Componenti Principali**:
- **Gestione dati**: Caricamento utente + timbrature
- **Filtri**: Event listeners per range date
- **Export PDF**: Generazione PDF con jsPDF
- **Export Excel**: Esportazione con SheetJS (lazy loading)
- **WhatsApp**: Share formattato per mobile
- **Navigazione**: Torna a utenti.html

**Pattern Implementato**:
```javascript
// Lazy loading libreria Excel
let XLSXLib = null;
if (!XLSXLib) {
  XLSXLib = await import("https://cdn.sheetjs.com/xlsx-0.20.0/package/xlsx.mjs");
}
```

#### 🔗 supabase-client.js
**Funzione**: Client Supabase configurato + utilities

**Exports**:
```javascript
export const supabaseClient // Client configurato
export function gestisciErroreSupabase(error) // Error handling standard
export async function recuperaTimbrature(pin, start, end) // Query ottimizzata
export async function recuperaUtente(pin) // Single user query
```

**Configurazione**:
- URL: `https://txmjqrnitfsiytbytxlc.supabase.co`
- Anon Key: Configurata e funzionante
- Error handling mapping per codici Supabase

#### 📋 timbrature-data.js
**Funzione**: CRUD operations per timbrature

**Funzioni Principali**:
```javascript
export async function caricaDati(pin, dataInizio, dataFine)
// Carica dipendente + timbrature range

export async function salvaTimbratura(pin, data, ora, tipo)
// Insert nuova timbratura con validazioni

export async function aggiornaTimbratura(id, nuoviDati)
// Update timbratura esistente

export async function eliminaTimbratura(id)
// Delete timbratura

export function pulisciCache()
// Utility pulizia cache locale
```

#### 🎨 timbrature-render.js
**Funzione**: Rendering HTML tabelle timbrature

**Funzioni**:
```javascript
export function renderizzaTabella(dipendente, timbrature, dataInizio, dataFine, tbody, footerTbody, pin)
// Rendering completo tabella con calcoli

export function calcolaOreMensili(timbrature)
// Calcolo totale ore periodo

export function raggruppaPerGiorno(timbrature)
// Raggruppa timbrature per giorno logico

export function calcolaOreGiornaliere(timbratureGiorno)
// Calcola ore singolo giorno
```

**Output**:
- Tabella HTML formattata
- Totali calcolati
- Event listeners per modifica

### 📁 Root Scripts - Utilities Sistema

#### 🔄 backup-current-system.js
**Funzione**: Backup configurazioni e stato sistema

**Caratteristiche**:
- Backup file configurazione
- Export stato database
- Archivio timestampato
- Restore instructions

#### 📦 create-zip.js
**Funzione**: Creazione archivio completo progetto

**Output**:
- ZIP con tutti i file sorgente
- Esclusione node_modules e cache
- Documentazione inclusa
- Deploy-ready package

#### 🔧 upgrade.sh
**Funzione**: Script aggiornamento versioni

**Operazioni**:
- Update dipendenze npm
- Patch sicurezza
- Database migrations
- Backup pre-upgrade

### 🎯 Pattern di Utilizzo Scripts

#### Import Pattern
```javascript
// Standard import per moduli assets/scripts/
import { funzione1, funzione2 } from './calendar-utils.js';
import { caricaDati } from './timbrature-data.js';
```

#### Error Handling Pattern
```javascript
try {
  const result = await operazioneDatabase();
  // Success logic
} catch (error) {
  console.error('❌ Errore:', error);
  const errorMessage = gestisciErroreSupabase(error);
  alert('Errore: ' + errorMessage);
}
```

#### Event Listener Pattern
```javascript
document.getElementById("elemento")?.addEventListener("click", async () => {
  // Async operation con feedback UI
  const btn = event.target;
  const originalText = btn.textContent;
  btn.textContent = "Loading...";
  btn.disabled = true;
  
  try {
    await operazione();
  } finally {
    btn.textContent = originalText;
    btn.disabled = false;
  }
});
```

### 📊 Dependency Mapping

#### External Dependencies
```javascript
// CDN Libraries (caricamento dinamico)
SheetJS     → Excel export
jsPDF       → PDF generation
Supabase JS → Database client

// Local Modules Network
calendar-utils ← storico-logic
timbrature-data ← storico-logic
timbrature-render ← storico-logic
modale-modifica → supabase-client
calendario-popup → storico-logic (via HTML)
```

#### Module Responsibilities
```
📄 Presentation:
- HTML files → User interface
- CSS files → Styling + responsive

🧠 Business Logic:
- storico-logic.js → Page orchestration
- timbrature-data.js → Data operations
- timbrature-render.js → UI rendering

🔧 Utilities:
- calendar-utils.js → Date manipulations
- supabase-client.js → Database abstraction
```

### 🛠️ Template per Nuovi Script

#### Modulo Utility Standard
```javascript
// assets/scripts/nuovo-modulo.js

/**
 * Descrizione funzionalità modulo
 * @author Sistema BADGEBOX
 * @version 1.0
 */

import { supabaseClient, gestisciErroreSupabase } from './supabase-client.js';

// Funzioni private
function funzioneInterna() {
  // Logic interna
}

// Funzioni pubbliche
export async function funzionePrincipale(parametri) {
  try {
    // Logica business
    return risultato;
  } catch (error) {
    console.error('❌ Errore modulo:', error);
    throw new Error(gestisciErroreSupabase(error));
  }
}

export function funzioneUtility() {
  // Utility function
}
```

#### Script Root Utility
```javascript
// nome-script.js (root level)

/**
 * Script di sistema per [funzionalità]
 * Esegui con: node nome-script.js
 */

console.log('🚀 Avvio script...');

async function main() {
  try {
    // Logica principale
    console.log('✅ Script completato con successo');
  } catch (error) {
    console.error('❌ Errore script:', error);
    process.exit(1);
  }
}

// Esegui se chiamato direttamente
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
```

### 🎮 Interactive Testing Scripts

#### Test Timbrature
```javascript
// Aggiungere in browser console per test
async function testTimbrature() {
  const testPIN = 99;
  const oggi = new Date().toISOString().split('T')[0];
  
  // Test entrata
  await salvaTimbratura(testPIN, oggi, "09:00", "ENTRATA");
  
  // Test uscita
  await salvaTimbratura(testPIN, oggi, "17:30", "USCITA");
  
  console.log('Test timbrature completato');
}
```

#### Stress Test Database
```javascript
async function stressTestDB() {
  const startTime = Date.now();
  const promises = [];
  
  for (let i = 0; i < 100; i++) {
    promises.push(recuperaTimbrature(1, "2024-01-01", "2024-12-31"));
  }
  
  await Promise.all(promises);
  const endTime = Date.now();
  console.log(`Stress test: ${endTime - startTime}ms per 100 queries`);
}
```

### 📋 Script Execution Guide

#### Sviluppo
```bash
# Dev server con hot reload
npm run dev

# Test moduli singoli (browser console)
import('./assets/scripts/calendar-utils.js').then(module => {
  // Test funzioni modulo
});
```

#### Produzione
```bash
# Deploy Netlify
git push origin main

# Backup sistema
node backup-current-system.js

# Aggiornamento
./upgrade.sh
```

#### Debug
```javascript
// Enable verbose logging
localStorage.setItem('debug', 'true');

// Performance monitoring
console.time('operation');
// ...codice...
console.timeEnd('operation');
```

```

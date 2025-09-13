
# PROJECT_STRUCTURE.md

## Struttura del Progetto BADGEBOX

### 📁 Directory Root
```
/
├── assets/                     # Risorse statiche
├── .github-config.json        # Configurazione GitHub
├── .gitignore                 # File ignorati da Git
├── .htaccess                  # Configurazione Apache
├── .replit                    # Configurazione Replit IDE
├── _redirects                 # Regole redirect Netlify
├── backup-current-system.js   # Script backup sistema
├── create-zip.js             # Utility creazione ZIP
├── fix-database.sql          # Script correzioni DB
├── index.html                # 🏠 Homepage - Sistema timbrature
├── manifest.json             # Configurazione PWA
├── netlify.toml              # Configurazione deploy Netlify
├── package.json              # Dipendenze Node.js
├── setup-database.sql        # Script inizializzazione DB
├── storico.html              # 📊 Pagina storico timbrature
├── style.css                 # 🎨 Stili globali applicazione
├── utenti.html               # 👥 Gestione dipendenti attivi
├── ex-dipendenti.html        # 🗂️ Archivio ex dipendenti
├── vite.config.js            # Configurazione Vite dev server
└── upgrade.sh                # Script aggiornamento sistema
```

### 📂 assets/
Directory per tutte le risorse statiche dell'applicazione.

#### 📁 assets/icons/ e public/assets/icons/
- **Responsabilità**: Icone e loghi dell'applicazione (duplicati per compatibility dev/prod)
- **Convenzione naming**: lowercase con trattini per icone generiche
- **Percorsi utilizzati**: SEMPRE `/assets/icons/` (con slash iniziale) per compatibilità Vite
```
icons/
├── BADGENODE.png           # Logo principale app
├── badgenode-192.png       # Logo PWA 192x192
├── badgenode-512.png       # Logo PWA 512x512
├── bnapp.png              # Logo app corner brand
├── calendario.png          # Icona calendario (📅)
├── cancella.png           # Icona eliminazione (🗑️)
├── esporta.png            # Icona esportazione Excel (📊)
├── freccia.png            # Icone navigazione (←)
├── invia.png              # Icona invio PDF (📄)
├── logoBN 2.png           # Logo alternativo
├── matita-colorata.png    # Icona modifica (✏️)
├── orologio.png           # Icona storico timbrature (🕐)
└── pdf.png                # Icona PDF (📄)
```

#### 📁 assets/scripts/
- **Responsabilità**: Moduli JavaScript riutilizzabili
- **Convenzione naming**: kebab-case con suffisso funzionale

```
scripts/
├── calendar-utils.js       # Utilità gestione range date e filtri
├── calendario-popup.js     # Popup calendario interattivo
├── modale-modifica.js     # Gestione modali modifica timbrature
├── storico-logic.js       # Logica business storico dipendenti
├── supabase-client.js     # Client configurato Supabase + utilities
├── timbrature-data.js     # Gestione dati timbrature (CRUD)
└── timbrature-render.js   # Rendering tabelle timbrature
```

#### 📁 assets/styles/
- **Responsabilità**: Fogli di stile modulari
```
styles/
└── storico-styles.css      # Stili specifici pagina storico e calendario
```

### 🔧 File di Configurazione

#### Development & Build
- **vite.config.js**: Dev server configurato (porta 5173, HMR WSS, hot reload)
- **package.json**: Dipendenze Vite, script npm
- **.replit**: Configurazione IDE Replit (workflow, porte)

#### Deployment
- **netlify.toml**: Configurazione hosting Netlify
- **_redirects**: Regole redirect single-page app
- **.htaccess**: Configurazione Apache (fallback)

#### PWA (Progressive Web App)
- **manifest.json**: Metadati PWA (icone, colori, orientamento mobile-first)

### 🗄️ Database & Backend
- **setup-database.sql**: Schema completo tabelle Supabase (utenti, timbrature, dipendenti_archiviati)
- **fix-database.sql**: Patch e correzioni DB

### 📱 Pagine Principali

#### index.html - Sistema Timbrature
- **Funzione**: Homepage con tastierino PIN e pulsanti Entrata/Uscita
- **Componenti**: 
  - Keypad 3x4 con PIN display
  - Pulsanti azione Entrata/Uscita
  - Display data/ora in tempo reale
  - Status messages per feedback utente
- **Integrazione**: Supabase timbrature, validazioni anti-duplicazione
- **Features speciali**: PIN admin 1909 per accesso gestione

#### utenti.html - Gestione Dipendenti
- **Funzione**: CRUD dipendenti attivi
- **Features implementate**: 
  - Lista dipendenti con PIN, nome, cognome
  - Modal aggiunta nuovo dipendente
  - Modal modifica dettagli (nome, cognome, email, telefono, ore contrattuali, descrizione contratto)
  - Upload file allegati (CV, documenti)
  - Archiviazione automatica (genera Excel, sposta a dipendenti_archiviati, libera PIN)
  - Link diretto a storico individuale
  - Pulsante "EX DIPENDENTI" per accesso archivio

#### ex-dipendenti.html - Archivio
- **Funzione**: Visualizzazione dipendenti archiviati
- **Features**: 
  - Tabella con nome, cognome, data archiviazione
  - Azioni per ogni record: scarico Excel, eliminazione definitiva
  - Pulsante "Torna ai Dipendenti" per navigazione
  - **Nota**: Rimossa funzione "Ripristina dipendente"

#### storico.html - Storico Timbrature
- **Funzione**: Visualizzazione dettagliata timbrature per dipendente
- **Features**:
  - Filtri temporali: mese corrente, precedente, personalizzato
  - Calendario popup interattivo per selezione date
  - Tabella timbrature con calcolo ore automatico
  - Modifica timbrature esistenti (modal con data/ora)
  - Eliminazione timbrature singole
  - Esportazione PDF con intestazione aziendale
  - Esportazione Excel dettagliata
  - Condivisione WhatsApp formattata
  - Calcolo totale ore mensili
  - Navigazione back a utenti.html

### 🎨 Styling Architecture

#### style.css - Global Styles
- **Sistema colori**: Dark theme con accenti blu
- **Layout**: Mobile-first responsive design
- **Typography**: Font system ottimizzato
- **Componenti**:
  - Keypad responsive (3x4 grid)
  - Modali centrate con backdrop
  - Tabelle scrollabili
  - Pulsanti touch-friendly
  - Form validation styles

#### storico-styles.css - Page Specific
- **Calendario popup**: Stili per calendario interattivo
- **Tabella timbrature**: Layout ottimizzato per dati tabulari
- **Media queries**: Ottimizzazioni landscape/portrait

### 📊 Data Flow Architecture

#### 1. Sistema Timbrature (index.html)
```
PIN Input → Validazione → Supabase Query → 
Controllo Anti-Duplicazione → Insert Timbratura → 
Feedback Visuale
```

#### 2. Gestione Dipendenti (utenti.html)
```
Lista Dipendenti ← Supabase utenti
↓
CRUD Operations:
- Aggiungi → Insert utenti
- Modifica → Update utenti  
- Archivia → Insert dipendenti_archiviati + Delete utenti
```

#### 3. Storico Timbrature (storico.html)
```
PIN Parameter → Query timbrature + utenti →
Rendering Tabella → Export/Share Actions
```

#### 4. Archivio Ex Dipendenti
```
Query dipendenti_archiviati → 
Display Archivio →
Actions: Download Excel, Delete definitivo
```

### 🔗 Module Dependencies

#### Supabase Integration
- **Client configurato**: `supabase-client.js`
- **Database**: PostgreSQL con Row Level Security
- **Tabelle**:
  - `utenti`: dipendenti attivi
  - `timbrature`: registrazioni entrata/uscita
  - `dipendenti_archiviati`: ex dipendenti con dati completi

#### External Libraries
- **Supabase JS**: `@supabase/supabase-js` via CDN ESM
- **SheetJS**: Excel export via CDN
- **jsPDF**: PDF generation via CDN
- **Vite**: Dev server con HMR

### 🛠️ Development Utilities

#### Scripts di Supporto
- **backup-current-system.js**: Backup configurazioni e stato
- **create-zip.js**: Packaging progetto
- **upgrade.sh**: Script aggiornamento sistema

#### File Legacy (mantenuti per compatibilità)
- **script.js**: Script legacy (sostituito da moduli in assets/scripts/)
- **timbrature-*.js**: File root (sostituiti da assets/scripts/)

### 📱 PWA Configuration

#### Manifest Features
- **Icone**: Multiple resoluzioni per iOS/Android
- **Orientamento**: Portrait preferito
- **Background**: Dark theme consistente
- **Installabilità**: Supporto add-to-homescreen

#### Performance Optimizations
- **Lazy loading**: Librerie Excel caricate on-demand
- **Asset optimization**: Icone WebP quando possibile
- **Cache strategy**: Implementabile via Service Worker (future)

### 🔐 Security Architecture

#### Frontend Security
- **Input validation**: PIN numerico 1-99
- **XSS protection**: Escape HTML nei template
- **Admin access**: PIN 1909 hardcoded

#### Database Security
- **Supabase RLS**: Row Level Security configurata
- **API Keys**: Anon key pubblica, service key protetta
- **CORS**: Configurato per domini autorizzati

### 📈 Scalability Considerations

#### Current Limits
- **Utenti**: Max 99 (limitazione PIN 2 cifre)
- **File upload**: 5MB per dipendente
- **Timbrature**: Illimitate (con archiving strategy)

#### Growth Path
- **PIN estensione**: Possibile migrazione a 3-4 cifre
- **Multi-tenant**: Separazione per azienda/filiale
- **Real-time**: WebSocket per timbrature live

```

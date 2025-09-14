# BadgeNode - Sistema di Timbratura Aziendale

## Panoramica Progetto

BadgeNode è un'applicazione web per la gestione delle timbrature aziendali, sviluppata come Progressive Web App (PWA) con architettura moderna e sincronizzazione real-time con Supabase.

### Obiettivi Principali

- ✅ **Registrazione Timbrature**: Sistema touch-friendly per entrata/uscita dipendenti
- ✅ **Gestione Utenti**: Amministrazione anagrafica dipendenti con PIN univoci
- ✅ **Report Mensili**: Visualizzazione storico timbrature con filtri temporali
- ✅ **Export Dati**: Esportazione PDF/Excel con tutti i giorni del periodo
- ✅ **Offline-First**: Funzionamento anche senza connessione internet

## Stack Tecnologico

### Frontend
- **Vanilla JavaScript ES6+** - Nessun framework, massima performance
- **CSS3 + Grid/Flexbox** - Layout responsive e moderno
- **Service Worker** - Cache intelligente e funzionalità offline
- **PWA Manifest** - Installabile su dispositivi mobili

### Backend & Database
- **Supabase** - Backend-as-a-Service con PostgreSQL
- **PostgREST** - API REST automatica dal database
- **Row Level Security (RLS)** - Sicurezza a livello di riga
- **Real-time Subscriptions** - Aggiornamenti live dei dati

### Build & Deploy
- **Vite** - Build tool moderno e veloce
- **Netlify** - Hosting con deploy automatico da GitHub
- **GitHub Actions** - CI/CD pipeline

## Flussi Principali

### 1. Registrazione Timbratura
```
Dipendente inserisce PIN → Validazione utente → Registrazione entrata/uscita → Conferma visiva
```

### 2. Report Mensile (Storico)
```
Admin accede → Seleziona dipendente → Filtra per periodo → Visualizza tabella → Export PDF/Excel
```

### 3. Gestione Utenti
```
Admin (PIN 1909) → Lista dipendenti → Aggiungi/Modifica/Elimina → Sincronizzazione automatica
```

## Struttura Cartelle Chiave

```
badgenode-main/
├── assets/
│   ├── scripts/           # Logica applicativa modulare
│   │   ├── supabase-client.js      # Client Supabase singleton
│   │   ├── timbrature-data.js      # Gestione dati timbrature
│   │   ├── storico-logic.js        # Logica pagina storico + export
│   │   ├── utenti-loader.js        # Caricamento lista utenti
│   │   └── virtual-table.js        # Rendering tabelle virtuali
│   ├── styles/            # CSS modulari per componenti
│   └── icons/             # Icone PWA e favicon
├── db/sql/                # Script SQL per viste e ottimizzazioni
├── docs/                  # Documentazione tecnica
├── public/                # Asset statici (favicon, manifest, SW)
├── main.js                # Entry point applicazione
├── index.html             # Pagina principale timbrature
├── storico.html           # Pagina report mensili
├── utenti.html            # Pagina gestione dipendenti
└── ex-dipendenti.html     # Archivio dipendenti cessati
```

## Caratteristiche Tecniche

### Architettura Modulare
- **ES Modules** per importazione dinamica
- **Singleton Pattern** per client Supabase
- **Event-driven** con listener DOM nativi
- **Separation of Concerns** tra logica, rendering e dati

### Performance
- **Virtual Scrolling** per tabelle con molti record
- **Lazy Loading** di librerie esterne (jsPDF, xlsx)
- **Caching intelligente** con Service Worker
- **Debouncing** su input utente

### Sicurezza
- **PIN-based Authentication** per dipendenti
- **Admin PIN separato** per funzioni amministrative
- **RLS Policies** su Supabase per isolamento dati
- **Input Validation** lato client e server

### Compatibilità
- **Cross-browser** (Chrome, Firefox, Safari, Edge)
- **Mobile-responsive** con touch gestures
- **Offline-capable** con sincronizzazione automatica
- **PWA-compliant** installabile su dispositivi

## Deployment

### Ambiente di Sviluppo
```bash
npm install
npm run dev  # Vite dev server su porta 5173
```

### Ambiente di Produzione
- **Auto-deploy** da GitHub main branch
- **Netlify** con ottimizzazioni automatiche
- **CDN globale** per asset statici
- **HTTPS** obbligatorio per PWA

## Monitoraggio

### Logging
- **Console logging** strutturato con emoji
- **Error tracking** con stack trace
- **Performance metrics** su operazioni critiche

### Health Checks
- ⚠️ **Connessione Supabase** verificata all'avvio
- ⚠️ **Validazione configurazione** con fallback
- ⚠️ **DOM readiness** prima dell'inizializzazione

---

*Documentazione aggiornata: Settembre 2025*


# SETUP_GUIDE.md

## Guida Setup BADGEBOX

### 🚀 Installazione Rapida

#### Requisiti Sistema
- **Node.js**: 18+ (per dev server Vite)
- **Browser moderno**: Chrome/Firefox/Safari con supporto ES6+
- **Account Supabase**: Per database PostgreSQL hosting

#### Setup Locale Replit
```bash
# Il progetto è già configurato, basta cliccare Run
# Vite dev server parte automaticamente su porta 5173
```

#### Setup Locale Tradizionale
```bash
# 1. Clona il progetto
git clone <repository-url>
cd badgebox

# 2. Installa dipendenze
npm install

# 3. Avvia dev server
npm run dev
# Server disponibile su http://localhost:5173
```

### 🔧 Configurazione Database

#### Supabase Setup Completo
1. **Crea progetto**: [supabase.com](https://supabase.com) → New Project
2. **Esegui script inizializzazione**:
```sql
-- Copia contenuto completo di setup-database.sql
-- Ed eseguilo nel SQL Editor di Supabase
-- Include: utenti, timbrature, dipendenti_archiviati + indici
```

3. **Configura RLS**: Row Level Security (già nel script setup)
4. **Ottieni credenziali**: Settings → API → URL + anon public key

#### Configurazione Connessioni
File da aggiornare con le tue credenziali Supabase:

**assets/scripts/supabase-client.js** (Primary):
```javascript
export const supabaseClient = createClient(
  "TUA_SUPABASE_URL",           // es: https://xxx.supabase.co
  "TUA_SUPABASE_ANON_KEY"      // Chiave pubblica anon
);
```

**File con client inline** (da aggiornare):
- `index.html` (script timbrature)
- `utenti.html` (gestione dipendenti) 
- `ex-dipendenti.html` (archivio)

### 📋 Comandi Disponibili

#### Development
```bash
npm run dev          # Dev server porta 5173 con HMR
```

#### Utilities
```bash
node backup-current-system.js    # Backup configurazioni
node create-zip.js               # Crea archivio progetto
./upgrade.sh                     # Aggiornamento sistema
```

### 🛠️ Workflow di Sviluppo

#### 1. Development Locale
```bash
# Replit: Clicca Run → workflow automatico
# Locale: npm run dev
```

#### 2. Testing Completo
- **Homepage**: `http://localhost:5173` → Test timbrature
- **Gestione**: `/utenti.html` → CRUD dipendenti
- **Storico**: `/storico.html?pin=XX` → Export/modifica
- **Archivio**: `/ex-dipendenti.html` → Ex dipendenti

#### 3. Mobile Testing
```javascript
// DevTools → Toggle Device → Test responsive
// Orientamenti: Portrait/Landscape
// Viewport: 360px, 480px, 768px, 1024px
```

#### 4. PWA Testing
```javascript
// Chrome DevTools → Application tab
// Manifest: Verifica icone e configurazione
// Service Workers: (Non implementato, future enhancement)
// Add to Home Screen: Test install prompt
```

### 🐛 Troubleshooting Aggiornato

#### Problema: WebSocket HTTPS/HTTP
```
Error: An insecure WebSocket connection may not be initiated from a page loaded over HTTPS
```
**Soluzione**: Il `vite.config.js` è già configurato:
```javascript
server: {
  host: '0.0.0.0',
  port: 5173,
  hmr: {
    protocol: 'wss',  // ✅ WSS per HTTPS
    host: '0.0.0.0'
  }
}
```

#### Problema: Moduli ES6 non caricati
```
Error: Failed to resolve module specifier
```
**Verifiche**:
1. Path relativi corretti (`./assets/scripts/`)
2. Estensione `.js` esplicita negli import
3. Tipo `module` negli script tag

#### Problema: Timbrature duplicate
**Sintomo**: Alert "ENTRATA già registrata oggi"
**Causa**: Sistema anti-duplicazione attivo (constraint DB)
**Debug**:
```sql
SELECT * FROM timbrature 
WHERE pin = XX AND data = CURRENT_DATE 
ORDER BY ore DESC;
```

#### Problema: PIN non trovato
**Sintomo**: "PIN non trovato" durante timbratura
**Verifiche**:
1. PIN esiste in tabella `utenti` (non `dipendenti_archiviati`)
2. PIN numerico range 1-99
3. Connessione Supabase attiva
4. Console browser per errori JavaScript

#### Problema: Esportazione Excel fallisce
**Sintomo**: "Errore generazione Excel"
**Verifiche**:
1. Libreria SheetJS caricata correttamente
2. Dati timbrature presenti
3. Browser supporta download automatico
4. Cache libreria (`XLSXLib` variable)

#### Problema: Icone non visibili in development
**Sintomo**: Icone non caricate nella preview Replit (funzionano nel deploy)
**Causa**: Vite dev server richiede percorsi assoluti `/assets/icons/` invece di `assets/icons/`
**Soluzione**: SEMPRE usare `/assets/icons/` in tutti i file HTML/JS:
```html
<!-- ✅ CORRETTO -->
<img src="/assets/icons/orologio.png" alt="Storico" />
<!-- ❌ SBAGLIATO -->
<img src="assets/icons/orologio.png" alt="Storico" />
```

#### Problema: Modali non responsive
**Soluzione**: Verificato in `style.css`:
```css
@media (max-width: 480px) {
  .modal-content { 
    margin: 5px; 
    padding: 10px; 
    max-width: calc(100vw - 10px);
  }
}
```

#### Problema: Calendario popup non visibile
**Soluzione**: Z-index e positioning in `storico-styles.css`:
```css
.calendario-popup {
  position: fixed;
  z-index: 10000;
  background: var(--bg-primary);
}
```

### 🔄 Maintenance Tasks

#### Backup Automatico
```bash
# Backup configurazioni sistema
node backup-current-system.js

# Backup database Supabase
# Dashboard → Settings → Database → Backup
# Frequenza consigliata: Settimanale
```

#### Monitoring Logs
- **Browser Console**: Errori JavaScript, performance
- **Supabase Dashboard**: 
  - Logs → Error monitoring
  - Database → Performance insights
- **Replit Console**: Output dev server

#### Performance Monitoring
```javascript
// Metriche caricamento pagine
console.time('caricamento-utenti');
await caricaUtenti();
console.timeEnd('caricamento-utenti');

// Cache hit rate monitoraggio
const cacheStats = {
  hit: 0,
  miss: 0,
  get hitRate() { return this.hit / (this.hit + this.miss) * 100; }
};
```

#### Database Maintenance
```sql
-- Pulizia timbrature vecchie (oltre 2 anni)
DELETE FROM timbrature 
WHERE data < CURRENT_DATE - INTERVAL '2 years';

-- Statistiche tabelle
SELECT 
  schemaname,
  tablename,
  attname,
  n_distinct,
  correlation
FROM pg_stats 
WHERE tablename IN ('utenti', 'timbrature', 'dipendenti_archiviati');
```

### 🌐 Deploy in Produzione

#### Netlify (Raccomandato)
1. **Setup**: Collega repository GitHub
2. **Configurazione**: Automatica da `netlify.toml`
3. **Deploy**: Automatico su push main branch
4. **URL**: Custom domain configurabile

#### Replit Hosting
1. **Workflow**: "Run Dev Server" attivo
2. **Porta**: 5173 con forwarding automatico
3. **URL**: `https://username.repl.co` pubblico
4. **SSL**: Automatico HTTPS

#### Configurazione Produzione
```javascript
// Variabili ambiente (non hardcodate)
const SUPABASE_URL = process.env.SUPABASE_URL || "https://xxx.supabase.co";
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || "fallback-key";
```

### 📱 PWA Setup Completo

#### Manifest Configurato
- **Nome**: "BADGEBOX - Camera con Vista"
- **Icone**: Ottimizzate 192x192, 512x512
- **Theme**: Dark mode nativo
- **Orientamento**: Portrait preferito, landscape supportato
- **Start URL**: `/` (homepage timbrature)

#### Service Worker (Future)
```javascript
// TODO: Implementazione per offline support
// Cache strategy per:
// - Assets statici (CSS, JS, icons)
// - Dati critici (lista dipendenti)
// - Fallback offline per timbrature
```

#### Install Prompts
- **Automatico**: Browser supportati mostrano banner
- **Custom**: Implementabile pulsante "Installa App"

### 🔐 Sicurezza Implementata

#### Frontend Security
- **Input sanitization**: Escape HTML automatico
- **PIN validation**: Range 1-99 enforced
- **Admin protection**: PIN 1909 per accesso gestione
- **File upload**: Limitazioni tipo/dimensione

#### Database Security
- **RLS attiva**: Row Level Security configurata
- **API keys**: Solo anon key esposta (sicura per frontend)
- **Constraints**: CHECK constraints per integrità dati
- **Indici**: Ottimizzati per security + performance

#### Network Security
- **HTTPS**: Obbligatorio in produzione
- **CORS**: Configurato per domini autorizzati
- **CSP**: Content Security Policy implementabile

### 📈 Scalability Path

#### Current Architecture Limits
- **Dipendenti**: 99 max (PIN constraint)
- **Timbrature**: Illimitate (con archiving)
- **Storage**: 5MB per dipendente (upload)

#### Scaling Options
```sql
-- Estensione PIN a 4 cifre
ALTER TABLE utenti 
ALTER COLUMN pin TYPE INTEGER;
ALTER TABLE utenti
ADD CONSTRAINT pin_range_extended CHECK (pin >= 1 AND pin <= 9999);

-- Partitioning per timbrature storiche
CREATE TABLE timbrature_2024 PARTITION OF timbrature
FOR VALUES FROM ('2024-01-01') TO ('2025-01-01');
```

### 🎯 Performance Optimization

#### Frontend Optimizations
- **Lazy loading**: Excel lib caricata on-demand
- **DOM caching**: Query selectors riutilizzati
- **Debouncing**: Input frequenti ottimizzati

#### Database Optimizations
- **Indici**: Su query frequenti (pin, data, tipo)
- **Query planning**: EXPLAIN ANALYZE per bottleneck
- **Connection pooling**: Supabase gestito automaticamente

### 🔧 Development Tools

#### Browser DevTools
- **Console**: Logging errori e performance
- **Network**: Monitoring chiamate API
- **Application**: PWA manifest e storage
- **Lighthouse**: Audit performance/accessibilità

#### Supabase Dashboard
- **SQL Editor**: Query testing e debug
- **Table Editor**: Data visualization
- **Logs**: Error tracking real-time
- **Performance**: Query performance insights

```

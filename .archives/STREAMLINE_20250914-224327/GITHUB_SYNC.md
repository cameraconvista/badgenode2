
# GITHUB_SYNC.md

## Sincronizzazione GitHub - BADGEBOX

### 🔧 Configurazione Repository

#### Setup Iniziale
```bash
# Se non già fatto, configura Git nel progetto
git init
git remote add origin https://github.com/USERNAME/badgebox.git

# Configura credenziali
git config user.name "Tuo Nome"
git config user.email "tua.email@example.com"
```

#### Configurazione Replit-GitHub
Il progetto include **`.github-config.json`** per sincronizzazione automatica:
```json
{
  "repository": "username/badgebox",
  "branch": "main",
  "auto_sync": true,
  "sync_on_save": false
}
```

### 🔄 Workflow di Sincronizzazione

#### Push Changes (Replit → GitHub)
```bash
# Commit con messaggio descrittivo
git add .
git commit -m "feat: implementazione archiviazione dipendenti"

# Push su repository remoto
git push origin main
```

#### Pull Updates (GitHub → Replit)
```bash
# Verifica updates remotri
git fetch origin

# Applica modifiche
git pull origin main

# Risolvi eventuali conflitti
git status
# Modifica file in conflitto, poi:
git add .
git commit -m "resolve: merge conflicts"
```

#### Sincronizzazione Automatica Replit
Il pulsante **"Connect to GitHub"** nella sidebar Replit:
1. Rileva modifiche automaticamente
2. Propone commit message
3. Push automatico configurabile
4. Pull updates da GitHub

### 🌿 Branching Strategy

#### Development Flow
```bash
# Crea branch per nuove features
git checkout -b feature/nuova-funzionalita

# Sviluppo e commit incrementali
git add assets/scripts/nuovo-modulo.js
git commit -m "feat: aggiunta gestione nuovo modulo"

git add utenti.html  
git commit -m "style: miglioramento UI modifica dipendente"

# Merge su main
git checkout main
git merge feature/nuova-funzionalita
git push origin main
```

#### Hotfix Flow  
```bash
# Fix urgenti su produzione
git checkout -b hotfix/correzione-critica

# Apply fix
git add fix-database.sql
git commit -m "fix: correzione constraint PIN duplicati"

# Deploy immediato
git checkout main
git merge hotfix/correzione-critica  
git push origin main
```

### 📝 Convenzioni Commit Implementate

#### Commit Message Standard
```bash
# ✅ Pattern implementato nel progetto:

feat: aggiunta funzionalità archiviazione dipendenti
fix: correzione WebSocket WSS per HTTPS compatibility
style: miglioramento responsive design mobile  
docs: aggiornamento documentazione completa
refactor: riorganizzazione moduli in assets/scripts
test: aggiunta test manual per export Excel
chore: aggiornamento dipendenze Vite

# Format standard:
<tipo>: <descrizione breve>

# Body opzionale per dettagli:
feat: eliminazione pulsante ripristina dipendente

Rimosso pulsante "Ripristina" da ex-dipendenti.html
Eliminata funzione ripristinaDipendente() da codice  
Aggiornata logica per impedire recupero dipendenti archiviati
```

#### Tipi Commit Utilizzati
```
feat     → Nuova funzionalità
fix      → Correzione bug
style    → Modifiche CSS/UI
docs     → Aggiornamento documentazione
refactor → Ristrutturazione codice senza modifiche funzionali
test     → Aggiunta/modifica test
chore    → Maintenance, aggiornamenti dipendenze
perf     → Ottimizzazioni performance
```

### 🔄 Integrazione Continua

#### Pre-commit Hooks (Configurabili)
Crea **`.git/hooks/pre-commit`**:
```bash
#!/bin/sh
# Pre-commit hook per qualità codice

echo "🔍 Esecuzione checks pre-commit..."

# Backup automatico pre-commit
npm run esegui-backup

# Verifica sintassi JavaScript
echo "📋 Verifica sintassi..."
find assets/scripts -name "*.js" -exec node -c {} \;

# Check trailing whitespace
echo "🧹 Pulizia whitespace..."
find . -name "*.js" -o -name "*.html" -o -name "*.css" | \
  xargs sed -i 's/[[:space:]]*$//'

# Verifica size files
echo "📏 Verifica dimensioni file..."
find . -name "*.js" -o -name "*.html" -o -name "*.css" | \
  while read file; do
    size=$(stat -c%s "$file")
    if [ $size -gt 500000 ]; then
      echo "⚠️  File troppo grande: $file ($size bytes)"
    fi
  done

echo "✅ Pre-commit checks completati"
```

#### Post-commit Hooks
```bash
#!/bin/sh
# .git/hooks/post-commit

# Log commit per tracking
echo "$(date): $(git log -1 --pretty=format:'%h %s')" >> .git/commit-log

# Trigger deploy se su branch main
if [ "$(git branch --show-current)" = "main" ]; then
  echo "🚀 Branch main aggiornato - Deploy automatico..."
fi
```

### 📊 Tracking e Monitoring

#### Git History Analysis
```bash
# Statistiche commit
git shortlog -sn --all

# Modifiche frequenti  
git log --pretty=format: --name-only | sort | uniq -c | sort -rg

# Contributor activity
git log --pretty=format:"%h %an %ad %s" --date=short | head -20
```

#### File Change Tracking
```bash
# Files modificati di recente
git log --name-status --since="1 week ago"

# Diff tra versioni
git diff HEAD~1 HEAD --stat

# Blame per troubleshooting  
git blame assets/scripts/storico-logic.js
```

### 🔐 Security Git Workflow

#### Sensitive Data Protection
```bash
# ✅ .gitignore configurato per:
node_modules/
*.env
*.log  
.DS_Store
backup-*.json

# Verifica nessun dato sensibile committato
git log -p | grep -i "password\|key\|secret"
```

#### Credential Management
```bash
# ✅ Pattern sicuro implementato:
# Credenziali Supabase in file pubblici (anon key OK)
# NO service keys in repository
# Environment variables per production
```

### 🚀 Deploy Automation

#### Netlify Integration
Il file **`netlify.toml`** configura deploy automatico:
```toml
[build]
  command = "npm run build"
  publish = "dist"

[dev]
  framework = "vite"
  command = "npm run dev"
  port = 5173
```

#### GitHub Actions (Configurabile)
Template **`.github/workflows/deploy.yml`**:
```yaml
name: Deploy to Netlify
on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install  
      - run: npm run build
      - name: Deploy to Netlify
        uses: netlify/actions/cli@master
        with:
          args: deploy --dir=dist --prod
```

### 📋 Workflow Routine

#### Daily Development
```bash
# 1. Start giornata - Pull updates
git pull origin main

# 2. Crea branch feature (opzionale)
git checkout -b feature/nome-feature

# 3. Sviluppo con commit frequenti  
git add file-modificato.js
git commit -m "feat: implementazione feature X"

# 4. Push fine giornata
git push origin feature/nome-feature
```

#### Weekly Maintenance
```bash
# Backup completo
npm run esegui-backup

# Merge branch sviluppo
git checkout main
git merge feature/branch-settimana
git push origin main

# Pulizia branch locali
git branch -d feature/old-branch

# Sync con remote
git remote prune origin
```

### 🔄 Conflict Resolution

#### Merge Conflicts
```bash
# Quando si presenta conflitto
git status  # Vedi files in conflitto

# Risolvi manualmente in editor
# Cerca markers: <<<<<<< HEAD, =======, >>>>>>> 

# Dopo risoluzione
git add file-risolto.js
git commit -m "resolve: merge conflict in file-risolto"
git push origin main
```

#### Common Conflicts in Project
```javascript
// Tipo conflitto più comune: configurazioni Supabase
<<<<<<< HEAD
const supabaseUrl = "https://old-url.supabase.co";
=======
const supabaseUrl = "https://new-url.supabase.co";
>>>>>>> feature-branch

// Risoluzione: mantieni URL produzione
const supabaseUrl = "https://txmjqrnitfsiytbytxlc.supabase.co";
```

### 📈 Repository Health

#### Metrics Tracking
```bash
# Code churn (file modificati frequentemente)
git log --name-only --pretty=format: | sort | uniq -c | sort -nr

# Commit frequency
git log --pretty=format:"%ad" --date=short | uniq -c

# Branch activity
git for-each-ref --format='%(refname:short) %(committerdate)' refs/heads
```

#### Quality Gates
```bash
# Pre-push quality check
function pre_push_check() {
  echo "🔍 Quality check pre-push..."
  
  # Verifica dimensione repository
  du -sh .git
  
  # Conta file modificati
  git diff --name-only HEAD~1 HEAD | wc -l
  
  # Verifica sintassi
  find . -name "*.js" -exec node -c {} \;
  
  echo "✅ Quality check completato"
}
```

### 🎯 Best Practices Implementate

#### Repository Organization
```
✅ Documentazione centralizzata nella root
✅ Assets organizzati in sottocartelle
✅ Scripts modulari con responsabilità singola
✅ Configurazioni separate per environment
✅ .gitignore completo e aggiornato
```

#### Collaboration Guidelines
```
✅ Commit message descriptivi e standardizzati
✅ Branch naming: feature/, hotfix/, docs/
✅ Pull request con review (se team)
✅ No force push su main branch
✅ Backup prima di operazioni rischiose
```

#### Code Review Process
```bash
# Review checklist per ogni commit
□ Funzionalità testata manualmente
□ Performance accettabile  
□ Error handling implementato
□ Documentazione aggiornata se necessaria
□ Backward compatibility mantenuta
□ Security implications valutate
```

```

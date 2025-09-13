
# ICON PATH STANDARDS - BADGEBOX

## 🚨 REGOLA CRITICA - MAI VIOLARE

### ✅ CORRETTO - Percorsi Assoluti
```html
<!-- Sempre con slash iniziale -->
<img src="/assets/icons/orologio.png" alt="Storico" />
<img src="/assets/icons/matita-colorata.png" alt="Modifica" />
<img src="/assets/icons/calendario.png" alt="Calendario" />
<img src="/assets/icons/pdf.png" alt="PDF" />
<img src="/assets/icons/bnapp.png" alt="BADGENODE app" />
```

### ❌ SBAGLIATO - Percorsi Relativi
```html
<!-- NON FUNZIONA in Vite development -->
<img src="assets/icons/orologio.png" alt="Storico" />
<img src="./assets/icons/matita-colorata.png" alt="Modifica" />
<img src="../assets/icons/calendario.png" alt="Calendario" />
```

## 🔧 Perché Questa Regola

### Development (Vite)
- Server dev serve file statici SOLO da `public/`
- Percorsi relativi `assets/icons/` → 404 Not Found
- Percorsi assoluti `/assets/icons/` → Serviti da `public/assets/icons/`

### Production (Build)
- Vite copia tutto in `dist/`
- Sia relativi che assoluti funzionano
- Ma standard assoluto garantisce consistency

## 📁 Struttura File Richiesta

```
├── assets/icons/           # Source icons (per sviluppo)
└── public/assets/icons/    # Static served icons (per Vite)
```

**IMPORTANTE**: Mantieni sempre entrambe le cartelle sincronizzate!

## 🔍 Come Verificare

### Quick Check
```bash
# Verifica tutti i percorsi icon in HTML/JS
grep -r "src.*assets/icons" *.html assets/scripts/

# RISULTATO CORRETTO: tutti con /assets/icons/
# RISULTATO SCORRETTO: alcuni senza slash iniziale
```

### Test Browser
1. **Development**: `npm run dev` → Tutte icone visibili
2. **Preview**: `npm run preview` → Tutte icone visibili
3. **DevTools**: Console pulita, zero 404 errors

## 🚑 Emergency Fix

Se icone spariscono in development:

```bash
# 1. Quick fix automatico
find . -name "*.html" -exec sed -i 's|src="assets/icons/|src="/assets/icons/|g' {} \;
find assets/scripts/ -name "*.js" -exec sed -i 's|"assets/icons/|"/assets/icons/|g' {} \;

# 2. Verifica fix
grep -r "assets/icons" *.html assets/scripts/ | grep -v "/assets/icons"

# 3. Se output vuoto = FIX COMPLETATO
```

## 📋 Checklist Pre-Commit

Prima di ogni commit verificare:

- [ ] Tutte le icone usano `/assets/icons/`
- [ ] Nessun `assets/icons/` senza slash iniziale
- [ ] `public/assets/icons/` sincronizzata con `assets/icons/`
- [ ] Test in development: `npm run dev` → icone visibili
- [ ] Console browser: zero errori 404

## 🎯 File da Controllare SEMPRE

### HTML Files
- `index.html`
- `utenti.html` 
- `storico.html`
- `ex-dipendenti.html`

### JavaScript Files
- `assets/scripts/timbrature-render.js`
- `assets/scripts/storico-logic.js`
- Qualsiasi file che usa `img.src = ...`

### CSS Files (raro ma possibile)
- `style.css`
- `assets/styles/*.css`

## 🔄 Maintenance Commands

### Sync Icon Directories
```bash
# Copia da assets/ a public/assets/
rsync -av assets/icons/ public/assets/icons/
```

### Audit Icon Usage
```bash
# Lista tutti i percorsi icon usati
grep -rh "assets/icons" *.html assets/scripts/ | sort | uniq
```

### Validate All Icons Exist
```bash
# Verifica che tutti i file referenziati esistano
grep -ro "/assets/icons/[^\"']*" *.html assets/scripts/ | \
  cut -d: -f2 | sort | uniq | \
  while read path; do
    if [ ! -f "public$path" ]; then
      echo "❌ MISSING: public$path"
    fi
  done
```

---

## ⚠️ CONSEGUENZE VIOLAZIONE

### Sviluppo Locale
- Icone invisibili in preview Replit
- Console piena di errori 404
- UI degradata, esperienza sviluppatore pessima

### Debugging Difficile  
- Errore si manifesta solo in dev, non in prod
- Sviluppatori confusi da comportamento inconsistente
- Time wasted su "bug fantasma"

### Team Workflow
- Altri sviluppatori erediteranno il problema
- Review process rallentato
- Deploy process incerto

---

**RICORDA**: Slash iniziale è OBBLIGATORIO per icone!

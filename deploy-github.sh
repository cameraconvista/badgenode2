#!/bin/bash
# 🚀 CASCADE | PUSH → GITHUB & PREP DEPLOY (BadgeNode)
# Obiettivo: caricare su GitHub le modifiche applicate (REC-002 + hotfix icone/SW), creare PR e — se il repo è configurato per Render con deploy su push a main — opzionale merge automatico.
# Nessuna modifica a layout/DOM/CSS oltre a quanto già applicato. Rollback git standard (revert/branch delete).

set -euo pipefail
ts=$(date +%Y%m%d-%H%M%S)
echo "[INFO] Start push-to-github @ $ts"

# 0) PRECHECK REPO
git status >/dev/null
default_branch=$(git remote show origin | awk '/HEAD branch/ {print $NF}')
[ -z "$default_branch" ] && default_branch=main
echo "[INFO] Default branch: $default_branch"

# 1) BACKUP RAPIDO (solo file mutati in working tree)
mkdir -p .backups/GIT_PUSH_$ts
git diff --name-only || true
git diff --name-only | xargs -I{} bash -lc '[ -f "{}" ] && cp --parents "{}" .backups/GIT_PUSH_'$ts' || true'
echo "[OK] Backup dei file cambiati in .backups/GIT_PUSH_$ts"

# 2) BUMP BUILD ID per cache-busting (non impatta layout)
BUILD_ID="r$ts"
if [ -f "assets/scripts/main.js" ]; then
  grep -q "__BUILD_ID__" assets/scripts/main.js || echo "globalThis.__BUILD_ID__='${BUILD_ID}';" >> assets/scripts/main.js
  sed -i.bak "s/globalThis.__BUILD_ID__ *= *['\"][^'\"]*['\"]/globalThis.__BUILD_ID__='${BUILD_ID}'/" assets/scripts/main.js || true
  rm -f assets/scripts/main.js.bak
fi

# 3) AGGIORNA NOTE DI DEPLOY
cat > DEPLOY_CHECKLIST.md <<EOF
# BadgeNode — Checklist Deploy (${ts})
- [x] Branch: hotfix/rec002-deploy-${ts}
- [x] SW guard attiva su 8080 e *.onrender.com (unregister auto)
- [x] Icone canonicalizzate: /assets/icons/{occhio.png,matita-colorata.png,orologio.png,esporta.png,badgenode-192.png}
- [x] Anti-reload utenti.html (debounce 10s)
- [x] Singleton Supabase client (REC-002)
## Post-deploy (Render)
1. Apri /utenti.html → niente loop, icone colonna "Storico" corrette.
2. Apri /storico.html?pin=<PIN> → icona "Matita" visibile, export PDF/XLS < 500ms.
3. Apri /ex-dipendenti.html → icone "Azioni" visibili; nessun errore SW in console.
4. Verifica TTI utenti→storico ~ ~3.7s o meglio (baseline locale ~4s).
EOF

# 4) BRANCH & COMMIT
branch="hotfix/rec002-deploy-${ts}"
git checkout -b "$branch"
git add -A
git commit -m "chore(deploy): REC-002 singleton + hotfix icone/SW + deploy checklist (${BUILD_ID})"

# 5) PUSH & PR
git push -u origin "$branch"

# Crea PR (usa gh se disponibile, fallback a link)
PR_URL=""
if command -v gh >/dev/null 2>&1; then
  set +e
  gh pr create --base "$default_branch" --head "$branch" --title "Deploy: REC-002 + hotfix icone/SW (${BUILD_ID})" \
    --body "Include: singleton Supabase, normalizzazione icone, SW guard/unregister, anti-reload utenti, checklist deploy.\n\nRollback: revert PR."
  gh pr view --web >/dev/null 2>&1 || true
  PR_URL=$(gh pr view --json url -q .url 2>/dev/null || echo "")
  set -e
fi
[ -z "$PR_URL" ] && echo "[ACTION] Apri PR manualmente: https://github.com/<ORG>/<REPO>/compare/${default_branch}...${branch}"

# 6) AUTO-MERGE (solo se gh presente e repo abilita deploy su push a default_branch)
if command -v gh >/dev/null 2>&1; then
  # Prova merge automatico; se richiede review, lascerà la PR aperta.
  gh pr merge --squash --auto || echo "[INFO] PR in attesa di review; il deploy partirà al merge."
fi

# 7) POST-MERGE: TAG OPZIONALE
if command -v gh >/dev/null 2>&1; then
  current_branch=$(git rev-parse --abbrev-ref HEAD)
  if [ "$current_branch" = "$default_branch" ]; then
    tag="v${ts}"
    git tag -a "$tag" -m "BadgeNode deploy ${tag}"
    git push origin "$tag"
    echo "[OK] Creato tag ${tag}"
  fi
fi

# 8) RIEPILOGO & ISTRUZIONI MONITOR
echo "------------------------------------------------------------------"
echo "[DONE] Branch: ${branch}"
[ -n "$PR_URL" ] && echo "[PR] ${PR_URL}"
echo "[NEXT] Se Render è configurato su push a ${default_branch}, monitorare build log su Render fino a 'Live'."
echo "[TEST] Esegui DEPLOY_CHECKLIST.md in produzione."
echo "[ROLLBACK] In caso di problemi: git revert -m 1 <merge_commit> oppure ripristina .backups/GIT_PUSH_${ts}/"
echo "------------------------------------------------------------------"

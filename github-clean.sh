#!/bin/bash
# 🧹 GITHUB CLEAN — Rimuovi banner "Compare & pull request" eliminando il branch remoto

set -euo pipefail
ts=$(date +%Y%m%d-%H%M%S)
target_prefix="hotfix/rec002-deploy"
default_branch="$(git remote show origin | awk '/HEAD branch/ {print $NF}')"
[ -z "$default_branch" ] && default_branch=main

echo "[INFO] Default branch: $default_branch"
echo "[INFO] Target prefix: $target_prefix"

git fetch --all --prune

# Trova i branch remoti che iniziano con il prefisso target (di solito uno solo)
targets=()
while IFS= read -r line; do
  targets+=("$line")
done < <(git branch -r | sed 's# *origin/##' | grep -E "^${target_prefix}" || true)

if [ "${#targets[@]}" -eq 0 ]; then
  echo "[OK] Nessun branch remoto con prefisso '${target_prefix}'. Nulla da fare."
  exit 0
fi

mkdir -p ".backups/DELETE_REMOTE_BRANCH_${ts}/patches"

for br in "${targets[@]}"; do
  echo "----"
  echo "[FOUND] origin/${br}"

  # Backup differenze (se il branch è avanti a main, salvo le patch per rollback)
  ahead=$(git rev-list --left-only --count "origin/${br}...origin/${default_branch}" || echo 0)
  if [ "$ahead" -gt 0 ]; then
    echo "[BACKUP] ${br} ha ${ahead} commit non presenti su ${default_branch}. Salvo patch..."
    git format-patch -o ".backups/DELETE_REMOTE_BRANCH_${ts}/patches/${br}" "origin/${default_branch}..origin/${br}" >/dev/null
    git log --oneline "origin/${default_branch}..origin/${br}" > ".backups/DELETE_REMOTE_BRANCH_${ts}/patches/${br}.log" || true
    echo "[BACKUP] Patch salvate in .backups/DELETE_REMOTE_BRANCH_${ts}/patches/${br}/"
  else
    echo "[INFO] ${br} non è avanti a ${default_branch}."
  fi

  # Cancella branch remoto
  git push origin --delete "${br}" || true

  # Cancella eventuale branch locale
  if git show-ref --verify --quiet "refs/heads/${br}"; then
    git branch -D "${br}" || true
  fi
done

# Pulisci i riferimenti remoti spariti
git remote prune origin

echo "----"
echo "[DONE] Branch remoti '${target_prefix}*' rimossi."
echo "[NOTE] Ricarica la pagina GitHub: il banner 'Compare & pull request' scomparirà."
echo "[ROLLBACK] Se servono i commit cancellati: applica le patch in .backups/DELETE_REMOTE_BRANCH_${ts}/patches/"

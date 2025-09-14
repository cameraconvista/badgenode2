# BadgeNode — Checklist Deploy (20250914-154500)
- [x] Branch: hotfix/rec002-deploy-20250914-154500
- [x] SW guard attiva su 8080 e *.onrender.com (unregister auto)
- [x] Icone canonicalizzate: /assets/icons/{occhio.png,matita-colorata.png,orologio.png,esporta.png,badgenode-192.png}
- [x] Anti-reload utenti.html (debounce 10s)
- [x] Singleton Supabase client (REC-002)
## Post-deploy (Render)
1. Apri /utenti.html → niente loop, icone colonna "Storico" corrette.
2. Apri /storico.html?pin=<PIN> → icona "Matita" visibile, export PDF/XLS < 500ms.
3. Apri /ex-dipendenti.html → icone "Azioni" visibili; nessun errore SW in console.
4. Verifica TTI utenti→storico ~ ~3.7s o meglio (baseline locale ~4s).

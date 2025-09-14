// storico-align.js - Fix conservativo per allineamento colonne e click matita

let syncTimeout = null;

export function initStoricoAlign() {
  // Verifica presenza elementi base
  const tbody = document.querySelector('#storico-body');
  if (!tbody) {
    console.info('[storico-align] #storico-body non trovato, skip');
    return;
  }

  const thTbl = document.querySelector('.tabella-header table');
  const tbTbl = document.querySelector('.tabella-body-wrapper table');
  const tfTbl = document.querySelector('.tabella-footer table');

  if (!thTbl || !tbTbl || !tfTbl) {
    console.warn('[storico-align] Tabelle header/body/footer incomplete');
    return;
  }

  console.info('[storico-align] Inizializzazione allineamento colonne');

  // Imposta table-layout fisso per tutte le tabelle
  function ensureFixedLayout() {
    [thTbl, tbTbl, tfTbl].forEach(table => {
      if (!table.style.tableLayout) {
        table.style.tableLayout = 'fixed';
        table.style.width = '100%';
        table.style.borderCollapse = 'separate';
      }
    });
  }

  // Sincronizza larghezze colonne
  function syncColumnWidths() {
    const headerRow = thTbl.querySelector('thead tr');
    if (!headerRow) return;

    const ths = headerRow.querySelectorAll('th');
    if (ths.length === 0) return;

    // Leggi larghezze effettive dai TH
    const widths = Array.from(ths).map(th => {
      const rect = th.getBoundingClientRect();
      return Math.max(50, Math.floor(rect.width)); // min 50px
    });

    console.info('[storico-align] Larghezze rilevate:', widths);

    // Applica larghezze al body
    const bodyRows = tbTbl.querySelectorAll('tbody tr');
    bodyRows.forEach(row => {
      const tds = row.querySelectorAll('td');
      tds.forEach((td, index) => {
        if (widths[index]) {
          td.style.width = widths[index] + 'px';
          td.style.minWidth = widths[index] + 'px';
          td.style.maxWidth = widths[index] + 'px';
        }
      });
    });

    // Applica larghezze al footer
    const footerRows = tfTbl.querySelectorAll('tbody tr');
    footerRows.forEach(row => {
      const tds = row.querySelectorAll('td');
      tds.forEach((td, index) => {
        if (widths[index]) {
          td.style.width = widths[index] + 'px';
          td.style.minWidth = widths[index] + 'px';
          td.style.maxWidth = widths[index] + 'px';
        }
      });
    });

    console.info('[storico-align] Sincronizzazione completata');
  }

  // Debounced sync
  function debouncedSync() {
    if (syncTimeout) clearTimeout(syncTimeout);
    syncTimeout = setTimeout(() => {
      ensureFixedLayout();
      syncColumnWidths();
    }, 100);
  }

  // Listener delegato per click matita
  function setupPencilListener() {
    tbody.addEventListener('click', (e) => {
      const btn = e.target.closest('.modifica-icon');
      if (!btn) return;

      try {
        const row = btn.closest('tr');
        if (!row) return;

        // Recupera dati dalla riga (dataset o data-attributes)
        const dataIso = btn.getAttribute('data-data') || row.dataset.data || '';
        const timbraturaId = btn.getAttribute('data-timbratura-id') || row.dataset.timbraturaId || '';
        
        // Recupera PIN dalla URL
        const urlParams = new URLSearchParams(window.location.search);
        const pin = urlParams.get('pin') || '';

        // Cerca dati timbrature dalla riga (se disponibili)
        const entrate = row.dataset.entrate || '';
        const uscite = row.dataset.uscite || '';

        console.info('[storico-align] Click matita:', { dataIso, pin, timbraturaId });

        // Chiama apriModaleModifica se disponibile
        if (typeof window.apriModaleModifica === 'function') {
          window.apriModaleModifica(dataIso, entrate, uscite, pin, timbraturaId);
        } else if (typeof apriModaleModifica === 'function') {
          apriModaleModifica(dataIso, entrate, uscite, pin, timbraturaId);
        } else {
          console.warn('[storico-align] apriModaleModifica non disponibile');
        }
      } catch (err) {
        console.error('[storico-align] click matita errore:', err);
      }
    }, { passive: false });

    console.info('[storico-align] Listener matita configurato');
  }

  // MutationObserver per re-sync automatico
  function setupObserver() {
    const observer = new MutationObserver((mutations) => {
      let shouldSync = false;
      mutations.forEach(mutation => {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          shouldSync = true;
        }
      });
      if (shouldSync) {
        console.info('[storico-align] DOM cambiato, re-sync');
        debouncedSync();
      }
    });

    observer.observe(tbody, { 
      childList: true, 
      subtree: true 
    });

    console.info('[storico-align] MutationObserver attivo');
  }

  // Inizializzazione
  ensureFixedLayout();
  setupPencilListener();
  setupObserver();

  // Sync iniziale (ritardato per permettere rendering)
  setTimeout(() => {
    debouncedSync();
  }, 200);

  // Sync su resize finestra
  window.addEventListener('resize', debouncedSync, { passive: true });

  console.info('[storico-align] Inizializzazione completata');
}

// Auto-init su DOMContentLoaded
document.addEventListener('DOMContentLoaded', initStoricoAlign);

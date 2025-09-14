// scripts/storico-logic.js

import { aggiungiOpzionePersonalizzato, aggiornaRange } from './calendar-utils.js';
import { caricaDati, pulisciCache } from './timbrature-data.js';
import { renderizzaTabella } from './timbrature-render.js';

const intestazione = document.getElementById("intestazione");
const tbody = document.getElementById("storico-body");
const selectFiltro = document.getElementById("filtro-mese");
const dataInizio = document.getElementById("data-inizio");
const dataFine = document.getElementById("data-fine");
const footerTbody = document.getElementById("totale-footer");

const urlParams = new URLSearchParams(window.location.search);
const pin = urlParams.get("pin");
if (!pin) console.warn("PIN non trovato nella URL");

let dipendente = null;
let timbrature = [];
let totaleMensile = '—';

// ✅ UNICA gestione range - eliminati duplicati
let currentRange = null;

// ✅ DEFAULT ROBUSTO: primo e ultimo giorno del mese corrente
function getDefaultRange() {
  const oggi = new Date();
  const anno = oggi.getFullYear();
  const mese = oggi.getMonth(); // 0-based

  const primoGiorno = new Date(anno, mese, 1);
  const ultimoGiorno = new Date(anno, mese + 1, 0);

  return {
    inizio: primoGiorno.toISOString().split('T')[0],
    fine: ultimoGiorno.toISOString().split('T')[0]
  };
}

// ✅ GUARDIA: Assicura sempre un range valido
function assicuraRangeValido() {
  if (!currentRange || !currentRange.inizio || !currentRange.fine) {
    currentRange = getDefaultRange();
    console.log('🔧 Range default applicato:', currentRange);
  }

  // Guardia: se from > to, correggi con swap
  if (new Date(currentRange.inizio) > new Date(currentRange.fine)) {
    const temp = currentRange.inizio;
    currentRange.inizio = currentRange.fine;
    currentRange.fine = temp;
    console.log('🔄 Range corretto (swap):', currentRange);
  }

  return currentRange;
}

// ✅ UNICA funzione aggiornamento range (eliminato duplicato)
function aggiornaMese() {
  const dataDa = document.getElementById('data-inizio')?.value;
  const dataA = document.getElementById('data-fine')?.value;

  // ✅ GUARDIA: Controlla elementi DOM presenti
  if (!document.getElementById('data-inizio') || !document.getElementById('data-fine')) {
    console.log('⚠️ Elementi calendario non presenti, uso default');
    currentRange = getDefaultRange();
    return;
  }

  if (dataDa && dataA) {
    currentRange = {
      inizio: dataDa,
      fine: dataA
    };

    // ✅ VALIDATION: Assicura range valido prima di procedere
    assicuraRangeValido();
    console.log('📅 Range aggiornato (corrente):', currentRange);
    caricaDatiServer();
  } else {
    // ✅ FALLBACK: Mostra messaggio se range incompleto
    const messaggioDiv = document.getElementById('messaggioRange');
    if (messaggioDiv) {
      messaggioDiv.textContent = 'Seleziona un intervallo valido';
      messaggioDiv.style.display = 'block';
    }
    console.log('⚠️ Range incompleto, fetch bloccato');
  }
}

// ✅ UNICA funzione caricamento dati server
async function caricaDatiServer() {
  // ✅ GUARDIA DOPPIA: Assicura range sempre valido
  const range = assicuraRangeValido();

  if (!range || !range.inizio || !range.fine) {
    console.log('❌ Range non valido per caricamento');
    const messaggioDiv = document.getElementById('messaggioRange');
    if (messaggioDiv) {
      messaggioDiv.textContent = 'Errore: intervallo date non valido';
      messaggioDiv.style.display = 'block';
    }
    return;
  }

  // Nascondi eventuali messaggi di errore
  const messaggioDiv = document.getElementById('messaggioRange');
  if (messaggioDiv) {
    messaggioDiv.style.display = 'none';
  }

  console.log('🔄 Caricamento dati da server...');
  const { dipendente: d, timbrature: t } = await caricaDati(pin, range.inizio, range.fine);
  dipendente = d;
  timbrature = t;

  // ✅ FIX CRITICO: Imposta sempre il nome del dipendente
  if (dipendente && dipendente.nome && dipendente.cognome) {
    intestazione.textContent = `${dipendente.nome} ${dipendente.cognome}`;
    console.log('✅ Nome dipendente impostato:', dipendente.nome, dipendente.cognome);
  } else if (pin) {
    intestazione.textContent = `PIN ${pin} - Utente non trovato`;
    console.log('⚠️ Dipendente non trovato per PIN:', pin);
  } else {
    intestazione.textContent = 'Dipendente non identificato';
    console.log('❌ PIN mancante');
  }

  const result = renderizzaTabella(dipendente, timbrature, range.inizio, range.fine, tbody, footerTbody, pin);
  totaleMensile = result?.totaleMensile || '—';
}

// ✅ UNICA funzione validazione (eliminato duplicato)
function validaRange(range) {
  if (!range || !range.inizio || !range.fine) {
    return null; // Range non valido
  }

  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(range.inizio) || !dateRegex.test(range.fine)) {
    return null; // Formato data non valido
  }

  const dataInizioObj = new Date(range.inizio);
  const dataFineObj = new Date(range.fine);

  if (isNaN(dataInizioObj.getTime()) || isNaN(dataFineObj.getTime())) {
    return null; // Date non valide
  }

  if (dataInizioObj > dataFineObj) {
    return null; // La data di inizio non può essere successiva alla data di fine
  }

  return range; // Range valido
}

// ✅ HELPER LOCALI PER RANGE DATE (no UTC, no toISOString)
// ritorna { start, end } per il mese di 'base'
function getMonthRangeLocal(base = new Date()) {
  const y = base.getFullYear(), m = base.getMonth();
  const start = new Date(y, m, 1);   start.setHours(12,0,0,0);   // mezzogiorno per evitare DST
  const end   = new Date(y, m+1, 0); end.setHours(12,0,0,0);
  return { start, end };
}

// calcola il mese con offset: 0 = corrente, -1 = precedente, -2 = due precedenti
function monthWithOffset(today = new Date(), offset = 0) {
  const y = today.getFullYear(), m = today.getMonth();
  return new Date(y, m + offset, 1);
}

// format YYYY-MM-DD in locale (senza UTC)
function fmtYmd(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth()+1).padStart(2,'0');
  const day = String(d.getDate()).padStart(2,'0');
  return `${y}-${m}-${day}`;
}

// ✅ EVENT LISTENERS - configurati una sola volta
selectFiltro?.addEventListener("change", () => {
  if (selectFiltro.value !== "personalizzato") {
    selectFiltro.querySelector('option[value="personalizzato"]')?.remove();
    selectFiltro.style.borderColor = '#334155';
    selectFiltro.style.color = 'white';

    // Aggiorna range in base alla selezione usando helper locali
    const oggi = new Date();
    let base, range;

    switch(selectFiltro.value) {
      case 'corrente':
        base = monthWithOffset(oggi, 0);
        break;
      case 'precedente':
        base = monthWithOffset(oggi, -1);
        break;
      case 'due-precedenti':
        base = monthWithOffset(oggi, -2);
        break;
      default:
        base = monthWithOffset(oggi, 0);
    }

    range = getMonthRangeLocal(base);
    
    // Log diagnostico
    console.info('[storico] preset:', selectFiltro.value, 'range:', fmtYmd(range.start), '→', fmtYmd(range.end));

    currentRange = {
      inizio: fmtYmd(range.start),
      fine: fmtYmd(range.end)
    };

    // Aggiorna input date
    if (dataInizio) dataInizio.value = currentRange.inizio;
    if (dataFine) dataFine.value = currentRange.fine;
  }

  caricaDatiServer();
});

dataInizio?.addEventListener("change", () => {
  aggiungiOpzionePersonalizzato(selectFiltro);
  aggiornaMese();
});

dataFine?.addEventListener("change", () => {
  aggiungiOpzionePersonalizzato(selectFiltro);
  aggiornaMese();
});

document.getElementById("torna-utenti")?.addEventListener("click", () => {
  window.location.href = "utenti.html";
});

// ✅ FUNZIONI EXPORT - mantenute separate per chiarezza
async function exportaPDF() {
  const range = assicuraRangeValido();

  if (!range) {
    mostraMessaggio('Errore nella selezione del periodo', 'error');
    return;
  }

  const btn = document.getElementById("btn-invia");
  if (!btn) return;

  const originalHTML = btn.innerHTML;
  btn.innerHTML = "Generando...";
  btn.disabled = true;

  try {
    console.log('📄 Inizio generazione PDF...');

    const jsPDFModule = await import('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
    const { jsPDF } = jsPDFModule.default || window.jspdf || {};
    if (!jsPDF) {
      throw new Error('Libreria PDF non disponibile');
    }

    const nomeCompleto = dipendente ? `${dipendente.nome} ${dipendente.cognome}` : 
                        (intestazione.textContent.includes('PIN') ? intestazione.textContent.replace(/PIN \d+ - /, '') : 
                        intestazione.textContent);

    const doc = new jsPDF();

    try {
      const logoImg = new Image();
      logoImg.crossOrigin = 'anonymous'; 

      await new Promise((resolve, reject) => {
        logoImg.onload = () => {
          try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const aspectRatio = logoImg.naturalWidth / logoImg.naturalHeight;
            const logoHeight = 7.5; 
            const logoWidth = logoHeight * aspectRatio; 
            const canvasScale = 4; 
            canvas.width = logoWidth * canvasScale;
            canvas.height = logoHeight * canvasScale;
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(logoImg, 0, 0, canvas.width, canvas.height);
            const logoBase64 = canvas.toDataURL('image/png', 1.0); 
            const xPosition = (210 - logoWidth) / 2; 
            doc.addImage(logoBase64, 'PNG', xPosition, 10, logoWidth, logoHeight);
            resolve();
          } catch (e) {
            reject(e);
          }
        };
        logoImg.onerror = () => reject(new Error('Immagine non trovata'));
        logoImg.src = 'assets/icons/Logo ccv black.png';
      });

    } catch (error) {
      console.warn('Errore caricamento logo:', error);
      console.log('📄 Continuo senza logo...');
    }

    doc.setFontSize(16);
    doc.text("RIEPILOGO MENSILE TIMBRATURE", 105, 40, { align: "center" });

    const dataInizioFormatted = new Date(range.inizio).toLocaleDateString('it-IT');
    const dataFineFormatted = new Date(range.fine).toLocaleDateString('it-IT');

    doc.setFontSize(12);
    doc.text(`Dipendente: ${nomeCompleto} (PIN: ${pin})`, 20, 60);
    doc.text(`Periodo: dal ${dataInizioFormatted} al ${dataFineFormatted}`, 20, 70);
    doc.text(`Ore totali: ${totaleMensile}`, 20, 80);

    doc.line(20, 90, 190, 90);

    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("Data", 20, 105);
    doc.text("Entrata", 70, 105);
    doc.text("Uscita", 120, 105);
    doc.text("Ore", 160, 105);
    doc.line(20, 110, 190, 110);

    doc.setFont("helvetica", "normal");
    let y = 120;
    
    // Genera tutti i giorni del range usando gli helper locali
    const [annoInizio, meseInizio, giornoInizio] = range.inizio.split('-').map(Number);
    const [annoFine, meseFine, giornoFine] = range.fine.split('-').map(Number);
    const start = new Date(annoInizio, meseInizio - 1, giornoInizio);
    const end = new Date(annoFine, meseFine - 1, giornoFine);
    start.setHours(12, 0, 0, 0);
    end.setHours(12, 0, 0, 0);
    
    // Genera tutti i giorni nel range
    const tuttiGiorni = [];
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      tuttiGiorni.push(new Date(d.getFullYear(), d.getMonth(), d.getDate()));
    }
    
    // Mappa timbrature dalla tabella per data
    const timbratureMap = new Map();
    const righe = document.querySelectorAll('#storico-body tr');
    righe.forEach(riga => {
      const celle = riga.querySelectorAll('td');
      if (celle.length >= 6) {
        const dataText = celle[0].textContent.trim();
        const entrata = celle[2].textContent.trim();
        const uscita = celle[3].textContent.trim();
        const ore = celle[4].textContent.trim();
        
        // Estrai solo il numero del giorno dalla prima colonna
        const giornoMatch = dataText.match(/^(\d{1,2})/);
        if (giornoMatch) {
          const giorno = parseInt(giornoMatch[1]);
          timbratureMap.set(giorno, { entrata, uscita, ore });
        }
      }
    });
    
    // Calcola spazio disponibile e dimensioni ottimizzate per A4
    const maxRighe = Math.min(tuttiGiorni.length, 20); // Max 20 righe per pagina A4
    const altezzaRiga = Math.min(8, (270 - 120) / maxRighe); // Altezza dinamica
    
    // Stampa tutti i giorni del range
    tuttiGiorni.forEach((giorno, index) => {
      if (y > 270) return; // Stop se supera la pagina
      
      const giornoNum = giorno.getDate();
      const giornoSettimana = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'][giorno.getDay()];
      const dataFormattata = `${giornoNum.toString().padStart(2, '0')} ${giornoSettimana}`;
      
      // Recupera dati dalla mappa o usa valori di default
      const datiGiorno = timbratureMap.get(giornoNum) || { entrata: '—', uscita: '—', ore: '0.00' };
      
      doc.text(dataFormattata, 20, y);
      doc.text(datiGiorno.entrata, 70, y);
      doc.text(datiGiorno.uscita, 120, y);
      doc.text(datiGiorno.ore, 160, y);
      y += altezzaRiga;
    });

    doc.setFontSize(8);
    doc.text(`Generato il: ${new Date().toLocaleString('it-IT')}`, 20, 285);

    const nomeFile = `${nomeCompleto.replace(/\s+/g, '_')}_timbrature_${range.inizio}_${range.fine}.pdf`;
    doc.save(nomeFile);

    console.log('✅ PDF generato con successo:', nomeFile);

  } catch (error) {
    console.error('❌ Errore generazione PDF:', error);
    alert('Errore durante la generazione del PDF. Riprova.');
  } finally {
    btn.innerHTML = originalHTML;
    btn.disabled = false;
  }
}

async function exportaExcel() {
  const range = assicuraRangeValido();

  if (!range) {
    mostraMessaggio('Errore nella selezione del periodo', 'error');
    return;
  }

  const btn = document.getElementById("btn-excel");
  if (!btn) return;

  const originalHTML = btn.innerHTML;
  btn.innerHTML = "Generando...";
  btn.disabled = true;

  try {
    console.log('📊 Inizio generazione Excel...');

    const XLSXModule = await import('https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js');
    const XLSX = XLSXModule.default || window.XLSX;
    if (!XLSX) {
      throw new Error('Libreria Excel non disponibile');
    }
    const { utils, writeFile } = XLSX;

    const nomeCompleto = dipendente ? `${dipendente.nome} ${dipendente.cognome}` : 
                        (intestazione.textContent.includes('PIN') ? intestazione.textContent.replace(/PIN \d+ - /, '') : 
                        intestazione.textContent);

    const dataInizioFormatted = new Date(range.inizio).toLocaleDateString('it-IT');
    const dataFineFormatted = new Date(range.fine).toLocaleDateString('it-IT');

    const worksheetData = [];

    worksheetData.push(['RIEPILOGO MENSILE TIMBRATURE'], [''], 
                      [`Dipendente: ${nomeCompleto} (PIN: ${pin})`],
                      [`Periodo: dal ${dataInizioFormatted} al ${dataFineFormatted}`],
                      [`Ore totali: ${totaleMensile}`],
                      [''], 
                      ['Data', 'Entrata', 'Uscita', 'Ore']);

    // Genera tutti i giorni del range usando gli helper locali
    const [annoInizio, meseInizio, giornoInizio] = range.inizio.split('-').map(Number);
    const [annoFine, meseFine, giornoFine] = range.fine.split('-').map(Number);
    const start = new Date(annoInizio, meseInizio - 1, giornoInizio);
    const end = new Date(annoFine, meseFine - 1, giornoFine);
    start.setHours(12, 0, 0, 0);
    end.setHours(12, 0, 0, 0);
    
    // Genera tutti i giorni nel range
    const tuttiGiorni = [];
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      tuttiGiorni.push(new Date(d.getFullYear(), d.getMonth(), d.getDate()));
    }
    
    // Mappa timbrature dalla tabella per data
    const timbratureMap = new Map();
    const righe = document.querySelectorAll('#storico-body tr');
    righe.forEach(riga => {
      const celle = riga.querySelectorAll('td');
      if (celle.length >= 6) {
        const dataText = celle[0].textContent.trim();
        const entrata = celle[2].textContent.trim();
        const uscita = celle[3].textContent.trim();
        const ore = celle[4].textContent.trim();
        
        // Estrai solo il numero del giorno dalla prima colonna
        const giornoMatch = dataText.match(/^(\d{1,2})/);
        if (giornoMatch) {
          const giorno = parseInt(giornoMatch[1]);
          timbratureMap.set(giorno, { entrata, uscita, ore });
        }
      }
    });
    
    // Aggiungi tutti i giorni del range al worksheet
    tuttiGiorni.forEach(giorno => {
      const giornoNum = giorno.getDate();
      const giornoSettimana = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'][giorno.getDay()];
      const dataFormattata = `${giornoNum.toString().padStart(2, '0')} ${giornoSettimana}`;
      
      // Recupera dati dalla mappa o usa valori di default
      const datiGiorno = timbratureMap.get(giornoNum) || { entrata: '—', uscita: '—', ore: '0.00' };
      
      worksheetData.push([dataFormattata, datiGiorno.entrata, datiGiorno.uscita, datiGiorno.ore]);
    });

    worksheetData.push([''], [`Generato il: ${new Date().toLocaleString('it-IT')}`]);

    const workbook = utils.book_new();
    const worksheet = utils.aoa_to_sheet(worksheetData);

    const columnWidths = [
      { wch: 12 }, 
      { wch: 10 }, 
      { wch: 10 }, 
      { wch: 8 }   
    ];
    worksheet['!cols'] = columnWidths;

    if (worksheet['A1']) {
      worksheet['A1'].s = {
        font: { bold: true, sz: 14 },
        alignment: { horizontal: 'center' }
      };
    }

    ['A7', 'B7', 'C7', 'D7'].forEach(cell => {
      if (worksheet[cell]) {
        worksheet[cell].s = {
          font: { bold: true },
          fill: { fgColor: { rgb: 'E6E6E6' } }
        };
      }
    });

    utils.book_append_sheet(workbook, worksheet, 'Timbrature');

    const nomeFile = `${nomeCompleto.replace(/\s+/g, '_')}_timbrature_${range.inizio}_${range.fine}.xlsx`;
    writeFile(workbook, nomeFile);

    console.log('✅ Excel generato con successo:', nomeFile);

  } catch (error) {
    console.error('❌ Errore generazione Excel:', error);
    alert('Errore durante la generazione del file Excel. Riprova.');
  } finally {
    btn.innerHTML = originalHTML;
    btn.disabled = false;
  }
}

// Bind eventi export
document.getElementById("btn-invia")?.addEventListener("click", exportaPDF);
document.getElementById("btn-excel")?.addEventListener("click", exportaExcel);

// Funzione di utilità per messaggi
function mostraMessaggio(messaggio, tipo = 'info') {
  const statusElement = document.getElementById('status');
  if (statusElement) {
    statusElement.textContent = messaggio;
    statusElement.className = `status-message ${tipo} visible`;
    setTimeout(() => {
      statusElement.className = 'status-message';
    }, 3000);
  } else {
    console.log(`${tipo.toUpperCase()}: ${messaggio}`);
  }
}

// ✅ INIZIALIZZAZIONE SICURA E ORDINATA - UNA SOLA VOLTA
document.addEventListener('DOMContentLoaded', function() {
  console.log('📊 STORICO: Inizializzazione...');

  // 1. Forza il filtro su "mese corrente" se non impostato
  const selectFiltro = document.getElementById('filtro-mese');
  if (selectFiltro && !selectFiltro.value) {
    selectFiltro.value = 'corrente';
    console.log('🔧 Filtro forzato su "mese corrente"');
  }

  // 2. Calcola range usando helper locali per mese corrente
  const oggi = new Date();
  const base = monthWithOffset(oggi, 0);
  const range = getMonthRangeLocal(base);
  
  currentRange = {
    inizio: fmtYmd(range.start),
    fine: fmtYmd(range.end)
  };
  
  console.log('🔧 Range mese corrente calcolato:', currentRange);

  // 3. Aggiorna input date con range corretto
  const dataInizioEl = document.getElementById('data-inizio');
  const dataFineEl = document.getElementById('data-fine');

  if (dataInizioEl && dataFineEl) {
    dataInizioEl.value = currentRange.inizio;
    dataFineEl.value = currentRange.fine;
    console.log('📅 Input date inizializzati con range mese corrente');
  }

  // 4. Primo caricamento IMMEDIATO con range corretto
  caricaDatiServer();

  console.log('✅ Storico inizializzato e caricamento avviato');
});
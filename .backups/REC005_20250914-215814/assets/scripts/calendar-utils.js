// calendar-utils.js

// Funzione per normalizzare le date
export function normalizzaData(data) {
  if (!data) return null;

  // Se è già in formato YYYY-MM-DD, restituisci così com'è
  if (typeof data === 'string' && data.match(/^\d{4}-\d{2}-\d{2}$/)) {
    return data;
  }

  // Se è un oggetto Date, convertilo in formato ISO
  if (data instanceof Date) {
    return data.toISOString().split('T')[0];
  }

  // Se è una stringa in altro formato, prova a parsarla
  if (typeof data === 'string') {
    const parsedDate = new Date(data);
    if (!isNaN(parsedDate.getTime())) {
      return parsedDate.toISOString().split('T')[0];
    }
  }

  return null;
}

// Funzione per calcolare le ore lavorate
export function calcolaOreLavorate(oraInizio, oraFine) {
  if (!oraInizio || !oraFine) return 0;

  const [oreInizio, minutiInizio] = oraInizio.split(':').map(Number);
  const [oreFine, minutiFine] = oraFine.split(':').map(Number);

  const minutiTotaliInizio = oreInizio * 60 + minutiInizio;
  const minutiTotaliFine = oreFine * 60 + minutiFine;

  let differenzaMinuti = minutiTotaliFine - minutiTotaliInizio;

  // Gestisce il caso in cui l'uscita è il giorno successivo
  if (differenzaMinuti < 0) {
    differenzaMinuti += 24 * 60;
  }

  return Math.round((differenzaMinuti / 60) * 100) / 100;
}

// Funzione per formattare le ore
export function formattaOre(ore) {
  if (typeof ore !== 'number' || isNaN(ore)) return '0.00';
  return ore.toFixed(2);
}

// Funzione per aggiornare il range delle date
export function aggiornaRange(valore, dataInizio, dataFine) {
  const oggi = new Date();
  let inizio, fine;

  switch (valore) {
    case 'corrente':
      // Primo giorno del mese corrente
      inizio = new Date(oggi.getFullYear(), oggi.getMonth(), 1);
      // Ultimo giorno del mese corrente
      fine = new Date(oggi.getFullYear(), oggi.getMonth() + 1, 0);
      break;
    case 'precedente':
      // Primo giorno del mese precedente
      inizio = new Date(oggi.getFullYear(), oggi.getMonth() - 1, 1);
      // Ultimo giorno del mese precedente
      fine = new Date(oggi.getFullYear(), oggi.getMonth(), 0);
      break;
    case 'due-precedenti':
      // Primo giorno di due mesi fa
      inizio = new Date(oggi.getFullYear(), oggi.getMonth() - 2, 1);
      // Ultimo giorno di due mesi fa
      fine = new Date(oggi.getFullYear(), oggi.getMonth() - 1, 0);
      break;
    default:
      return;
  }

  // Forza l'orario a mezzogiorno per evitare problemi di timezone
  inizio.setHours(12, 0, 0, 0);
  fine.setHours(12, 0, 0, 0);

  if (dataInizio) {
    dataInizio.value = inizio.toISOString().split('T')[0];
  }
  if (dataFine) {
    dataFine.value = fine.toISOString().split('T')[0];
  }

  console.log(`📅 Range aggiornato (${valore}):`, {
    inizio: inizio.toISOString().split('T')[0],
    fine: fine.toISOString().split('T')[0]
  });
}

// Funzione per aggiungere opzione personalizzato
export function aggiungiOpzionePersonalizzato(selectFiltro) {
  if (!selectFiltro) return;

  if (!selectFiltro.querySelector('option[value="personalizzato"]')) {
    const opzionePersonalizzata = document.createElement('option');
    opzionePersonalizzata.value = 'personalizzato';
    opzionePersonalizzata.textContent = 'Periodo personalizzato';
    selectFiltro.appendChild(opzionePersonalizzata);
  }

  selectFiltro.value = 'personalizzato';
  selectFiltro.style.borderColor = '#fbbf24';
  selectFiltro.style.color = '#fbbf24';
}
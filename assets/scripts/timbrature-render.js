// timbrature-render.js

import { calcolaOreLavorate, formattaOre, normalizzaData } from './calendar-utils.js';
import { apriModaleModifica } from './modale-modifica.js';

// Helper functions for date range iteration
function toISODate(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).toISOString().slice(0, 10);
}

function eachDay(startDate, endDate) {
  const out = [];
  const d = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
  const end = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
  while (d <= end) {
    out.push(new Date(d));
    d.setDate(d.getDate() + 1);
  }
  return out;
}

export function renderizzaTabella(dipendente, timbrature, dataInizio, dataFine, tbody, footerTbody, pin) {
  tbody.innerHTML = "";
  footerTbody.innerHTML = "";

  if (!timbrature || timbrature.length === 0) {
    const messaggioVuoto = dipendente
      ? `Nessun record per ${dipendente.nome} ${dipendente.cognome} nel periodo ${dataInizio} ÷ ${dataFine}`
      : `Nessun record per PIN ${pin} nel periodo selezionato`;

    tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: #fbbf24; padding: 40px; background: rgba(251, 191, 36, 0.1); border-radius: 8px;">
      <strong>📭 ${messaggioVuoto}</strong><br>
      <small style="color: #94a3b8; margin-top: 10px; display: block;">
        Verifica che esistano timbrature nel range selezionato o prova un periodo diverso
      </small>
    </td></tr>`;

    // Reset totale footer
    if (footerTbody) {
      const footerRow = footerTbody.querySelector('tr');
      if (footerRow) {
        const cells = footerRow.querySelectorAll('td');
        if (cells[4]) cells[4].textContent = '—';
        if (cells[5]) cells[5].textContent = '';
      }
    }

    return { totaleMensile: '—' };
  }

  // Fix timezone issues - use local date parsing
  const [annoInizio, meseInizio, giornoInizio] = dataInizio.split('-').map(Number);
  const [annoFine, meseFine, giornoFine] = dataFine.split('-').map(Number);
  const start = new Date(annoInizio, meseInizio - 1, giornoInizio);
  const end = new Date(annoFine, meseFine - 1, giornoFine);
  const giorniSettimana = ["Domenica", "Lunedì", "Martedì", "Mercoledì", "Giovedì", "Venerdì", "Sabato"];

  // Build timbrature map by date for quick lookup
  const byDate = new Map();
  if (timbrature && timbrature.length > 0) {
    for (const t of timbrature) {
      const key = normalizzaData(t.giornologico || t.data);
      if (!byDate.has(key)) {
        byDate.set(key, []);
      }
      byDate.get(key).push(t);
    }
  }

  // Generate all days in range
  const days = eachDay(start, end);
  let totaleMensileOre = 0;
  let totaleMensileExtra = 0;

  for (const current of days) {
    const dataISO = toISODate(current);
    const giornoSettimana = giorniSettimana[current.getDay()];
    const giornoNumero = current.getDate().toString().padStart(2, "0");
    const dataFormattata = `${giornoNumero} ${giornoSettimana}`;

    const timbratureOggi = byDate.get(dataISO) || [];
    const timbratureEntrata = timbratureOggi.filter(t => t.tipo === "entrata").sort((a, b) => a.ore.localeCompare(b.ore));
    const timbratureUscita = timbratureOggi.filter(t => t.tipo === "uscita").sort((a, b) => a.ore.localeCompare(b.ore));

    let oreTotaliGiorno = 0;
    if (timbratureEntrata.length > 0 && timbratureUscita.length > 0) {
      const entrata = timbratureEntrata[0];
      const uscita = timbratureUscita[timbratureUscita.length - 1];
      oreTotaliGiorno = calcolaOreLavorate(entrata.ore, uscita.ore);
    }

    const entrataDisplay = timbratureEntrata.length > 0 ? timbratureEntrata[0].ore.slice(0, 5) : '—';
    const uscitaDisplay = timbratureUscita.length > 0 ? timbratureUscita[timbratureUscita.length - 1].ore.slice(0, 5) : '—';
    const oreDisplay = oreTotaliGiorno.toFixed(2);

    const oreContrattuali = parseFloat(dipendente?.ore_contrattuali) || 8.00;
    const oreExtra = Math.max(0, oreTotaliGiorno - oreContrattuali);
    let extraContent = '';
    if (oreExtra > 0) {
      extraContent = `<span style="color: #fbbf24; font-weight: bold;">${oreExtra.toFixed(2)}</span>`;
      totaleMensileExtra += oreExtra;
    }

    const timbraturaId = timbratureEntrata.length > 0 ? timbratureEntrata[0].id : 'nuovo';
    const hasTimbrature = timbratureOggi.length > 0;

    // Calcola il mese per questa riga
    const mesiItaliani = [
      "Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno",
      "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"
    ];
    const meseAnno = `${mesiItaliani[current.getMonth()]} ${current.getFullYear()}`;

    const riga = document.createElement("tr");
    if (current.getDay() === 0 || current.getDay() === 6) riga.classList.add('weekend');
    riga.innerHTML = `
      <td style="text-align: left;">${dataFormattata}</td>
      <td style="text-align: center; color: #94a3b8; font-size: 0.9em;">${meseAnno}</td>
      <td>${entrataDisplay}</td>
      <td>${uscitaDisplay}</td>
      <td style="color: #ffff99;">${oreDisplay}</td>
      <td style="text-align: center;">${extraContent}</td>
      <td style="text-align: center;">
        <img
          src="/assets/icons/matita-colorata.png"
          class="modifica-icon"
          data-data="${dataISO}"
          data-timbratura-id="${timbraturaId}"
          title="Modifica"
          alt="Modifica"
          style="margin-right: 8px;"
        />
      </td>
    `;

    tbody.appendChild(riga);
    totaleMensileOre += oreTotaliGiorno;

    // Aggiungi evento click al pulsante modifica
    const btnModifica = riga.querySelector('.modifica-icon');
    if (btnModifica) {
      btnModifica.addEventListener('click', (e) => {
        e.preventDefault();
        apriModaleModifica(dataISO, timbratureEntrata, timbratureUscita, pin, timbraturaId);
      });
    }
  }

  const rigaTotale = document.createElement("tr");
  let totaleExtraContent = '';
  if (totaleMensileExtra > 0) {
    totaleExtraContent = `<span style="color: #fbbf24; font-weight: bold;">${formattaOre(totaleMensileExtra)}</span>`;
  }
  rigaTotale.innerHTML = `
    <td style="text-align:left;">TOTALE MENSILE</td>
    <td></td>
    <td></td>
    <td></td>
    <td style="color: #ffff99;">${totaleMensileOre.toFixed(2)}</td>
    <td style="text-align: center;">${totaleExtraContent}</td>
    <td></td>
  `;
  footerTbody.appendChild(rigaTotale);

  return {
    totaleMensile: totaleMensileOre.toFixed(2),
    totaleMensileExtra: totaleMensileExtra,
  };
}// CACHE BUSTER: 1757371014
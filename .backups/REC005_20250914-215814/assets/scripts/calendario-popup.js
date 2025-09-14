// calendario-popup.js - Gestione calendario visuale per date picker

export class CalendarioPopup {
  constructor() {
    this.calendarioAttivo = null;
    this.campoAttivo = null;
    this.init();
  }

  init() {
    // Gestisce clic sulle icone calendario
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('icona-calendario-campo')) {
        e.preventDefault();
        e.stopPropagation();
        const campoId = e.target.dataset.campo;
        this.mostraCalendario(campoId, e.target);
      } else if (!e.target.closest('.calendario-popup')) {
        this.nascondiCalendario();
      }
    });

    console.log('🗓️ Sistema calendario inizializzato');
  }

  mostraCalendario(campoId, iconaElemento) {
    console.log('📅 Mostro calendario per campo:', campoId);

    this.nascondiCalendario();

    const campo = document.getElementById(campoId);
    if (!campo) {
      console.error('❌ Campo non trovato:', campoId);
      return;
    }

    this.campoAttivo = campo;
    this.calendarioAttivo = this.creaCalendario();

    // Posiziona il calendario vicino all'icona
    const rect = iconaElemento.getBoundingClientRect();
    this.calendarioAttivo.style.position = 'fixed';
    this.calendarioAttivo.style.top = (rect.bottom + 5) + 'px';
    this.calendarioAttivo.style.left = Math.max(10, rect.left - 100) + 'px';
    this.calendarioAttivo.style.zIndex = '10000';
    this.calendarioAttivo.style.display = 'block';

    document.body.appendChild(this.calendarioAttivo);

    // Imposta la data corrente se presente
    if (campo.value) {
      this.impostaData(new Date(campo.value + 'T12:00:00'));
    } else {
      this.impostaData(new Date());
    }
  }

  nascondiCalendario() {
    if (this.calendarioAttivo) {
      this.calendarioAttivo.remove();
      this.calendarioAttivo = null;
      this.campoAttivo = null;
    }
  }

  creaCalendario() {
    const calendario = document.createElement('div');
    calendario.className = 'calendario-popup';

    calendario.innerHTML = `
      <div class="calendario-header">
        <button type="button" class="btn-nav-calendario" data-azione="prev-mese">‹</button>
        <div class="calendario-mese-anno" id="mese-anno-display"></div>
        <button type="button" class="btn-nav-calendario" data-azione="next-mese">›</button>
      </div>

      <div class="calendario-giorni-settimana">
        <div class="giorno-settimana">Dom</div>
        <div class="giorno-settimana">Lun</div>
        <div class="giorno-settimana">Mar</div>
        <div class="giorno-settimana">Mer</div>
        <div class="giorno-settimana">Gio</div>
        <div class="giorno-settimana">Ven</div>
        <div class="giorno-settimana">Sab</div>
      </div>

      <div class="calendario-griglia" id="calendario-griglia"></div>

      <div class="calendario-footer">
        <button type="button" class="btn-oggi">Oggi</button>
        <button type="button" class="btn-chiudi-calendario">Chiudi</button>
      </div>
    `;

    // Event listeners per i controlli
    calendario.addEventListener('click', (e) => {
      e.stopPropagation();

      if (e.target.classList.contains('btn-nav-calendario')) {
        const azione = e.target.dataset.azione;
        if (azione === 'prev-mese') {
          this.dataCorrente.setMonth(this.dataCorrente.getMonth() - 1);
        } else if (azione === 'next-mese') {
          this.dataCorrente.setMonth(this.dataCorrente.getMonth() + 1);
        }
        this.aggiornaCalendario();
      } else if (e.target.classList.contains('giorno-calendario')) {
        const giorno = parseInt(e.target.dataset.giorno);
        if (!isNaN(giorno)) {
          this.selezionaGiorno(giorno);
        }
      } else if (e.target.classList.contains('btn-oggi')) {
        this.impostaData(new Date());
        this.selezionaOggi();
      } else if (e.target.classList.contains('btn-chiudi-calendario')) {
        this.nascondiCalendario();
      }
    });

    return calendario;
  }

  impostaData(data) {
    this.dataCorrente = new Date(data);
    this.aggiornaCalendario();
  }

  aggiornaCalendario() {
    const mesi = [
      'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
      'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'
    ];

    // Aggiorna header
    const display = this.calendarioAttivo.querySelector('#mese-anno-display');
    display.textContent = `${mesi[this.dataCorrente.getMonth()]} ${this.dataCorrente.getFullYear()}`;

    // Genera griglia giorni
    const griglia = this.calendarioAttivo.querySelector('#calendario-griglia');
    griglia.innerHTML = '';

    const primoGiorno = new Date(this.dataCorrente.getFullYear(), this.dataCorrente.getMonth(), 1);
    const ultimoGiorno = new Date(this.dataCorrente.getFullYear(), this.dataCorrente.getMonth() + 1, 0);

    // Giorni del mese precedente per riempire la prima settimana
    const giorniPrecedenti = primoGiorno.getDay();
    for (let i = giorniPrecedenti - 1; i >= 0; i--) {
      const giorno = new Date(primoGiorno);
      giorno.setDate(giorno.getDate() - i - 1);
      this.aggiungiGiornoCalendario(griglia, giorno, true);
    }

    // Giorni del mese corrente
    for (let giorno = 1; giorno <= ultimoGiorno.getDate(); giorno++) {
      const data = new Date(this.dataCorrente.getFullYear(), this.dataCorrente.getMonth(), giorno);
      this.aggiungiGiornoCalendario(griglia, data, false);
    }

    // Giorni del mese successivo per completare l'ultima settimana
    const giorniSuccessivi = 42 - griglia.children.length; // 6 settimane * 7 giorni
    for (let i = 1; i <= giorniSuccessivi; i++) {
      const giorno = new Date(ultimoGiorno);
      giorno.setDate(ultimoGiorno.getDate() + i);
      this.aggiungiGiornoCalendario(griglia, giorno, true);
    }
  }

  aggiungiGiornoCalendario(griglia, data, altroMese) {
    const oggi = new Date();
    const giornoElement = document.createElement('div');
    giornoElement.className = 'giorno-calendario';
    giornoElement.textContent = data.getDate();
    giornoElement.dataset.giorno = data.getDate();
    giornoElement.dataset.data = data.toISOString().split('T')[0];

    if (altroMese) {
      giornoElement.classList.add('altro-mese');
    }

    // Evidenzia oggi
    if (data.toDateString() === oggi.toDateString()) {
      giornoElement.classList.add('oggi');
    }

    // Evidenzia giorno selezionato
    if (this.campoAttivo && this.campoAttivo.value === data.toISOString().split('T')[0]) {
      giornoElement.classList.add('selezionato');
    }

    griglia.appendChild(giornoElement);
  }

  selezionaGiorno(giorno) {
    const dataSelezionata = new Date(this.dataCorrente.getFullYear(), this.dataCorrente.getMonth(), giorno);
    const dataISO = dataSelezionata.toISOString().split('T')[0];

    if (this.campoAttivo) {
      this.campoAttivo.value = dataISO;
      this.campoAttivo.dispatchEvent(new Event('change', { bubbles: true }));
    }

    this.nascondiCalendario();
    console.log('📅 Data selezionata:', dataISO);
  }

  selezionaOggi() {
    const oggi = new Date();
    const dataISO = oggi.toISOString().split('T')[0];

    if (this.campoAttivo) {
      this.campoAttivo.value = dataISO;
      this.campoAttivo.dispatchEvent(new Event('change', { bubbles: true }));
    }

    this.nascondiCalendario();
    console.log('📅 Oggi selezionato:', dataISO);
  }
}

// Inizializza automaticamente quando il DOM è pronto
document.addEventListener('DOMContentLoaded', () => {
  new CalendarioPopup();
});
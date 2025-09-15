// Period Selector V2 - Shadow Mode Implementation
// Nuova logica selettore periodo isolata per testing sicuro

import FeatureFlags from './feature-flags.js';

class PeriodSelectorV2 {
  constructor() {
    this.isEnabled = FeatureFlags.isPeriodSelectorV2Enabled();
    this.currentPeriod = null;
    this.listeners = [];
    
    if (this.isEnabled) {
      console.log('🔄 [PeriodV2] Shadow mode ATTIVO');
      this.init();
    }
  }
  
  init() {
    // Inizializza con periodo mese corrente
    this.currentPeriod = this.getDefaultPeriod();
    this.setupShadowUI();
    this.bindEvents();
    
    console.log('📅 [PeriodV2] Inizializzato con periodo:', this.currentPeriod);
  }
  
  getDefaultPeriod() {
    const oggi = new Date();
    const anno = oggi.getFullYear();
    const mese = oggi.getMonth();
    
    return {
      inizio: new Date(anno, mese, 1).toISOString().split('T')[0],
      fine: new Date(anno, mese + 1, 0).toISOString().split('T')[0],
      modalita: 'corrente'
    };
  }
  
  setupShadowUI() {
    // Trova il select esistente e aggiungi opzione shadow
    const selectFiltro = document.getElementById('filtro-mese');
    if (!selectFiltro) return;
    
    // Aggiungi opzione nascosta per testing
    const shadowOption = document.createElement('option');
    shadowOption.value = 'custom-v2';
    shadowOption.textContent = 'Periodo personalizzato (Beta)';
    shadowOption.style.display = 'none'; // Nascosta di default
    selectFiltro.appendChild(shadowOption);
    
    // Crea container shadow (nascosto di default)
    const shadowContainer = document.createElement('div');
    shadowContainer.id = 'period-v2-shadow';
    shadowContainer.className = 'period-v2-shadow';
    shadowContainer.style.display = 'none';
    shadowContainer.innerHTML = `
      <div class="shadow-period-controls">
        <label>Dal: <input type="date" id="shadow-data-inizio" /></label>
        <label>Al: <input type="date" id="shadow-data-fine" /></label>
        <button type="button" id="shadow-applica" class="btn-shadow">Applica (V2)</button>
      </div>
    `;
    
    // Inserisci dopo il filtro esistente
    const filtroContainer = selectFiltro.closest('.filtro-temporale');
    if (filtroContainer) {
      filtroContainer.appendChild(shadowContainer);
    }
    
    console.log('🎭 [PeriodV2] Shadow UI creata (nascosta)');
  }
  
  bindEvents() {
    const selectFiltro = document.getElementById('filtro-mese');
    const shadowContainer = document.getElementById('period-v2-shadow');
    const shadowInizio = document.getElementById('shadow-data-inizio');
    const shadowFine = document.getElementById('shadow-data-fine');
    const shadowApplica = document.getElementById('shadow-applica');
    
    if (!selectFiltro) return;
    
    // Intercetta cambio select
    selectFiltro.addEventListener('change', (e) => {
      if (e.target.value === 'custom-v2') {
        this.showShadowUI();
      } else {
        this.hideShadowUI();
        this.handlePredefinedPeriod(e.target.value);
      }
    });
    
    // Eventi shadow controls
    if (shadowApplica) {
      shadowApplica.addEventListener('click', () => {
        if (shadowInizio?.value && shadowFine?.value) {
          this.setPeriod({
            inizio: shadowInizio.value,
            fine: shadowFine.value,
            modalita: 'custom'
          });
          console.log('📅 [PeriodV2] Periodo personalizzato applicato:', this.currentPeriod);
        }
      });
    }
    
    console.log('🔗 [PeriodV2] Eventi shadow collegati');
  }
  
  showShadowUI() {
    const shadowContainer = document.getElementById('period-v2-shadow');
    const shadowOption = document.querySelector('option[value="custom-v2"]');
    
    if (shadowContainer) {
      shadowContainer.style.display = 'block';
    }
    if (shadowOption) {
      shadowOption.style.display = 'block';
    }
    
    // Popola con periodo corrente
    const shadowInizio = document.getElementById('shadow-data-inizio');
    const shadowFine = document.getElementById('shadow-data-fine');
    
    if (shadowInizio && this.currentPeriod) {
      shadowInizio.value = this.currentPeriod.inizio;
    }
    if (shadowFine && this.currentPeriod) {
      shadowFine.value = this.currentPeriod.fine;
    }
    
    console.log('👁️ [PeriodV2] Shadow UI mostrata');
  }
  
  hideShadowUI() {
    const shadowContainer = document.getElementById('period-v2-shadow');
    if (shadowContainer) {
      shadowContainer.style.display = 'none';
    }
    console.log('🙈 [PeriodV2] Shadow UI nascosta');
  }
  
  handlePredefinedPeriod(modalita) {
    let periodo;
    
    switch (modalita) {
      case 'corrente':
        periodo = this.getMonthOffset(0);
        break;
      case 'precedente':
        periodo = this.getMonthOffset(-1);
        break;
      case 'due-precedenti':
        periodo = this.getMonthOffset(-2);
        break;
      default:
        periodo = this.getDefaultPeriod();
    }
    
    periodo.modalita = modalita;
    this.setPeriod(periodo);
    
    console.log('📅 [PeriodV2] Periodo predefinito:', modalita, periodo);
  }
  
  getMonthOffset(offset) {
    const oggi = new Date();
    const anno = oggi.getFullYear();
    const mese = oggi.getMonth() + offset;
    
    const dataCorretta = new Date(anno, mese, 1);
    const annoCorretto = dataCorretta.getFullYear();
    const meseCorretto = dataCorretta.getMonth();
    
    return {
      inizio: new Date(annoCorretto, meseCorretto, 1).toISOString().split('T')[0],
      fine: new Date(annoCorretto, meseCorretto + 1, 0).toISOString().split('T')[0]
    };
  }
  
  setPeriod(periodo) {
    this.currentPeriod = { ...periodo };
    this.notifyListeners();
  }
  
  getPeriod() {
    return this.currentPeriod ? { ...this.currentPeriod } : this.getDefaultPeriod();
  }
  
  addListener(callback) {
    this.listeners.push(callback);
  }
  
  notifyListeners() {
    this.listeners.forEach(callback => {
      try {
        callback(this.currentPeriod);
      } catch (error) {
        console.error('🚨 [PeriodV2] Errore listener:', error);
      }
    });
  }
  
  // API pubblica per export
  getCurrentPeriodForExport() {
    const periodo = this.getPeriod();
    console.log('📤 [PeriodV2] Periodo per export:', periodo);
    return periodo;
  }
}

// Singleton shadow
window.PeriodSelectorV2 = window.PeriodSelectorV2 || new PeriodSelectorV2();

export default window.PeriodSelectorV2;

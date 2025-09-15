// Period SSOT (Single Source of Truth) - Interface unificata
// Contratto per accesso periodo corrente con fallback sicuro

import FeatureFlags from './feature-flags.js';

class PeriodSSOT {
  constructor() {
    this.isV2Enabled = FeatureFlags.isPeriodSelectorV2Enabled();
    this.init();
  }
  
  init() {
    if (this.isV2Enabled) {
      console.log('🔄 [SSOT] Modalità V2 attiva - usando PeriodSelectorV2');
    } else {
      console.log('🔄 [SSOT] Modalità legacy attiva - usando logica esistente');
    }
  }
  
  // API unificata per ottenere periodo corrente
  getCurrentPeriod() {
    if (this.isV2Enabled && window.PeriodSelectorV2) {
      // Usa nuova logica V2
      return window.PeriodSelectorV2.getPeriod();
    } else {
      // Usa logica esistente (legacy)
      return this.getLegacyPeriod();
    }
  }
  
  // Fallback alla logica esistente
  getLegacyPeriod() {
    const dataInizio = document.getElementById('data-inizio');
    const dataFine = document.getElementById('data-fine');
    const selectFiltro = document.getElementById('filtro-mese');
    
    if (dataInizio?.value && dataFine?.value) {
      return {
        inizio: dataInizio.value,
        fine: dataFine.value,
        modalita: selectFiltro?.value || 'corrente'
      };
    }
    
    // Default: mese corrente
    const oggi = new Date();
    const anno = oggi.getFullYear();
    const mese = oggi.getMonth();
    
    return {
      inizio: new Date(anno, mese, 1).toISOString().split('T')[0],
      fine: new Date(anno, mese + 1, 0).toISOString().split('T')[0],
      modalita: 'corrente'
    };
  }
  
  // API per export (con telemetria)
  getPeriodForExport() {
    const periodo = this.getCurrentPeriod();
    
    if (this.isV2Enabled) {
      console.log('📤 [SSOT] Export usando V2:', periodo);
    } else {
      console.log('📤 [SSOT] Export usando legacy:', periodo);
    }
    
    return periodo;
  }
  
  // Verifica validità periodo
  isValidPeriod(periodo) {
    if (!periodo || !periodo.inizio || !periodo.fine) {
      return false;
    }
    
    const inizio = new Date(periodo.inizio);
    const fine = new Date(periodo.fine);
    
    return inizio <= fine;
  }
  
  // Normalizza periodo (swap se necessario)
  normalizePeriod(periodo) {
    if (!this.isValidPeriod(periodo)) {
      console.warn('⚠️ [SSOT] Periodo invalido, usando default');
      return this.getLegacyPeriod();
    }
    
    const inizio = new Date(periodo.inizio);
    const fine = new Date(periodo.fine);
    
    if (inizio > fine) {
      console.log('🔄 [SSOT] Swap date necessario');
      return {
        ...periodo,
        inizio: periodo.fine,
        fine: periodo.inizio
      };
    }
    
    return periodo;
  }
  
  // Debug info
  getDebugInfo() {
    return {
      isV2Enabled: this.isV2Enabled,
      currentPeriod: this.getCurrentPeriod(),
      source: this.isV2Enabled ? 'PeriodSelectorV2' : 'Legacy'
    };
  }
}

// Singleton globale
window.PeriodSSOT = window.PeriodSSOT || new PeriodSSOT();

export default window.PeriodSSOT;

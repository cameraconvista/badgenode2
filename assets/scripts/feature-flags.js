// Feature Flags System - BadgeNode
// Gestione centralizzata feature flags per sviluppo sicuro

class FeatureFlags {
  constructor() {
    this.flags = {
      // SHADOW MODE: Nuova selezione periodo (default OFF)
      'storico-period-selector-v2': false
    };
    
    this.init();
  }
  
  init() {
    // Leggi override da URL params (per testing dev)
    const urlParams = new URLSearchParams(window.location.search);
    const flagOverride = urlParams.get('ff-period-v2');
    
    if (flagOverride === 'true' || flagOverride === '1') {
      this.flags['storico-period-selector-v2'] = true;
      console.log('🚩 [FeatureFlag] storico-period-selector-v2 ENABLED via URL param');
    } else if (flagOverride === 'false' || flagOverride === '0') {
      this.flags['storico-period-selector-v2'] = false;
      console.log('🚩 [FeatureFlag] storico-period-selector-v2 DISABLED via URL param');
    }
    
    // Leggi override da localStorage (per testing persistente)
    const localOverride = localStorage.getItem('ff-period-v2');
    if (localOverride === 'true') {
      this.flags['storico-period-selector-v2'] = true;
      console.log('🚩 [FeatureFlag] storico-period-selector-v2 ENABLED via localStorage');
    } else if (localOverride === 'false') {
      this.flags['storico-period-selector-v2'] = false;
      console.log('🚩 [FeatureFlag] storico-period-selector-v2 DISABLED via localStorage');
    }
  }
  
  isEnabled(flagName) {
    return this.flags[flagName] || false;
  }
  
  // Metodi helper per flag specifici
  isPeriodSelectorV2Enabled() {
    return this.isEnabled('storico-period-selector-v2');
  }
  
  // Debug info
  getStatus() {
    return {
      'storico-period-selector-v2': this.isPeriodSelectorV2Enabled()
    };
  }
}

// Singleton globale
window.FeatureFlags = window.FeatureFlags || new FeatureFlags();

// Export per moduli ES6
export default window.FeatureFlags;

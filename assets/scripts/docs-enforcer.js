// 📚 DOCS ENFORCER - Forza lettura documentazione all'apertura progetto
// Sistema che obbliga a leggere i file informativi alla prima apertura su Windsurf

class DocsEnforcer {
  constructor() {
    this.STORAGE_KEY = 'badgenode_docs_read_status';
    this.DOCS_VERSION = '2025-09-15'; // Aggiorna quando cambi la documentazione
    this.requiredDocs = [
      {
        path: 'docs/onboarding/README_BADGENODE.md',
        title: 'Panoramica Progetto BadgeNode',
        description: 'Stack tecnologico, flussi principali, struttura cartelle'
      },
      {
        path: 'docs/onboarding/SUPABASE_SYNC.md', 
        title: 'Sincronizzazione Supabase',
        description: 'Tabelle, viste, real-time, RLS policies'
      },
      {
        path: 'docs/database/DB_SCHEMA.md',
        title: 'Schema Database',
        description: 'Relazioni, indici, ottimizzazioni, constraint'
      },
      {
        path: 'docs/api/API_REFERENCE.md',
        title: 'API Reference PostgREST',
        description: 'Endpoints, query patterns, esempi pratici'
      }
    ];
  }

  // Verifica se la documentazione è già stata letta per questa versione
  isDocsRead() {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return false;
      
      const data = JSON.parse(stored);
      return data.version === this.DOCS_VERSION && data.allRead === true;
    } catch (error) {
      console.warn('🔧 Errore lettura stato documentazione:', error);
      return false;
    }
  }

  // Marca la documentazione come letta
  markDocsAsRead() {
    try {
      const data = {
        version: this.DOCS_VERSION,
        allRead: true,
        readAt: new Date().toISOString(),
        userAgent: navigator.userAgent
      };
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
      console.log('✅ Documentazione marcata come letta');
    } catch (error) {
      console.error('❌ Errore salvataggio stato documentazione:', error);
    }
  }

  // Carica il contenuto di un file di documentazione
  async loadDocContent(docPath) {
    try {
      const response = await fetch(`/${docPath}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.text();
    } catch (error) {
      console.error(`❌ Errore caricamento ${docPath}:`, error);
      return `# Errore Caricamento\n\nImpossibile caricare il file: ${docPath}\n\nErrore: ${error.message}`;
    }
  }

  // Crea il modal di documentazione obbligatoria
  createDocsModal() {
    const modal = document.createElement('div');
    modal.id = 'docs-enforcer-modal';
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.95);
      z-index: 999999;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;

    modal.innerHTML = `
      <div style="
        background: #1e293b;
        border-radius: 16px;
        padding: 32px;
        max-width: 90vw;
        max-height: 90vh;
        overflow-y: auto;
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.8);
        border: 1px solid #334155;
      ">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #f1f5f9; margin: 0 0 8px 0; font-size: 28px; font-weight: 700;">
            📚 Documentazione BadgeNode
          </h1>
          <p style="color: #94a3b8; margin: 0; font-size: 16px;">
            Prima apertura rilevata - Lettura documentazione obbligatoria
          </p>
        </div>

        <div id="docs-tabs" style="
          display: flex;
          gap: 8px;
          margin-bottom: 24px;
          border-bottom: 1px solid #334155;
          overflow-x: auto;
        "></div>

        <div id="docs-content" style="
          background: #0f172a;
          border-radius: 8px;
          padding: 24px;
          min-height: 400px;
          max-height: 60vh;
          overflow-y: auto;
          border: 1px solid #1e293b;
          font-size: 14px;
          line-height: 1.6;
        "></div>

        <div style="
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 24px;
          padding-top: 16px;
          border-top: 1px solid #334155;
        ">
          <div id="read-progress" style="color: #94a3b8; font-size: 14px;"></div>
          <div style="display: flex; gap: 12px;">
            <button id="skip-docs" style="
              background: #374151;
              color: #d1d5db;
              border: none;
              padding: 12px 20px;
              border-radius: 8px;
              cursor: pointer;
              font-size: 14px;
              transition: all 0.2s;
            ">Salta (Sconsigliato)</button>
            <button id="confirm-read" disabled style="
              background: #059669;
              color: white;
              border: none;
              padding: 12px 20px;
              border-radius: 8px;
              cursor: pointer;
              font-size: 14px;
              font-weight: 600;
              transition: all 0.2s;
              opacity: 0.5;
            ">Ho Letto Tutto ✓</button>
          </div>
        </div>
      </div>
    `;

    return modal;
  }

  // Renderizza il contenuto markdown in HTML semplice
  renderMarkdown(content) {
    return content
      .replace(/^# (.*$)/gim, '<h1 style="color: #f1f5f9; font-size: 24px; margin: 24px 0 16px 0; border-bottom: 2px solid #334155; padding-bottom: 8px;">$1</h1>')
      .replace(/^## (.*$)/gim, '<h2 style="color: #e2e8f0; font-size: 20px; margin: 20px 0 12px 0;">$1</h2>')
      .replace(/^### (.*$)/gim, '<h3 style="color: #cbd5e1; font-size: 16px; margin: 16px 0 8px 0;">$1</h3>')
      .replace(/^\- (.*$)/gim, '<li style="color: #94a3b8; margin: 4px 0;">$1</li>')
      .replace(/\*\*(.*?)\*\*/g, '<strong style="color: #f1f5f9;">$1</strong>')
      .replace(/`([^`]+)`/g, '<code style="background: #374151; color: #fbbf24; padding: 2px 6px; border-radius: 4px; font-family: monospace;">$1</code>')
      .replace(/```[\s\S]*?```/g, '<pre style="background: #111827; color: #d1d5db; padding: 16px; border-radius: 8px; overflow-x: auto; margin: 16px 0; border-left: 4px solid #059669;"><code>$&</code></pre>')
      .replace(/✅/g, '<span style="color: #10b981;">✅</span>')
      .replace(/⚠️/g, '<span style="color: #f59e0b;">⚠️</span>')
      .replace(/❌/g, '<span style="color: #ef4444;">❌</span>')
      .replace(/\n/g, '<br>');
  }

  // Inizializza il sistema di tabs e contenuto
  async initializeDocsModal(modal) {
    const tabsContainer = modal.querySelector('#docs-tabs');
    const contentContainer = modal.querySelector('#docs-content');
    const progressElement = modal.querySelector('#read-progress');
    const confirmButton = modal.querySelector('#confirm-read');
    const skipButton = modal.querySelector('#skip-docs');

    let readDocs = new Set();
    let currentDoc = 0;

    // Crea i tabs
    this.requiredDocs.forEach((doc, index) => {
      const tab = document.createElement('button');
      tab.style.cssText = `
        background: ${index === 0 ? '#059669' : '#374151'};
        color: ${index === 0 ? 'white' : '#94a3b8'};
        border: none;
        padding: 12px 16px;
        border-radius: 8px 8px 0 0;
        cursor: pointer;
        font-size: 14px;
        white-space: nowrap;
        transition: all 0.2s;
        border-bottom: 2px solid ${index === 0 ? '#059669' : 'transparent'};
      `;
      tab.textContent = doc.title;
      tab.onclick = () => switchToDoc(index);
      tabsContainer.appendChild(tab);
    });

    // Funzione per cambiare documento
    const switchToDoc = async (index) => {
      currentDoc = index;
      const doc = this.requiredDocs[index];
      
      // Aggiorna tabs
      tabsContainer.querySelectorAll('button').forEach((btn, i) => {
        const isActive = i === index;
        const isRead = readDocs.has(i);
        btn.style.background = isActive ? '#059669' : (isRead ? '#0f766e' : '#374151');
        btn.style.color = isActive || isRead ? 'white' : '#94a3b8';
        btn.style.borderBottom = `2px solid ${isActive ? '#059669' : 'transparent'}`;
      });

      // Carica contenuto
      contentContainer.innerHTML = '<div style="color: #94a3b8; text-align: center; padding: 40px;">Caricamento...</div>';
      const content = await this.loadDocContent(doc.path);
      contentContainer.innerHTML = this.renderMarkdown(content);
      
      // Marca come letto dopo 3 secondi di visualizzazione
      setTimeout(() => {
        readDocs.add(index);
        updateProgress();
      }, 3000);
    };

    // Aggiorna progresso
    const updateProgress = () => {
      const progress = `${readDocs.size}/${this.requiredDocs.length} documenti letti`;
      progressElement.textContent = progress;
      
      if (readDocs.size === this.requiredDocs.length) {
        confirmButton.disabled = false;
        confirmButton.style.opacity = '1';
        confirmButton.style.background = '#059669';
      }
    };

    // Event listeners
    confirmButton.onclick = () => {
      this.markDocsAsRead();
      modal.remove();
      console.log('✅ Documentazione completata - Accesso consentito');
    };

    skipButton.onclick = () => {
      if (confirm('⚠️ Saltare la documentazione potrebbe causare problemi di comprensione del progetto.\n\nSei sicuro di voler continuare?')) {
        modal.remove();
        console.warn('⚠️ Documentazione saltata - Lettura fortemente consigliata');
      }
    };

    // Carica il primo documento
    await switchToDoc(0);
    updateProgress();
  }

  // Forza la lettura della documentazione
  async enforceDocsReading() {
    if (this.isDocsRead()) {
      console.log('✅ Documentazione già letta per questa versione');
      return;
    }

    console.log('📚 Prima apertura rilevata - Caricamento documentazione obbligatoria...');
    
    const modal = this.createDocsModal();
    document.body.appendChild(modal);
    
    await this.initializeDocsModal(modal);
  }

  // Reset stato per testing (solo sviluppo)
  resetDocsStatus() {
    localStorage.removeItem(this.STORAGE_KEY);
    console.log('🔧 Stato documentazione resettato');
  }
}

// Inizializzazione automatica
const docsEnforcer = new DocsEnforcer();

// Export per uso globale
window.docsEnforcer = docsEnforcer;

// Auto-start quando il DOM è pronto
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    docsEnforcer.enforceDocsReading();
  });
} else {
  docsEnforcer.enforceDocsReading();
}

export default docsEnforcer;

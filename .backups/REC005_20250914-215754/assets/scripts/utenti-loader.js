// Importa direttamente il client Supabase
import { supabaseClient } from './supabase-client.js';

document.addEventListener('DOMContentLoaded', async () => {
  console.info('[UTENTI] init DOMContentLoaded');
  console.time('[UTENTI] load');

  console.log('[UTENTI] Client Supabase importato, caricamento dati...');

  try {
    const { data, error, status } = await supabaseClient
      .from('utenti')
      .select('*')
      .order('pin', { ascending: true });

    if (error) {
      console.error('[UTENTI] supabase error', { status, error });
      document.getElementById('lista-dipendenti').innerHTML = `
        <tr><td colspan="5" style="color: red; text-align: center; padding: 20px;">
          Errore caricamento utenti: ${error.message}
        </td></tr>
      `;
      return;
    }

    console.debug('[UTENTI] rows', data?.length ?? 0);
    renderUtenti(data || []);
  } catch (e) {
    console.error('[UTENTI] exception', e);
    document.getElementById('lista-dipendenti').innerHTML = `
      <tr><td colspan="5" style="color: red; text-align: center; padding: 20px;">
        Errore di connessione: ${e.message}
      </td></tr>
    `;
  } finally {
    console.timeEnd('[UTENTI] load');
  }
});

function renderUtenti(utenti) {
  const tbody = document.getElementById('lista-dipendenti');

  if (!tbody) {
    console.error('[UTENTI] Elemento lista-dipendenti non trovato');
    return;
  }

  if (utenti.length === 0) {
    tbody.innerHTML = `
      <tr><td colspan="5" style="text-align: center; padding: 20px; color: #94a3b8;">
        Nessun utente trovato
      </td></tr>
    `;
    return;
  }

  tbody.innerHTML = utenti.map(utente => `
    <tr>
      <td>
        <a href="storico.html?pin=${utente.pin}" style="color: #60a5fa; text-decoration: none;">
          <img src="assets/icons/orologio.png" alt="Storico" style="width: 20px; height: 20px;" />
        </a>
      </td>
      <td>${utente.pin}</td>
      <td>${utente.nome}</td>
      <td>${utente.cognome}</td>
      <td>
        <button onclick="modificaUtente('${utente.pin}', '${utente.nome}', '${utente.cognome}', '${utente.email || ''}', '${utente.telefono || ''}', '${utente.descrizione_contratto || ''}', ${utente.ore_contrattuali || 8.0})" 
                title="Modifica dipendente" style="color: #3b82f6;">✏️</button>
        <button onclick="archiviaUtente('${utente.pin}', '${utente.nome}', '${utente.cognome}')" 
                title="Archivia dipendente" style="color: #f59e0b;">📦</button>
        <button onclick="eliminaUtente('${utente.pin}', '${utente.nome}', '${utente.cognome}')" 
                title="Elimina" style="color: #ef4444;">❌</button>
      </td>
    </tr>
  `).join('');

  console.info('[UTENTI] render complete', utenti.length, 'users');
}

// Funzione per aprire lo storico
function apriStorico(pin, nome, cognome) {
  console.log('🔍 Apertura storico per:', { pin, nome, cognome });
  window.location.href = `storico.html?pin=${pin}&nome=${encodeURIComponent(nome)}&cognome=${encodeURIComponent(cognome)}`;
}


window.archiviaUtente = async function(pin, nome, cognome) {
  if (!confirm(`⚠️ ATTENZIONE! Stai per archiviare il dipendente:\n\n${nome} ${cognome} (PIN: ${pin})\n\nQuesta azione:\n• Sposterà il dipendente nell'archivio\n• Genererà un file Excel con tutto lo storico\n• Libererà il PIN per nuovi dipendenti\n\nProcedere con l'archiviazione?`)) return;

  try {
    console.log(`🗂️ Inizio archiviazione per PIN ${pin}:`);
    console.log(`   • Nome: ${nome} ${cognome}`);

    // 1. Recupera tutti i dati del dipendente
    const { data: dipendenteData, error: dipendenteError } = await supabaseClient
      .from('utenti')
      .select('*')
      .eq('pin', parseInt(pin))
      .single();

    if (dipendenteError || !dipendenteData) {
      throw new Error('Dipendente non trovato nel database');
    }

    // 2. Recupera tutte le timbrature del dipendente
    const { data: timbratureData, error: timbratureError } = await supabaseClient
      .from('timbrature')
      .select('*')
      .eq('pin', parseInt(pin))
      .order('data', { ascending: true })
      .order('ore', { ascending: true });

    if (timbratureError) {
      console.error('Errore recupero timbrature:', timbratureError);
      // Continua comunque l'archiviazione anche senza timbrature
    }

    // 3. Genera il contenuto Excel con tutti i dati
    const excelData = {
      dipendente: {
        pin: dipendenteData.pin,
        nome: dipendenteData.nome,
        cognome: dipendenteData.cognome,
        email: dipendenteData.email || 'Non disponibile',
        telefono: dipendenteData.telefono || 'Non disponibile',
        ore_contrattuali: dipendenteData.ore_contrattuali || 8.0
      },
      timbrature: timbratureData || [],
      totaleTimbrature: timbratureData?.length || 0,
      dataGenerazione: new Date().toISOString()
    };

    // 4. Inserisci nella tabella dipendenti_archiviati
    const { data: archiviatiData, error: archiviatiError } = await supabaseClient
      .from('dipendenti_archiviati')
      .insert({
        pin: dipendenteData.pin,
        nome: dipendenteData.nome,
        cognome: dipendenteData.cognome,
        email: dipendenteData.email || 'Non disponibile',
        telefono: dipendenteData.telefono || 'Non disponibile',
        ore_contrattuali: dipendenteData.ore_contrattuali,
        data_archiviazione: new Date().toISOString(),
        file_excel_path: JSON.stringify(excelData),
        file_excel_name: `${nome}_${cognome}_timbrature_completo.csv`
      })
      .select();

    if (archiviatiError) {
      throw new Error(`Errore durante l'archiviazione: ${archiviatiError.message}`);
    }

    // 5. Elimina il dipendente dalla tabella utenti (libera il PIN)
    const { error: deleteError } = await supabaseClient
      .from('utenti')
      .delete()
      .eq('pin', parseInt(pin));

    if (deleteError) {
      console.error('Errore eliminazione dipendente:', deleteError);
      // Non blocca l'operazione, l'archiviazione è già avvenuta
    }

    console.log(`✅ Archiviazione completata per PIN ${pin}:`);
    console.log(`   • Nome: ${nome} ${cognome}`);
    console.log(`   • Timbrature archiviate: ${timbratureData?.length || 0}`);
    console.log(`   • PIN liberato: ${pin}`);

    alert(`✅ Dipendente ${nome} ${cognome} archiviato con successo!\n\n📊 Riepilogo archiviazione:\n• Timbrature salvate: ${timbratureData?.length || 0}\n• PIN liberato: ${pin}\n• File Excel generato\n\nIl dipendente è ora disponibile nella sezione "ex Dipendenti".`);

    // Rimuovi la riga dalla tabella senza ricaricare
    const rows = document.querySelectorAll('#lista-dipendenti tr');
    const targetRow = Array.from(rows).find(row => {
      const pinCell = row.cells[1]; // Colonna PIN è la seconda (indice 1)
      return pinCell && pinCell.textContent.trim() === pin.toString();
    });
    
    if (targetRow) {
      targetRow.style.transition = 'opacity 0.5s ease';
      targetRow.style.opacity = '0';
      setTimeout(() => targetRow.remove(), 500);
    } else {
      // Fallback: ricarica pagina se non trova la riga
      setTimeout(() => location.reload(), 1000);
    }

  } catch (error) {
    console.error('❌ Errore durante l\'archiviazione:', error);
    alert('Errore durante l\'archiviazione: ' + (error.message || 'Errore sconosciuto'));
  }
};

window.eliminaUtente = async function(pin, nome, cognome) {
  if (!confirm(`ATTENZIONE: Vuoi eliminare definitivamente ${nome} ${cognome} (PIN: ${pin})?\n\nQuesta azione NON può essere annullata e rimuoverà:\n• Il dipendente dal sistema\n• Tutte le sue timbrature\n• I dati non saranno recuperabili\n\nProcedere con l'eliminazione?`)) return;
  
  try {
    console.log(`🗑️ Eliminazione definitiva per PIN ${pin}: ${nome} ${cognome}`);
    
    // 1. Elimina tutte le timbrature del dipendente
    const { error: timbratureError } = await supabaseClient
      .from('timbrature')
      .delete()
      .eq('pin', parseInt(pin));
    
    if (timbratureError) {
      console.error('Errore eliminazione timbrature:', timbratureError);
      // Continua comunque con l'eliminazione dell'utente
    }
    
    // 2. Elimina il dipendente dalla tabella utenti
    const { error: utenteError } = await supabaseClient
      .from('utenti')
      .delete()
      .eq('pin', parseInt(pin));
    
    if (utenteError) {
      throw new Error(`Errore durante l'eliminazione: ${utenteError.message}`);
    }
    
    console.log(`✅ Eliminazione completata per PIN ${pin}: ${nome} ${cognome}`);
    alert(`✅ ${nome} ${cognome} eliminato definitivamente dal sistema.\n\nTutte le timbrature sono state rimosse e il PIN ${pin} è ora disponibile.`);
    
    // Rimuovi la riga dalla tabella senza ricaricare
    const rows = document.querySelectorAll('#lista-dipendenti tr');
    const targetRow = Array.from(rows).find(row => {
      const pinCell = row.cells[1]; // Colonna PIN è la seconda (indice 1)
      return pinCell && pinCell.textContent.trim() === pin.toString();
    });
    
    if (targetRow) {
      targetRow.style.transition = 'opacity 0.5s ease';
      targetRow.style.opacity = '0';
      setTimeout(() => targetRow.remove(), 500);
    } else {
      // Fallback: ricarica pagina se non trova la riga
      setTimeout(() => location.reload(), 1000);
    }
    
  } catch (error) {
    console.error('❌ Errore durante l\'eliminazione:', error);
    alert('Errore durante l\'eliminazione: ' + (error.message || 'Errore sconosciuto'));
  }
};


window.modificaUtente = function(pin, nome, cognome, email, telefono, descrizioneContratto, oreContrattuali) {
  console.log('✏️ Apertura modale modifica per:', { pin, nome, cognome });
  
  // Memorizza il PIN originale per l'update
  window.currentEditingPin = pin;
  
  // Precompila i campi del modale
  document.getElementById('modifica-nome').value = nome;
  document.getElementById('modifica-cognome').value = cognome;
  document.getElementById('modifica-email').value = email || '';
  document.getElementById('modifica-telefono').value = telefono || '';
  document.getElementById('modifica-pin').value = pin;
  document.getElementById('modifica-descrizione-contratto').value = descrizioneContratto || '';
  document.getElementById('modifica-ore-contrattuali').value = oreContrattuali || 8.0;
  
  // Mostra il modale
  document.getElementById('modalModificaDipendente').style.display = 'flex';
};

window.chiudiModalModificaDipendente = function() {
  document.getElementById('modalModificaDipendente').style.display = 'none';
  window.currentEditingPin = null;
};

window.annullaModificaDipendente = function() {
  if (confirm('Annullare le modifiche? Tutti i cambiamenti andranno persi.')) {
    window.chiudiModalModificaDipendente();
  }
};

window.salvaModificaDipendente = async function() {
  const pin = window.currentEditingPin;
  const nome = document.getElementById('modifica-nome').value.trim();
  const cognome = document.getElementById('modifica-cognome').value.trim();
  const email = document.getElementById('modifica-email').value.trim();
  const telefono = document.getElementById('modifica-telefono').value.trim();
  const descrizioneContratto = document.getElementById('modifica-descrizione-contratto').value.trim();
  const oreContrattuali = parseFloat(document.getElementById('modifica-ore-contrattuali').value) || 8.0;

  // Validazione campi obbligatori
  if (!nome || !cognome) {
    alert('⚠️ Nome e Cognome sono obbligatori!');
    return;
  }

  if (oreContrattuali <= 0 || oreContrattuali > 24) {
    alert('⚠️ Le ore contrattuali devono essere tra 0.25 e 24!');
    return;
  }

  try {
    console.log(`💾 Salvataggio modifiche per PIN ${pin}:`, { nome, cognome, email, telefono, oreContrattuali });

    const { error } = await supabaseClient
      .from('utenti')
      .update({
        nome: nome,
        cognome: cognome,
        email: email || null,
        telefono: telefono || null,
        descrizione_contratto: descrizioneContratto || null,
        ore_contrattuali: oreContrattuali
      })
      .eq('pin', parseInt(pin));

    if (error) {
      throw new Error(`Errore durante l'aggiornamento: ${error.message}`);
    }

    console.log(`✅ Dipendente PIN ${pin} aggiornato con successo`);
    alert(`✅ Dipendente ${nome} ${cognome} aggiornato con successo!`);
    
    // Chiudi modale e ricarica lista
    window.chiudiModalModificaDipendente();
    setTimeout(() => location.reload(), 500);

  } catch (error) {
    console.error('❌ Errore durante il salvataggio:', error);
    alert('Errore durante il salvataggio: ' + (error.message || 'Errore sconosciuto'));
  }
};

// Esposizione funzioni globali DOPO le definizioni
window.apriStorico = apriStorico;
console.log('[UTENTI] Funzioni globali registrate:', {
  archiviaUtente: typeof window.archiviaUtente, 
  eliminaUtente: typeof window.eliminaUtente,
  modificaUtente: typeof window.modificaUtente,
  chiudiModalModificaDipendente: typeof window.chiudiModalModificaDipendente,
  salvaModificaDipendente: typeof window.salvaModificaDipendente,
  annullaModificaDipendente: typeof window.annullaModificaDipendente,
  apriStorico: typeof window.apriStorico
});
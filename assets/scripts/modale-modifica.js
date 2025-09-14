// modale-modifica.js

import { supabaseClient } from './supabase-client.js';

export function apriModaleModifica(data, timbratureEntrata, timbratureUscita, pin, timbraturaId) {
  console.log('🔧 Apertura modale modifica per data:', data);

  const modal = document.getElementById('modalOverlay');
  const modaleDataEntrata = document.getElementById('modale-data-entrata');
  const modaleDataUscita = document.getElementById('modale-data-uscita');
  const modaleEntrata = document.getElementById('modale-entrata');
  const modaleUscita = document.getElementById('modale-uscita');

  if (!modal || !modaleDataEntrata || !modaleDataUscita || !modaleEntrata || !modaleUscita) {
    console.error('❌ Elementi modale non trovati');
    return;
  }

  // Rimuovi listener esistenti per evitare duplicazioni
  const btnSalva = document.getElementById('btnSalva');
  const btnElimina = document.getElementById('btnElimina');
  const btnChiudi = document.getElementById('btnChiudi');

  // Clona e sostituisci i bottoni per rimuovere tutti i listener esistenti
  if (btnSalva) {
    const newBtnSalva = btnSalva.cloneNode(true);
    btnSalva.parentNode.replaceChild(newBtnSalva, btnSalva);
  }
  if (btnElimina) {
    const newBtnElimina = btnElimina.cloneNode(true);
    btnElimina.parentNode.replaceChild(newBtnElimina, btnElimina);
  }
  if (btnChiudi) {
    const newBtnChiudi = btnChiudi.cloneNode(true);
    btnChiudi.parentNode.replaceChild(newBtnChiudi, btnChiudi);
  }

  // Precompilazione valori modale
  if (timbratureEntrata?.length > 0) {
    modaleDataEntrata.value = timbratureEntrata[0].data || data;
    modaleEntrata.value = timbratureEntrata[0].ore.slice(0, 5);
  } else {
    modaleDataEntrata.value = data;
    modaleEntrata.value = '';
  }

  if (timbratureUscita?.length > 0) {
    modaleDataUscita.value = timbratureUscita[timbratureUscita.length - 1].data || data;
    modaleUscita.value = timbratureUscita[timbratureUscita.length - 1].ore.slice(0, 5);
  } else {
    modaleDataUscita.value = data;
    modaleUscita.value = '';
  }

  modal.style.display = 'flex';

  // Riottieni i riferimenti ai bottoni sostituiti
  const newBtnSalva = document.getElementById('btnSalva');
  const newBtnElimina = document.getElementById('btnElimina');
  const newBtnChiudi = document.getElementById('btnChiudi');

  // Aggiungi nuovi listener (ora garantiti unici)
  if (newBtnSalva) {
    newBtnSalva.onclick = async () => {
      await salvaModifiche(
        modaleDataEntrata.value, 
        modaleEntrata.value, 
        modaleDataUscita.value, 
        modaleUscita.value, 
        pin, 
        timbraturaId,
        data
      );
      chiudiModale();
    };
  }

  if (newBtnElimina) {
    newBtnElimina.onclick = async () => {
      if (confirm('Sei sicuro di voler eliminare le timbrature di questo giorno?')) {
        await eliminaTimbrature(data, pin);
        chiudiModale();
      }
    };
  }

  if (newBtnChiudi) {
    newBtnChiudi.onclick = chiudiModale;
  }

  // Rimuovi listener esistente dal modal overlay prima di aggiungerne uno nuovo
  modal.replaceWith(modal.cloneNode(true));
  const freshModal = document.getElementById('modalOverlay');
  freshModal.onclick = (e) => { if (e.target === freshModal) chiudiModale(); };
}

function chiudiModale() {
  const modal = document.getElementById('modalOverlay');
  if (modal) modal.style.display = 'none';
}

async function salvaModifiche(dataEntrata, oraEntrata, dataUscita, oraUscita, pin, timbraturaId, dataOriginale) {
  try {
    console.log('💾 Salvataggio modifiche per:', { dataEntrata, oraEntrata, dataUscita, oraUscita, pin });

    const { data: userData, error: userError } = await supabaseClient
      .from('utenti')
      .select('nome, cognome')
      .eq('pin', parseInt(pin))
      .single();

    if (userError || !userData) throw new Error('Impossibile recuperare i dati dell\'utente');

    // Elimina le vecchie timbrature di quel giorno
    if (dataOriginale) {
      await supabaseClient.from('timbrature').delete().eq('pin', parseInt(pin)).eq('giornologico', dataOriginale);
      await supabaseClient.from('timbrature').delete().eq('pin', parseInt(pin)).eq('data', dataOriginale).is('giornologico', null);
    }

    const timbratureDaInserire = [];

    // ✅ ENTRATA
    if (oraEntrata && dataEntrata) {
      const [oreEntrata] = oraEntrata.split(':').map(Number);
      let giornoLogicoEntrata = dataEntrata;
      if (oreEntrata >= 0 && oreEntrata < 5) {
        const d = new Date(dataEntrata + 'T00:00:00');
        d.setDate(d.getDate() - 1);
        giornoLogicoEntrata = d.toISOString().split('T')[0];
      }

      timbratureDaInserire.push({
        pin: parseInt(pin),
        nome: userData.nome,
        cognome: userData.cognome,
        tipo: 'entrata',
        data: dataEntrata,
        ore: oraEntrata + ':00',
        giornologico: giornoLogicoEntrata
      });
    }

    // ✅ USCITA
    if (oraUscita && dataUscita) {
      const [oreUscita] = oraUscita.split(':').map(Number);
      let giornoLogicoUscita = dataUscita;
      let dataRealeUscita = dataUscita;

      // PATCH ROBUSTA: gestisce correttamente le uscite post-mezzanotte
      const dataEntrataObj = new Date(dataEntrata);
      const dataUscitaObj = new Date(dataUscita);
      const diffGiorni = (dataUscitaObj - dataEntrataObj) / (1000 * 60 * 60 * 24);

      if (oreUscita >= 0 && oreUscita < 5 && diffGiorni <= 1) {
        const d = new Date(dataUscita + 'T00:00:00');
        d.setDate(d.getDate() + 1);
        dataRealeUscita = d.toISOString().split('T')[0];

        const giornoLogicoDate = new Date(dataUscita + 'T00:00:00');
        giornoLogicoDate.setDate(giornoLogicoDate.getDate() - 1);
        giornoLogicoUscita = giornoLogicoDate.toISOString().split('T')[0];
      }

      timbratureDaInserire.push({
        pin: parseInt(pin),
        nome: userData.nome,
        cognome: userData.cognome,
        tipo: 'uscita',
        data: dataRealeUscita,
        ore: oraUscita + ':00',
        giornologico: giornoLogicoUscita
      });
    }

    if (!oraEntrata && !oraUscita) {
      throw new Error('Inserisci almeno un orario (entrata o uscita)');
    }

    const { data: insertedData, error: insertError } = await supabaseClient
      .from('timbrature')
      .insert(timbratureDaInserire)
      .select();

    if (insertError) {
      throw new Error(`Errore inserimento: ${insertError.message} (Code: ${insertError.code})`);
    }

    if (!insertedData || insertedData.length === 0) {
      throw new Error('Nessuna timbratura inserita - verifica i permessi');
    }

    alert('Modifiche salvate correttamente!');
    chiudiModale();
    setTimeout(() => window.location.reload(), 1000);

  } catch (error) {
    console.error('❌ Errore nel salvataggio:', error);
    let errorMessage = 'Errore nel salvataggio delle modifiche: ';
    if (error.message?.includes('utente')) {
      errorMessage += 'Utente non trovato nel sistema.';
    } else if (error.message?.includes('permission') || error.message?.includes('RLS')) {
      errorMessage += 'Permessi insufficienti per modificare le timbrature.';
    } else if (error.message?.includes('duplicate') || error.message?.includes('unique')) {
      errorMessage += 'Timbratura già esistente per questo orario.';
    } else if (error.message?.includes('almeno un orario')) {
      errorMessage += error.message;
    } else {
      errorMessage += (error.message || 'Errore di connessione al database');
    }

    alert(errorMessage);
  }
}

async function eliminaTimbrature(data, pin) {
  try {
    const { error } = await supabaseClient
      .from('timbrature')
      .delete()
      .eq('pin', parseInt(pin))
      .eq('giornologico', data);

    if (error) throw error;

    alert('Timbrature eliminate con successo!');
    setTimeout(() => location.reload(), 500);
  } catch (error) {
    console.error('❌ Errore nell\'eliminazione:', error);
    alert('Errore nell\'eliminazione: ' + (error.message || 'Errore sconosciuto'));
  }
}

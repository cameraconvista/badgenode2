// storico-colgroup-sync.js - Allineamento colonne con <colgroup>

const headTbl = document.querySelector('.tabella-header table');
const bodyWrap = document.querySelector('.tabella-body-wrapper');
const bodyTbl = bodyWrap?.querySelector('table');
const footTbl = document.querySelector('.tabella-footer table');
const tbody = document.querySelector('#storico-body');

if (!headTbl || !bodyTbl || !footTbl || !tbody) {
  console.warn('[storico-colgroup] Elementi tabella non trovati');
} else {

  function scrollbarPad() {
    const sbw = bodyWrap.offsetWidth - bodyWrap.clientWidth;
    const head = document.querySelector('.tabella-header');
    const foot = document.querySelector('.tabella-footer');
    if (head) head.style.paddingRight = sbw + 'px';
    if (foot) foot.style.paddingRight = sbw + 'px';
  }

  function buildColgroup() {
    const ths = headTbl.querySelectorAll('thead th');
    const widths = Array.from(ths, th => Math.round(th.getBoundingClientRect().width));
    const mk = () => {
      const cg = document.createElement('colgroup');
      widths.forEach(w => {
        const col = document.createElement('col');
        col.style.width = w + 'px';
        cg.appendChild(col);
      });
      return cg;
    };
    [headTbl, bodyTbl, footTbl].forEach(t => {
      t.querySelectorAll('colgroup').forEach(x => x.remove());
      t.prepend(mk());
      t.style.tableLayout = 'fixed';
      t.style.width = '100%';
      t.style.borderCollapse = 'separate';
    });
    console.info('[storico-colgroup] widths', widths);
  }

  function sync() {
    scrollbarPad();
    buildColgroup();
  }

  window.addEventListener('load', sync, { once: true });
  window.addEventListener('resize', () => requestAnimationFrame(sync));
  const mo = new MutationObserver(() => requestAnimationFrame(sync));
  mo.observe(tbody, { childList: true });

  window.__STORICO_COLSYNC__ = { sync };
}

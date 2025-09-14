/**
 * VirtualTable v1 — finestra virtuale per <tbody>.
 * Non cambia layout/DOM: accetta array di stringhe TR e renderizza solo la porzione visibile.
 */
export class VirtualTable {
  constructor(tbody, options={}){
    this.tbody = tbody;
    this.rowHeight = options.rowHeight || 44;
    this.buffer = options.buffer || 12;
    this.rows = [];
    this.container = tbody?.parentElement || null;
    this._onScroll = this._onScroll.bind(this);
  }
  setRows(htmlRows=[]){
    this.rows = htmlRows;
    const total = this.rows.length * this.rowHeight;
    Object.assign(this.tbody.style, { display:'block', position:'relative', height: total+'px' });
    this._render(); this._attach();
  }
  _attach(){
    const scroller = this.container || this.tbody?.parentElement;
    if (!scroller) return;
    scroller.removeEventListener('scroll', this._onScroll);
    scroller.addEventListener('scroll', this._onScroll, { passive:true });
  }
  _onScroll(){ this._render(); }
  _render(){
    const scroller = this.container || this.tbody?.parentElement || document.scrollingElement;
    if (!scroller) return;
    const scrollTop = scroller.scrollTop || 0;
    const height = scroller.clientHeight || window.innerHeight;
    const startIndex = Math.max(0, Math.floor(scrollTop / this.rowHeight) - this.buffer);
    const endIndex = Math.min(this.rows.length, Math.ceil((scrollTop + height) / this.rowHeight) + this.buffer);
    const offsetTop = startIndex * this.rowHeight;
    const slice = this.rows.slice(startIndex, endIndex).join('');
    this.tbody.innerHTML = `<tr style="height:${offsetTop}px"></tr>${slice}<tr style="height:${Math.max(0,(this.rows.length-endIndex)*this.rowHeight)}px"></tr>`;
  }
}

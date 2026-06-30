// ===== CAMADA DE DOMÍNIO =====
// Min-Heap binária (fila de prioridade) usada pelo Dijkstra.
// Cada item deve ter a propriedade numérica `custo`.

export class MinHeap {
  constructor() {
    this.h = [];
  }

  get size() {
    return this.h.length;
  }

  push(item) {
    const h = this.h;
    h.push(item);
    let i = h.length - 1;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (h[p].custo <= h[i].custo) break;
      [h[p], h[i]] = [h[i], h[p]];
      i = p;
    }
  }

  pop() {
    const h = this.h;
    const top = h[0];
    const last = h.pop();
    if (h.length) {
      h[0] = last;
      let i = 0;
      for (;;) {
        const l = 2 * i + 1, r = 2 * i + 2;
        let s = i;
        if (l < h.length && h[l].custo < h[s].custo) s = l;
        if (r < h.length && h[r].custo < h[s].custo) s = r;
        if (s === i) break;
        [h[s], h[i]] = [h[i], h[s]];
        i = s;
      }
    }
    return top;
  }
}

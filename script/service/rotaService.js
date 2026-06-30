// ===== CAMADA DE SERVIÇO (Regra de Negócio) =====
// Dijkstra com Heap adaptado ao custo em R$ e detalhamento do gasto.

import { MinHeap } from '../domain/MinHeap.js';

// Custo de percorrer a aresta u->v:
//   combustível = (distância / autonomia) * preçoCombustível
//   pedágio     = pedágio da capital v (pago ao CHEGAR; o da origem não conta)
function custoAresta(km, pedagioDestino, precoComb, autonomia) {
  return (km / autonomia) * precoComb + pedagioDestino;
}

// Dijkstra com Min-Heap. Retorna { caminho:[], total:Number } ou null se não houver rota.
export function buscarCaminhoMaisBarato(grafo, origem, destino, precoComb, autonomia) {
  const dist = new Map();
  const prev = new Map();
  const visto = new Set();

  for (const v of grafo.vertices()) dist.set(v, Infinity);
  dist.set(origem, 0);

  const heap = new MinHeap();
  heap.push({ custo: 0, no: origem });

  while (heap.size) {
    const { custo, no } = heap.pop();
    if (visto.has(no)) continue;
    visto.add(no);
    if (no === destino) break;

    for (const [vizinho, km] of grafo.vizinhos(no)) {
      if (visto.has(vizinho)) continue;
      const novo = custo + custoAresta(km, grafo.pedagio(vizinho), precoComb, autonomia);
      if (novo < dist.get(vizinho)) {
        dist.set(vizinho, novo);
        prev.set(vizinho, no);
        heap.push({ custo: novo, no: vizinho });
      }
    }
  }

  if (dist.get(destino) === Infinity) return null; // sem rota

  const caminho = [];
  for (let cur = destino; cur !== undefined; cur = prev.get(cur)) caminho.unshift(cur);
  return { caminho, total: dist.get(destino) };
}

// Detalha o gasto de uma rota já encontrada (km, combustível, pedágios).
export function detalharGasto(grafo, caminho, precoComb, autonomia) {
  let km = 0, pedagios = 0;
  for (let i = 0; i < caminho.length - 1; i++) {
    km += grafo.vizinhos(caminho[i]).get(caminho[i + 1]);
    pedagios += grafo.pedagio(caminho[i + 1]);
  }
  const litros = km / autonomia;
  return { km, litros, combustivel: litros * precoComb, pedagios };
}

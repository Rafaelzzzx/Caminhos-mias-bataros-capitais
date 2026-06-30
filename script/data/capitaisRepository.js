// ===== CAMADA DE DADOS (Repository) =====
// Responsável por carregar o JSON e montar o Grafo (função Seed).
// Isola a origem dos dados do resto da aplicação.

import { Grafo } from '../domain/Grafo.js';

const CAMINHO_JSON = 'data/capitais.json';

async function carregarJson() {
  const resp = await fetch(CAMINHO_JSON);
  if (!resp.ok) throw new Error(`Falha ao carregar ${CAMINHO_JSON}: ${resp.status}`);
  return resp.json();
}

// SEED: transforma os dados brutos no Grafo de domínio.
export async function seed() {
  const dados = await carregarJson();
  const g = new Grafo();

  // 1ª passada: cria vértices com seus pedágios.
  for (const obj of dados) {
    for (const [nome, info] of Object.entries(obj)) {
      g.addVertice(nome, info.toll ?? 0);
    }
  }

  // 2ª passada: cria as arestas (não-direcionadas).
  for (const obj of dados) {
    for (const [nome, info] of Object.entries(obj)) {
      for (const [vizinho, dist] of Object.entries(info.neighbors ?? {})) {
        if (!g.existe(vizinho)) g.addVertice(vizinho, 0);
        g.addAresta(nome, vizinho, dist);
      }
    }
  }

  return g;
}

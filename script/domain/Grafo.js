// ===== CAMADA DE DOMÍNIO =====
// Grafo NÃO-DIRECIONADO em Lista de Adjacências.
// Cada vértice = capital; cada aresta = rota entre capitais vizinhas (distância em km).

export class Grafo {
  constructor() {
    this.adj = new Map();   // nome -> Map<vizinho, distânciaKm>
    this.toll = new Map();  // nome -> pedágio (R$)
  }

  addVertice(nome, toll = 0) {
    if (!this.adj.has(nome)) this.adj.set(nome, new Map());
    this.toll.set(nome, toll);
  }

  // Aresta não-direcionada: registra a ligação nos dois sentidos.
  addAresta(a, b, dist) {
    if (!this.adj.has(a)) this.addVertice(a);
    if (!this.adj.has(b)) this.addVertice(b);
    this.adj.get(a).set(b, dist);
    this.adj.get(b).set(a, dist);
  }

  vertices() {
    return [...this.adj.keys()];
  }

  vizinhos(nome) {
    return this.adj.get(nome) ?? new Map();
  }

  pedagio(nome) {
    return this.toll.get(nome) ?? 0;
  }

  existe(nome) {
    return this.adj.has(nome);
  }
}

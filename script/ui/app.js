// ===== CAMADA DE APRESENTAÇÃO (UI) =====
// Orquestra as camadas de dados e serviço e renderiza a interface.

import { seed } from '../data/capitaisRepository.js';
import { buscarCaminhoMaisBarato, detalharGasto } from '../service/rotaService.js';

const $ = (id) => document.getElementById(id);
const brl = (n) =>
  'R$ ' + n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

let GRAFO = null;

// ---- Sprite do carro (pixel-art em divs) ----
const carHTML = () => `
  <img class="sprite" src="assets/car.png" alt="carro" draggable="false">
  <div class="smoke"><span></span><span></span><span></span></div>`;

// ---- Fumaça em sprites (25 quadros) que mascara a transição ----
const SMOKE_FRAMES = Array.from(
  { length: 25 },
  (_, i) => `assets/smoke/${String(i + 1).padStart(2, '0')}.png`
);
function preloadSmoke() {
  SMOKE_FRAMES.forEach((src) => { const im = new Image(); im.src = src; });
}

function playSmoke() {
  const fx = $('smokeFx');
  fx.innerHTML = '';
  const last = SMOKE_FRAMES.length - 1;
  const rnd = (a, b) => a + Math.random() * (b - a);
  const cols = [4, 27, 50, 73, 96];
  const rows = [16, 50, 84];

  // cada puff tem vida própria: início, duração e aparência variados
  const puffs = [];
  for (const top of rows) {
    for (const left of cols) {
      const img = document.createElement('img');
      img.className = 'puff';
      const size = rnd(48, 70);                       // vmax
      img.style.width = img.style.height = size + 'vmax';
      img.style.left = (left + rnd(-5, 5)) + '%';
      img.style.top = (top + rnd(-5, 5)) + '%';
      img.style.transform =
        `translate(-50%,-50%) scaleX(${Math.random() < 0.5 ? -1 : 1}) rotate(${(rnd(-16, 16)) | 0}deg)`;
      img.style.opacity = '0';
      fx.appendChild(img);
      // jitter de início baixo => cobertura total rápida e uniforme;
      // duração longa => sustenta a máscara por toda a transição do menu
      puffs.push({ img, start: rnd(0, 280), dur: rnd(2100, 2700), lastF: -1 });
    }
  }
  fx.classList.add('active');

  const t0 = performance.now();
  function frame(now) {
    const t = now - t0;
    let alive = false;
    for (const p of puffs) {
      const k = (t - p.start) / p.dur;               // progresso 0..1 do puff
      if (k < 0) { alive = true; continue; }          // ainda não começou
      if (k > 1) { if (p.img.style.opacity !== '0') p.img.style.opacity = '0'; continue; }
      alive = true;
      const f = Math.min(last, (k * (last + 1)) | 0);
      if (f !== p.lastF) { p.img.src = SMOKE_FRAMES[f]; p.lastF = f; }
      // envelope: fade-in rápido (0–.10), sustentação longa, fade-out (.85–1)
      p.img.style.opacity = String(
        k < 0.10 ? k / 0.10 : k > 0.85 ? Math.max(0, (1 - k) / 0.15) : 1
      );
    }
    if (alive && t < 4200) requestAnimationFrame(frame);
    else { fx.classList.remove('active'); fx.innerHTML = ''; }
  }
  requestAnimationFrame(frame);
}

// ---- Tela inicial: carro cruza, fumaça cobre e revela o menu ----
function iniciarJogo() {
  const start = $('startScreen');
  const car = $('startCar');
  if (start.classList.contains('launching')) return;
  car.classList.add('rolling');
  start.classList.add('launching');

  // 1) a fumaça sobe cobrindo a tela (cobertura total ~t=1090)
  setTimeout(playSmoke, 600);
  // 2) só depois da cobertura total o menu entra com fade (.8s -> opaco ~t=2000)
  //    e a tela inicial sai; a fumaça só começa a dissipar (~t=2385) DEPOIS
  //    do menu já estar opaco, então a transição passa despercebida.
  setTimeout(() => {
    $('app').classList.remove('app-hidden');
    $('app').classList.add('app-reveal');
    start.classList.add('fade');
  }, 1200);
  setTimeout(() => start.remove(), 3400);
}

// SHOW: exibe vértices e seus adjacentes.
function renderShow(grafo, caps) {
  $('show').innerHTML = caps
    .map((c) => {
      const viz = [...grafo.vizinhos(c)].map(([n, d]) => `${n} (${d}km)`).join(', ');
      return `<div class="adj"><b>${c}</b> [pedágio ${brl(grafo.pedagio(c))}] ➜ ${viz}</div>`;
    })
    .join('');
}

function renderErro(msg) {
  $('resWin').style.display = 'block';
  $('result').innerHTML = `<div class="err">${msg}</div>`;
}

function buscar() {
  const o = $('origem').value.trim();
  const d = $('destino').value.trim();
  const fuel = parseFloat($('fuel').value);
  const aut = parseFloat($('auton').value);

  if (!GRAFO.existe(o) || !GRAFO.existe(d))
    return renderErro('! CAPITAL INVÁLIDA<br><span class="hint">Escolha origem e destino da lista.</span>');
  if (o === d) return renderErro('! ORIGEM = DESTINO');
  if (!(fuel > 0) || !(aut > 0)) return renderErro('! COMBUSTÍVEL/AUTONOMIA INVÁLIDOS');

  const r = buscarCaminhoMaisBarato(GRAFO, o, d, fuel, aut);
  if (!r) return renderErro(`✗ SEM ROTA ENTRE<br>${o.toUpperCase()} E ${d.toUpperCase()}`);

  const g = detalharGasto(GRAFO, r.caminho, fuel, aut);
  const chips = r.caminho
    .map((c, i) => `<span class="city">${c}</span>${i < r.caminho.length - 1 ? '<span class="arrow">➜</span>' : ''}`)
    .join('');

  $('resWin').style.display = 'block';
  $('result').innerHTML = `
    <div>🏁 Rota de menor custo:</div>
    <div class="route">${chips}</div>
    <div class="breakdown">📏 Distância total: <b>${g.km.toLocaleString('pt-BR')} km</b></div>
    <div class="breakdown">⛽ Combustível: ${brl(g.combustivel)} &nbsp;(${g.litros.toFixed(1)} L)</div>
    <div class="breakdown">🛣️ Pedágios: ${brl(g.pedagios)}</div>
    <div class="total">💰 TOTAL: ${brl(r.total)}</div>`;
}

function montarCenario() {
  // injeta o sprite do carro da tela inicial
  $('startCar').innerHTML = carHTML();
  preloadSmoke();

  // START: clique, Enter ou Espaço
  $('startBtn').addEventListener('click', iniciarJogo);
  document.addEventListener('keydown', (e) => {
    if ($('startScreen') && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      iniciarJogo();
    }
  });
}

async function init() {
  montarCenario();
  GRAFO = await seed();
  const caps = GRAFO.vertices().sort((a, b) => a.localeCompare(b, 'pt-BR'));
  $('caps').innerHTML = caps.map((c) => `<option value="${c}">`).join('');
  renderShow(GRAFO, caps);

  $('go').addEventListener('click', buscar);
  [$('origem'), $('destino')].forEach((el) =>
    el.addEventListener('keydown', (e) => { if (e.key === 'Enter') buscar(); })
  );
}

init().catch((e) => {
  renderErro('ERRO AO CARREGAR DADOS');
  console.error(e);
});

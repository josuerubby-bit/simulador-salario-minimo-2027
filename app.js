/* ================= Constantes oficiales ================= */
const SMLV2026 = 1750905;
const AUX2026 = 249095;
const RATES = {
  saludP: 0.085, pensionP: 0.12, caja: 0.04, sena: 0.02, icbf: 0.03,
  saludT: 0.04, pensionT: 0.04,
  prima: 0.0833, cesantias: 0.0833, intereses: 0.01, vacaciones: 0.0417
};

/* ================= Utilidades ================= */
const $ = (id) => document.getElementById(id);
const fmtCOP = (n) => '$' + Math.round(n).toLocaleString('es-CO');
const fmtPct = (n, d = 1) => n.toLocaleString('es-CO', { minimumFractionDigits: d, maximumFractionDigits: d }) + '%';
const fmtSignPct = (n, d = 2) => (n >= 0 ? '+' : '') + n.toLocaleString('es-CO', { minimumFractionDigits: d, maximumFractionDigits: d }) + '%';

/* ================= Estado ================= */
let chartCostos = null, chartReal = null;

function readState() {
  const g = parseFloat($('r-incremento').value);
  const pi26 = parseFloat($('r-infla26').value);
  const pi27 = parseFloat($('r-infla27').value);
  const prod = parseFloat($('r-prod').value);
  const linkAux = $('c-linkaux').checked;
  const ga = linkAux ? g : parseFloat($('r-aux').value);
  const perfil = document.querySelector('input[name="perfil"]:checked').value;
  const arl = parseFloat($('s-arl').value) || 0.522;
  return { g, pi26, pi27, prod, ga, linkAux, exonerado: perfil === 'exonerado', arl };
}

/* ================= Modelo ================= */
function computeCost(salario, aux, st) {
  const salud = st.exonerado ? 0 : salario * RATES.saludP;
  const pension = salario * RATES.pensionP;
  const arl = salario * st.arl / 100;
  const caja = salario * RATES.caja;
  const paraf = st.exonerado ? 0 : salario * (RATES.sena + RATES.icbf);
  /* Prestaciones: prima y cesantías (e intereses) incluyen el auxilio de transporte
     para trabajadores de hasta 2 SMLV; vacaciones se causan sobre el salario base. */
  const prima = (salario + aux) / 12;
  const cesantias = (salario + aux) / 12;
  const intereses = (salario + aux) * RATES.intereses;
  const vacaciones = salario / 24;
  const prest = prima + cesantias + intereses + vacaciones;
  const total = salario + aux + salud + pension + arl + caja + paraf + prest;
  return { salud, pension, arl, caja, paraf, prest, total };
}

function recalc() {
  const st = readState();

  /* outputs de sliders */
  $('o-incremento').textContent = fmtPct(st.g, 1);
  $('o-infla26').textContent = fmtPct(st.pi26, 1);
  $('o-infla27').textContent = fmtPct(st.pi27, 1);
  $('o-prod').textContent = fmtPct(st.prod, 2);
  $('o-aux').textContent = fmtPct(st.ga, 1);
  $('r-aux').disabled = st.linkAux;
  $('r-aux').value = st.ga;

  /* salario simulado */
  const s27 = SMLV2026 * (1 + st.g / 100);
  const a27 = AUX2026 * (1 + st.ga / 100);
  const total27 = s27 + a27;
  const real = ((1 + st.g / 100) / (1 + st.pi27 / 100) - 1) * 100;
  const costo = computeCost(s27, a27, st);
  const costo26 = computeCost(SMLV2026, AUX2026, st);

  /* KPIs */
  $('k-salario').textContent = fmtCOP(s27);
  $('k-aumento').textContent = '+' + fmtCOP(s27 - SMLV2026) + ' mensuales (' + fmtPct(st.g, 1) + ')';
  $('k-total').textContent = fmtCOP(total27);
  $('k-auxval').textContent = 'Auxilio: ' + fmtCOP(a27) + ' (+' + fmtPct(st.ga, 1) + ')';
  $('k-real').textContent = fmtSignPct(real, 2);
  const realNote = $('k-realnote');
  realNote.textContent = real >= 0
    ? 'El salario crece por encima de la inflación 2027 (' + fmtPct(st.pi27, 1) + ')'
    : 'El aumento no compensa la inflación 2027 (' + fmtPct(st.pi27, 1) + ')';
  realNote.className = 'delta ' + (real >= 0 ? 'pos' : 'neg');
  $('k-costo').textContent = fmtCOP(costo.total);
  $('k-costonote').textContent = '+' + fmtCOP(costo.total - costo26.total) + ' vs. 2026 (aprox. ' + fmtPct(costo.total / costo26.total * 100 - 100, 1) + ')';

  /* referencia técnica */
  const ref = st.pi26 + st.prod;
  $('ref-eq').innerHTML = fmtPct(st.pi26, 1) + ' inflación + ' + fmtPct(st.prod, 2) + ' productividad = <b>' + fmtPct(ref, 2) + '</b>';
  const verdict = $('ref-verdict');
  const diff = st.g - ref;
  if (Math.abs(diff) < 0.25) {
    verdict.textContent = 'En línea con la referencia';
    verdict.className = 'ref-verdict below';
  } else if (diff > 0) {
    verdict.textContent = fmtSignPct(diff, 2).replace('%', '') + ' pp por encima de la referencia';
    verdict.className = 'ref-verdict above';
  } else {
    verdict.textContent = fmtSignPct(diff, 2).replace('%', '') + ' pp por debajo de la referencia';
    verdict.className = 'ref-verdict below';
  }

  /* bolsillo del trabajador */
  $('t-base').textContent = fmtCOP(s27);
  $('t-aux').textContent = fmtCOP(a27);
  $('t-salud').textContent = '− ' + fmtCOP(s27 * RATES.saludT);
  $('t-pension').textContent = '− ' + fmtCOP(s27 * RATES.pensionT);
  $('t-neto').textContent = fmtCOP(s27 + a27 - s27 * (RATES.saludT + RATES.pensionT));

  /* cargas al empleador */
  $('e-salud').textContent = st.exonerado ? 'Exonerado (art. 114-1 E.T.)' : fmtCOP(costo.salud);
  $('e-pension').textContent = fmtCOP(costo.pension);
  $('e-arl').textContent = fmtCOP(costo.arl) + ' (' + fmtPct(st.arl, 3) + ')';
  $('e-caja').textContent = fmtCOP(costo.caja);
  $('e-paraf').textContent = st.exonerado ? 'Exonerados' : fmtCOP(costo.paraf);
  $('e-prest').textContent = fmtCOP(costo.prest);
  $('e-total').textContent = fmtCOP(costo.total);

  /* tabla de escenarios */
  const tbody = $('tbl-escenarios').querySelector('tbody');
  const steps = [5, 6, 7, 8, 8.5, 9, 10, 11, 12];
  const gaEscenario = st.linkAux ? null : st.ga;
  tbody.innerHTML = '';
  const closeTo = (a, b) => Math.abs(a - b) < 0.051;
  steps.forEach(g => {
    const s = SMLV2026 * (1 + g / 100);
    const ga = gaEscenario === null ? g : gaEscenario;
    const a = AUX2026 * (1 + ga / 100);
    const c = computeCost(s, a, st);
    const r = ((1 + g / 100) / (1 + st.pi27 / 100) - 1) * 100;
    const tr = document.createElement('tr');
    if (closeTo(g, st.g)) tr.className = 'hl';
    tr.innerHTML = '<td class="b">' + fmtPct(g, 1) + (closeTo(g, st.g) ? ' ←' : '') + '</td>' +
      '<td>' + fmtCOP(s) + '</td>' +
      '<td>' + fmtCOP(a) + '</td>' +
      '<td class="b">' + fmtCOP(s + a) + '</td>' +
      '<td class="' + (r >= 0 ? 'pos-t' : 'neg-t') + '">' + fmtSignPct(r, 2) + '</td>' +
      '<td>' + fmtCOP(c.total) + '</td>';
    tbody.appendChild(tr);
  });
  $('tbl-pi').textContent = fmtPct(st.pi27, 1);

  updateCharts(st, costo26, costo, s27, a27);
}

/* ================= Gráficos ================= */
function cssVar(name) { return getComputedStyle(document.documentElement).getPropertyValue(name).trim(); }

function updateCharts(st, costo26, costo, s27, a27) {
  const textColor = cssVar('--color-text-muted');
  const gridColor = cssVar('--color-divider');
  const baseOpts = {
    responsive: true, maintainAspectRatio: false,
    plugins: {
      legend: { labels: { color: textColor, font: { family: 'Satoshi, sans-serif', size: 12 } } },
      tooltip: {
        callbacks: {
          label: (c) => ' ' + c.dataset.label + ': $' + Math.round(c.parsed.y ?? c.parsed.x ?? 0).toLocaleString('es-CO')
        }
      }
    }
  };

  /* Costos: barras apiladas 2026 vs 2027 */
  const dataCostos = {
    labels: ['2026', '2027'],
    datasets: [
      { label: 'Salario', data: [SMLV2026, s27], backgroundColor: cssVar('--color-primary') },
      { label: 'Auxilio transporte', data: [AUX2026, a27], backgroundColor: cssVar('--color-gold') },
      { label: 'Salud patronal', data: [costo26.salud, costo.salud], backgroundColor: cssVar('--color-blue') },
      { label: 'Pensión patronal', data: [costo26.pension, costo.pension], backgroundColor: '#8b6cc4' },
      { label: 'ARL', data: [costo26.arl, costo.arl], backgroundColor: '#c47a5a' },
      { label: 'Parafiscales', data: [costo26.caja + costo26.paraf, costo.caja + costo.paraf], backgroundColor: cssVar('--color-red') },
      { label: 'Prestaciones', data: [costo26.prest, costo.prest], backgroundColor: cssVar('--color-text-faint') }
    ]
  };
  if (chartCostos) chartCostos.destroy();
  chartCostos = new Chart($('ch-costos'), {
    type: 'bar',
    data: dataCostos,
    options: {
      ...baseOpts,
      indexAxis: 'x',
      scales: {
        x: { stacked: true, ticks: { color: textColor }, grid: { color: 'transparent' } },
        y: {
          stacked: true, ticks: { color: textColor, callback: (v) => '$' + (v / 1e6).toLocaleString('es-CO', { maximumFractionDigits: 1 }) + ' M' },
          grid: { color: gridColor }
        }
      },
      plugins: { ...baseOpts.plugins, legend: { ...baseOpts.plugins.legend, position: 'bottom' } }
    }
  });

  /* Ganancia real: línea según incremento */
  const gs = [];
  for (let g = 5; g <= 12.001; g += 0.25) gs.push(g);
  const reals = gs.map(g => ((1 + g / 100) / (1 + st.pi27 / 100) - 1) * 100);
  if (chartReal) chartReal.destroy();
  chartReal = new Chart($('ch-real'), {
    type: 'line',
    data: {
      labels: gs.map(g => fmtPct(g, 2)),
      datasets: [
        {
          label: 'Ganancia real (%)', data: reals,
          borderColor: cssVar('--color-primary'),
          backgroundColor: cssVar('--color-primary-highlight'),
          fill: true, tension: 0.35, pointRadius: 0, borderWidth: 2.5
        },
        {
          label: 'Ganancia real nula (0%)', data: gs.map(() => 0),
          borderColor: cssVar('--color-red'), borderDash: [6, 5], pointRadius: 0, borderWidth: 2
        }
      ]
    },
    options: {
      ...baseOpts,
      scales: {
        x: { ticks: { color: textColor, maxTicksLimit: 8, callback: function(v) { return this.getLabelForValue(v); } }, grid: { color: 'transparent' } },
        y: { ticks: { color: textColor, callback: (v) => v.toFixed(1) + '%' }, grid: { color: gridColor } }
      },
      plugins: {
        ...baseOpts.plugins,
        legend: { ...baseOpts.plugins.legend, position: 'bottom' },
        tooltip: { callbacks: { label: (c) => ' ' + c.dataset.label + ': ' + (c.parsed.y).toFixed(2) + '%' } }
      }
    }
  });
}

/* ================= Eventos ================= */
['r-incremento', 'r-infla26', 'r-infla27', 'r-prod', 'r-aux', 's-arl'].forEach(id => $(id).addEventListener('input', recalc));
document.querySelectorAll('input[name="perfil"]').forEach(el => el.addEventListener('change', recalc));
$('c-linkaux').addEventListener('change', recalc);
document.querySelectorAll('.chip').forEach(chip => chip.addEventListener('click', () => {
  $('r-incremento').value = chip.dataset.g;
  recalc();
}));

/* Tema claro/oscuro */
(function () {
  const t = document.querySelector('[data-theme-toggle]'), r = document.documentElement;
  let d = matchMedia('(prefers-color-scheme:dark)').matches ? 'dark' : 'light';
  r.setAttribute('data-theme', d);
  const sun = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>';
  const moon = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
  const setIcon = () => { t.innerHTML = d === 'dark' ? sun : moon; };
  setIcon();
  t.addEventListener('click', () => { d = d === 'dark' ? 'light' : 'dark'; r.setAttribute('data-theme', d); setIcon(); recalc(); });
})();

/* Primer cálculo cuando las fuentes estén listas (Chart.js) */
recalc();
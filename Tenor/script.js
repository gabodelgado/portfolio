// Tenor — loan simulator. Fixed-payment (French) amortization, with optional extra monthly payments.
// The interest rate is always entered by the user: there is no default or "typical" rate.

const GOALS = {
    home:     { emoji: '🏠', years: 30 },
    car:      { emoji: '🚗', years: 5 },
    study:    { emoji: '🎓', years: 10 },
    personal: { emoji: '💼', years: 3 }
};

const CURRENCIES = ['$', '€', '£', 'MX$', 'COP$', 'AR$', 'CLP$', 'S/', 'R$', 'Bs.', 'RD$', 'Q', '₡', 'CA$'];

const TEXT = {
    es: {
        welcomeTitle: '¿Qué quieres financiar?', welcomeSub: 'Elige y te mostramos la cuota, los intereses y cómo pagar menos.',
        home: 'Una casa', car: 'Un carro', study: 'Estudios', personal: 'Préstamo personal',
        homeHint: 'Hipoteca · plazo típico 15–30 años', carHint: 'Auto nuevo o usado · 3–7 años',
        studyHint: 'Universidad o posgrado · 5–15 años', personalHint: 'Gastos, deudas, proyectos · 1–5 años',
        tagline: 'Simulador de préstamos', loanTitle: 'Tu préstamo',
        amountLabel: 'Monto del préstamo', rateLabel: 'Tasa de interés anual (%)',
        rateNote: 'Usa la tasa que te ofrece tu banco (TAE / APR). No ponemos una tasa aproximada.',
        termLabel: 'Plazo', yearsUnit: 'Años', monthsUnit: 'Meses', startLabel: 'Primer pago',
        extraLabel: 'Pago extra cada mes (opcional)',
        extraNote: 'Lo que pagas de más va directo al capital: terminas antes y pagas menos intereses.',
        empty: 'Escribe el monto, la tasa y el plazo para ver tu plan de pagos.',
        paymentLabel: 'Cuota mensual', paymentSub: '{n} pagos · {extra}',
        paymentSubNoExtra: '{n} pagos', withExtra: '+ {x} extra = {total} al mes',
        interestLabel: 'Intereses totales', totalLabel: 'Total a pagar', payoffLabel: 'Último pago',
        savings: 'Con {x} extra al mes terminas <b>{time} antes</b> y te ahorras <b>{saved}</b> en intereses.',
        balanceTitle: 'Saldo pendiente', splitTitle: 'A dónde va tu dinero cada año',
        principal: 'Capital', interest: 'Intereses', balance: 'Saldo',
        planBase: 'Sin pago extra', planExtra: 'Con pago extra',
        scheduleTitle: 'Tabla de amortización', byYear: 'Por año', byMonth: 'Por mes', csv: 'Descargar CSV',
        colPeriod: 'Periodo', colYear: 'Año', colMonth: 'Mes', colPayment: 'Pago', colPrincipal: 'Capital', colInterest: 'Intereses', colBalance: 'Saldo',
        yearN: 'Año {n}',
        disclaimer: 'Cálculo con el sistema francés (cuota fija). Es una simulación: tu banco puede sumar seguros, comisiones o impuestos.',
        yearWord: ['año', 'años'], monthWord: ['mes', 'meses'], and: 'y',
        months: ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'],
        currencyAria: 'Moneda', csvName: 'tabla-amortizacion'
    },
    en: {
        welcomeTitle: 'What are you financing?', welcomeSub: "Pick one and we'll show the payment, the interest and how to pay less.",
        home: 'A home', car: 'A car', study: 'School', personal: 'Personal loan',
        homeHint: 'Mortgage · usually 15–30 years', carHint: 'New or used car · 3–7 years',
        studyHint: 'College or grad school · 5–15 years', personalHint: 'Expenses, debt, projects · 1–5 years',
        tagline: 'Loan simulator', loanTitle: 'Your loan',
        amountLabel: 'Loan amount', rateLabel: 'Annual interest rate (%)',
        rateNote: "Use the rate your bank offers you (APR). We don't fill in an approximate rate.",
        termLabel: 'Term', yearsUnit: 'Years', monthsUnit: 'Months', startLabel: 'First payment',
        extraLabel: 'Extra payment each month (optional)',
        extraNote: 'Anything you pay on top goes straight to principal: you finish sooner and pay less interest.',
        empty: 'Enter the amount, rate and term to see your payment plan.',
        paymentLabel: 'Monthly payment', paymentSub: '{n} payments · {extra}',
        paymentSubNoExtra: '{n} payments', withExtra: '+ {x} extra = {total} a month',
        interestLabel: 'Total interest', totalLabel: 'Total paid', payoffLabel: 'Last payment',
        savings: 'With {x} extra a month you finish <b>{time} sooner</b> and save <b>{saved}</b> in interest.',
        balanceTitle: 'Remaining balance', splitTitle: 'Where your money goes each year',
        principal: 'Principal', interest: 'Interest', balance: 'Balance',
        planBase: 'No extra payment', planExtra: 'With extra payment',
        scheduleTitle: 'Amortization schedule', byYear: 'By year', byMonth: 'By month', csv: 'Download CSV',
        colPeriod: 'Period', colYear: 'Year', colMonth: 'Month', colPayment: 'Payment', colPrincipal: 'Principal', colInterest: 'Interest', colBalance: 'Balance',
        yearN: 'Year {n}',
        disclaimer: 'Fixed-payment (French) amortization. This is a simulation: your bank may add insurance, fees or taxes.',
        yearWord: ['year', 'years'], monthWord: ['month', 'months'], and: 'and',
        months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        currencyAria: 'Currency', csvName: 'amortization-schedule'
    }
};

const SAVE_KEY = 'tenorSave';
let lang = 'es';
let goal = null;
let unit = 'years';
let view = 'yearly';
let current = null; // last calculated plan, used by the table, CSV and tooltips

function t(key, vars){
    let s = TEXT[lang][key];
    if(vars) Object.keys(vars).forEach(function(k){ s = s.split('{' + k + '}').join(vars[k]); });
    return s;
}

// ---------- numbers (same helpers as Waypoint and Swap) ----------
function numSeps(l){ return (l || lang) === 'es' ? { group: '.', dec: ',' } : { group: ',', dec: '.' }; }

function fmt(n, decimals){
    if(decimals === undefined) decimals = 2;
    const s = numSeps();
    const parts = Math.abs(n).toFixed(decimals).split('.');
    const intPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, s.group);
    const sign = n < 0 && Number(parts.join('.')) !== 0 ? '-' : '';
    return sign + intPart + (parts[1] ? s.dec + parts[1] : '');
}

function money(n, decimals){
    const sym = document.getElementById('currency').value;
    const space = /[A-Za-z.]$/.test(sym) ? ' ' : '';
    return (n < 0 && Math.abs(n) >= 0.005 ? '-' : '') + sym + space + fmt(Math.abs(n), decimals);
}

// Short axis labels: 250k / 1,2M
function compact(n){
    if(n >= 1e6) return fmt(n / 1e6, n % 1e6 === 0 ? 0 : 1) + 'M';
    if(n >= 1e3) return fmt(n / 1e3, 0) + 'k';
    return fmt(n, 0);
}

function parseNum(str, l){
    if(str === undefined || str === null || str === '') return NaN;
    const s = numSeps(l);
    return parseFloat(String(str).split(s.group).join('').replace(s.dec, '.'));
}

const MAX_INT_DIGITS = 12;

function normalizePastedNumber(text, dec, max){
    const txt = String(text).replace(/[^\d.,]/g, '');
    const lastDot = txt.lastIndexOf('.'), lastComma = txt.lastIndexOf(',');
    let decAt = -1;
    if(lastDot !== -1 && lastComma !== -1){
        decAt = Math.max(lastDot, lastComma);
    } else if(lastDot !== -1 || lastComma !== -1){
        const at = Math.max(lastDot, lastComma);
        const repeated = txt.indexOf(txt[at]) !== at;
        const looksGrouped = txt.length - at - 1 === 3 && txt[at] !== dec;
        const fitsGrouped = !max || Number(txt.replace(/[.,]/g, '')) <= max;
        if(!repeated && !(looksGrouped && fitsGrouped)) decAt = at;
    }
    let out = '';
    for(let i = 0; i < txt.length; i++){
        if(i === decAt) out += dec;
        else if(txt[i] >= '0' && txt[i] <= '9') out += txt[i];
    }
    return out;
}

function numberBeforeInput(e){
    const input = e.target, s = numSeps(), v = input.value;
    const start = input.selectionStart, end = input.selectionEnd;
    let next = null, caret = start;
    if(/^insert(Text|FromPaste|FromDrop|ReplacementText)$/.test(e.inputType)){
        let text = e.data;
        if(text == null && e.dataTransfer) text = e.dataTransfer.getData('text/plain');
        if(!text || /^\d$/.test(text)) return;
        const max = Number(input.getAttribute('data-max')) || 0;
        const chunk = text === '.' || text === ',' ? s.dec : normalizePastedNumber(text, s.dec, max);
        next = v.slice(0, start) + chunk + v.slice(end);
        caret = start + chunk.length;
    } else if(start === end && e.inputType === 'deleteContentBackward' && v[start - 1] === s.group){
        next = v.slice(0, start - 2) + v.slice(start);
        caret = start - 2;
    } else if(start === end && e.inputType === 'deleteContentForward' && v[start] === s.group){
        next = v.slice(0, start) + v.slice(start + 2);
    }
    if(next === null) return;
    e.preventDefault();
    input.value = next;
    input.setSelectionRange(caret, caret);
    input.dispatchEvent(new Event('input', { bubbles: true }));
}

function formatNumberInput(input, maxDecimals){
    const s = numSeps(), v = input.value, caret = input.selectionStart;
    let digits = '', seenDec = false, sigBeforeCaret = 0, decBeforeCaret = false;
    for(let i = 0; i < v.length; i++){
        const ch = v[i];
        const keep = (ch >= '0' && ch <= '9') || (ch === s.dec && !seenDec);
        if(!keep) continue;
        if(ch === s.dec){ seenDec = true; if(i < caret) decBeforeCaret = true; }
        digits += ch;
        if(i < caret) sigBeforeCaret++;
    }
    const split = digits.split(s.dec);
    let intPart = split[0];
    const zeros = intPart.length - intPart.replace(/^0+(?=\d)/, '').length;
    intPart = intPart.slice(zeros, zeros + MAX_INT_DIGITS);
    sigBeforeCaret = Math.max(0, sigBeforeCaret - zeros);
    const showDec = seenDec && maxDecimals > 0;
    if(seenDec && !showDec && decBeforeCaret) sigBeforeCaret--;
    if(intPart === '' && showDec){ intPart = '0'; sigBeforeCaret++; }
    const fracPart = showDec ? (split[1] || '').slice(0, maxDecimals) : '';
    const result = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, s.group) + (showDec ? s.dec + fracPart : '');
    let pos = 0, count = 0;
    while(pos < result.length && count < sigBeforeCaret){
        if(result[pos] !== s.group) count++;
        pos++;
    }
    input.value = result;
    input.setSelectionRange(pos, pos);
}

function toInputValue(n, maxDecimals){
    if(n === null || n === undefined || n === '' || isNaN(n)) return '';
    const fixed = Number(n).toFixed(maxDecimals === undefined ? 2 : maxDecimals);
    const frac = fixed.split('.')[1] || '';
    return fmt(Number(fixed), frac.replace(/0+$/, '').length);
}

function isNumInput(el){ return el.classList && el.classList.contains('num-input'); }
function decimalsOf(el){ return parseInt(el.getAttribute('data-decimals') || '2', 10); }
function numVal(id){ return parseNum(document.getElementById(id).value); }

document.addEventListener('beforeinput', function(e){ if(isNumInput(e.target)) numberBeforeInput(e); }, true);
document.addEventListener('input', function(e){
    if(!isNumInput(e.target)) return;
    formatNumberInput(e.target, decimalsOf(e.target));
    const max = e.target.getAttribute('data-max');
    if(max && (parseNum(e.target.value) || 0) > Number(max)) e.target.value = toInputValue(Number(max), decimalsOf(e.target));
}, true);
document.addEventListener('blur', function(e){
    if(isNumInput(e.target)) e.target.value = toInputValue(parseNum(e.target.value), decimalsOf(e.target));
}, true);

// ---------- dates ----------
function addMonths(ym, k){
    const y = ym.y + Math.floor((ym.m + k) / 12);
    return { y: y, m: ((ym.m + k) % 12 + 12) % 12 };
}
function fmtMonth(ym){ return t('months')[ym.m] + ' ' + ym.y; }
function startMonth(){
    const v = document.getElementById('start').value;
    if(/^\d{4}-\d{2}$/.test(v)) return { y: Number(v.slice(0, 4)), m: Number(v.slice(5, 7)) - 1 };
    const d = new Date();
    return addMonths({ y: d.getFullYear(), m: d.getMonth() }, 1);
}
function plural(n, words){ return n + ' ' + (n === 1 ? words[0] : words[1]); }
function duration(months){
    const y = Math.floor(months / 12), m = months % 12;
    const parts = [];
    if(y) parts.push(plural(y, t('yearWord')));
    if(m) parts.push(plural(m, t('monthWord')));
    return parts.join(' ' + t('and') + ' ');
}

// ---------- the math ----------
// Fixed payment for principal P, monthly rate r, n months. At 0 % it is simply P / n.
function monthlyPayment(P, r, n){
    return r === 0 ? P / n : P * r / (1 - Math.pow(1 + r, -n));
}

function schedule(P, r, n, payment, extra){
    const rows = [];
    let balance = P;
    for(let k = 0; k < n && balance > 0.005; k++){
        const interest = balance * r;
        let principal = payment - interest + extra;
        if(principal > balance) principal = balance; // the last payment only covers what's left
        balance = Math.max(0, balance - principal);
        rows.push({ k: k, payment: principal + interest, principal: principal, interest: interest, balance: balance });
    }
    return rows;
}

function sum(rows, key){ return rows.reduce(function(s, r){ return s + r[key]; }, 0); }

function readInputs(){
    const amount = numVal('amount');
    const rate = numVal('rate');
    const term = numVal('term');
    const extra = numVal('extra') || 0;
    const months = unit === 'years' ? Math.round(term * 12) : Math.round(term);
    if(!(amount > 0) || isNaN(rate) || rate < 0 || !(months > 0) || months > 600) return null;
    return { amount: amount, rate: rate, months: months, extra: Math.max(0, extra) };
}

// ---------- render ----------
function calculate(){
    const inp = readInputs();
    document.getElementById('extraCcy').textContent = document.getElementById('currency').value;
    if(!inp){
        current = null;
        document.getElementById('empty').classList.remove('hidden');
        document.getElementById('output').classList.add('hidden');
        saveState();
        return;
    }
    const r = inp.rate / 100 / 12;
    const payment = monthlyPayment(inp.amount, r, inp.months);
    const base = schedule(inp.amount, r, inp.months, payment, 0);
    const withExtra = inp.extra > 0 ? schedule(inp.amount, r, inp.months, payment, inp.extra) : null;
    const plan = withExtra || base;
    const start = startMonth();
    current = { inp: inp, payment: payment, base: base, withExtra: withExtra, plan: plan, start: start };

    document.getElementById('empty').classList.add('hidden');
    document.getElementById('output').classList.remove('hidden');

    document.getElementById('payment').textContent = money(payment);
    document.getElementById('paymentSub').textContent = withExtra
        ? t('paymentSub', { n: fmt(plan.length, 0), extra: t('withExtra', { x: money(inp.extra), total: money(payment + inp.extra) }) })
        : t('paymentSubNoExtra', { n: fmt(plan.length, 0) });
    document.getElementById('totalInterest').textContent = money(sum(plan, 'interest'));
    document.getElementById('totalPaid').textContent = money(sum(plan, 'payment'));
    document.getElementById('payoff').textContent = fmtMonth(addMonths(start, plan.length - 1));

    const savingsEl = document.getElementById('savings');
    if(withExtra){
        const saved = sum(base, 'interest') - sum(withExtra, 'interest');
        const sooner = base.length - withExtra.length;
        savingsEl.innerHTML = '<span class="icon">🌱</span><span>' + t('savings', {
            x: escapeHtml(money(inp.extra)), time: escapeHtml(duration(sooner) || '0'), saved: escapeHtml(money(saved))
        }) + '</span>';
        savingsEl.classList.remove('hidden');
    } else {
        savingsEl.classList.add('hidden');
    }

    drawBalance();
    drawSplit();
    renderTable();
    saveState();
}

function escapeHtml(s){ return String(s).replace(/[&<>"]/g, function(c){ return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

// ---------- charts (plain SVG) ----------
const SVGNS = 'http://www.w3.org/2000/svg';
function el(tag, attrs, parent){
    const node = document.createElementNS(SVGNS, tag);
    Object.keys(attrs).forEach(function(k){ node.setAttribute(k, attrs[k]); });
    if(parent) parent.appendChild(node);
    return node;
}
function niceMax(v){
    const pow = Math.pow(10, Math.floor(Math.log10(v)));
    const steps = [1, 2, 2.5, 5, 10];
    for(const s of steps){ if(v <= s * pow) return s * pow; }
    return 10 * pow;
}
const css = function(name){ return getComputedStyle(document.documentElement).getPropertyValue(name).trim(); };

function frame(container){
    container.innerHTML = '';
    const w = container.clientWidth, h = container.clientHeight;
    const pad = { l: 46, r: 16, t: 10, b: 26 };
    const svg = el('svg', { viewBox: '0 0 ' + w + ' ' + h, role: 'img' }, container);
    return { svg: svg, w: w, h: h, pad: pad, iw: w - pad.l - pad.r, ih: h - pad.t - pad.b };
}

function yAxis(f, max){
    for(let i = 0; i <= 4; i++){
        const v = max * i / 4;
        const y = f.pad.t + f.ih - f.ih * i / 4;
        el('line', { x1: f.pad.l, x2: f.w - f.pad.r, y1: y, y2: y, stroke: css('--grid'), 'stroke-width': 1 }, f.svg);
        const label = el('text', { x: f.pad.l - 8, y: y + 4, 'text-anchor': 'end' }, f.svg);
        label.textContent = compact(v);
    }
}

function drawBalance(){
    const c = current;
    const container = document.getElementById('balanceChart');
    const f = frame(container);
    const n = c.base.length;
    const max = niceMax(c.inp.amount);
    const x = function(k){ return f.pad.l + f.iw * k / n; };
    const y = function(v){ return f.pad.t + f.ih - f.ih * v / max; };
    yAxis(f, max);

    // year ticks along the bottom (at most ~6 labels)
    const years = Math.ceil(n / 12);
    const every = Math.max(1, Math.ceil(years / 6));
    for(let yr = 0; yr <= years; yr += every){
        const k = Math.min(yr * 12, n);
        const tick = el('text', { x: x(k), y: f.h - 6, 'text-anchor': 'middle' }, f.svg);
        tick.textContent = String(c.start.y + Math.floor((c.start.m + k) / 12));
    }

    function series(rows){ return [[0, c.inp.amount]].concat(rows.map(function(r, i){ return [i + 1, r.balance]; })); }
    function path(pts){ return pts.map(function(p, i){ return (i ? 'L' : 'M') + x(p[0]).toFixed(1) + ',' + y(p[1]).toFixed(1); }).join(''); }

    const legend = document.getElementById('balanceLegend');
    const main = series(c.plan);
    if(c.withExtra){
        el('path', { d: path(series(c.base)), fill: 'none', stroke: css('--context'), 'stroke-width': 2, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }, f.svg);
        legend.innerHTML = '<span><i class="key line" style="background:var(--context)"></i>' + t('planBase') + '</span>' +
            '<span><i class="key line" style="background:var(--green)"></i>' + t('planExtra') + '</span>';
    } else {
        legend.innerHTML = ''; // one series: the title already says what it is
    }
    el('path', { d: path(main) + 'L' + x(main[main.length - 1][0]) + ',' + y(0) + 'L' + x(0) + ',' + y(0) + 'Z', fill: css('--green'), 'fill-opacity': 0.1, stroke: 'none' }, f.svg);
    el('path', { d: path(main), fill: 'none', stroke: css('--green'), 'stroke-width': 2, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }, f.svg);

    // crosshair + tooltip: snaps to the nearest month
    const cross = el('line', { y1: f.pad.t, y2: f.pad.t + f.ih, stroke: css('--ink-2'), 'stroke-width': 1, visibility: 'hidden' }, f.svg);
    const dotBase = el('circle', { r: 4.5, fill: css('--context'), stroke: css('--card') || '#fff', 'stroke-width': 2, visibility: 'hidden' }, f.svg);
    const dot = el('circle', { r: 4.5, fill: css('--green'), stroke: '#fffdf8', 'stroke-width': 2, visibility: 'hidden' }, f.svg);
    const hit = el('rect', { x: f.pad.l, y: f.pad.t, width: f.iw, height: f.ih, fill: 'transparent' }, f.svg);

    function at(rows, k){ return k === 0 ? c.inp.amount : (rows[k - 1] ? rows[k - 1].balance : 0); }
    function show(e){
        const rect = f.svg.getBoundingClientRect();
        const px = (e.clientX - rect.left) * f.w / rect.width;
        const k = Math.max(0, Math.min(n, Math.round((px - f.pad.l) / f.iw * n)));
        cross.setAttribute('x1', x(k)); cross.setAttribute('x2', x(k)); cross.setAttribute('visibility', 'visible');
        dot.setAttribute('cx', x(k)); dot.setAttribute('cy', y(at(c.plan, k))); dot.setAttribute('visibility', 'visible');
        const rows = [];
        if(c.withExtra){
            dotBase.setAttribute('cx', x(k)); dotBase.setAttribute('cy', y(at(c.base, k))); dotBase.setAttribute('visibility', 'visible');
            rows.push([css('--green'), t('planExtra'), money(at(c.plan, k))], [css('--context'), t('planBase'), money(at(c.base, k))]);
        } else {
            rows.push([css('--green'), t('balance'), money(at(c.plan, k))]);
        }
        showTooltip(e, k === 0 ? t('amountLabel') : fmtMonth(addMonths(c.start, k - 1)), rows);
    }
    function hide(){ [cross, dot, dotBase].forEach(function(n){ n.setAttribute('visibility', 'hidden'); }); hideTooltip(); }
    hit.addEventListener('pointermove', show);
    hit.addEventListener('pointerdown', show);
    hit.addEventListener('pointerleave', hide);
}

function yearly(rows){
    const out = [];
    rows.forEach(function(r){
        const i = Math.floor(r.k / 12);
        if(!out[i]) out[i] = { year: i + 1, payment: 0, principal: 0, interest: 0, balance: 0, first: r.k };
        out[i].payment += r.payment; out[i].principal += r.principal; out[i].interest += r.interest; out[i].balance = r.balance;
    });
    return out;
}

function drawSplit(){
    const c = current;
    const container = document.getElementById('splitChart');
    const f = frame(container);
    const years = yearly(c.plan);
    const max = niceMax(Math.max.apply(null, years.map(function(y){ return y.payment; })));
    yAxis(f, max);
    const band = f.iw / years.length;
    const bw = Math.max(3, Math.min(24, band - 2)); // bars cap at 24px; touching bars keep a 2px gap
    const y = function(v){ return f.pad.t + f.ih - f.ih * v / max; };
    const every = Math.max(1, Math.ceil(years.length / 10));
    const GAP = 2;

    years.forEach(function(yr, i){
        const cx = f.pad.l + band * i + band / 2;
        const x0 = cx - bw / 2;
        const g = el('g', { tabindex: 0 }, f.svg);
        // principal at the bottom (square base), interest on top (rounded 4px end), 2px surface gap between
        const pTop = y(yr.principal);
        el('rect', { x: x0, y: pTop, width: bw, height: Math.max(0, y(0) - pTop), fill: css('--green') }, g);
        const iTop = y(yr.principal + yr.interest);
        const iH = Math.max(0, pTop - iTop - GAP);
        if(iH > 0){
            const rr = Math.min(4, bw / 2, iH);
            el('path', { d: 'M' + x0 + ',' + (pTop - GAP) + 'V' + (iTop + rr) + 'Q' + x0 + ',' + iTop + ' ' + (x0 + rr) + ',' + iTop +
                'H' + (x0 + bw - rr) + 'Q' + (x0 + bw) + ',' + iTop + ' ' + (x0 + bw) + ',' + (iTop + rr) + 'V' + (pTop - GAP) + 'Z', fill: css('--copper') }, g);
        }
        el('rect', { x: cx - band / 2, y: f.pad.t, width: band, height: f.ih, fill: 'transparent' }, g); // hit target wider than the bar
        if(i % every === 0 || i === years.length - 1){
            const label = el('text', { x: cx, y: f.h - 6, 'text-anchor': 'middle' }, f.svg);
            label.textContent = String(yr.year);
        }
        function show(e){
            showTooltip(e, t('yearN', { n: yr.year }), [
                [css('--green'), t('principal'), money(yr.principal)],
                [css('--copper'), t('interest'), money(yr.interest)]
            ]);
        }
        g.addEventListener('pointermove', show);
        g.addEventListener('pointerdown', show);
        g.addEventListener('pointerleave', hideTooltip);
        g.addEventListener('focus', function(){ const b = g.getBoundingClientRect(); show({ clientX: b.left + b.width / 2, clientY: b.top }); });
        g.addEventListener('blur', hideTooltip);
    });
}

const tooltip = document.getElementById('tooltip');
function showTooltip(e, title, rows){
    tooltip.textContent = '';
    const head = document.createElement('div');
    head.className = 'tt-title';
    head.textContent = title;
    tooltip.appendChild(head);
    rows.forEach(function(r){
        const row = document.createElement('div');
        row.className = 'tt-row';
        const name = document.createElement('span');
        const key = document.createElement('i');
        key.className = 'key';
        key.style.background = r[0];
        name.appendChild(key);
        name.appendChild(document.createTextNode(r[1]));
        const val = document.createElement('b');
        val.textContent = r[2];
        row.appendChild(name);
        row.appendChild(val);
        tooltip.appendChild(row);
    });
    tooltip.classList.add('show');
    const tw = tooltip.offsetWidth, th = tooltip.offsetHeight;
    let left = e.clientX + 14, top = e.clientY - th - 12;
    if(left + tw > window.innerWidth - 8) left = e.clientX - tw - 14;
    if(top < 8) top = e.clientY + 16;
    tooltip.style.left = left + 'px';
    tooltip.style.top = top + 'px';
}
function hideTooltip(){ tooltip.classList.remove('show'); }

// ---------- table + CSV ----------
function tableRows(){
    const c = current;
    if(view === 'yearly'){
        return yearly(c.plan).map(function(y){
            const from = addMonths(c.start, y.first);
            return [t('yearN', { n: y.year }) + ' · ' + from.y, y.payment, y.principal, y.interest, y.balance];
        });
    }
    return c.plan.map(function(r){ return [fmtMonth(addMonths(c.start, r.k)), r.payment, r.principal, r.interest, r.balance]; });
}

function renderTable(){
    const head = [view === 'yearly' ? t('colYear') : t('colMonth'), t('colPayment'), t('colPrincipal'), t('colInterest'), t('colBalance')];
    const table = document.getElementById('schedule');
    table.innerHTML = '<thead><tr>' + head.map(function(h){ return '<th>' + escapeHtml(h) + '</th>'; }).join('') + '</tr></thead><tbody>' +
        tableRows().map(function(r){
            return '<tr><td>' + escapeHtml(r[0]) + '</td>' + r.slice(1).map(function(v){ return '<td>' + escapeHtml(money(v)) + '</td>'; }).join('') + '</tr>';
        }).join('') + '</tbody>';
    document.getElementById('viewYearly').classList.toggle('active', view === 'yearly');
    document.getElementById('viewMonthly').classList.toggle('active', view === 'monthly');
}

function setView(v){ view = v; if(current) renderTable(); saveState(); }

// Month by month, with plain numbers so any spreadsheet can read them
function downloadCsv(){
    if(!current) return;
    const c = current;
    const lines = [[t('colPeriod'), t('colPayment'), t('colPrincipal'), t('colInterest'), t('colBalance')].join(',')];
    c.plan.forEach(function(r){
        lines.push(['"' + fmtMonth(addMonths(c.start, r.k)) + '"', r.payment.toFixed(2), r.principal.toFixed(2), r.interest.toFixed(2), r.balance.toFixed(2)].join(','));
    });
    const blob = new Blob(['﻿' + lines.join('\n')], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = t('csvName') + '.csv';
    document.body.appendChild(a);
    a.click();
    setTimeout(function(){ URL.revokeObjectURL(a.href); a.remove(); }, 0);
}

// ---------- goals, language, state ----------
function renderGoals(){
    document.getElementById('goals').innerHTML = Object.keys(GOALS).map(function(k){
        return '<button class="goal' + (k === goal ? ' selected' : '') + '" onclick="chooseGoal(\'' + k + '\')">' +
            '<span class="goal-emoji">' + GOALS[k].emoji + '</span><span class="goal-name">' + t(k) + '</span>' +
            '<span class="goal-hint">' + t(k + 'Hint') + '</span></button>';
    }).join('');
    document.getElementById('goalChip').textContent = goal ? GOALS[goal].emoji + ' ' + t(goal) + ' ▾' : '';
}

function chooseGoal(k){
    const changed = goal !== k;
    goal = k;
    // the goal only suggests a usual term; the amount and rate are always yours
    if(changed || !document.getElementById('term').value){
        unit = 'years';
        document.getElementById('term').value = toInputValue(GOALS[k].years, 0);
        applyUnit();
    }
    document.getElementById('welcome').classList.add('hidden');
    document.getElementById('app').classList.remove('hidden');
    renderGoals();
    calculate();
    const amount = document.getElementById('amount');
    if(!amount.value) amount.focus();
}

function showWelcome(){
    renderGoals();
    document.getElementById('welcome').classList.remove('hidden');
}

function applyUnit(){
    document.getElementById('unitYears').classList.toggle('active', unit === 'years');
    document.getElementById('unitMonths').classList.toggle('active', unit === 'months');
}

function setUnit(u){
    if(u === unit) return;
    const term = numVal('term');
    unit = u;
    if(term > 0) document.getElementById('term').value = toInputValue(u === 'months' ? term * 12 : Math.round(term / 12 * 10) / 10, 0);
    applyUnit();
    calculate();
}

function setLang(l){
    const prev = lang;
    const values = ['amount', 'rate', 'term', 'extra'].map(function(id){ return parseNum(document.getElementById(id).value, prev); });
    lang = l;
    document.documentElement.lang = l;
    ['amount', 'rate', 'term', 'extra'].forEach(function(id, i){ document.getElementById(id).value = toInputValue(values[i], decimalsOf(document.getElementById(id))); });
    document.querySelectorAll('[data-t]').forEach(function(node){ node.textContent = t(node.getAttribute('data-t')); });
    document.querySelectorAll('.lang-btn').forEach(function(b){ b.classList.toggle('active', b.getAttribute('data-lang') === l); });
    document.getElementById('currency').setAttribute('aria-label', t('currencyAria'));
    renderGoals();
    calculate();
}

function saveState(){
    try {
        localStorage.setItem(SAVE_KEY, JSON.stringify({
            lang: lang, goal: goal, unit: unit, view: view,
            currency: document.getElementById('currency').value,
            amount: numVal('amount'), rate: numVal('rate'), term: numVal('term'), extra: numVal('extra'),
            start: document.getElementById('start').value
        }));
    } catch(err){ /* private mode: nothing is remembered */ }
}

function loadState(){
    try { const d = JSON.parse(localStorage.getItem(SAVE_KEY)); return d && typeof d === 'object' ? d : {}; }
    catch(err){ return {}; }
}

document.addEventListener('input', function(e){ if(e.target.closest('.inputs')) calculate(); });
document.addEventListener('change', function(e){ if(e.target.closest('.inputs')) calculate(); });
document.addEventListener('keydown', function(e){
    if(e.key === 'Escape' && goal && !document.getElementById('welcome').classList.contains('hidden')){
        document.getElementById('welcome').classList.add('hidden');
    }
});
let resizeTimer = null;
window.addEventListener('resize', function(){
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function(){ if(current){ drawBalance(); drawSplit(); } }, 120);
});

(function init(){
    const saved = loadState();
    const currency = document.getElementById('currency');
    currency.innerHTML = CURRENCIES.map(function(s){ return '<option value="' + escapeHtml(s) + '">' + escapeHtml(s) + '</option>'; }).join('');
    if(CURRENCIES.indexOf(saved.currency) !== -1) currency.value = saved.currency;
    lang = saved.lang === 'en' ? 'en' : 'es';
    unit = saved.unit === 'months' ? 'months' : 'years';
    view = saved.view === 'monthly' ? 'monthly' : 'yearly';
    goal = GOALS[saved.goal] ? saved.goal : null;
    const num = function(v){ return typeof v === 'number' && isFinite(v) ? v : NaN; };
    document.getElementById('amount').value = toInputValue(num(saved.amount), 2);
    document.getElementById('rate').value = toInputValue(num(saved.rate), 3);
    document.getElementById('term').value = toInputValue(num(saved.term), 0);
    document.getElementById('extra').value = toInputValue(num(saved.extra), 2);
    if(typeof saved.start === 'string' && /^\d{4}-\d{2}$/.test(saved.start)) document.getElementById('start').value = saved.start;
    else {
        const s = startMonth();
        document.getElementById('start').value = s.y + '-' + String(s.m + 1).padStart(2, '0');
    }
    applyUnit();
    // show the app before the first calculation, so the charts measure their real width
    if(goal){
        document.getElementById('welcome').classList.add('hidden');
        document.getElementById('app').classList.remove('hidden');
    }
    setLang(lang);
})();

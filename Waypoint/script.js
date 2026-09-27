// Numbers always get thousands separators: 1.000,50 in Spanish · 1,000.50 in English
function numSeps(lang){
    return (lang || currentLang) === 'es' ? { group:'.', dec:',' } : { group:',', dec:'.' };
}

function fmt(n, decimals){
    if(decimals === undefined) decimals = 2;
    const s = numSeps();
    const parts = Math.abs(n).toFixed(decimals).split('.');
    const intPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, s.group);
    const sign = n < 0 && Number(parts.join('.')) !== 0 ? '-' : '';
    return sign + intPart + (parts[1] ? s.dec + parts[1] : '');
}

// -$1.250,00 instead of $-1.250,00, and "AED 1.250,00" gets a space after letter symbols
function money(n, sym, decimals){
    const space = /[A-Za-zÀ-ÿĀ-ž.]$/.test(sym) ? ' ' : '';
    const rounded = Number(Math.abs(n).toFixed(decimals === undefined ? 2 : decimals));
    return (n < 0 && rounded !== 0 ? '-' : '') + sym + space + fmt(Math.abs(n), decimals);
}

function parseNum(str, lang){
    if(str === undefined || str === null || str === '') return NaN;
    const s = numSeps(lang);
    return parseFloat(String(str).split(s.group).join('').replace(s.dec, '.'));
}

// Live-format a number field while typing, keeping the caret where the user expects it.
// Thousands separators are added automatically and a typed "." or "," is always the decimal key.
// Pasted numbers are read in either style ("1,234.56" or "1.234,56"), so nothing is off by 10× or 1000×.
const MAX_INT_DIGITS = 12;

// max (optional) settles "22.078" in a percent field: 22078 can't be right there, so it's 22,078
function normalizePastedNumber(text, dec, max){
    const t = String(text).replace(/[^\d.,]/g, '');
    const lastDot = t.lastIndexOf('.');
    const lastComma = t.lastIndexOf(',');
    let decAt = -1;
    if(lastDot !== -1 && lastComma !== -1){
        decAt = Math.max(lastDot, lastComma); // both marks used: the last one is the decimal
    } else if(lastDot !== -1 || lastComma !== -1){
        const at = Math.max(lastDot, lastComma);
        const repeated = t.indexOf(t[at]) !== at;                       // "1.234.567"
        const looksGrouped = t.length - at - 1 === 3 && t[at] !== dec;  // "1.234" where "." groups thousands
        const fitsGrouped = !max || Number(t.replace(/[.,]/g, '')) <= max;
        if(!repeated && !(looksGrouped && fitsGrouped)) decAt = at;
    }
    let out = '';
    for(let i = 0; i < t.length; i++){
        if(i === decAt) out += dec;
        else if(t[i] >= '0' && t[i] <= '9') out += t[i];
    }
    return out;
}

// Handles what the browser can't: the decimal key, pasted text, and deleting across a separator
function numberBeforeInput(e){
    const input = e.target;
    const s = numSeps();
    const v = input.value;
    const start = input.selectionStart, end = input.selectionEnd;
    let next = null, caret = start;
    if(/^insert(Text|FromPaste|FromDrop|ReplacementText)$/.test(e.inputType)){
        let text = e.data;
        if(text == null && e.dataTransfer) text = e.dataTransfer.getData('text/plain');
        if(!text || /^\d$/.test(text)) return; // a single digit needs no help
        const max = Number(input.getAttribute('data-max')) || 0;
        const chunk = text === '.' || text === ',' ? s.dec : normalizePastedNumber(text, s.dec, max);
        next = v.slice(0, start) + chunk + v.slice(end);
        caret = start + chunk.length;
    } else if(start === end && e.inputType === 'deleteContentBackward' && v[start - 1] === s.group){
        next = v.slice(0, start - 2) + v.slice(start); // Backspace after "1.|000" removes the 1
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
    const s = numSeps();
    const v = input.value;
    const caret = input.selectionStart;
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
    const zeros = intPart.length - intPart.replace(/^0+(?=\d)/, '').length; // "007" → "7"
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

// A number as the user would type it: 1.250 · 8,25 · 1.250,5 (no trailing zeros)
function toInputValue(n, maxDecimals){
    if(n === null || n === undefined || n === '' || isNaN(n)) return '';
    const fixed = Number(n).toFixed(maxDecimals === undefined ? 2 : maxDecimals);
    const frac = fixed.split('.')[1] || '';
    return fmt(Number(fixed), frac.replace(/0+$/, '').length);
}

function numVal(id){ return parseNum(document.getElementById(id).value); }

// Every .num-input gets live separators; data-decimals sets how many decimals it accepts (default 2)
function isNumInput(el){ return el.classList && el.classList.contains('num-input'); }
function decimalsOf(el){ return parseInt(el.getAttribute('data-decimals') || '2', 10); }

document.addEventListener('beforeinput', function(e){
    if(isNumInput(e.target)) numberBeforeInput(e);
}, true);

document.addEventListener('input', function(e){
    if(!isNumInput(e.target)) return;
    formatNumberInput(e.target, decimalsOf(e.target));
    const max = e.target.getAttribute('data-max');
    if(max && (parseNum(e.target.value) || 0) > Number(max)) e.target.value = toInputValue(Number(max), decimalsOf(e.target));
}, true);

document.addEventListener('blur', function(e){
    if(!isNumInput(e.target)) return;
    e.target.value = toInputValue(parseNum(e.target.value), decimalsOf(e.target));
}, true);

// Once the plan is on screen it updates live as you type
document.addEventListener('input', function(){
    if(document.getElementById('results').style.display !== 'none') calculate();
});
document.addEventListener('change', function(e){
    if(e.target.tagName === 'SELECT' && document.getElementById('results').style.display !== 'none') calculate();
});

// "1 año y 3 meses" / "1 year and 3 months"
function formatDuration(totalMonths){
    const es = currentLang === 'es';
    const years = Math.floor(totalMonths / 12);
    const months = totalMonths % 12;
    const y = years ? years + ' ' + (es ? (years === 1 ? 'año' : 'años') : (years === 1 ? 'year' : 'years')) : '';
    const m = months ? months + ' ' + (es ? (months === 1 ? 'mes' : 'meses') : (months === 1 ? 'month' : 'months')) : '';
    if(y && m) return y + (es ? ' y ' : ' and ') + m;
    return y || m;
}

// No hardcoded tax rates — the user enters their real tax rate manually.
// "regions" lets us show local-tax notes (e.g. New York City) for sub-national jurisdictions with extra taxes.
const countries = [
    { code:'OTHER', currency:'', name_es:'Otro / prefiero ingresarlo manualmente', name_en:'Other / enter manually' },
    { code:'US', currency:'$', name_es:'Estados Unidos', name_en:'United States', regionLabel_es:'Estado', regionLabel_en:'State', regions:[
        {name_es:'Alabama',name_en:'Alabama'},{name_es:'Alaska',name_en:'Alaska'},{name_es:'Arizona',name_en:'Arizona'},
        {name_es:'Arkansas',name_en:'Arkansas'},{name_es:'California',name_en:'California'},{name_es:'Colorado',name_en:'Colorado'},
        {name_es:'Connecticut',name_en:'Connecticut'},{name_es:'Delaware',name_en:'Delaware'},{name_es:'Florida',name_en:'Florida'},
        {name_es:'Georgia',name_en:'Georgia'},{name_es:'Hawái',name_en:'Hawaii'},{name_es:'Idaho',name_en:'Idaho'},
        {name_es:'Illinois',name_en:'Illinois'},{name_es:'Indiana',name_en:'Indiana'},{name_es:'Iowa',name_en:'Iowa'},
        {name_es:'Kansas',name_en:'Kansas'},{name_es:'Kentucky',name_en:'Kentucky'},{name_es:'Luisiana',name_en:'Louisiana'},
        {name_es:'Maine',name_en:'Maine'},{name_es:'Maryland',name_en:'Maryland'},{name_es:'Massachusetts',name_en:'Massachusetts'},
        {name_es:'Míchigan',name_en:'Michigan'},{name_es:'Minnesota',name_en:'Minnesota'},{name_es:'Misisipi',name_en:'Mississippi'},
        {name_es:'Misuri',name_en:'Missouri'},{name_es:'Montana',name_en:'Montana'},{name_es:'Nebraska',name_en:'Nebraska'},
        {name_es:'Nevada',name_en:'Nevada'},{name_es:'New Hampshire',name_en:'New Hampshire'},{name_es:'Nueva Jersey',name_en:'New Jersey'},
        {name_es:'Nuevo México',name_en:'New Mexico'},
        {name_es:'Nueva York',name_en:'New York',
            note_es:'Si vives dentro de la Ciudad de Nueva York (los 5 distritos), pagas además el impuesto local de NYC (~3,078%–3,876% según tu ingreso), sumado al estatal y federal. Yonkers también tiene su propio recargo local. Incluye ese monto en tu tasa real.',
            note_en:'If you live within New York City (the 5 boroughs), you also pay the NYC local income tax (~3.078%–3.876% depending on income), on top of state and federal. Yonkers also has its own local surcharge. Include that in your real rate.'},
        {name_es:'Carolina del Norte',name_en:'North Carolina'},
        {name_es:'Dakota del Norte',name_en:'North Dakota'},
        {name_es:'Ohio',name_en:'Ohio',
            note_es:'Además del estatal y federal, la mayoría de ciudades y pueblos de Ohio cobran su propio impuesto municipal sobre el ingreso (típicamente 1%–3%, ej. Columbus 2,5%, Cleveland 2,5%). Revisa la tasa exacta de tu municipio (muchos se administran vía RITA o CCA) y súmala a tu tasa real.',
            note_en:'On top of state and federal, most Ohio cities and towns charge their own municipal income tax (typically 1%–3%, e.g. Columbus 2.5%, Cleveland 2.5%). Check your specific municipality\'s rate (many are administered via RITA or CCA) and add it to your real rate.'},
        {name_es:'Oklahoma',name_en:'Oklahoma'},
        {name_es:'Oregón',name_en:'Oregon'},
        {name_es:'Pensilvania',name_en:'Pennsylvania',
            note_es:'Además del estatal (3,07%) y federal, casi todos los municipios de Pensilvania cobran un impuesto local sobre el ingreso (EIT). Filadelfia tiene el más alto del país: ~3,75% para residentes. Revisa la tasa de tu municipio e inclúyela en tu tasa real.',
            note_en:'On top of the state rate (3.07%) and federal, almost every Pennsylvania municipality charges a local Earned Income Tax (EIT). Philadelphia has the highest in the country: ~3.75% for residents. Check your municipality\'s rate and include it in your real rate.'},
        {name_es:'Rhode Island',name_en:'Rhode Island'},
        {name_es:'Carolina del Sur',name_en:'South Carolina'},{name_es:'Dakota del Sur',name_en:'South Dakota'},{name_es:'Tennessee',name_en:'Tennessee'},
        {name_es:'Texas',name_en:'Texas'},{name_es:'Utah',name_en:'Utah'},{name_es:'Vermont',name_en:'Vermont'},
        {name_es:'Virginia',name_en:'Virginia'},{name_es:'Washington',name_en:'Washington'},{name_es:'Virginia Occidental',name_en:'West Virginia'},
        {name_es:'Wisconsin',name_en:'Wisconsin'},{name_es:'Wyoming',name_en:'Wyoming'},{name_es:'Washington D.C.',name_en:'Washington D.C.'}
    ]},
    { code:'ES', currency:'€', name_es:'España', name_en:'Spain', regionLabel_es:'Comunidad Autónoma', regionLabel_en:'Region', regions:[
        {name_es:'Andalucía',name_en:'Andalusia'},{name_es:'Aragón',name_en:'Aragon'},{name_es:'Asturias',name_en:'Asturias'},
        {name_es:'Baleares',name_en:'Balearic Islands'},{name_es:'Canarias',name_en:'Canary Islands'},{name_es:'Cantabria',name_en:'Cantabria'},
        {name_es:'Castilla-La Mancha',name_en:'Castile-La Mancha'},{name_es:'Castilla y León',name_en:'Castile and Leon'},
        {name_es:'Cataluña',name_en:'Catalonia'},{name_es:'Extremadura',name_en:'Extremadura'},{name_es:'Galicia',name_en:'Galicia'},
        {name_es:'Madrid',name_en:'Madrid'},{name_es:'Murcia',name_en:'Murcia'},{name_es:'Navarra',name_en:'Navarre'},
        {name_es:'País Vasco',name_en:'Basque Country'},{name_es:'La Rioja',name_en:'La Rioja'},{name_es:'C. Valenciana',name_en:'Valencia'},
        {name_es:'Ceuta',name_en:'Ceuta'},{name_es:'Melilla',name_en:'Melilla'}
    ]},
    { code:'MX', currency:'MX$', name_es:'México', name_en:'Mexico' },
    { code:'VE', currency:'Bs.', name_es:'Venezuela', name_en:'Venezuela' },
    { code:'CO', currency:'COP$', name_es:'Colombia', name_en:'Colombia' },
    { code:'AR', currency:'AR$', name_es:'Argentina', name_en:'Argentina' },
    { code:'CL', currency:'CLP$', name_es:'Chile', name_en:'Chile' },
    { code:'PE', currency:'S/', name_es:'Perú', name_en:'Peru' },
    { code:'BR', currency:'R$', name_es:'Brasil', name_en:'Brazil' },
    { code:'UY', currency:'UY$', name_es:'Uruguay', name_en:'Uruguay' },
    { code:'PY', currency:'₲', name_es:'Paraguay', name_en:'Paraguay' },
    { code:'BO', currency:'Bs', name_es:'Bolivia', name_en:'Bolivia' },
    { code:'EC', currency:'$', name_es:'Ecuador', name_en:'Ecuador' },
    { code:'PA', currency:'B/.', name_es:'Panamá', name_en:'Panama' },
    { code:'CR', currency:'₡', name_es:'Costa Rica', name_en:'Costa Rica' },
    { code:'GT', currency:'Q', name_es:'Guatemala', name_en:'Guatemala' },
    { code:'HN', currency:'L', name_es:'Honduras', name_en:'Honduras' },
    { code:'NI', currency:'C$', name_es:'Nicaragua', name_en:'Nicaragua' },
    { code:'DO', currency:'RD$', name_es:'República Dominicana', name_en:'Dominican Republic' },
    { code:'GB', currency:'£', name_es:'Reino Unido', name_en:'United Kingdom' },
    { code:'DE', currency:'€', name_es:'Alemania', name_en:'Germany' },
    { code:'FR', currency:'€', name_es:'Francia', name_en:'France' },
    { code:'IT', currency:'€', name_es:'Italia', name_en:'Italy' },
    { code:'PT', currency:'€', name_es:'Portugal', name_en:'Portugal' },
    { code:'NL', currency:'€', name_es:'Países Bajos', name_en:'Netherlands' },
    { code:'BE', currency:'€', name_es:'Bélgica', name_en:'Belgium' },
    { code:'CH', currency:'Fr', name_es:'Suiza', name_en:'Switzerland' },
    { code:'AT', currency:'€', name_es:'Austria', name_en:'Austria' },
    { code:'SE', currency:'kr', name_es:'Suecia', name_en:'Sweden' },
    { code:'NO', currency:'kr', name_es:'Noruega', name_en:'Norway' },
    { code:'DK', currency:'kr', name_es:'Dinamarca', name_en:'Denmark' },
    { code:'FI', currency:'€', name_es:'Finlandia', name_en:'Finland' },
    { code:'PL', currency:'zł', name_es:'Polonia', name_en:'Poland' },
    { code:'GR', currency:'€', name_es:'Grecia', name_en:'Greece' },
    { code:'IE', currency:'€', name_es:'Irlanda', name_en:'Ireland' },
    { code:'RO', currency:'lei', name_es:'Rumania', name_en:'Romania' },
    { code:'RU', currency:'RUB', name_es:'Rusia', name_en:'Russia' },
    { code:'TR', currency:'TRY', name_es:'Turquía', name_en:'Turkey' },
    { code:'CN', currency:'¥', name_es:'China', name_en:'China' },
    { code:'JP', currency:'¥', name_es:'Japón', name_en:'Japan' },
    { code:'KR', currency:'₩', name_es:'Corea del Sur', name_en:'South Korea' },
    { code:'IN', currency:'₹', name_es:'India', name_en:'India' },
    { code:'ID', currency:'Rp', name_es:'Indonesia', name_en:'Indonesia' },
    { code:'MY', currency:'RM', name_es:'Malasia', name_en:'Malaysia' },
    { code:'TH', currency:'฿', name_es:'Tailandia', name_en:'Thailand' },
    { code:'VN', currency:'₫', name_es:'Vietnam', name_en:'Vietnam' },
    { code:'PH', currency:'₱', name_es:'Filipinas', name_en:'Philippines' },
    { code:'SG', currency:'S$', name_es:'Singapur', name_en:'Singapore' },
    { code:'AU', currency:'AU$', name_es:'Australia', name_en:'Australia' },
    { code:'NZ', currency:'NZ$', name_es:'Nueva Zelanda', name_en:'New Zealand' },
    { code:'ZA', currency:'R', name_es:'Sudáfrica', name_en:'South Africa' },
    { code:'EG', currency:'E£', name_es:'Egipto', name_en:'Egypt' },
    { code:'NG', currency:'₦', name_es:'Nigeria', name_en:'Nigeria' },
    { code:'KE', currency:'KSh', name_es:'Kenia', name_en:'Kenya' },
    { code:'MA', currency:'MAD', name_es:'Marruecos', name_en:'Morocco' },
    { code:'AE', currency:'AED', name_es:'Emiratos Árabes Unidos', name_en:'United Arab Emirates' },
    { code:'SA', currency:'SAR', name_es:'Arabia Saudita', name_en:'Saudi Arabia' },
    { code:'IL', currency:'₪', name_es:'Israel', name_en:'Israel' },
    { code:'QA', currency:'QAR', name_es:'Catar', name_en:'Qatar' },
    { code:'CA', currency:'CA$', name_es:'Canadá', name_en:'Canada' }
];

const i18n = {
    es: {
        appTitle:'🧭 Waypoint', appSubtitle:'Organiza tus ingresos y gastos para planificar tu futuro',
        welcomeTitle:'Bienvenido a bordo', welcomeSub:'Dinos tu nombre y tracemos juntos el rumbo de tus finanzas.',
        welcomeNamePh:'Ej: Gabriel', welcomeNameRequired:'Escribe tu nombre', welcomeBtn:'Comenzar →',
        greeting:'Hola, ', editNameTitle:'Cambiar nombre',
        goalTitle:'🎯 ¿Cuánto deseas ahorrar?', goalSub:'Define una meta y una fecha objetivo para ver cuánto necesitas ahorrar por pago (opcional)',
        goalAmountLabel:'Monto de la meta', goalCurrencyNote:'En la misma moneda de tus ingresos', goalDateLabel:'Fecha objetivo (opcional)', goalPh:'10.000',
        incomeTitle:'💵 Tus Ingresos', countryLabel:'País donde vives',
        countryNote:'Selecciona tu país y estado/región para ver avisos de impuestos locales (si aplica) — luego ingresa tu tasa de impuestos real abajo',
        taxNote:'Ingresa tu tasa real (revisa tu recibo de pago o el sitio oficial de impuestos de tu país). No usamos una tasa aproximada automática.',
        currencyLabel:'Moneda', hourlyLabel:'Pago por hora', hoursLabel:'Horas por semana',
        freqLabel:'Frecuencia de pago', freqNote:'Solo indica cuándo te pagan, las horas por semana no cambian',
        weekly:'Semanal', biweekly:'Quincenal', monthly:'Mensual', taxLabel:'Tasa de impuestos (%)',
        otherIncomeLabel:'Ingreso adicional mensual (opcional)', expensesTitle:'🏠 Tus Gastos Mensuales',
        fixedTitle:'Gastos Fijos', variableTitle:'Gastos Variables', addExpenseBtn:'+ Agregar otro gasto',
        calcBtn:'Calcular Mi Plan', resultsTitle:'📊 Tu Plan Financiero',
        annualGross:'Ingreso Bruto Anual', monthlyGross:'Ingreso Bruto Mensual', netStat:'Ingreso Neto Mensual',
        expenseStat:'Gastos Mensuales', savingsStat:'Ahorro Mensual',
        periodWeekly:'Ahorro Semanal', periodBiweekly:'Ahorro Quincenal',
        incomeLegend:'Ingreso', expenseLegend:'Gastos', savingsLegend:'Ahorro',
        goalProgressLabel:'🎯 Progreso hacia tu meta',
        timelineTitle:'🗓️ Proyección de Ahorro',
        placeholder:'🧭 Completa tus ingresos y gastos y toca «Calcular Mi Plan» para ver tu plan financiero personalizado',
        rent:'Alquiler', utilities:'Servicios', insurance:'Seguro', food:'Comida', transport:'Transporte', entertainment:'Entretenimiento',
        perWeek:'Por semana', perBiweek:'Por quincena', perMonth:'Por mes', perYear:'Por año', in5:'En 5 años',
        warning:'⚠️ Tus gastos superan tus ingresos. Considera reducir gastos o aumentar tus ingresos.',
        expenseName:'Nombre del gasto',
        goalDatePast:'⚠️ La fecha objetivo ya pasó. Elige una fecha futura.',
        goalNeed:'Para tu meta necesitas ahorrar', goalOnTrack:'✅ Vas bien — tu ahorro actual cubre esta meta.',
        goalShort:'⚠️ Te faltan', goalShortEnd:'por periodo para llegar a tiempo.',
        goalNoDate:'A este ritmo, alcanzarías tu meta en aproximadamente',
        hourlyPh:'25,00', moneyPh:'0,00', goalReached:'✅ ¡Ya alcanzarías tu meta en menos de un mes de ahorro!',
        perWeekWord:'semana', perBiweekWord:'quincena', perMonthWord:'mes', every:'cada', removeExpense:'Quitar gasto'
    },
    en: {
        appTitle:'🧭 Waypoint', appSubtitle:'Organize your income and expenses to plan your future',
        welcomeTitle:'Welcome aboard', welcomeSub:'Tell us your name and let\'s chart the course for your finances together.',
        welcomeNamePh:'E.g: Gabriel', welcomeNameRequired:'Type your name', welcomeBtn:'Get started →',
        greeting:'Hi, ', editNameTitle:'Change name',
        goalTitle:'🎯 How much do you want to save?', goalSub:'Set a goal and target date to see how much you need to save per paycheck (optional)',
        goalAmountLabel:'Goal amount', goalCurrencyNote:'In the same currency as your income', goalDateLabel:'Target date (optional)', goalPh:'10,000',
        incomeTitle:'💵 Your Income', countryLabel:'Country you live in',
        countryNote:'Select your country and state/region to see local tax notes (if any) — then enter your real tax rate below',
        taxNote:'Enter your real rate (check your pay stub or your country\'s official tax site). We don\'t auto-fill an approximate rate.',
        currencyLabel:'Currency', hourlyLabel:'Hourly rate', hoursLabel:'Hours per week',
        freqLabel:'Pay frequency', freqNote:'Just tells us when you get paid, hours per week do not change',
        weekly:'Weekly', biweekly:'Bi-weekly', monthly:'Monthly', taxLabel:'Tax rate (%)',
        otherIncomeLabel:'Other monthly income (optional)', expensesTitle:'🏠 Your Monthly Expenses',
        fixedTitle:'Fixed Expenses', variableTitle:'Variable Expenses', addExpenseBtn:'+ Add another expense',
        calcBtn:'Calculate My Plan', resultsTitle:'📊 Your Financial Plan',
        annualGross:'Annual Gross Income', monthlyGross:'Monthly Gross Income', netStat:'Monthly Net Income',
        expenseStat:'Monthly Expenses', savingsStat:'Monthly Savings',
        periodWeekly:'Weekly Savings', periodBiweekly:'Bi-weekly Savings',
        incomeLegend:'Income', expenseLegend:'Expenses', savingsLegend:'Savings',
        goalProgressLabel:'🎯 Progress toward your goal',
        timelineTitle:'🗓️ Savings Projection',
        placeholder:'🧭 Fill in your income and expenses and tap “Calculate My Plan” to see your personalized financial plan',
        rent:'Rent', utilities:'Utilities', insurance:'Insurance', food:'Food', transport:'Transportation', entertainment:'Entertainment',
        perWeek:'Per week', perBiweek:'Per pay period (biweekly)', perMonth:'Per month', perYear:'Per year', in5:'In 5 years',
        warning:'⚠️ Your expenses exceed your income. Consider reducing expenses or increasing income.',
        expenseName:'Expense name',
        goalDatePast:'⚠️ The target date has already passed. Pick a future date.',
        goalNeed:'To hit your goal you need to save', goalOnTrack:'✅ You are on track — your current savings covers this goal.',
        goalShort:'⚠️ You are short', goalShortEnd:'per period to make it in time.',
        goalNoDate:'At this rate, you would reach your goal in approximately',
        hourlyPh:'25.00', moneyPh:'0.00', goalReached:'✅ You would already reach your goal in under a month of saving!',
        perWeekWord:'week', perBiweekWord:'pay period', perMonthWord:'month', every:'every', removeExpense:'Remove expense'
    }
};
let currentLang = 'es';
let draftRestored = false;

function populateCountries(){
    const sel = document.getElementById('country');
    sel.innerHTML = countries.map(function(c){
        return '<option value="' + c.code + '">' + (currentLang==='es' ? c.name_es : c.name_en) + '</option>';
    }).join('');
}

function updateRegionNote(region){
    const noteEl = document.getElementById('regionNote');
    const note = region && (currentLang==='es' ? region.note_es : region.note_en);
    if(note){
        noteEl.textContent = note;
        noteEl.style.display = 'block';
    } else {
        noteEl.style.display = 'none';
    }
}

function syncGoalCurrency(){
    document.getElementById('goalCcy').textContent = document.getElementById('currency').value;
}

function onCountryChange(){
    const code = document.getElementById('country').value;
    const country = countries.find(function(c){ return c.code === code; });
    const regionField = document.getElementById('regionField');
    document.getElementById('taxRate').value = '';
    if(country && country.currency){
        const currencySel = document.getElementById('currency');
        if([].some.call(currencySel.options, function(o){ return o.value === country.currency; })){
            currencySel.value = country.currency;
        }
    }
    syncGoalCurrency();
    if(country && country.regions){
        regionField.style.display = 'block';
        document.getElementById('regionLabel').textContent = currentLang==='es' ? country.regionLabel_es : country.regionLabel_en;
        const regSel = document.getElementById('region');
        regSel.innerHTML = country.regions.map(function(r,idx){
            return '<option value="' + idx + '">' + (currentLang==='es' ? r.name_es : r.name_en) + '</option>';
        }).join('');
        onRegionChange();
    } else {
        regionField.style.display = 'none';
        updateRegionNote(null);
    }
}

function onRegionChange(){
    const code = document.getElementById('country').value;
    const country = countries.find(function(c){ return c.code === code; });
    document.getElementById('taxRate').value = '';
    if(country && country.regions){
        const idx = parseInt(document.getElementById('region').value, 10);
        updateRegionNote(country.regions[idx]);
    }
}

function setLang(lang){
    const prevLang = currentLang;
    const numInputs = Array.from(document.querySelectorAll('.num-input'));
    const numValues = numInputs.map(function(el){ return parseNum(el.value, prevLang); });
    currentLang = lang;
    document.documentElement.lang = lang;
    numInputs.forEach(function(el, i){ el.value = toInputValue(numValues[i], decimalsOf(el)); });
    document.getElementById('langEs').classList.toggle('active', lang==='es');
    document.getElementById('langEn').classList.toggle('active', lang==='en');
    document.getElementById('welcomeLangEs').classList.toggle('active', lang==='es');
    document.getElementById('welcomeLangEn').classList.toggle('active', lang==='en');
    document.querySelectorAll('[data-i18n]').forEach(function(el){ el.textContent = i18n[lang][el.getAttribute('data-i18n')]; });
    document.querySelectorAll('[data-i18n-ph]').forEach(function(el){ el.placeholder = i18n[lang][el.getAttribute('data-i18n-ph')]; });
    document.querySelectorAll('[data-i18n-title]').forEach(function(el){ el.title = i18n[lang][el.getAttribute('data-i18n-title')]; });
    document.querySelectorAll('[data-i18n-val]').forEach(function(el){ el.value = i18n[lang][el.getAttribute('data-i18n-val')]; });
    document.querySelectorAll('.expense-row input[type=text]:not([data-i18n-val]):not(.num-input)').forEach(function(el){
        el.placeholder = i18n[lang].expenseName;
    });
    document.querySelectorAll('.remove-x').forEach(function(el){ el.title = i18n[lang].removeExpense; el.setAttribute('aria-label', i18n[lang].removeExpense); });
    const currentCountry = document.getElementById('country').value;
    const currentRegion = document.getElementById('region').value;
    const currentTaxRate = document.getElementById('taxRate').value;
    populateCountries();
    document.getElementById('country').value = currentCountry;
    onCountryChange();
    if(document.getElementById('regionField').style.display !== 'none'){
        document.getElementById('region').value = currentRegion;
        onRegionChange();
    }
    document.getElementById('taxRate').value = currentTaxRate;
    refreshGreeting();
    const results = document.getElementById('results');
    if(results.style.display !== 'none') calculate();
    if(draftRestored) saveDraft();
}

function addCustomExpense(){
    const container = document.getElementById('variableExpenses');
    const row = document.createElement('div');
    row.className = 'expense-row';
    row.innerHTML = '<input type="text" maxlength="30" placeholder="' + i18n[currentLang].expenseName + '">' +
        '<input type="text" inputmode="decimal" autocomplete="off" class="expense-value num-input" placeholder="' + i18n[currentLang].moneyPh + '" data-i18n-ph="moneyPh">' +
        removeBtnHtml();
    container.appendChild(row);
    row.querySelector('input').focus();
}

function removeBtnHtml(){
    return '<button class="remove-x" onclick="removeExpense(this)" title="' + i18n[currentLang].removeExpense + '" aria-label="' + i18n[currentLang].removeExpense + '">✕</button>';
}

function removeExpense(btn){
    btn.parentElement.remove();
    saveDraft();
    if(document.getElementById('results').style.display !== 'none') calculate();
}

function calculate(){
    const t = i18n[currentLang];
    const currency = document.getElementById('currency').value;
    const hourlyRate = Math.max(numVal('hourlyRate') || 0, 0);
    const hoursPerWeek = Math.min(Math.max(numVal('hoursPerWeek') || 0, 0), 168);
    const otherIncome = Math.max(numVal('otherIncome') || 0, 0);
    const taxRate = Math.min(Math.max(numVal('taxRate') || 0, 0), 100);
    const frequency = document.getElementById('payFrequency').value;
    const savingsGoal = Math.max(numVal('savingsGoal') || 0, 0);
    const goalCurrency = currency;
    const goalDateStr = document.getElementById('goalDate').value;

    const annualGross = hourlyRate * hoursPerWeek * 52;
    const grossMonthly = annualGross / 12;
    const netMonthly = grossMonthly * (1 - taxRate / 100) + otherIncome;

    let totalExpenses = 0;
    document.querySelectorAll('.expense-value').forEach(function(inp){
        totalExpenses += Math.max(parseNum(inp.value) || 0, 0);
    });

    const monthlySavings = netMonthly - totalExpenses;
    const annualSavings = monthlySavings * 12;
    const weeklySavings = monthlySavings * 12 / 52;
    const biweeklySavings = monthlySavings * 12 / 26;

    document.getElementById('annualVal').textContent = money(annualGross, currency, 0);
    document.getElementById('grossVal').textContent = money(grossMonthly, currency);
    document.getElementById('netVal').textContent = money(netMonthly, currency);
    document.getElementById('expenseVal').textContent = money(totalExpenses, currency);
    document.getElementById('savingsVal').textContent = money(monthlySavings, currency);

    const savingsBox = document.getElementById('savingsBox');
    savingsBox.className = 'stat-box savings';
    if(monthlySavings < 0) savingsBox.classList.add('danger');
    // Monthly pay has no per-period box, so monthly savings takes the full row
    if(frequency === 'monthly') savingsBox.classList.add('full');

    const periodBox = document.getElementById('periodBox');
    let periodSavingsForFreq = monthlySavings;
    if(frequency === 'weekly'){
        periodBox.style.display = 'block';
        document.getElementById('periodLabel').textContent = t.periodWeekly;
        document.getElementById('periodVal').textContent = money(weeklySavings, currency);
        periodSavingsForFreq = weeklySavings;
    } else if(frequency === 'biweekly'){
        periodBox.style.display = 'block';
        document.getElementById('periodLabel').textContent = t.periodBiweekly;
        document.getElementById('periodVal').textContent = money(biweeklySavings, currency);
        periodSavingsForFreq = biweeklySavings;
    } else {
        periodBox.style.display = 'none';
    }

    const maxRef = Math.max(netMonthly, totalExpenses, Math.abs(monthlySavings), 1);
    document.getElementById('barIncomeVal').textContent = money(netMonthly, currency);
    document.getElementById('barExpenseVal').textContent = money(totalExpenses, currency);
    document.getElementById('barSavingsVal').textContent = money(monthlySavings, currency);
    document.getElementById('barIncome').style.width = Math.min((netMonthly/maxRef)*100,100) + '%';
    document.getElementById('barExpense').style.width = Math.min((totalExpenses/maxRef)*100,100) + '%';
    document.getElementById('barSavings').style.width = Math.min((Math.max(monthlySavings,0)/maxRef)*100,100) + '%';

    // Goal progress — with target date if provided, otherwise fallback to simple months-to-goal estimate
    const goalBox = document.getElementById('goalProgressBox');
    const goalText = document.getElementById('goalProgressText');
    goalText.className = 'goal-progress-text';
    if(savingsGoal > 0 && goalDateStr){
        const targetDate = new Date(goalDateStr + 'T00:00:00');
        const today = new Date();
        today.setHours(0,0,0,0);
        const msPerDay = 86400000;
        const daysRemaining = Math.round((targetDate - today) / msPerDay);

        if(daysRemaining <= 0){
            goalBox.style.display = 'block';
            document.getElementById('goalProgressFill').style.width = '0%';
            goalText.textContent = t.goalDatePast;
            goalText.classList.add('short');
        } else {
            goalBox.style.display = 'block';
            let requiredPerPeriod, periodWord;
            if(frequency === 'weekly'){
                requiredPerPeriod = savingsGoal / (daysRemaining/7);
                periodWord = t.perWeekWord;
            } else if(frequency === 'biweekly'){
                requiredPerPeriod = savingsGoal / (daysRemaining/14);
                periodWord = t.perBiweekWord;
            } else {
                requiredPerPeriod = savingsGoal / (daysRemaining/30.44);
                periodWord = t.perMonthWord;
            }
            const progressPct = periodSavingsForFreq > 0 ? Math.min((periodSavingsForFreq/requiredPerPeriod)*100, 100) : 0;
            document.getElementById('goalProgressFill').style.width = progressPct + '%';

            const needLine = t.goalNeed + ' ' + money(requiredPerPeriod, goalCurrency) + ' ' + t.every + ' ' + periodWord + '.';
            if(periodSavingsForFreq >= requiredPerPeriod){
                goalText.innerHTML = needLine + '<br>' + t.goalOnTrack;
                goalText.classList.add('ontrack');
            } else {
                const shortfall = requiredPerPeriod - periodSavingsForFreq;
                goalText.innerHTML = needLine + '<br>' + t.goalShort + ' ' + money(shortfall, goalCurrency) + ' ' + t.goalShortEnd;
                goalText.classList.add('short');
            }
        }
    } else if(savingsGoal > 0 && monthlySavings > 0){
        goalBox.style.display = 'block';
        const monthsToGoal = savingsGoal / monthlySavings;
        const progressPct = Math.min((monthlySavings/savingsGoal)*100, 100);
        document.getElementById('goalProgressFill').style.width = progressPct + '%';
        if(monthsToGoal < 1){
            goalText.textContent = t.goalReached;
        } else {
            goalText.textContent = t.goalNoDate + ' ' + formatDuration(Math.ceil(monthsToGoal)) + ' (' + money(savingsGoal, goalCurrency, 0) + ').';
        }
    } else {
        goalBox.style.display = 'none';
    }

    const timelineRows = document.getElementById('timelineRows');
    if(monthlySavings > 0){
        let rows = '';
        if(frequency === 'weekly'){
            rows += '<div class="timeline-row"><span class="timeline-period">' + t.perWeek + '</span><span class="timeline-value">' + money(weeklySavings, currency) + '</span></div>';
        } else if(frequency === 'biweekly'){
            rows += '<div class="timeline-row"><span class="timeline-period">' + t.perBiweek + '</span><span class="timeline-value">' + money(biweeklySavings, currency) + '</span></div>';
        }
        rows += '<div class="timeline-row"><span class="timeline-period">' + t.perMonth + '</span><span class="timeline-value">' + money(monthlySavings, currency) + '</span></div>';
        rows += '<div class="timeline-row"><span class="timeline-period">' + t.perYear + '</span><span class="timeline-value">' + money(annualSavings, currency) + '</span></div>';
        rows += '<div class="timeline-row"><span class="timeline-period">' + t.in5 + '</span><span class="timeline-value">' + money(annualSavings*5, currency) + '</span></div>';
        timelineRows.innerHTML = rows;
    } else {
        timelineRows.innerHTML = '<div class="alert-box">' + t.warning + '</div>';
    }

    document.getElementById('results').style.display = 'block';
    document.getElementById('placeholder').style.display = 'none';
}

const DRAFT_KEY = 'waypointDraft';
const OLD_DRAFT_KEY = 'brujulaFinancieraDraft';

// Drafts store plain numbers ("1250.5") so they survive a language switch; old drafts used the same format
function draftNum(id){ const n = numVal(id); return isNaN(n) ? '' : String(n); }
// Saved values already respect each field's decimals, so 3 never adds precision that wasn't typed
function fromDraftNum(v){ return v === undefined || v === null || v === '' ? '' : toInputValue(Number(v), 3); }

function escapeHtml(str){
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function saveDraft(){
    try{
        const fixedValues = Array.from(document.querySelectorAll('#fixedExpenses .expense-value')).map(function(el){ const n = parseNum(el.value); return isNaN(n) ? '' : String(n); });
        const variableRows = Array.from(document.querySelectorAll('#variableExpenses .expense-row')).map(function(row){
            const textInput = row.querySelector('input[type=text]');
            return {
                key: textInput.getAttribute('data-i18n-val'),
                label: textInput.value,
                value: (function(n){ return isNaN(n) ? '' : String(n); })(parseNum(row.querySelector('.expense-value').value))
            };
        });
        const draft = {
            lang: currentLang,
            country: document.getElementById('country').value,
            region: document.getElementById('region').value,
            currency: document.getElementById('currency').value,
            hourlyRate: draftNum('hourlyRate'),
            hoursPerWeek: draftNum('hoursPerWeek'),
            payFrequency: document.getElementById('payFrequency').value,
            taxRate: draftNum('taxRate'),
            otherIncome: draftNum('otherIncome'),
            savingsGoal: draftNum('savingsGoal'),
            goalDate: document.getElementById('goalDate').value,
            showResults: document.getElementById('results').style.display !== 'none',
            fixedValues: fixedValues,
            variableRows: variableRows
        };
        localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    } catch(err){
        // localStorage unavailable (private mode, quota, etc.) — safe to ignore
    }
}

function restoreDraft(){
    let draft;
    try{
        const raw = localStorage.getItem(DRAFT_KEY) || localStorage.getItem(OLD_DRAFT_KEY);
        if(!raw) return;
        draft = JSON.parse(raw);
    } catch(err){
        return;
    }
    if(!draft) return;

    if(draft.lang === 'en' && currentLang !== 'en') setLang('en');

    if(draft.country){
        document.getElementById('country').value = draft.country;
        onCountryChange();
    }
    if(draft.region && document.getElementById('regionField').style.display !== 'none'){
        document.getElementById('region').value = draft.region;
        onRegionChange();
    }
    if(draft.currency) document.getElementById('currency').value = draft.currency;
    syncGoalCurrency();
    document.getElementById('hourlyRate').value = fromDraftNum(draft.hourlyRate);
    document.getElementById('hoursPerWeek').value = fromDraftNum(draft.hoursPerWeek);
    if(draft.payFrequency) document.getElementById('payFrequency').value = draft.payFrequency;
    document.getElementById('taxRate').value = fromDraftNum(draft.taxRate);
    document.getElementById('otherIncome').value = fromDraftNum(draft.otherIncome);
    document.getElementById('savingsGoal').value = fromDraftNum(draft.savingsGoal);
    document.getElementById('goalDate').value = draft.goalDate || '';

    if(draft.fixedValues){
        const fixedInputs = document.querySelectorAll('#fixedExpenses .expense-value');
        draft.fixedValues.forEach(function(v, i){ if(fixedInputs[i]) fixedInputs[i].value = fromDraftNum(v); });
    }

    if(draft.variableRows && draft.variableRows.length){
        const container = document.getElementById('variableExpenses');
        container.innerHTML = '';
        draft.variableRows.forEach(function(r){
            const row = document.createElement('div');
            row.className = 'expense-row';
            const valueInput = '<input type="text" inputmode="decimal" autocomplete="off" class="expense-value num-input" placeholder="' + i18n[currentLang].moneyPh + '" data-i18n-ph="moneyPh" value="' + escapeHtml(fromDraftNum(r.value)) + '">';
            if(r.key){
                row.innerHTML = '<input type="text" data-i18n-val="' + r.key + '" value="' + escapeHtml(i18n[currentLang][r.key] || r.label) + '" readonly tabindex="-1">' + valueInput;
            } else {
                row.innerHTML = '<input type="text" maxlength="30" placeholder="' + i18n[currentLang].expenseName + '" value="' + escapeHtml(r.label) + '">' + valueInput + removeBtnHtml();
            }
            container.appendChild(row);
        });
    }

    if(draft.showResults !== false) calculate();
}

document.addEventListener('input', saveDraft);
document.addEventListener('change', saveDraft);

const USER_NAME_KEY = 'waypointUserName';

function refreshGreeting(){
    let name = null;
    try{ name = localStorage.getItem(USER_NAME_KEY); } catch(err){ /* ignore */ }
    if(name){
        document.getElementById('userGreetingText').textContent = i18n[currentLang].greeting + name;
    }
}

function startJourney(){
    const input = document.getElementById('userNameInput');
    const name = input.value.trim();
    if(!name){
        input.classList.add('error');
        document.getElementById('welcomeNameError').classList.add('show');
        return;
    }
    input.classList.remove('error');
    document.getElementById('welcomeNameError').classList.remove('show');
    try{ localStorage.setItem(USER_NAME_KEY, name); } catch(err){ /* ignore */ }
    refreshGreeting();
    document.getElementById('welcomeOverlay').classList.add('hidden');
    document.getElementById('appWrapper').classList.remove('hidden');
}

function editUserName(){
    let current = '';
    try{ current = localStorage.getItem(USER_NAME_KEY) || ''; } catch(err){ /* ignore */ }
    const input = document.getElementById('userNameInput');
    input.value = current;
    document.getElementById('welcomeOverlay').classList.remove('hidden');
    input.focus();
    input.select();
}

function initUserSetup(){
    let savedName = null;
    try{ savedName = localStorage.getItem(USER_NAME_KEY); } catch(err){ /* ignore */ }
    if(savedName){
        refreshGreeting();
        document.getElementById('welcomeOverlay').classList.add('hidden');
        document.getElementById('appWrapper').classList.remove('hidden');
    }
}

document.getElementById('userNameInput').addEventListener('keydown', function(e){
    if(e.key === 'Enter') startJourney();
});

// Esc backs out of renaming, as long as a name is already saved
document.addEventListener('keydown', function(e){
    if(e.key === 'Escape' && !document.getElementById('appWrapper').classList.contains('hidden')){
        document.getElementById('welcomeOverlay').classList.add('hidden');
    }
});

// Enter in any field calculates the plan
document.getElementById('appWrapper').addEventListener('keydown', function(e){
    if(e.key === 'Enter' && e.target.tagName === 'INPUT') calculate();
});

(function setGoalDateMin(){
    const d = new Date();
    d.setDate(d.getDate() + 1);
    const pad = function(n){ return String(n).padStart(2, '0'); };
    document.getElementById('goalDate').min = d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
})();

initUserSetup();
setLang('es');
restoreDraft();
draftRestored = true;

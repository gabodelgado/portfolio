// Only real rates are shown: live from the API, or the last live rates saved on this device.
// There are no hardcoded fallback rates — without data the app says so instead of guessing.
const CURRENCY_CODES = [
    'USD', 'EUR', 'GBP', 'JPY', 'CHF', 'CAD', 'AUD', 'NZD', 'CNY', 'HKD', 'SGD', 'INR',
    'KRW', 'TWD', 'THB', 'MYR', 'IDR', 'PHP', 'VND', 'PKR', 'BDT', 'LKR', 'NPR', 'MMK',
    'KHR', 'LAK', 'MNT', 'MXN', 'BRL', 'COP', 'CLP', 'ARS', 'PEN', 'UYU', 'VES', 'BOB',
    'PYG', 'GTQ', 'HNL', 'NIO', 'CRC', 'PAB', 'DOP', 'JMD', 'TTD', 'BSD', 'BBD', 'ZAR',
    'EGP', 'NGN', 'KES', 'GHS', 'ETB', 'TZS', 'UGX', 'ZMW', 'MAD', 'TND', 'DZD', 'SEK',
    'NOK', 'DKK', 'PLN', 'CZK', 'HUF', 'RON', 'RUB', 'TRY', 'UAH', 'BGN', 'ISK', 'RSD',
    'GEL', 'AMD', 'AZN', 'KZT', 'UZS', 'AED', 'SAR', 'ILS', 'QAR', 'BHD', 'KWD', 'OMR',
    'JOD', 'LBP', 'IQD', 'FJD'
];

const usdRates = {};
let ratesAreLive = false;
let hasRealData = false;
let isFetching = false;
let lastUpdated = null;

const RATES_CACHE_KEY = 'swapRatesCache';
const OLD_RATES_CACHE_KEY = 'currencyExchangeRatesCache';

function loadCachedRates(){
    try{
        const raw = localStorage.getItem(RATES_CACHE_KEY) || localStorage.getItem(OLD_RATES_CACHE_KEY);
        if(!raw) return false;
        const cached = JSON.parse(raw);
        if(!cached || !cached.rates || !cached.timestamp) return false;
        CURRENCY_CODES.forEach(function(code){
            if(typeof cached.rates[code] === 'number'){ usdRates[code] = cached.rates[code]; }
        });
        lastUpdated = new Date(cached.timestamp);
        hasRealData = true;
        return true;
    } catch(err){
        return false;
    }
}

function saveCachedRates(){
    try{
        localStorage.setItem(RATES_CACHE_KEY, JSON.stringify({ rates: usdRates, timestamp: lastUpdated.getTime() }));
    } catch(err){
        // localStorage unavailable (private mode, quota, etc.) — safe to ignore
    }
}

const flags = {
    USD:'🇺🇸', EUR:'🇪🇺', GBP:'🇬🇧', JPY:'🇯🇵', CHF:'🇨🇭', CAD:'🇨🇦', AUD:'🇦🇺', NZD:'🇳🇿',
    CNY:'🇨🇳', HKD:'🇭🇰', SGD:'🇸🇬', INR:'🇮🇳', KRW:'🇰🇷', TWD:'🇹🇼', THB:'🇹🇭', MYR:'🇲🇾', IDR:'🇮🇩', PHP:'🇵🇭', VND:'🇻🇳',
    PKR:'🇵🇰', BDT:'🇧🇩', LKR:'🇱🇰', NPR:'🇳🇵', MMK:'🇲🇲', KHR:'🇰🇭', LAK:'🇱🇦', MNT:'🇲🇳',
    MXN:'🇲🇽', BRL:'🇧🇷', COP:'🇨🇴', CLP:'🇨🇱', ARS:'🇦🇷', PEN:'🇵🇪', UYU:'🇺🇾', VES:'🇻🇪',
    BOB:'🇧🇴', PYG:'🇵🇾', GTQ:'🇬🇹', HNL:'🇭🇳', NIO:'🇳🇮', CRC:'🇨🇷', PAB:'🇵🇦', DOP:'🇩🇴', JMD:'🇯🇲', TTD:'🇹🇹', BSD:'🇧🇸', BBD:'🇧🇧',
    ZAR:'🇿🇦', EGP:'🇪🇬', NGN:'🇳🇬', KES:'🇰🇪', GHS:'🇬🇭', ETB:'🇪🇹', TZS:'🇹🇿', UGX:'🇺🇬', ZMW:'🇿🇲',
    MAD:'🇲🇦', TND:'🇹🇳', DZD:'🇩🇿',
    SEK:'🇸🇪', NOK:'🇳🇴', DKK:'🇩🇰', PLN:'🇵🇱', CZK:'🇨🇿', HUF:'🇭🇺', RON:'🇷🇴', RUB:'🇷🇺', TRY:'🇹🇷',
    UAH:'🇺🇦', BGN:'🇧🇬', ISK:'🇮🇸', RSD:'🇷🇸', GEL:'🇬🇪', AMD:'🇦🇲', AZN:'🇦🇿', KZT:'🇰🇿', UZS:'🇺🇿',
    AED:'🇦🇪', SAR:'🇸🇦', ILS:'🇮🇱', QAR:'🇶🇦', BHD:'🇧🇭', KWD:'🇰🇼', OMR:'🇴🇲', JOD:'🇯🇴', LBP:'🇱🇧', IQD:'🇮🇶',
    FJD:'🇫🇯'
};

const names = {
    es: { USD:'Dólar EE.UU.', EUR:'Euro', GBP:'Libra Esterlina', JPY:'Yen Japonés', CHF:'Franco Suizo', CAD:'Dólar Canadiense', AUD:'Dólar Australiano', NZD:'Dólar Neozelandés',
        CNY:'Yuan Chino', HKD:'Dólar Hong Kong', SGD:'Dólar Singapur', INR:'Rupia India', KRW:'Won Surcoreano', TWD:'Dólar Taiwanés', THB:'Baht Tailandés', MYR:'Ringgit Malayo', IDR:'Rupia Indonesia', PHP:'Peso Filipino', VND:'Dong Vietnamita',
        PKR:'Rupia Pakistaní', BDT:'Taka Bangladesí', LKR:'Rupia de Sri Lanka', NPR:'Rupia Nepalí', MMK:'Kyat de Myanmar', KHR:'Riel Camboyano', LAK:'Kip Laosiano', MNT:'Tugrik Mongol',
        MXN:'Peso Mexicano', BRL:'Real Brasileño', COP:'Peso Colombiano', CLP:'Peso Chileno', ARS:'Peso Argentino', PEN:'Sol Peruano', UYU:'Peso Uruguayo', VES:'Bolívar Venezolano',
        BOB:'Boliviano', PYG:'Guaraní Paraguayo', GTQ:'Quetzal Guatemalteco', HNL:'Lempira Hondureño', NIO:'Córdoba Nicaragüense', CRC:'Colón Costarricense', PAB:'Balboa Panameño', DOP:'Peso Dominicano', JMD:'Dólar Jamaiquino', TTD:'Dólar de Trinidad y Tobago', BSD:'Dólar Bahameño', BBD:'Dólar de Barbados',
        ZAR:'Rand Sudafricano', EGP:'Libra Egipcia', NGN:'Naira Nigeriana', KES:'Chelín Keniano', GHS:'Cedi Ghanés', ETB:'Birr Etíope', TZS:'Chelín Tanzano', UGX:'Chelín Ugandés', ZMW:'Kwacha Zambiano',
        MAD:'Dirham Marroquí', TND:'Dinar Tunecino', DZD:'Dinar Argelino',
        SEK:'Corona Sueca', NOK:'Corona Noruega', DKK:'Corona Danesa', PLN:'Zloty Polaco', CZK:'Corona Checa', HUF:'Florín Húngaro', RON:'Leu Rumano', RUB:'Rublo Ruso', TRY:'Lira Turca',
        UAH:'Grivna Ucraniana', BGN:'Lev Búlgaro', ISK:'Corona Islandesa', RSD:'Dinar Serbio', GEL:'Lari Georgiano', AMD:'Dram Armenio', AZN:'Manat Azerbaiyano', KZT:'Tenge Kazajo', UZS:'Sum Uzbeko',
        AED:'Dirham EAU', SAR:'Riyal Saudí', ILS:'Séquel Israelí', QAR:'Riyal Catarí', BHD:'Dinar Bareiní', KWD:'Dinar Kuwaití', OMR:'Rial Omaní', JOD:'Dinar Jordano', LBP:'Libra Libanesa', IQD:'Dinar Iraquí',
        FJD:'Dólar Fiyiano' },
    en: { USD:'US Dollar', EUR:'Euro', GBP:'British Pound', JPY:'Japanese Yen', CHF:'Swiss Franc', CAD:'Canadian Dollar', AUD:'Australian Dollar', NZD:'New Zealand Dollar',
        CNY:'Chinese Yuan', HKD:'Hong Kong Dollar', SGD:'Singapore Dollar', INR:'Indian Rupee', KRW:'South Korean Won', TWD:'Taiwan Dollar', THB:'Thai Baht', MYR:'Malaysian Ringgit', IDR:'Indonesian Rupiah', PHP:'Philippine Peso', VND:'Vietnamese Dong',
        PKR:'Pakistani Rupee', BDT:'Bangladeshi Taka', LKR:'Sri Lankan Rupee', NPR:'Nepalese Rupee', MMK:'Myanmar Kyat', KHR:'Cambodian Riel', LAK:'Lao Kip', MNT:'Mongolian Tugrik',
        MXN:'Mexican Peso', BRL:'Brazilian Real', COP:'Colombian Peso', CLP:'Chilean Peso', ARS:'Argentine Peso', PEN:'Peruvian Sol', UYU:'Uruguayan Peso', VES:'Venezuelan Bolivar',
        BOB:'Bolivian Boliviano', PYG:'Paraguayan Guarani', GTQ:'Guatemalan Quetzal', HNL:'Honduran Lempira', NIO:'Nicaraguan Cordoba', CRC:'Costa Rican Colon', PAB:'Panamanian Balboa', DOP:'Dominican Peso', JMD:'Jamaican Dollar', TTD:'Trinidad & Tobago Dollar', BSD:'Bahamian Dollar', BBD:'Barbadian Dollar',
        ZAR:'South African Rand', EGP:'Egyptian Pound', NGN:'Nigerian Naira', KES:'Kenyan Shilling', GHS:'Ghanaian Cedi', ETB:'Ethiopian Birr', TZS:'Tanzanian Shilling', UGX:'Ugandan Shilling', ZMW:'Zambian Kwacha',
        MAD:'Moroccan Dirham', TND:'Tunisian Dinar', DZD:'Algerian Dinar',
        SEK:'Swedish Krona', NOK:'Norwegian Krone', DKK:'Danish Krone', PLN:'Polish Zloty', CZK:'Czech Koruna', HUF:'Hungarian Forint', RON:'Romanian Leu', RUB:'Russian Ruble', TRY:'Turkish Lira',
        UAH:'Ukrainian Hryvnia', BGN:'Bulgarian Lev', ISK:'Icelandic Krona', RSD:'Serbian Dinar', GEL:'Georgian Lari', AMD:'Armenian Dram', AZN:'Azerbaijani Manat', KZT:'Kazakhstani Tenge', UZS:'Uzbekistani Som',
        AED:'UAE Dirham', SAR:'Saudi Riyal', ILS:'Israeli Shekel', QAR:'Qatari Riyal', BHD:'Bahraini Dinar', KWD:'Kuwaiti Dinar', OMR:'Omani Rial', JOD:'Jordanian Dinar', LBP:'Lebanese Pound', IQD:'Iraqi Dinar',
        FJD:'Fijian Dollar' }
};

const symbols = {
    USD:'$', EUR:'€', GBP:'£', JPY:'¥', CHF:'Fr', CAD:'CA$', AUD:'AU$', NZD:'NZ$',
    CNY:'¥', HKD:'HK$', SGD:'S$', INR:'₹', KRW:'₩', TWD:'NT$', THB:'฿', MYR:'RM', IDR:'Rp', PHP:'₱', VND:'₫',
    PKR:'Rs', BDT:'৳', LKR:'Rs', NPR:'Rs', MMK:'K', KHR:'៛', LAK:'₭', MNT:'₮',
    MXN:'MX$', BRL:'R$', COP:'COP$', CLP:'CLP$', ARS:'AR$', PEN:'S/', UYU:'UY$', VES:'Bs.',
    BOB:'Bs', PYG:'₲', GTQ:'Q', HNL:'L', NIO:'C$', CRC:'₡', PAB:'B/.', DOP:'RD$', JMD:'J$', TTD:'TT$', BSD:'B$', BBD:'Bds$',
    ZAR:'R', EGP:'E£', NGN:'₦', KES:'KSh', GHS:'₵', ETB:'Br', TZS:'TSh', UGX:'USh', ZMW:'ZK',
    MAD:'MAD', TND:'TND', DZD:'DZD',
    SEK:'kr', NOK:'kr', DKK:'kr', PLN:'zł', CZK:'Kč', HUF:'Ft', RON:'lei', RUB:'₽', TRY:'₺',
    UAH:'₴', BGN:'лв', ISK:'ISK', RSD:'RSD', GEL:'₾', AMD:'֏', AZN:'₼', KZT:'₸', UZS:'soʻm',
    AED:'AED', SAR:'SAR', ILS:'₪', QAR:'QAR', BHD:'BHD', KWD:'KWD', OMR:'OMR', JOD:'JOD', LBP:'LBP', IQD:'IQD',
    FJD:'FJ$'
};

const i18n = {
    es: { title:'SWAP', subtitle:'Tasas reales del mercado, sin comisión', live:'TASAS AL DÍA',
        loadingRates:'Actualizando tasas...', offlineRates:'Sin conexión', cachedRates:'Últimas tasas guardadas (sin conexión)',
        youSend:'Envías', theyReceive:'Reciben', totalReceive:'Total a recibir',
        noFees:'Sin comisiones · Sin cargos ocultos · Tasa real', updated:'Última actualización:', searchPh:'Buscar moneda o país...',
        noRates:'No pudimos cargar las tasas. Revisa tu conexión y toca ⟳ para reintentar.',
        noRatesTs:'Aún no hay tasas descargadas en este dispositivo',
        noResults:'Sin resultados', refresh:'Actualizar tasas', swapLabel:'Intercambiar monedas',
        welcomeTitle:'¿En qué moneda piensas?', welcomeSub:'Elige tu moneda local y la usaremos como punto de partida cada vez que abras la app.',
        welcomeBtn:'Comenzar →', changeHome:'Cambiar moneda local', ratesBy:'Tasas de' },
    en: { title:'SWAP', subtitle:'Real mid-market rates, zero markup', live:'RATES UP TO DATE',
        loadingRates:'Updating rates...', offlineRates:'Offline', cachedRates:'Last saved rates (offline)',
        youSend:'You send', theyReceive:'They receive', totalReceive:'Total to receive',
        noFees:'No fees · No hidden charges · Real exchange rate', updated:'Last updated:', searchPh:'Search currency or country...',
        noRates:'We couldn\'t load the rates. Check your connection and tap ⟳ to retry.',
        noRatesTs:'No rates downloaded on this device yet',
        noResults:'No results', refresh:'Refresh rates', swapLabel:'Swap currencies',
        welcomeTitle:'What\'s your home currency?', welcomeSub:'Pick your local currency and we\'ll use it as your starting point every time you open the app.',
        welcomeBtn:'Get started →', changeHome:'Change home currency', ratesBy:'Rates by' }
};
let currentLang = 'es';
let fromValue = 'USD';
let toValue = 'EUR';
let homeSelection = 'USD';
const currencyCodes = CURRENCY_CODES;

const LANG_KEY = 'swapLang';

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

function parseNum(str, lang){
    if(str === undefined || str === null || str === '') return NaN;
    const s = numSeps(lang);
    return parseFloat(String(str).split(s.group).join('').replace(s.dec, '.'));
}

// How many decimals a currency really uses (JPY/KRW/CLP: 0, USD/EUR: 2, KWD/BHD: 3)
function currencyDigits(code){
    try{ return new Intl.NumberFormat('en', {style:'currency', currency:code}).resolvedOptions().maximumFractionDigits; }
    catch(err){ return 2; }
}

function money(n, code){
    const sym = symbols[code];
    const space = /[A-Za-zÀ-ÿЀ-ӿ]$/.test(sym) ? ' ' : '';
    return sym + space + fmt(n, currencyDigits(code));
}

// Small rates (e.g. 1 IDR = 0.0000634 USD) keep enough significant digits to be useful
function formatRate(rate){
    if(rate >= 1) return fmt(rate, 4);
    const decimals = Math.min(Math.max(4, -Math.floor(Math.log10(rate)) + 3), 10);
    return fmt(rate, decimals);
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

function sortedCodes(){
    return [...currencyCodes].sort(function(a,b){
        return names[currentLang][a].localeCompare(names[currentLang][b], currentLang);
    });
}

// The keyboard highlight starts on the current currency (so Enter keeps it), or on the first search match
function itemsHtml(codes, which, highlightSelected){
    if(codes.length === 0) return '<div class="ccy-empty">' + i18n[currentLang].noResults + '</div>';
    const selected = which === 'from' ? fromValue : (which === 'to' ? toValue : homeSelection);
    const highlight = highlightSelected && codes.indexOf(selected) !== -1 ? selected : codes[0];
    return codes.map(function(code){
        return '<div class="ccy-item' + (code === selected ? ' selected' : '') + (code === highlight ? ' highlighted' : '') + '" data-code="' + code + '" onclick="selectCurrency(\'' + which + '\',\'' + code + '\')">' +
            '<span class="flag">' + flags[code] + '</span>' +
            '<span class="code">' + code + '</span>' +
            '<span class="name">' + names[currentLang][code] + '</span></div>';
    }).join('');
}

function buildList(which){
    document.getElementById(which + 'List').innerHTML = itemsHtml(sortedCodes(), which, true);
}

// Accent-insensitive search: "dolar" finds "Dólar", "yen" finds "Yen Japonés"
function normalize(str){
    return str.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

function filterList(which){
    const query = normalize(document.getElementById(which + 'Search').value.trim());
    const codes = sortedCodes().filter(function(code){
        return normalize(code).indexOf(query) !== -1 ||
            normalize(names.es[code]).indexOf(query) !== -1 ||
            normalize(names.en[code]).indexOf(query) !== -1;
    });
    document.getElementById(which + 'List').innerHTML = itemsHtml(codes, which, query === '');
}

function closeAllDropdowns(){
    ['from','to','home'].forEach(function(w){ document.getElementById(w + 'Panel').classList.remove('open'); });
}

function toggleDropdown(which){
    const panel = document.getElementById(which + 'Panel');
    const isOpen = panel.classList.contains('open');
    closeAllDropdowns();
    if(!isOpen){
        panel.classList.add('open');
        document.getElementById(which + 'Search').value = '';
        buildList(which);
        const sel = panel.querySelector('.ccy-item.selected');
        if(sel) sel.scrollIntoView({block:'nearest'});
        setTimeout(function(){ document.getElementById(which + 'Search').focus(); }, 50);
    }
}

// Keyboard: ↑/↓ move, Enter picks, Esc closes
function onSearchKey(e, which){
    const list = document.getElementById(which + 'List');
    const items = Array.from(list.querySelectorAll('.ccy-item'));
    let idx = items.findIndex(function(el){ return el.classList.contains('highlighted'); });
    if(e.key === 'ArrowDown' || e.key === 'ArrowUp'){
        e.preventDefault();
        if(!items.length) return;
        if(idx !== -1) items[idx].classList.remove('highlighted');
        idx = e.key === 'ArrowDown' ? Math.min(idx + 1, items.length - 1) : Math.max(idx - 1, 0);
        items[idx].classList.add('highlighted');
        items[idx].scrollIntoView({block:'nearest'});
    } else if(e.key === 'Enter'){
        e.preventDefault();
        if(idx !== -1) selectCurrency(which, items[idx].getAttribute('data-code'));
    } else if(e.key === 'Escape'){
        closeAllDropdowns();
    }
}

function updateTriggers(){
    document.getElementById('fromTriggerFlag').textContent = flags[fromValue];
    document.getElementById('fromTriggerText').textContent = fromValue;
    document.getElementById('fromNameHint').textContent = names[currentLang][fromValue];
    document.getElementById('toTriggerFlag').textContent = flags[toValue];
    document.getElementById('toTriggerText').textContent = toValue;
    document.getElementById('toNameHint').textContent = names[currentLang][toValue];
    document.getElementById('homeTriggerFlag').textContent = flags[homeSelection];
    document.getElementById('homeTriggerText').textContent = homeSelection;
    document.getElementById('homeTriggerName').textContent = names[currentLang][homeSelection];
}

function selectCurrency(which, code){
    // Picking the currency already on the other side just flips them
    if(which === 'from'){
        if(code === toValue) toValue = fromValue;
        fromValue = code;
    } else if(which === 'to'){
        if(code === fromValue) fromValue = toValue;
        toValue = code;
    } else {
        homeSelection = code;
    }
    updateTriggers();
    document.getElementById(which + 'Panel').classList.remove('open');
    if(which !== 'home'){
        fitAmountToCurrency();
        calculate();
    }
}

document.addEventListener('click', function(e){
    if(!e.target.closest('#fromDropdown')){ document.getElementById('fromPanel').classList.remove('open'); }
    if(!e.target.closest('#toDropdown')){ document.getElementById('toPanel').classList.remove('open'); }
    if(!e.target.closest('#homeDropdown')){ document.getElementById('homePanel').classList.remove('open'); }
});

document.addEventListener('keydown', function(e){
    if(e.key === 'Escape') closeAllDropdowns();
});

const amountInput = document.getElementById('amount');

function getRate(from, to){ return usdRates[to] / usdRates[from]; }

function calculate(){
    const t = i18n[currentLang];
    if(!hasRealData || !usdRates[fromValue] || !usdRates[toValue]){
        document.getElementById('convertedDisplay').value = '—';
        document.getElementById('rateInfo').textContent = isFetching ? t.loadingRates : t.noRates;
        document.getElementById('finalResult').textContent = '—';
        return;
    }
    let amount = parseNum(amountInput.value);
    if(isNaN(amount) || amount < 0) amount = 0;
    const rate = getRate(fromValue, toValue);
    const converted = amount * rate;

    document.getElementById('convertedDisplay').value = fmt(converted, currencyDigits(toValue));
    document.getElementById('rateInfo').innerHTML = '1 ' + fromValue + ' = <span>' + formatRate(rate) + ' ' + toValue + '</span>';
    document.getElementById('finalResult').textContent = money(converted, toValue);
}

function swapCurrencies(){
    const f = fromValue;
    fromValue = toValue;
    toValue = f;
    updateTriggers();
    fitAmountToCurrency();
    calculate();
}

function updateTimestamp(){
    const locale = currentLang === 'es' ? 'es-ES' : 'en-US';
    const el = document.getElementById('timestamp');
    if(lastUpdated){
        el.textContent = i18n[currentLang].updated + ' ' + lastUpdated.toLocaleString(locale,{day:'numeric',month:'long',year:'numeric',hour:'2-digit',minute:'2-digit'});
    } else {
        el.textContent = isFetching ? '' : i18n[currentLang].noRatesTs;
    }
}

function updateLiveBadge(state){
    const badge = document.getElementById('liveBadge');
    const text = document.getElementById('liveText');
    badge.classList.remove('offline', 'loading', 'cached');
    if(state === 'loading'){
        badge.classList.add('loading');
        text.textContent = i18n[currentLang].loadingRates;
    } else if(state === 'cached'){
        badge.classList.add('cached');
        text.textContent = i18n[currentLang].cachedRates;
    } else if(state === 'offline'){
        badge.classList.add('offline');
        text.textContent = i18n[currentLang].offlineRates;
    } else {
        text.textContent = i18n[currentLang].live;
    }
}

async function fetchLiveRates(){
    if(isFetching) return;
    isFetching = true;
    updateLiveBadge('loading');
    document.getElementById('refreshBtn').classList.add('spinning');
    if(!hasRealData) calculate();
    try{
        const res = await fetch('https://open.er-api.com/v6/latest/USD');
        if(!res.ok) throw new Error('network response not ok');
        const data = await res.json();
        if(data.result !== 'success') throw new Error('api result not success');
        CURRENCY_CODES.forEach(function(code){
            if(typeof data.rates[code] === 'number'){ usdRates[code] = data.rates[code]; }
        });
        lastUpdated = new Date(data.time_last_update_unix * 1000);
        ratesAreLive = true;
        hasRealData = true;
        saveCachedRates();
        updateLiveBadge('live');
    } catch(err){
        ratesAreLive = false;
        updateLiveBadge(hasRealData ? 'cached' : 'offline');
    }
    isFetching = false;
    document.getElementById('refreshBtn').classList.remove('spinning');
    updateTimestamp();
    calculate();
}

function applyLang(lang){
    currentLang = lang;
    document.documentElement.lang = lang;
    ['langEs','welcomeLangEs'].forEach(function(id){ document.getElementById(id).classList.toggle('active', lang==='es'); });
    ['langEn','welcomeLangEn'].forEach(function(id){ document.getElementById(id).classList.toggle('active', lang==='en'); });
    document.querySelectorAll('[data-i18n]').forEach(function(el){ el.textContent = i18n[lang][el.getAttribute('data-i18n')]; });
    document.querySelectorAll('[data-i18n-aria]').forEach(function(el){
        el.setAttribute('aria-label', i18n[lang][el.getAttribute('data-i18n-aria')]);
        el.title = i18n[lang][el.getAttribute('data-i18n-aria')];
    });
    ['fromSearch','toSearch','homeSearch'].forEach(function(id){ document.getElementById(id).placeholder = i18n[lang].searchPh; });
}

function setLang(lang){
    const prevLang = currentLang;
    const amount = parseNum(amountInput.value, prevLang);
    applyLang(lang);
    amountInput.value = toInputValue(amount, currencyDigits(fromValue));
    try{ localStorage.setItem(LANG_KEY, lang); } catch(err){ /* ignore */ }
    ['from','to','home'].forEach(function(w){
        if(document.getElementById(w + 'Panel').classList.contains('open')) filterList(w);
    });
    updateTriggers();
    updateLiveBadge(isFetching ? 'loading' : (ratesAreLive ? 'live' : (hasRealData ? 'cached' : 'offline')));
    updateTimestamp();
    calculate();
}

amountInput.addEventListener('beforeinput', numberBeforeInput);

amountInput.addEventListener('input', function(){
    formatNumberInput(amountInput, currencyDigits(fromValue));
    calculate();
});

amountInput.addEventListener('blur', function(){
    amountInput.value = toInputValue(parseNum(amountInput.value), currencyDigits(fromValue));
});

// Switching to a currency without cents (JPY, KRW, CLP) rounds the amount to what that currency can hold
function fitAmountToCurrency(){
    if(amountInput.value === '') return;
    amountInput.value = toInputValue(parseNum(amountInput.value), currencyDigits(fromValue));
}

const HOME_CCY_KEY = 'swapHomeCurrency';

function showMain(){
    document.getElementById('welcomeCard').classList.add('hidden');
    document.getElementById('mainCard').classList.remove('hidden');
}

function startSwap(){
    fromValue = homeSelection;
    toValue = homeSelection === 'EUR' ? 'USD' : 'EUR';
    try{ localStorage.setItem(HOME_CCY_KEY, homeSelection); } catch(err){ /* ignore */ }
    showMain();
    updateTriggers();
    fitAmountToCurrency();
    calculate();
    amountInput.focus();
    amountInput.select();
}

function changeHomeCurrency(){
    homeSelection = fromValue;
    updateTriggers();
    document.getElementById('mainCard').classList.add('hidden');
    document.getElementById('welcomeCard').classList.remove('hidden');
}

function initHomeCurrency(){
    let saved = null;
    try{ saved = localStorage.getItem(HOME_CCY_KEY); } catch(err){ /* ignore */ }
    if(saved && CURRENCY_CODES.indexOf(saved) !== -1){
        homeSelection = saved;
        fromValue = saved;
        toValue = saved === 'EUR' ? 'USD' : 'EUR';
        showMain();
    }
}

function initLang(){
    let saved = null;
    try{ saved = localStorage.getItem(LANG_KEY); } catch(err){ /* ignore */ }
    applyLang(saved === 'en' ? 'en' : 'es');
    amountInput.value = toInputValue(100, 0);
}

initLang();
if(loadCachedRates()){
    updateLiveBadge('cached');
}
initHomeCurrency();
updateTriggers();
fitAmountToCurrency();
calculate();
updateTimestamp();
fetchLiveRates();
setInterval(fetchLiveRates, 30 * 60 * 1000);

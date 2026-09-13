const FALLBACK_RATES = {
    USD:1, EUR:0.9200, GBP:0.7900, JPY:149.50, CHF:0.8800, CAD:1.3600, AUD:1.5200, NZD:1.6600,
    CNY:7.2400, HKD:7.8000, SGD:1.3400, INR:83.20, KRW:1320, TWD:31.80, THB:34.90, MYR:4.68, IDR:15750, PHP:56.40, VND:24500,
    PKR:278, BDT:110, LKR:305, NPR:133, MMK:2100, KHR:4100, LAK:21500, MNT:3450,
    MXN:18.50, BRL:5.15, COP:4050, CLP:940, ARS:990, PEN:3.75, UYU:40.20, VES:850,
    BOB:6.91, PYG:7300, GTQ:7.75, HNL:24.7, NIO:36.6, CRC:520, PAB:1.00, DOP:59.5, JMD:156, TTD:6.78, BSD:1.00, BBD:2.00,
    ZAR:18.60, EGP:48.50, NGN:1550, KES:129.50, GHS:15.20, ETB:118, TZS:2600, UGX:3750, ZMW:26.5,
    MAD:9.95, TND:3.11, DZD:134.5,
    SEK:10.45, NOK:10.65, DKK:6.86, PLN:4.00, CZK:22.90, HUF:358.50, RON:4.58, RUB:92.30, TRY:34.20,
    UAH:41.2, BGN:1.80, ISK:138, RSD:107.5, GEL:2.70, AMD:387, AZN:1.70, KZT:445, UZS:12750,
    AED:3.67, SAR:3.75, ILS:3.68, QAR:3.64, BHD:0.376, KWD:0.307, OMR:0.385, JOD:0.709, LBP:89500, IQD:1310,
    FJD:2.27
};

const usdRates = Object.assign({}, FALLBACK_RATES);
let ratesAreLive = false;
let hasRealData = false;
let isFetching = false;
let lastUpdated = null;

const RATES_CACHE_KEY = 'currencyExchangeRatesCache';

function loadCachedRates(){
    try{
        const raw = localStorage.getItem(RATES_CACHE_KEY);
        if(!raw) return false;
        const cached = JSON.parse(raw);
        if(!cached || !cached.rates || !cached.timestamp) return false;
        Object.keys(FALLBACK_RATES).forEach(function(code){
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
    PKR:'Rs', BDT:'Tk', LKR:'Rs', NPR:'Rs', MMK:'K', KHR:'CR', LAK:'K', MNT:'T',
    MXN:'MX$', BRL:'R$', COP:'COP$', CLP:'CLP$', ARS:'AR$', PEN:'S/', UYU:'UY$', VES:'Bs.',
    BOB:'Bs', PYG:'G', GTQ:'Q', HNL:'L', NIO:'C$', CRC:'C', PAB:'B/.', DOP:'RD$', JMD:'J$', TTD:'TT$', BSD:'B$', BBD:'Bds$',
    ZAR:'R', EGP:'E£', NGN:'₦', KES:'KSh', GHS:'GHS', ETB:'Br', TZS:'TSh', UGX:'USh', ZMW:'ZK',
    MAD:'MAD', TND:'TND', DZD:'DZD',
    SEK:'kr', NOK:'kr', DKK:'kr', PLN:'zl', CZK:'Kc', HUF:'Ft', RON:'lei', RUB:'RUB', TRY:'TRY',
    UAH:'UAH', BGN:'BGN', ISK:'ISK', RSD:'RSD', GEL:'GEL', AMD:'AMD', AZN:'AZN', KZT:'KZT', UZS:'UZS',
    AED:'AED', SAR:'SAR', ILS:'ILS', QAR:'QAR', BHD:'BHD', KWD:'KWD', OMR:'OMR', JOD:'JOD', LBP:'LBP', IQD:'IQD',
    FJD:'FJ$'
};

const i18n = {
    es: { title:'SWAP', subtitle:'Tasas de mercado en tiempo real, sin comisión', live:'TASA EN VIVO',
        loadingRates:'Actualizando tasas...', offlineRates:'Tasas aproximadas (sin conexión)', cachedRates:'Últimas tasas guardadas (sin conexión)',
        youSend:'Envías', theyReceive:'Reciben', totalReceive:'Total a recibir',
        noFees:'Sin comisiones · Sin cargos ocultos · Tasa real', updated:'Última actualización:', searchPh:'Buscar...',
        welcomeTitle:'¿En qué moneda piensas?', welcomeSub:'Elige tu moneda local y la usaremos como punto de partida cada vez que abras la app.',
        welcomeBtn:'Comenzar →' },
    en: { title:'SWAP', subtitle:'Live mid-market rates, zero markup', live:'LIVE RATES',
        loadingRates:'Updating rates...', offlineRates:'Approximate rates (offline)', cachedRates:'Last saved rates (offline)',
        youSend:'You send', theyReceive:'They receive', totalReceive:'Total to receive',
        noFees:'No fees · No hidden charges · Real exchange rate', updated:'Last updated:', searchPh:'Search...',
        welcomeTitle:'What\'s your home currency?', welcomeSub:'Pick your local currency and we\'ll use it as your starting point every time you open the app.',
        welcomeBtn:'Get started →' }
};
let currentLang = 'es';
let fromValue = 'USD';
let toValue = 'EUR';
let homeSelection = 'USD';
const currencyCodes = Object.keys(FALLBACK_RATES);

function sortedCodes(){
    return [...currencyCodes].sort(function(a,b){
        return names[currentLang][a].localeCompare(names[currentLang][b], currentLang);
    });
}

function itemsHtml(codes, which){
    if(codes.length === 0) return '<div class="ccy-empty">—</div>';
    return codes.map(function(code){
        return '<div class="ccy-item" onclick="selectCurrency(\'' + which + '\',\'' + code + '\')">' +
            '<span class="flag">' + flags[code] + '</span>' +
            '<span class="code">' + code + '</span>' +
            '<span class="name">' + names[currentLang][code] + '</span></div>';
    }).join('');
}

function buildList(which){
    document.getElementById(which + 'List').innerHTML = itemsHtml(sortedCodes(), which);
}

function filterList(which){
    const query = document.getElementById(which + 'Search').value.toLowerCase();
    const codes = sortedCodes().filter(function(code){
        return code.toLowerCase().indexOf(query) !== -1 || names[currentLang][code].toLowerCase().indexOf(query) !== -1;
    });
    document.getElementById(which + 'List').innerHTML = itemsHtml(codes, which);
}

function toggleDropdown(which){
    const panel = document.getElementById(which + 'Panel');
    const isOpen = panel.classList.contains('open');
    document.getElementById('fromPanel').classList.remove('open');
    document.getElementById('toPanel').classList.remove('open');
    document.getElementById('homePanel').classList.remove('open');
    if(!isOpen){
        panel.classList.add('open');
        buildList(which);
        document.getElementById(which + 'Search').value = '';
        setTimeout(function(){ document.getElementById(which + 'Search').focus(); }, 50);
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
}

function selectCurrency(which, code){
    if(which === 'from'){ fromValue = code; }
    else if(which === 'to'){ toValue = code; }
    else { homeSelection = code; }
    updateTriggers();
    document.getElementById(which + 'Panel').classList.remove('open');
    if(which !== 'home') calculate();
}

document.addEventListener('click', function(e){
    if(!e.target.closest('#fromDropdown')){ document.getElementById('fromPanel').classList.remove('open'); }
    if(!e.target.closest('#toDropdown')){ document.getElementById('toPanel').classList.remove('open'); }
    if(!e.target.closest('#homeDropdown')){ document.getElementById('homePanel').classList.remove('open'); }
});

const amountInput = document.getElementById('amount');

function getRate(from, to){ return usdRates[to] / usdRates[from]; }

function calculate(){
    let amount = parseFloat(amountInput.value);
    if (isNaN(amount) || amount < 0) { amount = 0; amountInput.value = ''; }
    const rate = getRate(fromValue, toValue);
    const converted = amount * rate;

    document.getElementById('convertedDisplay').value = converted.toLocaleString('es-ES',{minimumFractionDigits:2, maximumFractionDigits:2});
    document.getElementById('rateInfo').innerHTML = '1 ' + fromValue + ' = <span>' + rate.toLocaleString('es-ES',{minimumFractionDigits:2, maximumFractionDigits:4}) + ' ' + toValue + '</span>';
    document.getElementById('finalResult').textContent = symbols[toValue] + converted.toLocaleString('es-ES',{minimumFractionDigits:2, maximumFractionDigits:2});
}

function swapCurrencies(){
    const f = fromValue;
    fromValue = toValue;
    toValue = f;
    updateTriggers();
    calculate();
}

function updateTimestamp(){
    const locale = currentLang === 'es' ? 'es-ES' : 'en-US';
    const label = i18n[currentLang].updated;
    if(lastUpdated){
        document.getElementById('timestamp').textContent = label + ' ' + lastUpdated.toLocaleString(locale,{day:'numeric',month:'long',year:'numeric',hour:'2-digit',minute:'2-digit'});
    } else {
        const today = new Date();
        document.getElementById('timestamp').textContent = label + ' ' + today.toLocaleDateString(locale,{day:'numeric',month:'long',year:'numeric'});
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
    try{
        const res = await fetch('https://open.er-api.com/v6/latest/USD');
        if(!res.ok) throw new Error('network response not ok');
        const data = await res.json();
        if(data.result !== 'success') throw new Error('api result not success');
        Object.keys(FALLBACK_RATES).forEach(function(code){
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
    updateTimestamp();
    calculate();
}

function setLang(lang){
    currentLang = lang;
    document.getElementById('langEs').classList.toggle('active', lang==='es');
    document.getElementById('langEn').classList.toggle('active', lang==='en');
    document.getElementById('welcomeLangEs').classList.toggle('active', lang==='es');
    document.getElementById('welcomeLangEn').classList.toggle('active', lang==='en');
    document.querySelectorAll('[data-i18n]').forEach(function(el){ el.textContent = i18n[lang][el.getAttribute('data-i18n')]; });
    document.getElementById('fromSearch').placeholder = i18n[lang].searchPh;
    document.getElementById('toSearch').placeholder = i18n[lang].searchPh;
    document.getElementById('homeSearch').placeholder = i18n[lang].searchPh;
    updateTriggers();
    updateLiveBadge(ratesAreLive ? 'live' : (hasRealData ? 'cached' : 'offline'));
    updateTimestamp();
    calculate();
}

amountInput.addEventListener('input', function(){
    if (amountInput.value < 0) amountInput.value = 0;
    calculate();
});

const HOME_CCY_KEY = 'swapHomeCurrency';

function startSwap(){
    fromValue = homeSelection;
    toValue = homeSelection === 'EUR' ? 'USD' : 'EUR';
    try{ localStorage.setItem(HOME_CCY_KEY, homeSelection); } catch(err){ /* ignore */ }
    document.getElementById('welcomeCard').classList.add('hidden');
    document.getElementById('mainCard').classList.remove('hidden');
    updateTriggers();
    calculate();
}

function initHomeCurrency(){
    let saved = null;
    try{ saved = localStorage.getItem(HOME_CCY_KEY); } catch(err){ /* ignore */ }
    if(saved && FALLBACK_RATES[saved] !== undefined){
        fromValue = saved;
        toValue = saved === 'EUR' ? 'USD' : 'EUR';
        document.getElementById('welcomeCard').classList.add('hidden');
        document.getElementById('mainCard').classList.remove('hidden');
    }
}

updateTriggers();
if(loadCachedRates()){
    updateLiveBadge('cached');
}
initHomeCurrency();
calculate();
updateTimestamp();
fetchLiveRates();
setInterval(fetchLiveRates, 30 * 60 * 1000);

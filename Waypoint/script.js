function fmt(n, decimals){
    if(decimals === undefined) decimals = 2;
    return n.toLocaleString('es-ES', {minimumFractionDigits: decimals, maximumFractionDigits: decimals});
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
    { code:'PY', currency:'G', name_es:'Paraguay', name_en:'Paraguay' },
    { code:'BO', currency:'Bs', name_es:'Bolivia', name_en:'Bolivia' },
    { code:'EC', currency:'$', name_es:'Ecuador', name_en:'Ecuador' },
    { code:'PA', currency:'B/.', name_es:'Panamá', name_en:'Panama' },
    { code:'CR', currency:'C', name_es:'Costa Rica', name_en:'Costa Rica' },
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
    { code:'PL', currency:'zl', name_es:'Polonia', name_en:'Poland' },
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
        goalAmountLabel:'Monto de la meta', goalCurrencyLabel:'Moneda de la meta', goalDateLabel:'Fecha objetivo (opcional)', goalPh:'10000',
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
        placeholder:'👈 Completa tus ingresos y gastos para ver tu plan financiero personalizado',
        rent:'Alquiler', utilities:'Servicios', insurance:'Seguro', food:'Comida', transport:'Transporte', entertainment:'Entretenimiento',
        perWeek:'Por semana', perBiweek:'Por quincena', perMonth:'Por mes', perYear:'Por año', in5:'En 5 años',
        warning:'⚠️ Tus gastos superan tus ingresos. Considera reducir gastos o aumentar tus ingresos.',
        expenseName:'Nombre del gasto',
        goalDatePast:'⚠️ La fecha objetivo ya pasó. Elige una fecha futura.',
        goalNeed:'Para tu meta necesitas ahorrar', goalOnTrack:'✅ Vas bien — tu ahorro actual cubre esta meta.',
        goalShort:'⚠️ Te faltan', goalShortEnd:'por periodo para llegar a tiempo.',
        goalNoDate:'A este ritmo, alcanzarías tu meta en aproximadamente', goalReached:'✅ ¡Ya alcanzarías tu meta en menos de un mes de ahorro!',
        perWeekWord:'semana', perBiweekWord:'quincena', perMonthWord:'mes', months:'meses'
    },
    en: {
        appTitle:'🧭 Waypoint', appSubtitle:'Organize your income and expenses to plan your future',
        welcomeTitle:'Welcome aboard', welcomeSub:'Tell us your name and let\'s chart the course for your finances together.',
        welcomeNamePh:'E.g: Gabriel', welcomeNameRequired:'Type your name', welcomeBtn:'Get started →',
        greeting:'Hi, ', editNameTitle:'Change name',
        goalTitle:'🎯 How much do you want to save?', goalSub:'Set a goal and target date to see how much you need to save per paycheck (optional)',
        goalAmountLabel:'Goal amount', goalCurrencyLabel:'Goal currency', goalDateLabel:'Target date (optional)', goalPh:'10000',
        incomeTitle:'💵 Your Income', countryLabel:'Country you live in',
        countryNote:'Select your country and state/region to see local tax notes (if any) — then enter your real tax rate below',
        taxNote:'Enter your real rate (check your pay stub or your country\'s official tax site). We no longer auto-fill an approximate rate.',
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
        placeholder:'👈 Fill in your income and expenses to see your personalized financial plan',
        rent:'Rent', utilities:'Utilities', insurance:'Insurance', food:'Food', transport:'Transportation', entertainment:'Entertainment',
        perWeek:'Per week', perBiweek:'Per pay period (biweekly)', perMonth:'Per month', perYear:'Per year', in5:'In 5 years',
        warning:'⚠️ Your expenses exceed your income. Consider reducing expenses or increasing income.',
        expenseName:'Expense name',
        goalDatePast:'⚠️ The target date has already passed. Pick a future date.',
        goalNeed:'To hit your goal you need to save', goalOnTrack:'✅ You are on track — your current savings covers this goal.',
        goalShort:'⚠️ You are short', goalShortEnd:'per period to make it in time.',
        goalNoDate:'At this rate, you would reach your goal in approximately', goalReached:'✅ You would already reach your goal in under a month of saving!',
        perWeekWord:'week', perBiweekWord:'pay period', perMonthWord:'month', months:'months'
    }
};
let currentLang = 'es';

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
    currentLang = lang;
    document.getElementById('langEs').classList.toggle('active', lang==='es');
    document.getElementById('langEn').classList.toggle('active', lang==='en');
    document.getElementById('welcomeLangEs').classList.toggle('active', lang==='es');
    document.getElementById('welcomeLangEn').classList.toggle('active', lang==='en');
    document.querySelectorAll('[data-i18n]').forEach(function(el){ el.textContent = i18n[lang][el.getAttribute('data-i18n')]; });
    document.querySelectorAll('[data-i18n-ph]').forEach(function(el){ el.placeholder = i18n[lang][el.getAttribute('data-i18n-ph')]; });
    document.querySelectorAll('[data-i18n-title]').forEach(function(el){ el.title = i18n[lang][el.getAttribute('data-i18n-title')]; });
    document.querySelectorAll('[data-i18n-val]').forEach(function(el){ el.value = i18n[lang][el.getAttribute('data-i18n-val')]; });
    document.querySelectorAll('.expense-row input[type=text]:not([data-i18n-val])').forEach(function(el){
        if(!el.hasAttribute('readonly')) el.placeholder = i18n[lang].expenseName;
    });
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
}

function addCustomExpense(){
    const container = document.getElementById('variableExpenses');
    const row = document.createElement('div');
    row.className = 'expense-row';
    row.innerHTML = '<input type="text" placeholder="' + i18n[currentLang].expenseName + '">' +
        '<input type="number" class="expense-value" placeholder="0.00" min="0">' +
        '<button class="remove-x" onclick="this.parentElement.remove(); saveDraft();">✕</button>';
    container.appendChild(row);
}

function calculate(){
    const t = i18n[currentLang];
    const currency = document.getElementById('currency').value;
    const hourlyRate = Math.max(parseFloat(document.getElementById('hourlyRate').value) || 0, 0);
    const hoursPerWeek = Math.max(parseFloat(document.getElementById('hoursPerWeek').value) || 0, 0);
    const otherIncome = Math.max(parseFloat(document.getElementById('otherIncome').value) || 0, 0);
    const taxRate = Math.min(Math.max(parseFloat(document.getElementById('taxRate').value) || 0, 0), 100);
    const frequency = document.getElementById('payFrequency').value;
    const savingsGoal = Math.max(parseFloat(document.getElementById('savingsGoal').value) || 0, 0);
    const goalCurrency = document.getElementById('goalCurrency').value;
    const goalDateStr = document.getElementById('goalDate').value;

    const annualGross = hourlyRate * hoursPerWeek * 52;
    const grossMonthly = annualGross / 12;
    const netMonthly = grossMonthly * (1 - taxRate / 100) + otherIncome;

    let totalExpenses = 0;
    document.querySelectorAll('.expense-value').forEach(function(inp){
        totalExpenses += Math.max(parseFloat(inp.value) || 0, 0);
    });

    const monthlySavings = netMonthly - totalExpenses;
    const annualSavings = monthlySavings * 12;
    const weeklySavings = monthlySavings * 12 / 52;
    const biweeklySavings = monthlySavings * 12 / 26;

    document.getElementById('annualVal').textContent = currency + fmt(annualGross, 0);
    document.getElementById('grossVal').textContent = currency + fmt(grossMonthly);
    document.getElementById('netVal').textContent = currency + fmt(netMonthly);
    document.getElementById('expenseVal').textContent = currency + fmt(totalExpenses);
    document.getElementById('savingsVal').textContent = currency + fmt(monthlySavings);

    const savingsBox = document.getElementById('savingsBox');
    savingsBox.className = 'stat-box savings';
    if(monthlySavings < 0) savingsBox.classList.add('danger');

    const periodBox = document.getElementById('periodBox');
    let periodSavingsForFreq = monthlySavings;
    if(frequency === 'weekly'){
        periodBox.style.display = 'block';
        document.getElementById('periodLabel').textContent = t.periodWeekly;
        document.getElementById('periodVal').textContent = currency + fmt(weeklySavings);
        periodSavingsForFreq = weeklySavings;
    } else if(frequency === 'biweekly'){
        periodBox.style.display = 'block';
        document.getElementById('periodLabel').textContent = t.periodBiweekly;
        document.getElementById('periodVal').textContent = currency + fmt(biweeklySavings);
        periodSavingsForFreq = biweeklySavings;
    } else {
        periodBox.style.display = 'none';
    }

    const maxRef = Math.max(netMonthly, totalExpenses, Math.abs(monthlySavings), 1);
    document.getElementById('barIncomeVal').textContent = currency + fmt(netMonthly);
    document.getElementById('barExpenseVal').textContent = currency + fmt(totalExpenses);
    document.getElementById('barSavingsVal').textContent = currency + fmt(monthlySavings);
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

            const needLine = t.goalNeed + ' ' + goalCurrency + fmt(requiredPerPeriod) + ' ' + (currentLang==='es' ? 'cada ' : 'every ') + periodWord + '.';
            if(periodSavingsForFreq >= requiredPerPeriod){
                goalText.innerHTML = needLine + '<br>' + t.goalOnTrack;
                goalText.classList.add('ontrack');
            } else {
                const shortfall = requiredPerPeriod - periodSavingsForFreq;
                goalText.innerHTML = needLine + '<br>' + t.goalShort + ' ' + goalCurrency + fmt(shortfall) + ' ' + t.goalShortEnd;
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
            goalText.textContent = t.goalNoDate + ' ' + Math.ceil(monthsToGoal) + ' ' + t.months + ' (' + goalCurrency + fmt(savingsGoal, 0) + ')';
        }
    } else {
        goalBox.style.display = 'none';
    }

    const timelineRows = document.getElementById('timelineRows');
    if(monthlySavings > 0){
        let rows = '';
        if(frequency === 'weekly'){
            rows += '<div class="timeline-row"><span class="timeline-period">' + t.perWeek + '</span><span class="timeline-value">' + currency + fmt(weeklySavings) + '</span></div>';
        } else if(frequency === 'biweekly'){
            rows += '<div class="timeline-row"><span class="timeline-period">' + t.perBiweek + '</span><span class="timeline-value">' + currency + fmt(biweeklySavings) + '</span></div>';
        }
        rows += '<div class="timeline-row"><span class="timeline-period">' + t.perMonth + '</span><span class="timeline-value">' + currency + fmt(monthlySavings) + '</span></div>';
        rows += '<div class="timeline-row"><span class="timeline-period">' + t.perYear + '</span><span class="timeline-value">' + currency + fmt(annualSavings) + '</span></div>';
        rows += '<div class="timeline-row"><span class="timeline-period">' + t.in5 + '</span><span class="timeline-value">' + currency + fmt(annualSavings*5) + '</span></div>';
        timelineRows.innerHTML = rows;
    } else {
        timelineRows.innerHTML = '<div class="alert-box">' + t.warning + '</div>';
    }

    document.getElementById('results').style.display = 'block';
    document.getElementById('placeholder').style.display = 'none';
}

const DRAFT_KEY = 'brujulaFinancieraDraft';

function escapeHtml(str){
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function saveDraft(){
    try{
        const fixedValues = Array.from(document.querySelectorAll('#fixedExpenses .expense-value')).map(function(el){ return el.value; });
        const variableRows = Array.from(document.querySelectorAll('#variableExpenses .expense-row')).map(function(row){
            const textInput = row.querySelector('input[type=text]');
            return {
                key: textInput.getAttribute('data-i18n-val'),
                label: textInput.value,
                value: row.querySelector('.expense-value').value
            };
        });
        const draft = {
            lang: currentLang,
            country: document.getElementById('country').value,
            region: document.getElementById('region').value,
            currency: document.getElementById('currency').value,
            hourlyRate: document.getElementById('hourlyRate').value,
            hoursPerWeek: document.getElementById('hoursPerWeek').value,
            payFrequency: document.getElementById('payFrequency').value,
            taxRate: document.getElementById('taxRate').value,
            otherIncome: document.getElementById('otherIncome').value,
            savingsGoal: document.getElementById('savingsGoal').value,
            goalCurrency: document.getElementById('goalCurrency').value,
            goalDate: document.getElementById('goalDate').value,
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
        const raw = localStorage.getItem(DRAFT_KEY);
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
    document.getElementById('hourlyRate').value = draft.hourlyRate || '';
    document.getElementById('hoursPerWeek').value = draft.hoursPerWeek || '';
    if(draft.payFrequency) document.getElementById('payFrequency').value = draft.payFrequency;
    document.getElementById('taxRate').value = draft.taxRate || '';
    document.getElementById('otherIncome').value = draft.otherIncome || '';
    document.getElementById('savingsGoal').value = draft.savingsGoal || '';
    if(draft.goalCurrency) document.getElementById('goalCurrency').value = draft.goalCurrency;
    document.getElementById('goalDate').value = draft.goalDate || '';

    if(draft.fixedValues){
        const fixedInputs = document.querySelectorAll('#fixedExpenses .expense-value');
        draft.fixedValues.forEach(function(v, i){ if(fixedInputs[i]) fixedInputs[i].value = v; });
    }

    if(draft.variableRows && draft.variableRows.length){
        const container = document.getElementById('variableExpenses');
        container.innerHTML = '';
        draft.variableRows.forEach(function(r){
            const row = document.createElement('div');
            row.className = 'expense-row';
            if(r.key){
                row.innerHTML = '<input type="text" data-i18n-val="' + r.key + '" value="' + escapeHtml(i18n[currentLang][r.key] || r.label) + '" readonly>' +
                    '<input type="number" class="expense-value" placeholder="0.00" min="0" value="' + escapeHtml(r.value) + '">';
            } else {
                row.innerHTML = '<input type="text" placeholder="' + i18n[currentLang].expenseName + '" value="' + escapeHtml(r.label) + '">' +
                    '<input type="number" class="expense-value" placeholder="0.00" min="0" value="' + escapeHtml(r.value) + '">' +
                    '<button class="remove-x" onclick="this.parentElement.remove(); saveDraft();">✕</button>';
            }
            container.appendChild(row);
        });
    }

    calculate();
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
    document.getElementById('userNameInput').value = current;
    document.getElementById('welcomeOverlay').classList.remove('hidden');
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

initUserSetup();
populateCountries();
onCountryChange();
restoreDraft();

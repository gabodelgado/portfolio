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

function money(n){ return '$' + fmt(n); }

// Percentages drop trailing zeros: 8,25 % · 7 % · 8,5 %
function fmtPct(n){
    return fmt(n, 3).replace(new RegExp('\\' + numSeps().dec + '?0+$'), '');
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

// Number fields and how many decimals each accepts
const NUMBER_INPUTS = { customTip: 2, taxRatePct: 3 };

const menuData = {
    es: [
        { id:1, name:'Pizza Margherita', price:14.99, cat:'Platos Fuertes', emoji:'🍕' },
        { id:2, name:'Ensalada César', price:9.99, cat:'Entradas', emoji:'🥗' },
        { id:3, name:'Salmón a la Parrilla', price:24.99, cat:'Platos Fuertes', emoji:'🐟' },
        { id:4, name:'Pasta Carbonara', price:16.99, cat:'Platos Fuertes', emoji:'🍝' },
        { id:5, name:'Bruschetta', price:8.99, cat:'Entradas', emoji:'🍞' },
        { id:6, name:'Pastel de Chocolate', price:7.99, cat:'Postres', emoji:'🍰' },
        { id:7, name:'Tiramisú', price:8.99, cat:'Postres', emoji:'🍮' },
        { id:8, name:'Té Helado', price:3.99, cat:'Bebidas', emoji:'🧊' },
        { id:9, name:'Copa de Vino', price:6.99, cat:'Bebidas', emoji:'🍷' },
        { id:10, name:'Risotto', price:18.99, cat:'Platos Fuertes', emoji:'🍚' },
        { id:11, name:'Sopa del Día', price:6.99, cat:'Entradas', emoji:'🍲' },
        { id:12, name:'Helado', price:5.99, cat:'Postres', emoji:'🍨' }
    ],
    en: [
        { id:1, name:'Margherita Pizza', price:14.99, cat:'Main Courses', emoji:'🍕' },
        { id:2, name:'Caesar Salad', price:9.99, cat:'Starters', emoji:'🥗' },
        { id:3, name:'Grilled Salmon', price:24.99, cat:'Main Courses', emoji:'🐟' },
        { id:4, name:'Pasta Carbonara', price:16.99, cat:'Main Courses', emoji:'🍝' },
        { id:5, name:'Bruschetta', price:8.99, cat:'Starters', emoji:'🍞' },
        { id:6, name:'Chocolate Cake', price:7.99, cat:'Desserts', emoji:'🍰' },
        { id:7, name:'Tiramisu', price:8.99, cat:'Desserts', emoji:'🍮' },
        { id:8, name:'Iced Tea', price:3.99, cat:'Drinks', emoji:'🧊' },
        { id:9, name:'Glass of Wine', price:6.99, cat:'Drinks', emoji:'🍷' },
        { id:10, name:'Risotto', price:18.99, cat:'Main Courses', emoji:'🍚' },
        { id:11, name:"Soup of the Day", price:6.99, cat:'Starters', emoji:'🍲' },
        { id:12, name:'Ice Cream', price:5.99, cat:'Desserts', emoji:'🍨' }
    ]
};

const i18n = {
    es: {
        appTitle:'🍽️ Apron',
        welcomeTitle:'¡Bienvenido!', welcomeSub:'Ponle el nombre a tu restaurante y arma tu página de pedidos al instante con estos platos de muestra.',
        welcomeNamePh:'Ej: Sabor Criollo', welcomeNameRequired:'Escribe el nombre de tu restaurante', welcomeBtn:'Comenzar →',
        editNameTitle:'Cambiar nombre',
        subtitle:'Selecciona los platos y calcula tu cuenta al instante', menuTitle:'📋 Menú', billTitle:'🧾 Tu Cuenta',
        emptyCart:'Aún no has agregado nada', tipTitle:'💚 Agregar propina', customTip:'0,00', taxPh:'8,25',
        tipHint:'O escribe un monto exacto de propina en dólares (ej: 5,00)',
        subtotal:'Subtotal', tax:'Impuesto', tip:'Propina', totalLabel:'Total a pagar', clearBtn:'🗑️ Vaciar cuenta',
        taxRateTitle:'🧾 Impuesto de venta local (%)',
        taxRateHint:'Ingresa la tasa real de impuesto a las ventas de tu ciudad/estado (ej: 8,25). Varía según el lugar — no usamos un valor automático.',
        addBtn:'Agregar', orderTypeTitle:'🚗 Tipo de pedido', pickup:'Recoger', pickupSub:'Gratis',
        delivery:'Delivery', deliveryFeeLabel:'Costo de envío',
        noteTitle:'📝 Nota para tu pedido (opcional)', modalNoteTitle:'📝 Nota', notePh:'Ej: sin cebolla, alergia a los frutos secos, tocar el timbre...',
        checkoutTitle:'📇 Datos de contacto', nameLabel:'Nombre completo', namePh:'Tu nombre',
        phoneLabel:'Número de teléfono', phonePh:'(555) 123-4567',
        addressLabel:'Dirección de entrega', addressPh:'Calle, número, apto, ciudad',
        confirmBtn:'✅ Confirmar Pedido', cartEmptyError:'Agrega al menos un plato para confirmar tu pedido.',
        nameRequired:'Ingresa tu nombre', phoneRequired:'Ingresa tu teléfono', phoneInvalid:'El teléfono debe tener al menos 7 dígitos', removeItem:'Quitar', addressRequired:'Ingresa tu dirección de entrega',
        orderConfirmedTitle:'¡Pedido confirmado!', orderNumberLabel:'N.º de pedido',
        modalSummaryTitle:'Resumen', modalContactTitle:'Contacto', phoneShort:'Teléfono', closeLabel:'Cerrar', newOrderBtn:'🍽️ Hacer otro pedido',
        etaPickup:'Listo para recoger en 15–20 min', etaDelivery:'Llega en 35–45 min'
    },
    en: {
        appTitle:'🍽️ Apron',
        welcomeTitle:'Welcome!', welcomeSub:'Give your restaurant a name and set up your ordering page instantly with these sample dishes.',
        welcomeNamePh:'E.g: The Flavor House', welcomeNameRequired:'Type your restaurant\'s name', welcomeBtn:'Get started →',
        editNameTitle:'Change name',
        subtitle:'Select your dishes and calculate your bill instantly', menuTitle:'📋 Menu', billTitle:'🧾 Your Bill',
        emptyCart:'Nothing added yet', tipTitle:'💚 Add a tip', customTip:'0.00', taxPh:'8.25',
        tipHint:'Or type an exact tip amount in dollars (e.g. 5.00)',
        subtotal:'Subtotal', tax:'Tax', tip:'Tip', totalLabel:'Total to pay', clearBtn:'🗑️ Clear bill',
        taxRateTitle:'🧾 Local sales tax (%)',
        taxRateHint:'Enter the real sales tax rate for your city/state (e.g. 8.25). It varies by location — we don\'t use an automatic value.',
        addBtn:'Add', orderTypeTitle:'🚗 Order type', pickup:'Pickup', pickupSub:'Free',
        delivery:'Delivery', deliveryFeeLabel:'Delivery fee',
        noteTitle:'📝 Note for your order (optional)', modalNoteTitle:'📝 Note', notePh:'E.g: no onion, nut allergy, ring the bell...',
        checkoutTitle:'📇 Contact details', nameLabel:'Full name', namePh:'Your name',
        phoneLabel:'Phone number', phonePh:'(555) 123-4567',
        addressLabel:'Delivery address', addressPh:'Street, number, apt, city',
        confirmBtn:'✅ Confirm Order', cartEmptyError:'Add at least one dish to confirm your order.',
        nameRequired:'Enter your name', phoneRequired:'Enter your phone number', phoneInvalid:'Phone number needs at least 7 digits', removeItem:'Remove', addressRequired:'Enter your delivery address',
        orderConfirmedTitle:'Order confirmed!', orderNumberLabel:'Order #',
        modalSummaryTitle:'Summary', modalContactTitle:'Contact', phoneShort:'Phone', closeLabel:'Close', newOrderBtn:'🍽️ Place another order',
        etaPickup:'Ready for pickup in 15–20 min', etaDelivery:'Arrives in 35–45 min'
    }
};

let currentLang = 'es';
let menu = menuData.es;
let cart = {};
let tipPct = 0;
let orderType = 'pickup';
const DELIVERY_FEE = 6.00;
const qtySelections = {};
let lastBill = null;

function applyLang(lang){
    currentLang = lang;
    menu = menuData[lang];
    document.documentElement.lang = lang;
    ['langEs','welcomeLangEs'].forEach(function(id){ document.getElementById(id).classList.toggle('active', lang==='es'); });
    ['langEn','welcomeLangEn'].forEach(function(id){ document.getElementById(id).classList.toggle('active', lang==='en'); });
    document.querySelectorAll('[data-i18n]').forEach(function(el){ el.textContent = i18n[lang][el.getAttribute('data-i18n')]; });
    document.querySelectorAll('[data-i18n-ph]').forEach(function(el){ el.placeholder = i18n[lang][el.getAttribute('data-i18n-ph')]; });
    document.querySelectorAll('[data-i18n-title]').forEach(function(el){ el.title = i18n[lang][el.getAttribute('data-i18n-title')]; });
    document.querySelectorAll('[data-i18n-aria]').forEach(function(el){ el.setAttribute('aria-label', i18n[lang][el.getAttribute('data-i18n-aria')]); });
    document.getElementById('deliverySubText').textContent = '+' + money(DELIVERY_FEE);
    // Dish names in the cart follow the language; quantities stay
    Object.keys(cart).forEach(function(id){
        const item = menu.find(function(m){ return m.id === Number(id); });
        if(item) cart[id] = Object.assign({}, item, {qty: cart[id].qty});
    });
}

function setLang(lang){
    const prevLang = currentLang;
    const ids = Object.keys(NUMBER_INPUTS);
    const values = ids.map(function(id){ return parseNum(document.getElementById(id).value, prevLang); });
    applyLang(lang);
    ids.forEach(function(id, i){ document.getElementById(id).value = toInputValue(values[i], NUMBER_INPUTS[id]); });
    clearFieldErrors();
    renderMenu();
    renderCart();
}

function setOrderType(type){
    orderType = type;
    document.getElementById('pickupBtn').classList.toggle('active', type==='pickup');
    document.getElementById('deliveryBtn').classList.toggle('active', type==='delivery');
    document.getElementById('deliveryLine').style.display = type==='delivery' ? 'flex' : 'none';
    document.getElementById('addressField').style.display = type==='delivery' ? 'block' : 'none';
    calcTotal();
}

function renderMenu(){
    const cats = [...new Set(menu.map(function(m){ return m.cat; }))];
    const container = document.getElementById('menuContainer');
    container.innerHTML = cats.map(function(cat){
        return '<div class="category-label">' + cat + '</div><div class="menu-grid">' +
            menu.filter(function(m){ return m.cat===cat; }).map(function(item){
                if (!(item.id in qtySelections)) qtySelections[item.id] = 1;
                return '<div class="dish-card">' +
                    '<div class="dish-emoji">' + item.emoji + '</div>' +
                    '<div class="dish-name">' + item.name + '</div>' +
                    '<div class="dish-price">' + money(item.price) + '</div>' +
                    '<div class="qty-add-row">' +
                        '<div class="qty-stepper">' +
                            '<button class="qty-btn" onclick="changeQty(' + item.id + ',-1)">−</button>' +
                            '<span class="qty-value" id="qty-' + item.id + '">' + qtySelections[item.id] + '</span>' +
                            '<button class="qty-btn" onclick="changeQty(' + item.id + ',1)">+</button>' +
                        '</div>' +
                        '<button class="add-btn" id="add-' + item.id + '" onclick="addItem(' + item.id + ')">' + i18n[currentLang].addBtn + '</button>' +
                    '</div></div>';
            }).join('') + '</div>';
    }).join('');
}

function changeCartQty(id, delta){
    if(!cart[id]) return;
    cart[id].qty += delta;
    if(cart[id].qty <= 0) delete cart[id];
    else cart[id].qty = Math.min(cart[id].qty, 99);
    renderCart();
}

function changeQty(id, delta){
    qtySelections[id] = Math.max(1, Math.min(20, (qtySelections[id]||1) + delta));
    document.getElementById('qty-' + id).textContent = qtySelections[id];
}

function addItem(id){
    const item = menu.find(function(m){ return m.id===id; });
    const qty = qtySelections[id] || 1;
    if(cart[id]) cart[id].qty += qty;
    else { cart[id] = Object.assign({}, item, {qty: qty}); }
    cart[id].qty = Math.min(cart[id].qty, 99);
    qtySelections[id] = 1;
    document.getElementById('qty-' + id).textContent = 1;
    document.getElementById('cartError').classList.remove('show');
    renderCart();
    const btn = document.getElementById('add-' + id);
    if(btn){
        btn.classList.add('added');
        btn.textContent = '✓';
        setTimeout(function(){ btn.classList.remove('added'); btn.textContent = i18n[currentLang].addBtn; }, 900);
    }
}

function removeItem(id){
    delete cart[id];
    renderCart();
}

function renderCart(){
    const items = Object.values(cart);
    const cartList = document.getElementById('cartList');
    cartList.innerHTML = items.length ? items.map(function(i){
        return '<div class="cart-row">' +
            '<span class="cart-emoji">' + i.emoji + '</span>' +
            '<span class="cart-name">' + i.name + '</span>' +
            '<span class="cart-stepper">' +
                '<button class="cart-step" onclick="changeCartQty(' + i.id + ',-1)" aria-label="−">−</button>' +
                '<span class="cart-qty">' + i.qty + '</span>' +
                '<button class="cart-step" onclick="changeCartQty(' + i.id + ',1)" aria-label="+">+</button>' +
            '</span>' +
            '<span class="cart-price">' + money(i.price*i.qty) + '</span>' +
            '<button class="del-btn" onclick="removeItem(' + i.id + ')" title="' + i18n[currentLang].removeItem + '" aria-label="' + i18n[currentLang].removeItem + '">✕</button></div>';
    }).join('') : '<div class="empty">' + i18n[currentLang].emptyCart + '</div>';
    const count = items.reduce(function(s,i){ return s + i.qty; }, 0);
    const badge = document.getElementById('cartCount');
    badge.textContent = count;
    badge.style.display = count ? 'inline-flex' : 'none';
    calcTotal();
}

function calcTotal(){
    const subtotal = Object.values(cart).reduce(function(s,i){ return s+i.price*i.qty; },0);
    const taxRatePct = Math.min(parseNum(document.getElementById('taxRatePct').value) || 0, 100);
    const tax = subtotal * (taxRatePct / 100);
    const custom = parseNum(document.getElementById('customTip').value) || 0;
    const tip = tipPct>0 ? subtotal*tipPct : custom;
    const deliveryFee = orderType === 'delivery' ? DELIVERY_FEE : 0;
    const total = subtotal+tax+tip+deliveryFee;

    document.getElementById('taxLabelText').textContent = i18n[currentLang].tax + ' (' + fmtPct(taxRatePct) + ' %)';
    document.getElementById('subtotal').textContent = money(subtotal);
    document.getElementById('tax').textContent = money(tax);
    document.getElementById('deliveryFeeAmt').textContent = money(deliveryFee);
    document.getElementById('tipAmt').textContent = money(tip);
    document.getElementById('total').textContent = money(total);
    lastBill = { subtotal: subtotal, tax: tax, taxRatePct: taxRatePct, deliveryFee: deliveryFee, tip: tip, total: total };
    saveDraft();
}

function setTip(pct, btn){
    // Tapping the active tip again removes it
    tipPct = tipPct === pct ? 0 : pct;
    document.getElementById('customTip').value='';
    document.querySelectorAll('.tip-btn').forEach(function(b){ b.classList.remove('active'); });
    if(tipPct) btn.classList.add('active');
    calcTotal();
}

function clearCart(){
    cart = {}; tipPct = 0;
    document.getElementById('customTip').value='';
    document.getElementById('orderNote').value='';
    document.getElementById('custName').value='';
    document.getElementById('custPhone').value='';
    document.getElementById('custAddress').value='';
    document.querySelectorAll('.tip-btn').forEach(function(b){ b.classList.remove('active'); });
    clearFieldErrors();
    clearDraft();
    renderCart();
}

function clearFieldErrors(){
    ['custName','custPhone','custAddress'].forEach(function(id){ document.getElementById(id).classList.remove('error'); });
    ['nameError','phoneError','addressError','cartError'].forEach(function(id){ document.getElementById(id).classList.remove('show'); });
    document.getElementById('phoneError').textContent = i18n[currentLang].phoneRequired;
}

const DRAFT_KEY = 'apronOrderDraft';
const OLD_DRAFT_KEY = 'menuOnlineOrderDraft';

function saveDraft(){
    try{
        const draft = {
            lang: currentLang,
            cart: cart,
            qtySelections: qtySelections,
            orderType: orderType,
            tipPct: tipPct,
            customTip: parseNum(document.getElementById('customTip').value),
            taxRatePct: parseNum(document.getElementById('taxRatePct').value),
            orderNote: document.getElementById('orderNote').value,
            custName: document.getElementById('custName').value,
            custPhone: document.getElementById('custPhone').value,
            custAddress: document.getElementById('custAddress').value
        };
        localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    } catch(err){
        // localStorage unavailable (private mode, quota, etc.) — safe to ignore
    }
}

function clearDraft(){
    try{ localStorage.removeItem(DRAFT_KEY); } catch(err){ /* ignore */ }
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

    cart = draft.cart || {};
    Object.assign(qtySelections, draft.qtySelections || {});
    orderType = draft.orderType === 'delivery' ? 'delivery' : 'pickup';
    tipPct = typeof draft.tipPct === 'number' ? draft.tipPct : 0;

    applyLang(draft.lang === 'en' ? 'en' : 'es');
    // Drop anything in a saved cart that isn't a real dish with a sane quantity
    Object.keys(cart).forEach(function(id){
        const item = menu.find(function(m){ return m.id === Number(id); });
        const qty = cart[id] && cart[id].qty;
        if(!item || !Number.isInteger(qty) || qty < 1) delete cart[id];
        else cart[id] = Object.assign({}, item, {qty: Math.min(qty, 99)});
    });

    // Older drafts stored raw strings like "8.25"; Number() reads both
    document.getElementById('customTip').value = toInputValue(draft.customTip === null || draft.customTip === '' ? NaN : Number(draft.customTip), NUMBER_INPUTS.customTip);
    document.getElementById('taxRatePct').value = toInputValue(draft.taxRatePct === null || draft.taxRatePct === '' ? NaN : Number(draft.taxRatePct), NUMBER_INPUTS.taxRatePct);
    document.getElementById('orderNote').value = draft.orderNote || '';
    document.getElementById('custName').value = draft.custName || '';
    document.getElementById('custPhone').value = draft.custPhone || '';
    document.getElementById('custAddress').value = draft.custAddress || '';

    document.getElementById('pickupBtn').classList.toggle('active', orderType==='pickup');
    document.getElementById('deliveryBtn').classList.toggle('active', orderType==='delivery');
    document.getElementById('deliveryLine').style.display = orderType==='delivery' ? 'flex' : 'none';
    document.getElementById('addressField').style.display = orderType==='delivery' ? 'block' : 'none';

    document.querySelectorAll('.tip-btn').forEach(function(b){
        b.classList.toggle('active', tipPct > 0 && parseFloat(b.getAttribute('data-pct')) === tipPct);
    });
}

function generateOrderNumber(){
    return '#' + Math.floor(1000 + Math.random()*9000);
}

function focusFirstError(){
    const first = document.querySelector('.checkout-field input.error');
    if(first){ first.focus(); first.scrollIntoView({behavior:'smooth', block:'center'}); }
}

function placeOrder(){
    clearFieldErrors();
    let valid = true;

    if(Object.keys(cart).length === 0){
        document.getElementById('cartError').classList.add('show');
        valid = false;
    }

    const name = document.getElementById('custName').value.trim();
    if(!name){
        document.getElementById('custName').classList.add('error');
        document.getElementById('nameError').classList.add('show');
        valid = false;
    }

    const phone = document.getElementById('custPhone').value.trim();
    const phoneDigits = phone.replace(/\D/g, '').length;
    if(!phone || phoneDigits < 7){
        document.getElementById('custPhone').classList.add('error');
        document.getElementById('phoneError').textContent = phone ? i18n[currentLang].phoneInvalid : i18n[currentLang].phoneRequired;
        document.getElementById('phoneError').classList.add('show');
        valid = false;
    }

    let address = '';
    if(orderType === 'delivery'){
        address = document.getElementById('custAddress').value.trim();
        if(!address){
            document.getElementById('custAddress').classList.add('error');
            document.getElementById('addressError').classList.add('show');
            valid = false;
        }
    }

    if(!valid){ focusFirstError(); return; }
    showOrderConfirmation(name, phone, address);
}

function showOrderConfirmation(name, phone, address){
    document.getElementById('orderNumber').textContent = generateOrderNumber();
    document.getElementById('etaText').textContent = orderType === 'delivery' ? i18n[currentLang].etaDelivery : i18n[currentLang].etaPickup;

    calcTotal();
    const t = i18n[currentLang];
    const row = function(label, value, cls){
        return '<div class="modal-row' + (cls ? ' ' + cls : '') + '"><span>' + label + '</span><span>' + value + '</span></div>';
    };
    const items = Object.values(cart);
    let html = items.map(function(i){ return row(i.emoji + ' ' + i.name + ' × ' + i.qty, money(i.price*i.qty)); }).join('');
    // How the total is built, so it never looks like it came out of nowhere
    html += row(t.subtotal, money(lastBill.subtotal), 'modal-sub first');
    if(lastBill.tax > 0) html += row(t.tax + ' (' + fmtPct(lastBill.taxRatePct) + ' %)', money(lastBill.tax), 'modal-sub');
    if(lastBill.deliveryFee > 0) html += row(t.deliveryFeeLabel, money(lastBill.deliveryFee), 'modal-sub');
    if(lastBill.tip > 0) html += row(t.tip, money(lastBill.tip), 'modal-sub');
    document.getElementById('modalItems').innerHTML = html;

    document.getElementById('modalTotal').textContent = money(lastBill.total);
    document.getElementById('modalName').textContent = name;
    document.getElementById('modalPhone').textContent = phone;

    const addressRow = document.getElementById('modalAddressRow');
    if(orderType === 'delivery'){
        addressRow.style.display = 'flex';
        document.getElementById('modalAddress').textContent = address;
    } else {
        addressRow.style.display = 'none';
    }

    const note = document.getElementById('orderNote').value.trim();
    const noteSection = document.getElementById('modalNoteSection');
    if(note){
        noteSection.style.display = 'block';
        document.getElementById('modalNote').textContent = note;
    } else {
        noteSection.style.display = 'none';
    }

    document.getElementById('orderModal').classList.add('show');
}

function closeModal(){
    document.getElementById('orderModal').classList.remove('show');
}

document.getElementById('orderModal').addEventListener('click', function(e){
    if(e.target === this) closeModal();
});

document.addEventListener('keydown', function(e){
    if(e.key !== 'Escape') return;
    closeModal();
    // Esc also backs out of renaming, as long as the restaurant already has a name
    if(!document.getElementById('appWrapper').classList.contains('hidden')){
        document.getElementById('welcomeOverlay').classList.add('hidden');
    }
});

function newOrder(){
    closeModal();
    clearCart();
}

document.getElementById('customTip').addEventListener('input', function(e){
    formatNumberInput(e.target, NUMBER_INPUTS.customTip);
    tipPct = 0;
    document.querySelectorAll('.tip-btn').forEach(function(b){ b.classList.remove('active'); });
    calcTotal();
});

document.getElementById('taxRatePct').addEventListener('input', function(e){
    formatNumberInput(e.target, NUMBER_INPUTS.taxRatePct);
    if((parseNum(e.target.value) || 0) > 100) e.target.value = toInputValue(100, NUMBER_INPUTS.taxRatePct);
    calcTotal();
});

Object.keys(NUMBER_INPUTS).forEach(function(id){
    const input = document.getElementById(id);
    input.addEventListener('beforeinput', numberBeforeInput);
    input.addEventListener('blur', function(){
        input.value = toInputValue(parseNum(input.value), NUMBER_INPUTS[id]);
    });
});

document.getElementById('orderNote').addEventListener('input', function(){
    saveDraft();
});

['custName','custPhone','custAddress'].forEach(function(id){
    document.getElementById(id).addEventListener('input', function(e){
        e.target.classList.remove('error');
        document.getElementById(id.replace('cust','').toLowerCase() + 'Error').classList.remove('show');
        saveDraft();
    });
});

const RESTAURANT_NAME_KEY = 'apronRestaurantName';
const OLD_RESTAURANT_NAME_KEY = 'menuTemplateRestaurantName';

function applyRestaurantName(name){
    document.getElementById('restaurantNameDisplay').textContent = '🍽️ ' + name;
    document.title = name + ' · Apron';
}

function startRestaurant(){
    const input = document.getElementById('restaurantNameInput');
    const name = input.value.trim();
    if(!name){
        input.classList.add('error');
        document.getElementById('welcomeNameError').classList.add('show');
        return;
    }
    input.classList.remove('error');
    document.getElementById('welcomeNameError').classList.remove('show');
    try{ localStorage.setItem(RESTAURANT_NAME_KEY, name); } catch(err){ /* ignore */ }
    applyRestaurantName(name);
    document.getElementById('welcomeOverlay').classList.add('hidden');
    document.getElementById('appWrapper').classList.remove('hidden');
}

function editRestaurantName(){
    const current = document.getElementById('restaurantNameDisplay').textContent.replace('🍽️ ', '');
    const input = document.getElementById('restaurantNameInput');
    input.value = current;
    document.getElementById('welcomeOverlay').classList.remove('hidden');
    input.focus();
    input.select();
}

function initRestaurantSetup(){
    let savedName = null;
    try{ savedName = localStorage.getItem(RESTAURANT_NAME_KEY) || localStorage.getItem(OLD_RESTAURANT_NAME_KEY); } catch(err){ /* ignore */ }
    if(savedName){
        applyRestaurantName(savedName);
        document.getElementById('welcomeOverlay').classList.add('hidden');
        document.getElementById('appWrapper').classList.remove('hidden');
    }
}

document.getElementById('restaurantNameInput').addEventListener('keydown', function(e){
    if(e.key === 'Enter') startRestaurant();
});

applyLang('es');
initRestaurantSetup();
restoreDraft();
renderMenu();
renderCart();

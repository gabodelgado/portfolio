function fmt(n, decimals){
    if(decimals === undefined) decimals = 2;
    return n.toLocaleString('es-ES', {minimumFractionDigits: decimals, maximumFractionDigits: decimals});
}

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
        emptyCart:'Aún no has agregado nada', tipTitle:'💚 Agregar propina', customTip:'0.00',
        tipHint:'Escribe un monto exacto de propina en dólares (ej: 5.00)',
        subtotal:'Subtotal', tax:'Impuesto', tip:'Propina', totalLabel:'Total a pagar', clearBtn:'🗑️ Vaciar cuenta',
        taxRateTitle:'🧾 Impuesto de venta local (%)',
        taxRateHint:'Ingresa la tasa real de impuesto a las ventas de tu ciudad/estado (ej: 8.25). Varía según el lugar — no usamos un valor automático.',
        addBtn:'Agregar', orderTypeTitle:'🚗 Tipo de pedido', pickup:'Recoger', pickupSub:'Gratis',
        delivery:'Delivery', deliverySub:'+$6.00', deliveryFeeLabel:'Fee de delivery',
        noteTitle:'📝 Nota para tu pedido (opcional)', notePh:'Ej: sin cebolla, alergia a los frutos secos, tocar el timbre...',
        checkoutTitle:'📇 Datos de contacto', nameLabel:'Nombre completo', namePh:'Tu nombre',
        phoneLabel:'Número de teléfono', phonePh:'(555) 123-4567',
        addressLabel:'Dirección de entrega', addressPh:'Calle, número, apto, ciudad',
        confirmBtn:'✅ Confirmar Pedido', cartEmptyError:'Agrega al menos un plato para confirmar tu pedido.',
        nameRequired:'Ingresa tu nombre', phoneRequired:'Ingresa tu teléfono', addressRequired:'Ingresa tu dirección de entrega',
        orderConfirmedTitle:'¡Pedido confirmado!', orderNumberLabel:'N.º de pedido',
        modalSummaryTitle:'Resumen', modalContactTitle:'Contacto', newOrderBtn:'🍽️ Hacer otro pedido',
        etaPickup:'Listo para recoger en 15–20 min', etaDelivery:'Llega en 35–45 min'
    },
    en: {
        appTitle:'🍽️ Apron',
        welcomeTitle:'Welcome!', welcomeSub:'Give your restaurant a name and set up your ordering page instantly with these sample dishes.',
        welcomeNamePh:'E.g: The Flavor House', welcomeNameRequired:'Type your restaurant\'s name', welcomeBtn:'Get started →',
        editNameTitle:'Change name',
        subtitle:'Select your dishes and calculate your bill instantly', menuTitle:'📋 Menu', billTitle:'🧾 Your Bill',
        emptyCart:'Nothing added yet', tipTitle:'💚 Add a tip', customTip:'0.00',
        tipHint:'Type an exact tip amount in dollars (e.g. 5.00)',
        subtotal:'Subtotal', tax:'Tax', tip:'Tip', totalLabel:'Total to pay', clearBtn:'🗑️ Clear bill',
        taxRateTitle:'🧾 Local sales tax (%)',
        taxRateHint:'Enter the real sales tax rate for your city/state (e.g. 8.25). It varies by location — we don\'t use an automatic value.',
        addBtn:'Add', orderTypeTitle:'🚗 Order type', pickup:'Pickup', pickupSub:'Free',
        delivery:'Delivery', deliverySub:'+$6.00', deliveryFeeLabel:'Delivery fee',
        noteTitle:'📝 Note for your order (optional)', notePh:'E.g: no onion, nut allergy, ring the bell...',
        checkoutTitle:'📇 Contact details', nameLabel:'Full name', namePh:'Your name',
        phoneLabel:'Phone number', phonePh:'(555) 123-4567',
        addressLabel:'Delivery address', addressPh:'Street, number, apt, city',
        confirmBtn:'✅ Confirm Order', cartEmptyError:'Add at least one dish to confirm your order.',
        nameRequired:'Enter your name', phoneRequired:'Enter your phone number', addressRequired:'Enter your delivery address',
        orderConfirmedTitle:'Order confirmed!', orderNumberLabel:'Order #',
        modalSummaryTitle:'Summary', modalContactTitle:'Contact', newOrderBtn:'🍽️ Place another order',
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

function setLang(lang){
    currentLang = lang;
    menu = menuData[lang];
    document.getElementById('langEs').classList.toggle('active', lang==='es');
    document.getElementById('langEn').classList.toggle('active', lang==='en');
    document.getElementById('welcomeLangEs').classList.toggle('active', lang==='es');
    document.getElementById('welcomeLangEn').classList.toggle('active', lang==='en');
    document.querySelectorAll('[data-i18n]').forEach(function(el){ el.textContent = i18n[lang][el.getAttribute('data-i18n')]; });
    document.querySelectorAll('[data-i18n-ph]').forEach(function(el){ el.placeholder = i18n[lang][el.getAttribute('data-i18n-ph')]; });
    document.querySelectorAll('[data-i18n-title]').forEach(function(el){ el.title = i18n[lang][el.getAttribute('data-i18n-title')]; });
    cart = {};
    tipPct = 0;
    document.getElementById('customTip').value = '';
    document.querySelectorAll('.tip-btn').forEach(function(b){ b.classList.remove('active'); });
    clearFieldErrors();
    document.getElementById('orderModal').classList.remove('show');
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
                    '<div class="dish-price">$' + fmt(item.price) + '</div>' +
                    '<div class="qty-add-row">' +
                        '<div class="qty-stepper">' +
                            '<button class="qty-btn" onclick="changeQty(' + item.id + ',-1)">−</button>' +
                            '<span class="qty-value" id="qty-' + item.id + '">' + qtySelections[item.id] + '</span>' +
                            '<button class="qty-btn" onclick="changeQty(' + item.id + ',1)">+</button>' +
                        '</div>' +
                        '<button class="add-btn" onclick="addItem(' + item.id + ')">' + i18n[currentLang].addBtn + '</button>' +
                    '</div></div>';
            }).join('') + '</div>';
    }).join('');
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
    qtySelections[id] = 1;
    document.getElementById('qty-' + id).textContent = 1;
    renderCart();
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
            '<span class="cart-qty">x' + i.qty + '</span>' +
            '<span class="cart-price">$' + fmt(i.price*i.qty) + '</span>' +
            '<button class="del-btn" onclick="removeItem(' + i.id + ')">✕</button></div>';
    }).join('') : '<div class="empty">' + i18n[currentLang].emptyCart + '</div>';
    calcTotal();
}

function calcTotal(){
    const subtotal = Object.values(cart).reduce(function(s,i){ return s+i.price*i.qty; },0);
    const taxRatePct = parseFloat(document.getElementById('taxRatePct').value) || 0;
    const tax = subtotal * (taxRatePct / 100);
    const custom = parseFloat(document.getElementById('customTip').value)||0;
    const tip = tipPct>0 ? subtotal*tipPct : custom;
    const deliveryFee = orderType === 'delivery' ? DELIVERY_FEE : 0;
    const total = subtotal+tax+tip+deliveryFee;

    document.getElementById('taxLabelText').textContent = i18n[currentLang].tax + ' (' + fmt(taxRatePct, 2) + '%)';
    document.getElementById('subtotal').textContent = '$' + fmt(subtotal);
    document.getElementById('tax').textContent = '$' + fmt(tax);
    document.getElementById('deliveryFeeAmt').textContent = '$' + fmt(deliveryFee);
    document.getElementById('tipAmt').textContent = '$' + fmt(tip);
    document.getElementById('total').textContent = '$' + fmt(total);
    saveDraft();
}

function setTip(pct, btn){
    tipPct = pct;
    document.getElementById('customTip').value='';
    document.querySelectorAll('.tip-btn').forEach(function(b){ b.classList.remove('active'); });
    btn.classList.add('active');
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
}

const DRAFT_KEY = 'menuOnlineOrderDraft';

function saveDraft(){
    try{
        const draft = {
            lang: currentLang,
            cart: cart,
            qtySelections: qtySelections,
            orderType: orderType,
            tipPct: tipPct,
            customTip: document.getElementById('customTip').value,
            taxRatePct: document.getElementById('taxRatePct').value,
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
        const raw = localStorage.getItem(DRAFT_KEY);
        if(!raw) return;
        draft = JSON.parse(raw);
    } catch(err){
        return;
    }
    if(!draft) return;

    currentLang = draft.lang === 'en' ? 'en' : 'es';
    menu = menuData[currentLang];
    cart = draft.cart || {};
    Object.assign(qtySelections, draft.qtySelections || {});
    orderType = draft.orderType === 'delivery' ? 'delivery' : 'pickup';
    tipPct = typeof draft.tipPct === 'number' ? draft.tipPct : 0;

    document.getElementById('langEs').classList.toggle('active', currentLang==='es');
    document.getElementById('langEn').classList.toggle('active', currentLang==='en');
    document.querySelectorAll('[data-i18n]').forEach(function(el){ el.textContent = i18n[currentLang][el.getAttribute('data-i18n')]; });
    document.querySelectorAll('[data-i18n-ph]').forEach(function(el){ el.placeholder = i18n[currentLang][el.getAttribute('data-i18n-ph')]; });

    document.getElementById('customTip').value = draft.customTip || '';
    document.getElementById('taxRatePct').value = draft.taxRatePct || '';
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
    if(!phone){
        document.getElementById('custPhone').classList.add('error');
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

    if(!valid) return;
    showOrderConfirmation(name, address);
}

function showOrderConfirmation(name, address){
    document.getElementById('orderNumber').textContent = generateOrderNumber();
    document.getElementById('etaText').textContent = orderType === 'delivery' ? i18n[currentLang].etaDelivery : i18n[currentLang].etaPickup;

    const items = Object.values(cart);
    document.getElementById('modalItems').innerHTML = items.map(function(i){
        return '<div class="modal-row"><span>' + i.emoji + ' ' + i.name + ' x' + i.qty + '</span><span>$' + fmt(i.price*i.qty) + '</span></div>';
    }).join('');

    document.getElementById('modalTotal').textContent = document.getElementById('total').textContent;
    document.getElementById('modalName').textContent = name;

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

function newOrder(){
    closeModal();
    clearCart();
}

document.getElementById('customTip').addEventListener('input', function(e){
    if(e.target.value < 0) e.target.value = 0;
    tipPct = 0;
    document.querySelectorAll('.tip-btn').forEach(function(b){ b.classList.remove('active'); });
    calcTotal();
});

document.getElementById('taxRatePct').addEventListener('input', function(e){
    if(e.target.value < 0) e.target.value = 0;
    calcTotal();
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

const RESTAURANT_NAME_KEY = 'menuTemplateRestaurantName';

function applyRestaurantName(name){
    document.getElementById('restaurantNameDisplay').textContent = '🍽️ ' + name;
    document.title = name;
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
    document.getElementById('restaurantNameInput').value = current;
    document.getElementById('welcomeOverlay').classList.remove('hidden');
}

function initRestaurantSetup(){
    let savedName = null;
    try{ savedName = localStorage.getItem(RESTAURANT_NAME_KEY); } catch(err){ /* ignore */ }
    if(savedName){
        applyRestaurantName(savedName);
        document.getElementById('welcomeOverlay').classList.add('hidden');
        document.getElementById('appWrapper').classList.remove('hidden');
    }
}

document.getElementById('restaurantNameInput').addEventListener('keydown', function(e){
    if(e.key === 'Enter') startRestaurant();
});

initRestaurantSetup();
restoreDraft();
renderMenu();
renderCart();

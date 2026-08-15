const tg = window.Telegram?.WebApp;
if (tg) {
    tg.ready();
    tg.expand();
    // Применяем тему Telegram
    document.documentElement.style.setProperty('--tg-theme-bg-color', tg.themeParams.bg_color || '#0f0f1a');
    document.documentElement.style.setProperty('--tg-theme-text-color', tg.themeParams.text_color || '#ffffff');
    document.documentElement.style.setProperty('--tg-theme-hint-color', tg.themeParams.hint_color || '#a0a0b0');
    document.documentElement.style.setProperty('--tg-theme-button-color', tg.themeParams.button_color || '#a855f7');
    document.documentElement.style.setProperty('--tg-theme-button-text-color', tg.themeParams.button_text_color || '#ffffff');
    document.documentElement.style.setProperty('--tg-theme-secondary-bg-color', tg.themeParams.secondary_bg_color || '#1a1a2e');
}

// ⚡ Замените на ваш актуальный API_URL
const API_URL = "https://testwebappmaya.alwaysdata.net/api/products";

let products = [];
let cart = {}; // ключ: product.id
let currentCategory = null;

// DOM элементы
const catalogEl = document.getElementById('catalog');
const categoriesBar = document.getElementById('categoriesBar');
const cartCountEl = document.getElementById('cartCount');
const cartTotalEl = document.getElementById('cartTotal');
const cartItemsEl = document.getElementById('cartItems');
const cartToggle = document.getElementById('cartToggle');
const cartBody = document.getElementById('cartBody');
const checkoutBtn = document.getElementById('checkoutBtn');
const nameInput = document.getElementById('nameInput');
const phoneInput = document.getElementById('phoneInput');
const commentInput = document.getElementById('commentInput');
const cartEmptyEl = document.getElementById('cartEmpty');

// Загрузка товаров
async function loadProducts() {
    try {
        const resp = await fetch(API_URL);
        products = await resp.json();
        renderCategories();
        const firstCat = products.length > 0 ? products[0].category : null;
        setCategory(firstCat);
    } catch (e) {
        console.error("Ошибка загрузки:", e);
        if (tg) tg.showAlert("Не удалось загрузить каталог");
    }
}

function renderCategories() {
    const categories = [...new Set(products.map(p => p.category))];
    categoriesBar.innerHTML = categories.map(cat =>
        `<button class="category-btn ${cat === currentCategory ? 'active' : ''}" onclick="setCategory('${cat}')">${cat}</button>`
    ).join('');
}

function setCategory(category) {
    currentCategory = category;
    renderCategories();
    renderCatalog();
}

function renderCatalog() {
    const filtered = products.filter(p => p.stock > 0 && p.category === currentCategory);
    if (filtered.length === 0) {
        catalogEl.innerHTML = `<div class="no-products">В этой категории нет товаров</div>`;
        return;
    }
    catalogEl.innerHTML = filtered.map(product => {
        const qty = cart[product.id]?.qty || 0;
        return `
            <div class="product-card">
                <img src="${product.image}" alt="${product.name}"
                     onerror="this.src='https://via.placeholder.com/150/1a1a2e/a855f7?text=VAPE'">
                <h3>${product.name}</h3>
                <div class="price">${product.price} ₽</div>
                <div class="stock">В наличии: ${product.stock}</div>
                <div class="controls">
                    <button onclick="removeFromCart(${product.id})">−</button>
                    <span class="qty-display">${qty}</span>
                    <button onclick="addToCart(${product.id})">+</button>
                </div>
            </div>
        `;
    }).join('');
}

// Добавление в корзину
function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    if (cart[productId]) {
        cart[productId].qty++;
    } else {
        cart[productId] = { ...product, qty: 1 };
    }
    updateCartUI();
    cartBody.classList.remove('hidden');
}

// Удаление одной единицы (при нажатии минус на карточке)
function removeFromCart(productId) {
    if (cart[productId]) {
        cart[productId].qty--;
        if (cart[productId].qty <= 0) {
            delete cart[productId];
        }
    }
    updateCartUI();
}

// Полное удаление позиции (при нажатии на корзину)
function deleteFromCart(productId) {
    delete cart[productId];
    updateCartUI();
}

function updateCartUI() {
    const items = Object.values(cart);
    const totalQty = items.reduce((sum, item) => sum + item.qty, 0);
    const totalPrice = items.reduce((sum, item) => sum + item.price * item.qty, 0);

    cartCountEl.textContent = totalQty;
    cartTotalEl.textContent = `${totalPrice} ₽`;

    if (items.length === 0) {
        cartItemsEl.innerHTML = '';
        cartEmptyEl.style.display = 'block';
        checkoutBtn.style.display = 'none';
    } else {
        cartEmptyEl.style.display = 'none';
        checkoutBtn.style.display = 'block';
        cartItemsEl.innerHTML = items.map((item) => {
            return `
                <div>
                    <span>${item.name} ×${item.qty}</span>
                    <span>${item.price * item.qty} ₽</span>
                    <button onclick="deleteFromCart(${item.id})">🗑️</button>
                </div>
            `;
        }).join('');
    }

    // Обновляем количество в каталоге
    renderCatalog();
}

// Переключение корзины
cartToggle.addEventListener('click', () => {
    cartBody.classList.toggle('hidden');
});

// Оформление заказа
checkoutBtn.addEventListener('click', async () => {
    const name = nameInput.value.trim();
    const phone = phoneInput.value.trim();

    if (!name || !phone) {
        if (tg) tg.showAlert('Укажите имя и телефон');
        else alert('Укажите имя и телефон');
        return;
    }
    if (Object.keys(cart).length === 0) {
        if (tg) tg.showAlert('Корзина пуста');
        else alert('Корзина пуста');
        return;
    }

    // Получаем IP пользователя
    let ip = 'неизвестен';
    try {
        const ipResp = await fetch('https://api.ipify.org?format=json');
        const ipData = await ipResp.json();
        ip = ipData.ip;
    } catch (e) {
        console.warn('Не удалось получить IP:', e);
    }

    const orderData = {
        items: Object.values(cart).map(item => ({
            id: item.id,
            name: item.name,
            price: item.price,
            qty: item.qty
        })),
        total: Object.values(cart).reduce((sum, i) => sum + i.price * i.qty, 0),
        customer_name: name,
        phone: phone,
        comment: commentInput.value.trim(),
        ip: ip
    };

    if (tg) {
        tg.sendData(JSON.stringify(orderData));
        tg.showAlert('✅ Заказ отправлен!');
    } else {
        alert('Тестовый заказ:\n' + JSON.stringify(orderData, null, 2));
        console.log('Заказ:', orderData);
    }
});

// Инициализация
loadProducts();

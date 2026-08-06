// Telegram Mini App инициализация
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

// Ассортимент Maya VapeShop
const products = [
    {
        id: 1,
        name: 'Elf Bar BC5000',
        price: 1400,
        image: 'https://i.ibb.co/Y7K5rhw/elfbar.png' // замените на свои изображения
    },
    {
        id: 2,
        name: 'HQD Cuvie Plus',
        price: 1100,
        image: 'https://i.ibb.co/pyQHjRJ/hqd.png'
    },
    {
        id: 3,
        name: 'Vaporesso XROS 3',
        price: 2200,
        image: 'https://i.ibb.co/B6WfcjY/xros3.png'
    },
    {
        id: 4,
        name: 'Солевая жидкость 30мл',
        price: 750,
        image: 'https://i.ibb.co/NN0y56N/saltnic.png'
    },
    {
        id: 5,
        name: 'Картридж XROS (2шт)',
        price: 590,
        image: 'https://i.ibb.co/5xgGgqk/cartridge.png'
    },
    {
        id: 6,
        name: 'Испаритель Smok Nord',
        price: 320,
        image: 'https://i.ibb.co/9p7PfBv/coil.png'
    }
];

// Корзина: { [id]: { ...product, qty } }
let cart = {};

// DOM элементы
const catalogEl = document.getElementById('catalog');
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

// Рендер каталога
function renderCatalog() {
    catalogEl.innerHTML = products.map(product => {
        const qty = cart[product.id]?.qty || 0;
        return `
            <div class="product-card">
                <img src="${product.image}" alt="${product.name}" 
                     onerror="this.src='https://via.placeholder.com/150/1a1a2e/a855f7?text=VAPE'">
                <h3>${product.name}</h3>
                <div class="price">${product.price} ₽</div>
                <div class="controls">
                    <button onclick="removeFromCart(${product.id})">−</button>
                    <span class="qty-display">${qty}</span>
                    <button onclick="addToCart(${product.id})">+</button>
                </div>
            </div>
        `;
    }).join('');
}

// Обновление интерфейса корзины
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
        cartItemsEl.innerHTML = items.map(item => `
            <div>
                <span>${item.name} ×${item.qty}</span>
                <span>${item.price * item.qty} ₽</span>
            </div>
        `).join('');
    }

    // Обновляем цифры в карточках товаров
    renderCatalog(); // можно оптимизировать, но для простоты перерисовываем
}

function addToCart(productId) {
    if (!cart[productId]) {
        const product = products.find(p => p.id === productId);
        cart[productId] = { ...product, qty: 1 };
    } else {
        cart[productId].qty++;
    }
    updateCartUI();
    // Автоматически раскрываем панель корзины
    cartBody.classList.remove('hidden');
}

function removeFromCart(productId) {
    if (cart[productId]) {
        cart[productId].qty--;
        if (cart[productId].qty <= 0) {
            delete cart[productId];
        }
    }
    updateCartUI();
}

// Переключение видимости тела корзины
cartToggle.addEventListener('click', () => {
    cartBody.classList.toggle('hidden');
});

// Оформление заказа
checkoutBtn.addEventListener('click', () => {
    const name = nameInput.value.trim();
    const phone = phoneInput.value.trim();

    if (!name || !phone) {
        if (tg) tg.showAlert('Пожалуйста, укажите имя и номер телефона.');
        else alert('Пожалуйста, укажите имя и номер телефона.');
        return;
    }

    if (Object.keys(cart).length === 0) {
        if (tg) tg.showAlert('Корзина пуста.');
        else alert('Корзина пуста.');
        return;
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
        comment: commentInput.value.trim()
    };

    if (tg) {
        tg.sendData(JSON.stringify(orderData));
        // Опционально показываем alert перед закрытием
        tg.showAlert('✅ Заказ отправлен! С вами свяжется менеджер.');
    } else {
        // Для отладки вне Telegram
        alert('Тестовый заказ:\n' + JSON.stringify(orderData, null, 2));
        console.log('Заказ:', orderData);
    }
});

// Инициализация
renderCatalog();
updateCartUI();
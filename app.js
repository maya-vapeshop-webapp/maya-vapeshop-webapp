const tg = window.Telegram?.WebApp;
if (tg) {
    tg.ready();
    tg.expand();
    // применение темы (опционально)
}

// ⚡ Адрес API (измените на ваш сервер, где работает бот)
const API_URL = "https://your-server-address.com:8080/api/products";
// Для локального теста через ngrok будет что-то вроде: "https://xxxx.ngrok.io/api/products"

let products = [];
let cart = {};

// Загрузка товаров с сервера
async function loadProducts() {
    try {
        const resp = await fetch(API_URL);
        products = await resp.json();
        renderCatalog();
        updateCartUI();
    } catch (e) {
        console.error("Ошибка загрузки товаров:", e);
        if (tg) tg.showAlert("Не удалось загрузить каталог. Проверьте соединение.");
    }
}

// Рендер карточек (аналогичен предыдущему, но с проверкой stock > 0)
function renderCatalog() {
    const catalogEl = document.getElementById('catalog');
    catalogEl.innerHTML = products.filter(p => p.stock > 0).map(product => {
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

function addToCart(productId) { /* как раньше */ }
function removeFromCart(productId) { /* как раньше */ }
function updateCartUI() { /* как раньше, с перерисовкой каталога */ }

// Оформление заказа — без изменений, отправляет данные через sendData
document.getElementById('checkoutBtn').addEventListener('click', () => {
    // ... проверка имени и телефона ...
    const orderData = { /* ... */ };
    if (tg) {
        tg.sendData(JSON.stringify(orderData));
    }
});

// Загружаем товары при открытии
loadProducts();

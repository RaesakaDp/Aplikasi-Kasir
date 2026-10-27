// DATA DEFAULT AWAL
const defaultProducts = [
    { id: 1, name: "Caffe Latte", category: "Kopi", price: 28000, stock: 50, image: "https://images.unsplash.com/photo-1541167760496-1628856ab772?w=300" },
    { id: 2, name: "Cappuccino", category: "Kopi", price: 28000, stock: 40, image: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=300" },
    { id: 3, name: "Americano", category: "Kopi", price: 22000, stock: 60, image: "https://images.unsplash.com/photo-1514064369515-b65fc4f70634?w=300" },
    { id: 4, name: "Matcha Latte", category: "Non-Kopi", price: 32000, stock: 30, image: "https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=300" },
    { id: 5, name: "Chocolate Hazelnut", category: "Non-Kopi", price: 30000, stock: 25, image: "https://images.unsplash.com/photo-1542990253-0d0f5be5f0ed?w=300" },
    { id: 6, name: "Croissant Butter", category: "Snack", price: 20000, stock: 15, image: "https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=300" },
    { id: 7, name: "French Fries", category: "Snack", price: 18000, stock: 25, image: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=300" },
    { id: 8, name: "Nasi Goreng Kafe", category: "Makanan", price: 35000, stock: 20, image: "https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=300" }
];

const defaultUsers = [
    { name: "Owner Kafe", username: "owner", password: "123", role: "superadmin" },
    { name: "Manager Toko", username: "manager", password: "123", role: "admin" },
    { name: "Kasir Shift 1", username: "kasir", password: "123", role: "kasir" }
];

// STATE APLIKASI
let products = JSON.parse(localStorage.getItem('cafe_products')) || defaultProducts;
let users = JSON.parse(localStorage.getItem('cafe_users')) || defaultUsers;
let currentUser = JSON.parse(localStorage.getItem('cafe_current_user')) || null;
let activeShift = JSON.parse(localStorage.getItem('cafe_active_shift')) || null;

let cart = [];
let transactions = JSON.parse(localStorage.getItem('cafe_transactions')) || [];
let activeCategory = 'All';
let currentOrderType = 'Dine-In';

// INISIALISASI
document.addEventListener('DOMContentLoaded', () => {
    if (currentUser) {
        showApp();
    } else {
        showLogin();
    }
});

// --- SISTEM LOGIN INTERAKTIF ---
function togglePasswordVisibility() {
    const passwordInput = document.getElementById('login-password');
    const eyeIcon = document.getElementById('eye-icon');

    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        eyeIcon.classList.remove('fa-eye');
        eyeIcon.classList.add('fa-eye-slash');
    } else {
        passwordInput.type = 'password';
        eyeIcon.classList.remove('fa-eye-slash');
        eyeIcon.classList.add('fa-eye');
    }
}

function handleLogin(e) {
    e.preventDefault();
    const u = document.getElementById('login-username').value.trim();
    const p = document.getElementById('login-password').value.trim();
    const loginCard = document.getElementById('login-card');

    const foundUser = users.find(user => user.username === u && user.password === p);
    if (foundUser) {
        currentUser = foundUser;
        localStorage.setItem('cafe_current_user', JSON.stringify(currentUser));
        showApp();
    } else {
        loginCard.classList.add('shake');
        setTimeout(() => loginCard.classList.remove('shake'), 400);
        alert('Username atau password salah!');
    }
}

function handleLogout() {
    if (activeShift) {
        if (!confirm('Anda belum melakukan tutup buku/shift. Yakin ingin keluar?')) {
            return;
        }
    }
    currentUser = null;
    localStorage.removeItem('cafe_current_user');
    showLogin();
}

function showLogin() {
    document.getElementById('login-container').style.display = 'flex';
    document.getElementById('app-container').style.display = 'none';
    document.getElementById('login-form').reset();
}

function showApp() {
    document.getElementById('login-container').style.display = 'none';
    document.getElementById('app-container').style.display = 'flex';

    document.getElementById('logged-user-name').innerText = currentUser.name;
    document.getElementById('logged-user-role').innerText = currentUser.role;

    setupSidebarMenu();
    updateDateDisplay();
    renderProducts();
    switchTab('pos');

    // Cek apakah shift aktif sudah dibuka
    if (!activeShift) {
        document.getElementById('shift-modal').classList.add('active');
    }
}

function startShift(e) {
    e.preventDefault();
    const initialCash = parseFloat(document.getElementById('initial-cash').value) || 0;

    activeShift = {
        cashier: currentUser.name,
        startTime: new Date().toISOString(),
        initialCash: initialCash
    };

    localStorage.setItem('cafe_active_shift', JSON.stringify(activeShift));
    document.getElementById('shift-modal').classList.remove('active');
    showToast('Shift berhasil dimulai!');
}

function setupSidebarMenu() {
    const menu = document.getElementById('sidebar-menu');
    menu.innerHTML = `
        <li class="active" onclick="switchTab('pos')">
            <i class="fa-solid fa-cash-register"></i> Kasir (POS)
        </li>
    `;

    if (currentUser.role === 'admin' || currentUser.role === 'superadmin') {
        menu.innerHTML += `
            <li onclick="switchTab('products')">
                <i class="fa-solid fa-boxes-stacked"></i> Produk
            </li>
            <li onclick="switchTab('reports')">
                <i class="fa-solid fa-chart-line"></i> Laporan Harian
            </li>
        `;
    }

    if (currentUser.role === 'superadmin') {
        menu.innerHTML += `
            <li onclick="switchTab('users')">
                <i class="fa-solid fa-users-gear"></i> Manajemen User
            </li>
        `;
    }

    // Menu Tutup Buku / Shift untuk semua user aktif
    menu.innerHTML += `
        <li onclick="openCloseShiftModal()">
            <i class="fa-solid fa-vault"></i> Tutup Buku / Shift
        </li>
    `;
}

// FORMAT RUPIAH
function formatRupiah(number) {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number);
}

// TANGGAL HEADER
function updateDateDisplay() {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const dateStr = new Date().toLocaleDateString('id-ID', options);
    const dateEl = document.getElementById('current-date');
    if (dateEl) dateEl.innerText = dateStr;
}

// NAVIGASI TAB
function switchTab(tabId) {
    if (currentUser.role === 'kasir' && tabId !== 'pos') {
        alert('Akses ditolak! Karyawan hanya dapat mengakses menu Kasir.');
        return;
    }
    if (currentUser.role === 'admin' && tabId === 'users') {
        alert('Akses ditolak! Menu ini khusus untuk Super Admin (Owner).');
        return;
    }

    document.querySelectorAll('.sidebar-menu li').forEach(li => li.classList.remove('active'));
    document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));

    const menuItems = document.querySelectorAll('.sidebar-menu li');
    menuItems.forEach(li => {
        if (li.getAttribute('onclick')?.includes(tabId)) {
            li.classList.add('active');
        }
    });

    if (tabId === 'pos') {
        document.getElementById('tab-pos').classList.add('active');
    } else if (tabId === 'products') {
        document.getElementById('tab-products').classList.add('active');
        renderProductTable();
    } else if (tabId === 'reports') {
        document.getElementById('tab-reports').classList.add('active');
        initReportDate();
        renderReports();
    } else if (tabId === 'users') {
        document.getElementById('tab-users').classList.add('active');
        renderUserTable();
    }
}

// --- NOTIFIKASI KILAT (TOAST) ---
function showToast(message) {
    let toast = document.getElementById('toast-notification');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toast-notification';
        toast.innerHTML = `<i class="fa-solid fa-circle-check"></i> <span id="toast-message"></span>`;
        document.body.appendChild(toast);
    }

    document.getElementById('toast-message').innerText = message;
    toast.classList.add('show');

    setTimeout(() => {
        toast.classList.remove('show');
    }, 2000);
}

// --- TUTUP BUKU & REKONSILIASI SHIFT ---
function openCloseShiftModal() {
    if (!activeShift) {
        alert('Belum ada shift yang aktif.');
        return;
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const shiftTransactions = transactions.filter(t => t.timestamp.startsWith(todayStr) && t.paymentMethod === 'Cash');
    const totalCashSales = shiftTransactions.reduce((sum, t) => sum + t.grandTotal, 0);

    const expectedCash = activeShift.initialCash + totalCashSales;

    document.getElementById('rekap-initial').innerText = formatRupiah(activeShift.initialCash);
    document.getElementById('rekap-cash-sales').innerText = formatRupiah(totalCashSales);
    document.getElementById('rekap-expected').innerText = formatRupiah(expectedCash);
    document.getElementById('actual-cash').value = '';
    document.getElementById('rekap-diff').innerText = formatRupiah(0);

    window.currentExpectedCash = expectedCash;
    document.getElementById('close-shift-modal').classList.add('active');
}

function closeShiftModal() {
    document.getElementById('close-shift-modal').classList.remove('active');
}

function calculateDifference() {
    const actualCash = parseFloat(document.getElementById('actual-cash').value) || 0;
    const diff = actualCash - window.currentExpectedCash;
    const diffEl = document.getElementById('rekap-diff');

    diffEl.innerText = formatRupiah(diff);
    if (diff < 0) {
        diffEl.style.color = 'var(--danger)';
        diffEl.innerText += ' (Kurang)';
    } else if (diff > 0) {
        diffEl.style.color = 'var(--warning)';
        diffEl.innerText += ' (Lebih)';
    } else {
        diffEl.style.color = 'var(--success)';
        diffEl.innerText += ' (Pas)';
    }
}

function finalizeCloseShift() {
    const actualCash = parseFloat(document.getElementById('actual-cash').value);
    if (isNaN(actualCash)) {
        alert('Masukkan jumlah fisik uang di laci!');
        return;
    }

    const diff = actualCash - window.currentExpectedCash;
    alert(`Tutup buku berhasil!\nModal Awal: ${formatRupiah(activeShift.initialCash)}\nSeharusnya di Laci: ${formatRupiah(window.currentExpectedCash)}\nFaktual: ${formatRupiah(actualCash)}\nSelisih: ${formatRupiah(diff)}`);

    localStorage.removeItem('cafe_active_shift');
    activeShift = null;
    closeShiftModal();
    handleLogout();
}

// --- MANAJEMEN TIPE PESANAN (DINE-IN / TAKEAWAY) ---
function setOrderType(type) {
    currentOrderType = type;
    const btnDineIn = document.getElementById('type-dinein');
    const btnTakeaway = document.getElementById('type-takeaway');
    const tableWrapper = document.getElementById('table-select-wrapper');

    if (type === 'Dine-In') {
        btnDineIn.style.background = 'var(--primary)';
        btnDineIn.style.color = 'white';
        btnTakeaway.style.background = 'var(--surface)';
        btnTakeaway.style.color = 'var(--text-muted)';
        tableWrapper.style.display = 'flex';
    } else {
        btnTakeaway.style.background = 'var(--primary)';
        btnTakeaway.style.color = 'white';
        btnDineIn.style.background = 'var(--surface)';
        btnDineIn.style.color = 'var(--text-muted)';
        tableWrapper.style.display = 'none';
    }
}

// --- RENDER KATALOG PRODUK ---
function renderProducts() {
    const grid = document.getElementById('product-grid');
    const searchInput = document.getElementById('search-product');
    if (!grid || !searchInput) return;

    const searchKeyword = searchInput.value.toLowerCase();
    grid.innerHTML = '';

    const filtered = products.filter(p => {
        const matchesCategory = activeCategory === 'All' || p.category === activeCategory;
        const matchesSearch = p.name.toLowerCase().includes(searchKeyword);
        return matchesCategory && matchesSearch;
    });

    if (filtered.length === 0) {
        grid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: #64748b; margin-top: 40px;">Tidak ada produk ditemukan</div>`;
        return;
    }

    filtered.forEach(product => {
        const imgSrc = (product.image && product.image.trim() !== '') 
            ? product.image 
            : 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=300';

        const card = document.createElement('div');
        card.className = 'product-card';
        card.onclick = (e) => addToCart(product.id, e);
        card.innerHTML = `
            <img src="${imgSrc}" class="product-img" alt="${product.name}" onerror="this.src='https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=300'">
            <div class="product-info">
                <span class="product-name" title="${product.name}">${product.name}</span>
                <span class="product-price">${formatRupiah(product.price)}</span>
                <span class="product-stock">Stok: ${product.stock}</span>
            </div>
        `;
        grid.appendChild(card);
    });
}

function filterCategory(category) {
    activeCategory = category;
    document.querySelectorAll('.cat-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.innerText.includes(category) || (category === 'All' && btn.innerText === 'Semua')) {
            btn.classList.add('active');
        }
    });
    renderProducts();
}

function filterProducts() {
    renderProducts();
}

// --- KERANJANG BELANJA ---
function addToCart(productId, event) {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    if (product.stock <= 0) {
        alert('Stok produk habis!');
        return;
    }

    const card = event.currentTarget;
    if (card) {
        card.classList.add('clicked');
        setTimeout(() => card.classList.remove('clicked'), 200);
    }

    const cartItem = cart.find(item => item.id === productId);
    if (cartItem) {
        if (cartItem.qty >= product.stock) {
            alert('Jumlah melebihi stok yang tersedia!');
            return;
        }
        cartItem.qty++;
    } else {
        cart.push({ id: product.id, name: product.name, price: product.price, qty: 1 });
    }

    renderCart();
    showToast(`${product.name} ditambahkan`);
}

function updateCartQty(productId, change) {
    const cartItem = cart.find(item => item.id === productId);
    const product = products.find(p => p.id === productId);
    if (!cartItem) return;

    const newQty = cartItem.qty + change;
    if (newQty > product.stock) {
        alert('Stok tidak mencukupi!');
        return;
    }

    if (newQty <= 0) {
        cart = cart.filter(item => item.id !== productId);
    } else {
        cartItem.qty = newQty;
    }
    renderCart();
}

function clearCart() {
    cart = [];
    renderCart();
}

function renderCart() {
    const container = document.getElementById('cart-items');
    if (!container) return;
    container.innerHTML = '';

    if (cart.length === 0) {
        container.innerHTML = `<div class="empty-cart">Keranjang masih kosong</div>`;
        calculateTotal();
        return;
    }

    cart.forEach(item => {
        const div = document.createElement('div');
        div.className = 'cart-item';
        div.innerHTML = `
            <div class="cart-item-details">
                <span class="cart-item-name">${item.name}</span>
                <span class="cart-item-price">${formatRupiah(item.price)} x ${item.qty}</span>
            </div>
            <div class="cart-item-controls">
                <button class="qty-btn" onclick="updateCartQty(${item.id}, -1)">-</button>
                <span>${item.qty}</span>
                <button class="qty-btn" onclick="updateCartQty(${item.id}, 1)">+</button>
            </div>
        `;
        container.appendChild(div);
    });

    calculateTotal();
}

function calculateTotal() {
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    const discInput = document.getElementById('discount-percent');
    const discountPercent = discInput ? parseFloat(discInput.value) || 0 : 0;
    const discountAmount = (subtotal * discountPercent) / 100;
    const grandTotal = subtotal - discountAmount;

    const subEl = document.getElementById('subtotal-price');
    const grandEl = document.getElementById('grand-total');
    if (subEl) subEl.innerText = formatRupiah(subtotal);
    if (grandEl) grandEl.innerText = formatRupiah(grandTotal);

    switchPaymentMethod();
}

// --- PEMBAYARAN ---
function switchPaymentMethod() {
    const method = document.getElementById('payment-method').value;
    const cashSection = document.getElementById('cash-payment-section');
    const payButton = document.getElementById('btn-pay');

    if (method === 'cash') {
        cashSection.style.display = 'block';
        calculateChange();
    } else {
        cashSection.style.display = 'none';
        if (cart.length > 0) {
            payButton.disabled = false;
        } else {
            payButton.disabled = true;
        }
    }
}

function calculateChange() {
    const method = document.getElementById('payment-method').value;
    if (method !== 'cash') return;

    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    const discountPercent = parseFloat(document.getElementById('discount-percent').value) || 0;
    const grandTotal = subtotal - ((subtotal * discountPercent) / 100);

    const cashGiven = parseFloat(document.getElementById('cash-given').value) || 0;
    const change = cashGiven - grandTotal;

    const changeElement = document.getElementById('change-amount');
    const payButton = document.getElementById('btn-pay');

    if (cashGiven >= grandTotal && cart.length > 0) {
        changeElement.innerText = formatRupiah(change);
        changeElement.style.color = 'var(--success)';
        payButton.disabled = false;
    } else {
        changeElement.innerText = formatRupiah(change < 0 ? 0 : change);
        changeElement.style.color = 'var(--text-main)';
        payButton.disabled = true;
    }
}

function processPayment() {
    if (cart.length === 0) return;

    const method = document.getElementById('payment-method').value;

    if (method === 'qris' || method === 'credit') {
        const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
        const discountPercent = parseFloat(document.getElementById('discount-percent').value) || 0;
        const grandTotal = subtotal - ((subtotal * discountPercent) / 100);

        document.getElementById('qris-title').innerText = method === 'qris' ? 'Scan QRIS Pembayaran' : 'Gesek Kartu (Credit/Debit)';
        document.getElementById('qris-total-amount').innerText = formatRupiah(grandTotal);
        document.getElementById('qris-modal').classList.add('active');
        return;
    }

    executeFinalTransaction('Cash');
}

function closeQrisModal() {
    document.getElementById('qris-modal').classList.remove('active');
}

function confirmQrisPayment() {
    const method = document.getElementById('payment-method').value;
    const methodName = method === 'qris' ? 'QRIS' : 'Credit Card';
    closeQrisModal();
    executeFinalTransaction(methodName);
}

function executeFinalTransaction(methodName) {
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    const discountPercent = parseFloat(document.getElementById('discount-percent').value) || 0;
    const discountAmount = (subtotal * discountPercent) / 100;
    const grandTotal = subtotal - discountAmount;
    
    let cashGiven = grandTotal;
    let change = 0;

    if (methodName === 'Cash') {
        cashGiven = parseFloat(document.getElementById('cash-given').value) || 0;
        change = cashGiven - grandTotal;
    }

    const trxId = 'TRX-' + Math.floor(100000 + Math.random() * 900000);
    const now = new Date();
    const timestamp = now.toISOString();
    const tableNumber = currentOrderType === 'Dine-In' ? document.getElementById('table-number').value : 'Takeaway';

    cart.forEach(cartItem => {
        const prod = products.find(p => p.id === cartItem.id);
        if (prod) prod.stock -= cartItem.qty;
    });
    localStorage.setItem('cafe_products', JSON.stringify(products));

    const transaction = {
        id: trxId,
        timestamp: timestamp,
        cashier: currentUser.name,
        orderType: currentOrderType,
        tableInfo: tableNumber,
        paymentMethod: methodName,
        items: [...cart],
        subtotal: subtotal,
        discountPercent: discountPercent,
        discountAmount: discountAmount,
        grandTotal: grandTotal,
        cashGiven: cashGiven,
        change: change
    };

    transactions.push(transaction);
    localStorage.setItem('cafe_transactions', JSON.stringify(transactions));

    prepareReceiptForPrint(transaction);
    window.print();

    cart = [];
    document.getElementById('discount-percent').value = 0;
    document.getElementById('cash-given').value = '';
    document.getElementById('payment-method').value = 'cash';
    switchPaymentMethod();
    renderCart();
    renderProducts();
}

function prepareReceiptForPrint(trx) {
    document.getElementById('receipt-trx-id').innerText = `ID: ${trx.id} (${trx.cashier})`;
    const dateObj = new Date(trx.timestamp);
    document.getElementById('receipt-time').innerText = dateObj.toLocaleString('id-ID');
    document.getElementById('receipt-order-info').innerText = `${trx.orderType} | ${trx.tableInfo}`;
    document.getElementById('receipt-pay-method').innerText = `Metode: ${trx.paymentMethod}`;

    const itemsList = document.getElementById('receipt-items-list');
    itemsList.innerHTML = '';
    trx.items.forEach(i => {
        itemsList.innerHTML += `
            <div>${i.name}</div>
            <div style="display: flex; justify-content: space-between;">
                <span>${i.qty} x ${formatRupiah(i.price)}</span>
                <span>${formatRupiah(i.price * i.qty)}</span>
            </div>
        `;
    });

    document.getElementById('r-subtotal').innerText = formatRupiah(trx.subtotal);
    document.getElementById('r-discount').innerText = `${formatRupiah(trx.discountAmount)} (${trx.discountPercent}%)`;
    document.getElementById('r-total').innerText = formatRupiah(trx.grandTotal);

    if (trx.paymentMethod === 'Cash') {
        document.getElementById('r-cash-row').style.display = 'flex';
        document.getElementById('r-change-row').style.display = 'flex';
        document.getElementById('r-cash').innerText = formatRupiah(trx.cashGiven);
        document.getElementById('r-change').innerText = formatRupiah(trx.change);
    } else {
        document.getElementById('r-cash-row').style.display = 'none';
        document.getElementById('r-change-row').style.display = 'none';
    }
}

// --- MANAJEMEN PRODUK ---
function renderProductTable() {
    const tbody = document.getElementById('product-table-body');
    if (!tbody) return;
    tbody.innerHTML = '';

    products.forEach(p => {
        const imgSrc = (p.image && p.image.trim() !== '') ? p.image : 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=300';
        tbody.innerHTML += `
            <tr>
                <td><img src="${imgSrc}" class="table-img" onerror="this.src='https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=300'"></td>
                <td><strong>${p.name}</strong></td>
                <td>${p.category}</td>
                <td>${formatRupiah(p.price)}</td>
                <td>${p.stock}</td>
                <td>
                    <button class="btn-secondary" style="padding: 4px 10px; font-size: 0.8rem; display: inline-flex; margin-right: 6px;" onclick="editProduct(${p.id})">Edit</button>
                    <button class="btn-danger" onclick="deleteProduct(${p.id})">Hapus</button>
                </td>
            </tr>
        `;
    });
}

function openProductModal(id = null) {
    document.getElementById('product-modal').classList.add('active');
    if (id) {
        document.getElementById('modal-title').innerText = 'Edit Produk';
        const p = products.find(prod => prod.id === id);
        document.getElementById('product-id').value = p.id;
        document.getElementById('form-name').value = p.name;
        document.getElementById('form-category').value = p.category;
        document.getElementById('form-price').value = p.price;
        document.getElementById('form-stock').value = p.stock;
        document.getElementById('form-image').value = p.image || '';
    } else {
        document.getElementById('modal-title').innerText = 'Tambah Produk Baru';
        document.getElementById('product-form').reset();
        document.getElementById('product-id').value = '';
    }
}

function closeProductModal() {
    document.getElementById('product-modal').classList.remove('active');
}

function saveProduct(e) {
    e.preventDefault();
    const id = document.getElementById('product-id').value;
    const name = document.getElementById('form-name').value;
    const category = document.getElementById('form-category').value;
    const price = parseFloat(document.getElementById('form-price').value);
    const stock = parseInt(document.getElementById('form-stock').value);
    const image = document.getElementById('form-image').value;

    if (id) {
        const p = products.find(prod => prod.id == id);
        p.name = name;
        p.category = category;
        p.price = price;
        p.stock = stock;
        p.image = image;
    } else {
        const newId = products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 1;
        products.push({ id: newId, name, category, price, stock, image });
    }

    localStorage.setItem('cafe_products', JSON.stringify(products));
    closeProductModal();
    renderProductTable();
    renderProducts();
}

function editProduct(id) {
    openProductModal(id);
}

function deleteProduct(id) {
    if (confirm('Yakin ingin menghapus produk ini?')) {
        products = products.filter(p => p.id !== id);
        localStorage.setItem('cafe_products', JSON.stringify(products));
        renderProductTable();
        renderProducts();
    }
}

// --- MANAJEMEN USER ---
function renderUserTable() {
    const tbody = document.getElementById('user-table-body');
    if (!tbody) return;
    tbody.innerHTML = '';

    users.forEach(u => {
        let roleBadge = u.role;
        if (u.role === 'superadmin') roleBadge = 'Super Admin (Owner)';
        else if (u.role === 'admin') roleBadge = 'Admin (Manager)';
        else roleBadge = 'Karyawan (Kasir)';

        tbody.innerHTML += `
            <tr>
                <td><strong>${u.name}</strong></td>
                <td>${u.username}</td>
                <td><span class="badge-role">${roleBadge}</span></td>
                <td>
                    <button class="btn-secondary" style="padding: 4px 10px; font-size: 0.8rem; display: inline-flex; margin-right: 6px;" onclick="editUser('${u.username}')">Edit</button>
                    ${u.username !== currentUser.username ? `<button class="btn-danger" onclick="deleteUser('${u.username}')">Hapus</button>` : ''}
                </td>
            </tr>
        `;
    });
}

function openUserModal(username = null) {
    document.getElementById('user-modal').classList.add('active');
    if (username) {
        document.getElementById('user-modal-title').innerText = 'Edit Akun Pengguna';
        const u = users.find(user => user.username === username);
        document.getElementById('user-edit-username').value = u.username;
        document.getElementById('form-user-name').value = u.name;
        document.getElementById('form-user-username').value = u.username;
        document.getElementById('form-user-password').value = u.password;
        document.getElementById('form-user-role').value = u.role;
    } else {
        document.getElementById('user-modal-title').innerText = 'Tambah Akun Baru';
        document.getElementById('user-form').reset();
        document.getElementById('user-edit-username').value = '';
    }
}

function closeUserModal() {
    document.getElementById('user-modal').classList.remove('active');
}

function saveUser(e) {
    e.preventDefault();
    const oldUsername = document.getElementById('user-edit-username').value;
    const name = document.getElementById('form-user-name').value;
    const username = document.getElementById('form-user-username').value.trim();
    const password = document.getElementById('form-user-password').value.trim();
    const role = document.getElementById('form-user-role').value;

    if (oldUsername) {
        const u = users.find(user => user.username === oldUsername);
        if (users.some(user => user.username === username && user.username !== oldUsername)) {
            alert('Username sudah digunakan!');
            return;
        }
        u.name = name;
        u.username = username;
        u.password = password;
        u.role = role;
    } else {
        if (users.some(user => user.username === username)) {
            alert('Username sudah terdaftar!');
            return;
        }
        users.push({ name, username, password, role });
    }

    localStorage.setItem('cafe_users', JSON.stringify(users));
    closeUserModal();
    renderUserTable();
}

function editUser(username) {
    openUserModal(username);
}

function deleteUser(username) {
    if (confirm(`Yakin ingin menghapus akun ${username}?`)) {
        users = users.filter(user => user.username !== username);
        localStorage.setItem('cafe_users', JSON.stringify(users));
        renderUserTable();
    }
}

// --- LAPORAN PENJUALAN HARIAN ---
function initReportDate() {
    const todayStr = new Date().toISOString().split('T')[0];
    const dateInput = document.getElementById('report-date');
    if (dateInput && !dateInput.value) {
        dateInput.value = todayStr;
    }
}

function renderReports() {
    const reportDateInput = document.getElementById('report-date');
    if (!reportDateInput) return;

    const selectedDate = reportDateInput.value;
    const tbody = document.getElementById('report-table-body');
    tbody.innerHTML = '';

    const filteredTrx = transactions.filter(t => t.timestamp.startsWith(selectedDate));

    let totalTrx = filteredTrx.length;
    let grossIncome = 0;
    let totalDiscount = 0;

    filteredTrx.forEach(t => {
        grossIncome += t.grandTotal;
        totalDiscount += t.discountAmount;

        const timeStr = new Date(t.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
        const itemsSummary = t.items.map(i => `${i.name} (${i.qty}x)`).join(', ');

        tbody.innerHTML += `
            <tr>
                <td><strong>${t.id}</strong><br><small style="color:var(--text-muted)">${t.orderType || 'Dine-In'} (${t.tableInfo || '-'})</small></td>
                <td>${timeStr}</td>
                <td><span class="badge-role" style="background:#e0f2fe; color:#0369a1;">${t.paymentMethod || 'Cash'}</span></td>
                <td style="max-width: 200px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${itemsSummary}">${itemsSummary}</td>
                <td><strong>${formatRupiah(t.grandTotal)}</strong></td>
                <td>
                    <button class="btn-danger" style="padding: 4px 8px; font-size: 0.75rem;" onclick="deleteTransaction('${t.id}')">Batalkan</button>
                </td>
            </tr>
        `;
    });

    if (filteredTrx.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-muted);">Tidak ada transaksi pada tanggal ini</td></tr>`;
    }

    document.getElementById('stat-total-trx').innerText = totalTrx;
    document.getElementById('stat-gross-income').innerText = formatRupiah(grossIncome);
    document.getElementById('stat-total-discount').innerText = formatRupiah(totalDiscount);
}

function resetTodayReport() {
    const selectedDate = document.getElementById('report-date').value;
    if (confirm(`Yakin ingin mereset/menghapus seluruh laporan transaksi pada tanggal ${selectedDate}?`)) {
        transactions = transactions.filter(t => !t.timestamp.startsWith(selectedDate));
        localStorage.setItem('cafe_transactions', JSON.stringify(transactions));
        renderReports();
    }
}

function deleteTransaction(trxId) {
    if (confirm(`Batalkan transaksi ${trxId}?`)) {
        transactions = transactions.filter(t => t.id !== trxId);
        localStorage.setItem('cafe_transactions', JSON.stringify(transactions));
        renderReports();
    }
}
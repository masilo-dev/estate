// Admin Dashboard JavaScript
// Syncs with authentication system and displays all system data

// Helper function to escape HTML to prevent XSS
function escapeHtml(unsafe) {
    if (typeof unsafe !== 'string') return unsafe;
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Check authentication on page load
document.addEventListener('DOMContentLoaded', function() {
    if (!authService.isAuthenticated()) {
        alert('Please login to access the dashboard');
        window.location.href = 'index.html';
        return;
    }

    const user = authService.getCurrentUser();
    if (user.role !== 'admin') {
        alert('Access denied. This is the admin dashboard.');
        window.location.href = 'index.html';
        return;
    }

    // Set user name in header
    document.getElementById('dashboard-user-name').textContent = user.name;

    // Load dashboard data with counts
    loadStats();
    loadOverview();
    loadAllBookings();
    loadAllPayments();
    loadProperties();
    loadUsers();
    
    // Update counts
    updateCounts();
});

// Listen for auth state changes
window.addEventListener('authStateChange', function(e) {
    if (e.detail.action === 'logout') {
        window.location.href = 'index.html';
    }
});

function switchTab(tabName) {
    // Remove active class from all tabs
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });

    // Add active class to selected tab
    event.target.classList.add('active');
    document.getElementById(`${tabName}-tab`).classList.add('active');
}

function updateCounts() {
    const bookings = getBookings();
    const payments = getPayments();
    const users = authService.getUsers();
    
    document.getElementById('bookings-count').textContent = bookings.length;
    document.getElementById('payments-count').textContent = payments.length;
    document.getElementById('users-count').textContent = users.length;
}

function loadStats() {
    const bookings = getBookings();
    const payments = getPayments();
    const properties = getProperties();

    // Total bookings
    document.getElementById('total-bookings').textContent = bookings.length;

    // Total revenue
    const totalRevenue = payments.reduce((sum, payment) => sum + payment.amount, 0);
    document.getElementById('total-revenue').textContent = `$${totalRevenue}`;

    // Total properties
    document.getElementById('total-properties').textContent = properties.length;

    // Pending payments
    const pendingBookings = bookings.filter(b => b.status === 'pending').length;
    document.getElementById('pending-payments').textContent = pendingBookings;
}

function loadOverview() {
    // Load recent bookings (last 5)
    const bookings = getBookings().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5);
    const recentBookings = document.getElementById('recent-bookings');

    if (bookings.length === 0) {
        recentBookings.innerHTML = `
            <div class="text-center py-8 text-gray-400">
                <i class="fas fa-inbox text-4xl mb-2 opacity-30"></i>
                <p class="text-sm">No recent bookings</p>
            </div>
        `;
    } else {
        recentBookings.innerHTML = '';
        bookings.forEach((booking, index) => {
            const item = document.createElement('div');
            item.className = 'flex items-center gap-3 p-3 bg-white rounded-lg hover:shadow-md transition-all';
            item.style.animationDelay = `${index * 0.05}s`;
            item.classList.add('animate-slide-in');
            
            const statusIcon = booking.status === 'confirmed' ? 'check-circle' : 'clock';
            const statusColor = booking.status === 'confirmed' ? 'green' : 'yellow';
            
            item.innerHTML = `
                <div class="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <i class="fas fa-home text-blue-600"></i>
                </div>
                <div class="flex-1 min-w-0">
                    <p class="font-semibold text-gray-800 truncate">${escapeHtml(booking.propertyName)}</p>
                    <p class="text-xs text-gray-500">${escapeHtml(booking.userName)} • $${escapeHtml(booking.price)}</p>
                </div>
                <div class="flex-shrink-0">
                    <i class="fas fa-${statusIcon} text-${statusColor}-600"></i>
                </div>
            `;
            recentBookings.appendChild(item);
        });
    }

    // Load recent payments (last 5)
    const payments = getPayments().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5);
    const recentPayments = document.getElementById('recent-payments');

    if (payments.length === 0) {
        recentPayments.innerHTML = `
            <div class="text-center py-8 text-gray-400">
                <i class="fas fa-wallet text-4xl mb-2 opacity-30"></i>
                <p class="text-sm">No recent payments</p>
            </div>
        `;
    } else {
        recentPayments.innerHTML = '';
        payments.forEach((payment, index) => {
            const item = document.createElement('div');
            item.className = 'flex items-center gap-3 p-3 bg-white rounded-lg hover:shadow-md transition-all';
            item.style.animationDelay = `${index * 0.05}s`;
            item.classList.add('animate-slide-in');
            item.innerHTML = `
                <div class="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <i class="fas fa-dollar-sign text-green-600"></i>
                </div>
                <div class="flex-1 min-w-0">
                    <p class="font-semibold text-gray-800 truncate">${escapeHtml(payment.propertyName)}</p>
                    <p class="text-xs text-gray-500">•••• ${escapeHtml(payment.cardLast4 || '****')}</p>
                </div>
                <div class="flex-shrink-0">
                    <p class="font-bold text-green-600">$${escapeHtml(payment.amount)}</p>
                </div>
            `;
            recentPayments.appendChild(item);
        });
    }
}

function loadAllBookings() {
    const bookings = getBookings().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const bookingsList = document.getElementById('all-bookings-list');

    if (bookings.length === 0) {
        bookingsList.innerHTML = '<p class="text-gray-500">No bookings yet.</p>';
        return;
    }

    bookingsList.innerHTML = '';
    bookings.forEach(booking => {
        const card = document.createElement('div');
        card.className = 'border rounded-lg p-4 bg-gray-50';
        
        const statusColor = booking.status === 'confirmed' ? 'green' : 
                           booking.status === 'pending' ? 'yellow' : 'red';
        
        card.innerHTML = `
            <div class="flex justify-between items-start">
                <div>
                    <h3 class="text-lg font-semibold">${escapeHtml(booking.propertyName)}</h3>
                    <p class="text-gray-600">Booking ID: #${escapeHtml(booking.id)}</p>
                    <p class="text-gray-600">Customer: ${escapeHtml(booking.userName)} (${escapeHtml(booking.userEmail)})</p>
                    <p class="text-gray-600">Amount: $${escapeHtml(booking.price)}</p>
                    <p class="text-sm text-gray-500">Created: ${escapeHtml(new Date(booking.createdAt).toLocaleDateString())}</p>
                    ${booking.paidAt ? `<p class="text-sm text-gray-500">Paid: ${escapeHtml(new Date(booking.paidAt).toLocaleDateString())}</p>` : ''}
                </div>
                <div>
                    <span class="px-3 py-1 rounded-full text-sm bg-${statusColor}-100 text-${statusColor}-800">
                        ${escapeHtml(booking.status.charAt(0).toUpperCase() + booking.status.slice(1))}
                    </span>
                </div>
            </div>
        `;
        bookingsList.appendChild(card);
    });
}

function loadAllPayments() {
    const payments = getPayments().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const paymentsList = document.getElementById('all-payments-list');

    if (payments.length === 0) {
        paymentsList.innerHTML = '<p class="text-gray-500">No payments yet.</p>';
        return;
    }

    paymentsList.innerHTML = '';
    payments.forEach(payment => {
        const card = document.createElement('div');
        card.className = 'border rounded-lg p-4 bg-gray-50';
        
        card.innerHTML = `
            <div class="flex justify-between items-start">
                <div>
                    <h3 class="text-lg font-semibold">${escapeHtml(payment.propertyName)}</h3>
                    <p class="text-gray-600">Payment ID: #${escapeHtml(payment.id)}</p>
                    <p class="text-gray-600">Booking ID: #${escapeHtml(payment.bookingId)}</p>
                    <p class="text-gray-600">Card: **** **** **** ${escapeHtml(payment.cardLast4)}</p>
                    <p class="text-sm text-gray-500">Date: ${escapeHtml(new Date(payment.createdAt).toLocaleDateString())}</p>
                </div>
                <div class="text-right">
                    <p class="text-xl font-bold text-green-600">$${escapeHtml(payment.amount)}</p>
                    <span class="px-3 py-1 rounded-full text-sm bg-green-100 text-green-800">
                        ${escapeHtml(payment.status)}
                    </span>
                </div>
            </div>
        `;
        paymentsList.appendChild(card);
    });
}

function loadProperties() {
    const properties = getProperties();
    const propertiesList = document.getElementById('properties-list');

    propertiesList.innerHTML = '';
    properties.forEach(property => {
        const card = document.createElement('div');
        card.className = 'border rounded-lg p-4 bg-white';
        
        card.innerHTML = `
            <img src="${escapeHtml(property.image)}" alt="${escapeHtml(property.name)}" class="w-full h-32 object-cover rounded-lg mb-3">
            <h3 class="font-semibold text-lg">${escapeHtml(property.name)}</h3>
            <p class="text-sm text-gray-500">${escapeHtml(property.location)}</p>
            <p class="text-gray-600 text-sm mt-2">${escapeHtml(property.description)}</p>
            <p class="text-lg font-bold text-blue-600 mt-2">$${escapeHtml(property.price)}/night</p>
            <div class="mt-3 flex gap-2">
                <button class="flex-1 bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600">Edit</button>
                <button class="flex-1 bg-gray-500 text-white px-3 py-1 rounded text-sm hover:bg-gray-600">Disable</button>
            </div>
        `;
        propertiesList.appendChild(card);
    });
}

function loadUsers() {
    const users = authService.getUsers();
    const usersList = document.getElementById('users-list');

    if (users.length === 0) {
        usersList.innerHTML = '<p class="text-gray-500">No registered users yet.</p>';
        return;
    }

    usersList.innerHTML = '';
    users.forEach(user => {
        const card = document.createElement('div');
        card.className = 'border rounded-lg p-4 bg-gray-50 flex justify-between items-center';
        
        const roleColor = user.role === 'admin' ? 'purple' : 'blue';
        
        card.innerHTML = `
            <div>
                <h3 class="text-lg font-semibold">${escapeHtml(user.name)}</h3>
                <p class="text-gray-600">${escapeHtml(user.email)}</p>
                <p class="text-sm text-gray-500">Joined: ${escapeHtml(new Date(user.createdAt).toLocaleDateString())}</p>
            </div>
            <div>
                <span class="px-3 py-1 rounded-full text-sm bg-${roleColor}-100 text-${roleColor}-800">
                    ${escapeHtml(user.role.charAt(0).toUpperCase() + user.role.slice(1))}
                </span>
            </div>
        `;
        usersList.appendChild(card);
    });
}

function getPayments() {
    const payments = localStorage.getItem('estate_payments');
    return payments ? JSON.parse(payments) : [];
}

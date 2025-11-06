// Client Dashboard JavaScript
// Syncs with authentication system and displays user-specific data

let currentBookingId = null;

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
    if (user.role !== 'client') {
        alert('Access denied. This is the client dashboard.');
        window.location.href = 'index.html';
        return;
    }

    // Set user name in header
    document.getElementById('dashboard-user-name').textContent = user.name;

    // Load dashboard data with stats
    loadStats();
    loadBookings();
    loadPayments();
    loadProfile();
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

function loadStats() {
    const user = authService.getCurrentUser();
    const bookings = getBookings().filter(b => b.userId === user.id);
    const payments = getPayments().filter(p => p.userId === user.id);
    
    // Total bookings
    document.getElementById('total-bookings-count').textContent = bookings.length;
    
    // Total spent
    const totalSpent = payments.reduce((sum, p) => sum + p.amount, 0);
    document.getElementById('total-spent').textContent = `$${totalSpent}`;
    
    // Pending bookings
    const pendingCount = bookings.filter(b => b.status === 'pending').length;
    document.getElementById('pending-bookings-count').textContent = pendingCount;
}

function loadBookings() {
    const user = authService.getCurrentUser();
    const bookings = getBookings().filter(b => b.userId === user.id).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const bookingsList = document.getElementById('bookings-list');

    if (bookings.length === 0) {
        bookingsList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-calendar-times"></i>
                <h3 class="text-xl font-semibold text-gray-600 mb-2">No bookings yet</h3>
                <p class="text-gray-500 mb-4">Start your journey by booking your perfect vacation home</p>
                <a href="index.html#properties" class="inline-block bg-blue-600 text-white px-6 py-3 rounded-full hover:bg-blue-700 transition-all shadow-lg">
                    <i class="fas fa-search mr-2"></i>Browse Properties
                </a>
            </div>
        `;
        return;
    }

    bookingsList.innerHTML = '';
    bookings.forEach((booking, index) => {
        const card = document.createElement('div');
        card.className = `booking-card ${booking.status} bg-white rounded-xl p-6 shadow-md hover:shadow-xl transition-all`;
        card.style.animationDelay = `${index * 0.1}s`;
        card.classList.add('animate-slide-in');
        
        const statusConfig = {
            'confirmed': { color: 'green', icon: 'check-circle', text: 'Confirmed' },
            'pending': { color: 'yellow', icon: 'clock', text: 'Pending Payment' },
            'cancelled': { color: 'red', icon: 'times-circle', text: 'Cancelled' }
        };
        
        const status = statusConfig[booking.status] || statusConfig.pending;
        
        card.innerHTML = `
            <div class="flex justify-between items-start">
                <div class="flex-1">
                    <div class="flex items-start gap-4 mb-4">
                        <div class="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white text-2xl flex-shrink-0">
                            <i class="fas fa-home"></i>
                        </div>
                        <div>
                            <h3 class="text-xl font-bold text-gray-800 mb-1">${escapeHtml(booking.propertyName)}</h3>
                            <p class="text-sm text-gray-500">Booking #${escapeHtml(booking.id)}</p>
                        </div>
                    </div>
                    <div class="grid grid-cols-2 gap-4 mt-4">
                        <div>
                            <p class="text-xs text-gray-500 uppercase tracking-wide mb-1">Amount</p>
                            <p class="text-2xl font-bold text-blue-600">$${escapeHtml(booking.price)}</p>
                        </div>
                        <div>
                            <p class="text-xs text-gray-500 uppercase tracking-wide mb-1">Booked On</p>
                            <p class="text-sm font-semibold text-gray-700">${escapeHtml(new Date(booking.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }))}</p>
                        </div>
                    </div>
                </div>
                <div class="text-right flex flex-col items-end gap-3">
                    <span class="payment-badge bg-${status.color}-100 text-${status.color}-800">
                        <i class="fas fa-${status.icon}"></i>
                        ${status.text}
                    </span>
                    ${booking.status === 'pending' ? 
                        `<button onclick="showPaymentModal(${booking.id})" class="bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-3 rounded-full hover:from-green-600 hover:to-green-700 transition-all shadow-lg hover:shadow-xl font-medium">
                            <i class="fas fa-credit-card mr-2"></i>Pay Now
                        </button>` : 
                        booking.paidAt ? `<p class="text-xs text-gray-500">Paid ${escapeHtml(new Date(booking.paidAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }))}</p>` : ''}
                </div>
            </div>
        `;
        bookingsList.appendChild(card);
    });
}

function loadPayments() {
    const user = authService.getCurrentUser();
    const payments = getPayments().filter(p => p.userId === user.id).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const paymentsList = document.getElementById('payments-list');

    if (payments.length === 0) {
        paymentsList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-receipt"></i>
                <h3 class="text-xl font-semibold text-gray-600 mb-2">No payment history</h3>
                <p class="text-gray-500">Your completed payments will appear here</p>
            </div>
        `;
        return;
    }

    paymentsList.innerHTML = '';
    payments.forEach((payment, index) => {
        const card = document.createElement('div');
        card.className = 'bg-white rounded-xl p-6 shadow-md hover:shadow-xl transition-all animate-slide-in';
        card.style.animationDelay = `${index * 0.1}s`;
        
        card.innerHTML = `
            <div class="flex justify-between items-start">
                <div class="flex-1">
                    <div class="flex items-start gap-4 mb-4">
                        <div class="w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center text-white text-xl">
                            <i class="fas fa-check-circle"></i>
                        </div>
                        <div>
                            <h3 class="text-lg font-bold text-gray-800 mb-1">${escapeHtml(payment.propertyName)}</h3>
                            <p class="text-sm text-gray-500">Payment #${escapeHtml(payment.id)}</p>
                            <p class="text-xs text-gray-400 mt-1">Booking #${escapeHtml(payment.bookingId)}</p>
                        </div>
                    </div>
                    <div class="flex items-center gap-4 mt-4">
                        <div class="flex items-center gap-2 text-sm text-gray-600">
                            <i class="fas fa-credit-card text-blue-600"></i>
                            <span>•••• ${escapeHtml(payment.cardLast4 || '****')}</span>
                        </div>
                        <div class="flex items-center gap-2 text-sm text-gray-600">
                            <i class="fas fa-calendar text-blue-600"></i>
                            <span>${escapeHtml(new Date(payment.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }))}</span>
                        </div>
                    </div>
                </div>
                <div class="text-right">
                    <p class="text-3xl font-bold text-green-600 mb-2">$${escapeHtml(payment.amount)}</p>
                    <span class="payment-badge bg-green-100 text-green-800">
                        <i class="fas fa-check"></i>
                        Completed
                    </span>
                </div>
            </div>
        `;
        paymentsList.appendChild(card);
    });
}

function loadProfile() {
    const user = authService.getCurrentUser();
    const bookings = getBookings().filter(b => b.userId === user.id);
    const payments = getPayments().filter(p => p.userId === user.id);
    const profileInfo = document.getElementById('profile-info');

    const initials = user.name.split(' ').map(n => n[0]).join('').toUpperCase();

    profileInfo.innerHTML = `
        <div class="text-center mb-8">
            <div class="profile-avatar">
                ${escapeHtml(initials)}
            </div>
            <h3 class="text-2xl font-bold text-gray-800 mb-1">${escapeHtml(user.name)}</h3>
            <p class="text-gray-600">${escapeHtml(user.email)}</p>
            <div class="mt-4">
                <span class="payment-badge bg-green-100 text-green-800">
                    <i class="fas fa-check-circle"></i>
                    Active Account
                </span>
            </div>
        </div>
        
        <div class="grid grid-cols-2 gap-4 mb-8">
            <div class="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-6 text-center">
                <p class="text-3xl font-bold text-blue-600 mb-2">${bookings.length}</p>
                <p class="text-sm text-gray-600">Total Bookings</p>
            </div>
            <div class="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 text-center">
                <p class="text-3xl font-bold text-green-600 mb-2">${payments.length}</p>
                <p class="text-sm text-gray-600">Payments Made</p>
            </div>
        </div>
        
        <div class="space-y-4">
            <div class="bg-gray-50 rounded-xl p-4 border-2 border-gray-100">
                <label class="block text-gray-600 font-semibold mb-2 text-sm uppercase tracking-wide">
                    <i class="fas fa-user mr-2 text-blue-600"></i>Full Name
                </label>
                <p class="text-gray-800 font-medium">${escapeHtml(user.name)}</p>
            </div>
            <div class="bg-gray-50 rounded-xl p-4 border-2 border-gray-100">
                <label class="block text-gray-600 font-semibold mb-2 text-sm uppercase tracking-wide">
                    <i class="fas fa-envelope mr-2 text-blue-600"></i>Email Address
                </label>
                <p class="text-gray-800 font-medium">${escapeHtml(user.email)}</p>
            </div>
            <div class="bg-gray-50 rounded-xl p-4 border-2 border-gray-100">
                <label class="block text-gray-600 font-semibold mb-2 text-sm uppercase tracking-wide">
                    <i class="fas fa-user-tag mr-2 text-blue-600"></i>Account Type
                </label>
                <p class="text-gray-800 font-medium">Client (Property Renter)</p>
            </div>
            <div class="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border-2 border-green-200">
                <label class="block text-gray-600 font-semibold mb-2 text-sm uppercase tracking-wide">
                    <i class="fas fa-shield-alt mr-2 text-green-600"></i>Account Status
                </label>
                <p class="text-green-700 font-bold">Active & Verified</p>
            </div>
        </div>
    `;
}

function showPaymentModal(bookingId) {
    currentBookingId = bookingId;
    const bookings = getBookings();
    const booking = bookings.find(b => b.id === bookingId);

    if (!booking) {
        alert('Booking not found');
        return;
    }

    const paymentDetails = document.getElementById('payment-details');
    paymentDetails.innerHTML = `
        <div class="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-xl border-2 border-blue-200">
            <div class="flex items-start gap-4">
                <div class="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white text-xl">
                    <i class="fas fa-home"></i>
                </div>
                <div class="flex-1">
                    <h3 class="font-bold text-xl text-gray-800 mb-1">${escapeHtml(booking.propertyName)}</h3>
                    <p class="text-sm text-gray-600 mb-3">Booking #${escapeHtml(booking.id)}</p>
                    <div class="flex items-center gap-2">
                        <span class="text-sm text-gray-600">Total Amount:</span>
                        <span class="text-3xl font-bold text-blue-600">$${escapeHtml(booking.price)}</span>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.getElementById('paymentModal').style.display = 'flex';
    document.getElementById('paymentModal').style.alignItems = 'center';
    document.getElementById('paymentModal').style.justifyContent = 'center';
}

function closePaymentModal() {
    document.getElementById('paymentModal').style.display = 'none';
    currentBookingId = null;
}

async function handlePayment(event) {
    event.preventDefault();

    const cardNumber = document.getElementById('card-number').value;
    const cardExpiry = document.getElementById('card-expiry').value;
    const cardCvv = document.getElementById('card-cvv').value;

    // Simulate payment processing
    if (!currentBookingId) {
        alert('No booking selected');
        return;
    }

    // In production, this would call a payment gateway API (Stripe, PayPal, etc.)
    await simulatePaymentProcessing();

    const bookings = getBookings();
    const booking = bookings.find(b => b.id === currentBookingId);
    
    if (booking) {
        // Update booking status
        booking.status = 'confirmed';
        booking.paidAt = new Date().toISOString();
        localStorage.setItem('estate_bookings', JSON.stringify(bookings));

        // Create payment record
        const payment = {
            id: Date.now(),
            bookingId: booking.id,
            userId: booking.userId,
            propertyName: booking.propertyName,
            amount: booking.price,
            status: 'completed',
            cardLast4: cardNumber.slice(-4),
            createdAt: new Date().toISOString()
        };

        const payments = getPayments();
        payments.push(payment);
        localStorage.setItem('estate_payments', JSON.stringify(payments));

        closePaymentModal();
        alert('Payment successful! Your booking is confirmed.');
        
        // Reload data
        loadBookings();
        loadPayments();
    }
}

function simulatePaymentProcessing() {
    return new Promise(resolve => setTimeout(resolve, 1000));
}

function getPayments() {
    const payments = localStorage.getItem('estate_payments');
    return payments ? JSON.parse(payments) : [];
}

// Close modal when clicking outside
window.onclick = function(event) {
    if (event.target.id === 'paymentModal') {
        closePaymentModal();
    }
}

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
    document.getElementById('dashboard-user-name').textContent = `Welcome, ${user.name}`;

    // Load dashboard data
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

function loadBookings() {
    const user = authService.getCurrentUser();
    const bookings = getBookings().filter(b => b.userId === user.id);
    const bookingsList = document.getElementById('bookings-list');

    if (bookings.length === 0) {
        bookingsList.innerHTML = '<p class="text-gray-500">No bookings yet. <a href="index.html" class="text-blue-600 hover:underline">Browse properties</a> to make your first booking!</p>';
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
                    <h3 class="text-lg font-semibold">${booking.propertyName}</h3>
                    <p class="text-gray-600">Booking ID: #${booking.id}</p>
                    <p class="text-gray-600">Amount: $${booking.price}</p>
                    <p class="text-sm text-gray-500">Created: ${new Date(booking.createdAt).toLocaleDateString()}</p>
                </div>
                <div class="text-right">
                    <span class="px-3 py-1 rounded-full text-sm bg-${statusColor}-100 text-${statusColor}-800">
                        ${booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                    </span>
                    ${booking.status === 'pending' ? 
                        `<button onclick="showPaymentModal(${booking.id})" class="mt-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 block">Pay Now</button>` : 
                        ''}
                </div>
            </div>
        `;
        bookingsList.appendChild(card);
    });
}

function loadPayments() {
    const user = authService.getCurrentUser();
    const payments = getPayments().filter(p => p.userId === user.id);
    const paymentsList = document.getElementById('payments-list');

    if (payments.length === 0) {
        paymentsList.innerHTML = '<p class="text-gray-500">No payment history yet.</p>';
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

function loadProfile() {
    const user = authService.getCurrentUser();
    const profileInfo = document.getElementById('profile-info');

    profileInfo.innerHTML = `
        <div class="space-y-4">
            <div>
                <label class="block text-gray-700 font-semibold mb-2">Full Name</label>
                <p class="px-4 py-2 bg-gray-50 border rounded">${user.name}</p>
            </div>
            <div>
                <label class="block text-gray-700 font-semibold mb-2">Email</label>
                <p class="px-4 py-2 bg-gray-50 border rounded">${user.email}</p>
            </div>
            <div>
                <label class="block text-gray-700 font-semibold mb-2">User Type</label>
                <p class="px-4 py-2 bg-gray-50 border rounded">Client (Renter)</p>
            </div>
            <div>
                <label class="block text-gray-700 font-semibold mb-2">Account Status</label>
                <p class="px-4 py-2 bg-green-50 border border-green-200 rounded text-green-800">Active</p>
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
        <div class="bg-blue-50 p-4 rounded-lg mb-4">
            <h3 class="font-semibold text-lg">${booking.propertyName}</h3>
            <p class="text-gray-600">Booking ID: #${booking.id}</p>
            <p class="text-2xl font-bold text-blue-600 mt-2">Total: $${booking.price}</p>
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

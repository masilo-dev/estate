// Properties data and management

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

const properties = [
    {
        id: 1,
        name: "Cozy Beach Cottage",
        image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c",
        description: "Charming cottage steps from the beach, perfect for a relaxing getaway.",
        price: 150,
        location: "Miami Beach, FL"
    },
    {
        id: 2,
        name: "Mountain View Cabin",
        image: "https://images.unsplash.com/photo-1570129477492-45c003edd2be",
        description: "Rustic cabin with stunning mountain views, ideal for nature lovers.",
        price: 200,
        location: "Aspen, CO"
    },
    {
        id: 3,
        name: "Urban Loft",
        image: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2",
        description: "Modern loft in the heart of the city, close to all attractions.",
        price: 180,
        location: "New York, NY"
    },
    {
        id: 4,
        name: "Lake House Retreat",
        image: "https://images.unsplash.com/photo-1499696010180-025ef6e1a8f9",
        description: "Peaceful lakeside house with private dock and amazing sunsets.",
        price: 220,
        location: "Lake Tahoe, CA"
    },
    {
        id: 5,
        name: "Desert Villa",
        image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750",
        description: "Luxurious villa with pool and desert landscape views.",
        price: 300,
        location: "Scottsdale, AZ"
    },
    {
        id: 6,
        name: "Coastal Bungalow",
        image: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688",
        description: "Charming bungalow with ocean views and beach access.",
        price: 175,
        location: "Malibu, CA"
    }
];

// Initialize properties list on page load
document.addEventListener('DOMContentLoaded', function() {
    const propertyList = document.getElementById('property-list');
    if (propertyList) {
        loadProperties();
    }
});

function loadProperties() {
    const propertyList = document.getElementById('property-list');
    propertyList.innerHTML = '';
    
    properties.forEach(property => {
        const card = document.createElement('div');
        card.className = 'property-card bg-white rounded-lg shadow-lg p-4';
        card.innerHTML = `
            <img src="${escapeHtml(property.image)}" alt="${escapeHtml(property.name)}" class="w-full h-48 object-cover rounded-t-lg">
            <h3 class="text-xl font-semibold mt-4">${escapeHtml(property.name)}</h3>
            <p class="text-sm text-gray-500 mt-1">${escapeHtml(property.location)}</p>
            <p class="text-gray-600 mt-2">${escapeHtml(property.description)}</p>
            <p class="text-lg font-bold mt-2 text-blue-600">$${escapeHtml(property.price)}/night</p>
            <button class="mt-4 w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600" 
                    onclick="bookProperty(${property.id})">Book Now</button>
        `;
        propertyList.appendChild(card);
    });
}

function bookProperty(propertyId) {
    if (!authService.isAuthenticated()) {
        alert('Please login to book a property');
        showLogin();
        return;
    }

    const property = properties.find(p => p.id === propertyId);
    if (!property) {
        alert('Property not found');
        return;
    }

    // Navigate to booking page or show booking modal
    const user = authService.getCurrentUser();
    
    // Create booking
    const booking = {
        id: Date.now(),
        propertyId: property.id,
        propertyName: property.name,
        userId: user.id,
        userName: user.name,
        userEmail: user.email,
        price: property.price,
        status: 'pending',
        createdAt: new Date().toISOString()
    };

    // Save booking
    const bookings = getBookings();
    bookings.push(booking);
    localStorage.setItem('estate_bookings', JSON.stringify(bookings));

    alert(`Booking request created for ${property.name}! Check your dashboard to complete payment.`);
    showDashboard();
}

function getBookings() {
    const bookings = localStorage.getItem('estate_bookings');
    return bookings ? JSON.parse(bookings) : [];
}

function getProperties() {
    return properties;
}

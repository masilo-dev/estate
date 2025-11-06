# Estate Rentals - Authentication & Dashboard System

## Overview
This is a comprehensive vacation rental platform with full authentication and synchronized dashboards for clients and administrators.

## Features

### Authentication System
- **User Registration & Login**: Secure authentication with JWT-like token management
- **Role-Based Access Control**: Separate dashboards for clients and admins
- **Session Persistence**: Authentication state synced across browser tabs and sessions
- **Auto-Logout on Token Expiry**: 24-hour session tokens with automatic expiration
- **Cross-Tab Synchronization**: Authentication state syncs in real-time across multiple tabs

### Client Dashboard
- **My Bookings**: View all property bookings with status tracking
- **Payment Management**: Complete payments for pending bookings
- **Payment History**: View all completed payment transactions
- **Profile Management**: View and manage user profile information

### Admin Dashboard
- **Overview Statistics**: Real-time stats for bookings, revenue, properties, and pending payments
- **Booking Management**: View and manage all customer bookings
- **Payment Tracking**: Monitor all payment transactions
- **Property Management**: Manage property listings
- **User Management**: View all registered users and their roles

### Payment Integration
- **Payment Processing**: Integrated payment interface (Stripe-ready)
- **Booking Confirmation**: Automatic booking confirmation upon successful payment
- **Payment History**: Complete transaction records for both clients and admins

## Authentication Flow

1. **Registration**:
   - User signs up with name, email, password, and role (client/admin)
   - Password is hashed before storage
   - JWT-like token is generated and stored
   - User is automatically logged in

2. **Login**:
   - User credentials are validated
   - JWT-like token is generated with 24-hour expiry
   - Session is stored in localStorage for persistence
   - Authentication state is synced across all open tabs

3. **Session Management**:
   - Token is verified on each dashboard access
   - Expired tokens trigger automatic logout
   - Storage events ensure sync across tabs/windows

4. **Logout**:
   - All session data is cleared
   - Authentication state is broadcast to all tabs
   - User is redirected to home page

## Dashboard Synchronization

The system ensures perfect synchronization across all components:

- **Authentication State**: Real-time sync using localStorage and storage events
- **Booking Data**: Shared booking information between client and admin dashboards
- **Payment Records**: Synchronized payment history across all views
- **User Sessions**: Cross-tab session management ensures consistent state

## File Structure

```
estate/
├── index.html                  # Main landing page with auth modals
├── client-dashboard.html       # Client dashboard for renters
├── admin-dashboard.html        # Admin dashboard for property managers
├── js/
│   ├── auth.js                # Authentication service with JWT-like tokens
│   ├── properties.js          # Property data and booking management
│   ├── client-dashboard.js    # Client dashboard logic
│   └── admin-dashboard.js     # Admin dashboard logic
└── README.md                  # This file
```

## Usage

### For Clients (Renters):
1. Visit the main page and click "Sign Up"
2. Register with role "Client (Renter)"
3. Browse properties and click "Book Now"
4. Access your dashboard to view bookings
5. Complete payment for pending bookings
6. View payment history in the Payments tab

### For Admins (Property Managers):
1. Visit the main page and click "Sign Up"
2. Register with role "Admin (Property Manager)"
3. Access admin dashboard to view all system data
4. Monitor bookings, payments, properties, and users
5. View real-time statistics on the Overview tab

## Security Features

- **Password Hashing**: All passwords are hashed before storage
- **Token-Based Authentication**: JWT-like tokens with expiration
- **Role-Based Access Control**: Separate access levels for clients and admins
- **Session Expiry**: 24-hour automatic session timeout
- **CSRF Protection**: Token verification on all authenticated requests
- **Cross-Tab Security**: Automatic logout propagation across all tabs

## Technical Implementation

### Authentication Service (`auth.js`)
- Implements singleton pattern for consistent state management
- Uses localStorage for session persistence
- Broadcasts authentication events using CustomEvent API
- Listens for storage events to sync across tabs
- Generates and verifies JWT-like tokens

### Data Storage
All data is currently stored in localStorage:
- `estate_users`: User accounts
- `estate_user`: Current user session
- `estate_token`: Authentication token
- `estate_bookings`: All booking records
- `estate_payments`: All payment records

**Note**: In production, this should be replaced with a proper backend API and database.

## Payment Integration

The current implementation includes a payment interface that simulates payment processing. To integrate with a real payment gateway:

1. Replace the `handlePayment()` function in `client-dashboard.js`
2. Add Stripe.js or PayPal SDK
3. Update payment processing to call the payment gateway API
4. Handle webhooks for payment confirmation
5. Update backend to securely process payments

Example Stripe Integration:
```javascript
// Add Stripe.js to your HTML
<script src="https://js.stripe.com/v3/"></script>

// Initialize Stripe
const stripe = Stripe('your_publishable_key');

// Update handlePayment function
async function handlePayment(event) {
    event.preventDefault();
    const {token} = await stripe.createToken(cardElement);
    // Send token to your backend
}
```

## Future Enhancements

- Backend API with Node.js/Express or similar
- Database integration (MongoDB, PostgreSQL)
- Real payment gateway integration (Stripe, PayPal)
- Email notifications for bookings and payments
- Property search and filtering
- Booking calendar with date selection
- Reviews and ratings system
- File upload for property images
- Two-factor authentication
- Password reset functionality

## Browser Compatibility

This application works in all modern browsers that support:
- ES6 JavaScript
- localStorage
- CustomEvent API
- Storage events

## Demo Users

After first run, you can create test users:
- Client: Register with "Client (Renter)" role
- Admin: Register with "Admin (Property Manager)" role

## Support

For issues or questions, please contact the development team.

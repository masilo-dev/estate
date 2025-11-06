// Authentication System with JWT-like token management
// Syncs authentication state across all dashboards

class AuthService {
    constructor() {
        this.currentUser = null;
        this.token = null;
        this.init();
    }

    init() {
        // Check for existing session
        const savedUser = localStorage.getItem('estate_user');
        const savedToken = localStorage.getItem('estate_token');
        
        if (savedUser && savedToken) {
            this.currentUser = JSON.parse(savedUser);
            this.token = savedToken;
            this.updateUI();
        }

        // Listen for storage changes to sync across tabs/windows
        window.addEventListener('storage', (e) => {
            if (e.key === 'estate_user' || e.key === 'estate_token') {
                this.syncAuthState();
            }
        });
    }

    // Simulate JWT token generation
    generateToken(user) {
        const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
        const payload = btoa(JSON.stringify({
            userId: user.id,
            email: user.email,
            role: user.role,
            exp: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
        }));
        const signature = btoa(user.email + Date.now());
        return `${header}.${payload}.${signature}`;
    }

    // Verify token is still valid
    verifyToken() {
        if (!this.token) return false;
        
        try {
            const parts = this.token.split('.');
            const payload = JSON.parse(atob(parts[1]));
            return payload.exp > Date.now();
        } catch (e) {
            return false;
        }
    }

    async register(name, email, password, role) {
        // Simulate API call - in production, this would call your backend
        await this.simulateApiDelay();

        // Check if user already exists
        const users = this.getUsers();
        if (users.find(u => u.email === email)) {
            throw new Error('User with this email already exists');
        }

        // Create new user
        const newUser = {
            id: Date.now(),
            name,
            email,
            password: this.hashPassword(password),
            role: role || 'client',
            createdAt: new Date().toISOString()
        };

        // Save to storage
        users.push(newUser);
        localStorage.setItem('estate_users', JSON.stringify(users));

        // Auto-login after registration
        return this.login(email, password);
    }

    async login(email, password) {
        // Simulate API call
        await this.simulateApiDelay();

        const users = this.getUsers();
        const user = users.find(u => u.email === email);

        if (!user || user.password !== this.hashPassword(password)) {
            throw new Error('Invalid email or password');
        }

        // Create session
        const userSession = {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role
        };

        this.currentUser = userSession;
        this.token = this.generateToken(userSession);

        // Save to localStorage for persistence and sync
        localStorage.setItem('estate_user', JSON.stringify(userSession));
        localStorage.setItem('estate_token', this.token);

        // Broadcast authentication event
        this.broadcastAuthChange('login');

        this.updateUI();
        return userSession;
    }

    logout() {
        this.currentUser = null;
        this.token = null;
        localStorage.removeItem('estate_user');
        localStorage.removeItem('estate_token');
        
        // Broadcast logout event
        this.broadcastAuthChange('logout');
        
        this.updateUI();
        
        // Redirect to home if on dashboard
        if (window.location.pathname.includes('dashboard')) {
            window.location.href = '/index.html';
        }
    }

    // Sync auth state across tabs/windows
    syncAuthState() {
        const savedUser = localStorage.getItem('estate_user');
        const savedToken = localStorage.getItem('estate_token');

        if (savedUser && savedToken) {
            this.currentUser = JSON.parse(savedUser);
            this.token = savedToken;
        } else {
            this.currentUser = null;
            this.token = null;
        }

        this.updateUI();

        // Refresh dashboard if user state changed
        if (window.location.pathname.includes('dashboard')) {
            if (this.currentUser) {
                window.location.reload();
            } else {
                window.location.href = '/index.html';
            }
        }
    }

    // Broadcast auth changes using CustomEvent
    broadcastAuthChange(action) {
        const event = new CustomEvent('authStateChange', {
            detail: { action, user: this.currentUser, token: this.token }
        });
        window.dispatchEvent(event);
    }

    updateUI() {
        const authButtons = document.getElementById('auth-buttons');
        const userMenu = document.getElementById('user-menu');
        const userName = document.getElementById('user-name');

        if (this.currentUser && this.verifyToken()) {
            if (authButtons) authButtons.style.display = 'none';
            if (userMenu) userMenu.style.display = 'block';
            if (userName) userName.textContent = `Welcome, ${this.currentUser.name}`;
        } else {
            if (authButtons) authButtons.style.display = 'block';
            if (userMenu) userMenu.style.display = 'none';
            if (this.currentUser && !this.verifyToken()) {
                // Token expired, logout
                this.logout();
                alert('Your session has expired. Please login again.');
            }
        }
    }

    // Simple password hashing (in production, use bcrypt on backend)
    hashPassword(password) {
        let hash = 0;
        for (let i = 0; i < password.length; i++) {
            const char = password.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return hash.toString(36);
    }

    getUsers() {
        const users = localStorage.getItem('estate_users');
        return users ? JSON.parse(users) : [];
    }

    simulateApiDelay() {
        return new Promise(resolve => setTimeout(resolve, 500));
    }

    isAuthenticated() {
        return this.currentUser !== null && this.verifyToken();
    }

    getCurrentUser() {
        return this.currentUser;
    }

    getToken() {
        return this.token;
    }

    hasRole(role) {
        return this.currentUser && this.currentUser.role === role;
    }
}

// Initialize auth service
const authService = new AuthService();

// Modal functions
function showLogin() {
    document.getElementById('loginModal').classList.add('active');
}

function showRegister() {
    document.getElementById('registerModal').classList.add('active');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

function showDashboard() {
    if (!authService.isAuthenticated()) {
        alert('Please login first');
        showLogin();
        return;
    }

    const user = authService.getCurrentUser();
    if (user.role === 'admin') {
        window.location.href = 'admin-dashboard.html';
    } else {
        window.location.href = 'client-dashboard.html';
    }
}

// Handle login form
async function handleLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    try {
        await authService.login(email, password);
        closeModal('loginModal');
        alert('Login successful!');
        showDashboard();
    } catch (error) {
        alert(error.message);
    }
}

// Handle register form
async function handleRegister(event) {
    event.preventDefault();
    
    const name = document.getElementById('register-name').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const role = document.getElementById('register-role').value;

    try {
        await authService.register(name, email, password, role);
        closeModal('registerModal');
        alert('Registration successful! You are now logged in.');
        showDashboard();
    } catch (error) {
        alert(error.message);
    }
}

function logout() {
    if (confirm('Are you sure you want to logout?')) {
        authService.logout();
        alert('You have been logged out successfully.');
    }
}

// Close modals when clicking outside
window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.classList.remove('active');
    }
}

// Authentication and User Management Module

class AuthManager {
    constructor() {
        this.currentUser = null;
        this.users = JSON.parse(localStorage.getItem('crmUsers')) || [
            // Default admin user
            {
                username: 'admin',
                // Default password: 'admin123' (hashed)
                passwordHash: '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9',
                role: 'admin'
            }
        ];
    }

    // Hash password using SHA-256
    async hashPassword(password) {
        const encoder = new TextEncoder();
        const data = encoder.encode(password);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(byte => byte.toString(16).padStart(2, '0')).join('');
    }

    // Generate JWT token
    generateToken(user) {
        const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
        const payload = btoa(JSON.stringify({
            username: user.username,
            role: user.role,
            exp: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
        }));
        const signature = btoa(header + '.' + payload); // Simplified for demo
        return `${header}.${payload}.${signature}`;
    }

    // Login user
    async login(username, password) {
        console.log('Login attempt:', { username });
        const user = this.users.find(u => u.username === username);
        if (!user) {
            console.error('Login failed: User not found');
            throw new Error('User not found');
        }

        const passwordHash = await this.hashPassword(password);
        console.log('Password verification:', { 
            inputHash: passwordHash,
            storedHash: user.passwordHash,
            matches: passwordHash === user.passwordHash
        });

        if (passwordHash !== user.passwordHash) {
            console.error('Login failed: Invalid password');
            throw new Error('Invalid password');
        }

        const token = this.generateToken(user);
        this.currentUser = { ...user, token };
        localStorage.setItem('crmCurrentUser', JSON.stringify(this.currentUser));
        console.log('Login successful:', { username: user.username, role: user.role });
        return this.currentUser;
    }

    // Logout user
    logout() {
        this.currentUser = null;
        localStorage.removeItem('crmCurrentUser');
    }

    // Check if user is logged in
    isLoggedIn() {
        if (!this.currentUser) {
            const savedUser = localStorage.getItem('crmCurrentUser');
            if (savedUser) {
                this.currentUser = JSON.parse(savedUser);
            }
        }
        return !!this.currentUser;
    }

    // Add new user (admin only)
    async addUser(username, password, role = 'user') {
        if (!this.currentUser || this.currentUser.role !== 'admin') {
            throw new Error('Unauthorized');
        }

        if (this.users.some(u => u.username === username)) {
            throw new Error('Username already exists');
        }

        const passwordHash = await this.hashPassword(password);
        const newUser = { username, passwordHash, role };
        this.users.push(newUser);
        localStorage.setItem('crmUsers', JSON.stringify(this.users));
        return newUser;
    }

    // Get current user
    getCurrentUser() {
        return this.currentUser;
    }
}

// Create global instance
const authManager = new AuthManager();

const handleFetchError = (error) => {
    console.error('Error:', error);
    alert('An error occurred. Please try again later.');
};

// Check which form exists on the current page
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');

// Registration Form Handler
if (registerForm) {
    registerForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        
        // Get form values
        const username = document.getElementById('username').value.trim();
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        const role = document.getElementById('role').value;

        // Basic validation
        if (!username || !email || !password || !confirmPassword) {
            alert('Please fill in all fields');
            return;
        }

        if (password !== confirmPassword) {
            alert('Passwords do not match');
            return;
        }

        const newUser = {
            username,
            email,
            password,
            role,
            createdAt: new Date().toISOString()
        };

        try {
            // Check if username or email already exists
            const checkResponse = await fetch('http://localhost:3000/users');
            const existingUsers = await checkResponse.json();
            
            if (existingUsers.some(user => user.username === username)) {
                alert('Username already exists');
                return;
            }

            if (existingUsers.some(user => user.email === email)) {
                alert('Email already exists');
                return;
            }

            // Register new user
            const response = await fetch('http://localhost:3000/users', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(newUser)
            });

            if (!response.ok) {
                throw new Error('Registration failed');
            }

            const result = await response.json();
            console.log('Registration successful:', result);
            alert('Registration successful! Please login.');
            window.location.href = 'login.html';
        } catch (error) {
            handleFetchError(error);
        }
    });
}

// Login Form Handler
if (loginForm) {
    loginForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;

        if (!username || !password) {
            alert('Please fill in all fields');
            return;
        }

        try {
            const response = await fetch('http://localhost:3000/users');
            if (!response.ok) {
                throw new Error('Failed to fetch users');
            }

            const users = await response.json();
            console.log('Retrieved users:', users); // For debugging

            const user = users.find(u => 
                u.username === username && u.password === password
            );

            if (user) {
                console.log('User found:', user); // For debugging
                localStorage.setItem('currentUser', JSON.stringify(user));
                alert('Login successful!');
                
                if (user.role === 'admin') {
                    window.location.href = 'admin_dashboard.html';
                } else {
                    window.location.href = 'farmer_dashboard.html';
                }
            } else {
                alert('Invalid username or password');
            }
        } catch (error) {
            handleFetchError(error);
        }
    });
}

// Check Authentication Status
const checkAuth = () => {
    const currentUser = localStorage.getItem('currentUser');
    if (currentUser) {
        const user = JSON.parse(currentUser);
        const currentPage = window.location.pathname;
        
        // Redirect from login/register pages if already logged in
        if (currentPage.includes('login.html') || currentPage.includes('register.html')) {
            window.location.href = user.role === 'admin' ? 'admin_dashboard.html' : 'farmer_dashboard.html';
        }
    }
};

// Logout Function
const logout = () => {
    localStorage.removeItem('currentUser');
    window.location.href = 'login.html';
};

// Check auth status when page loads
document.addEventListener('DOMContentLoaded', checkAuth);
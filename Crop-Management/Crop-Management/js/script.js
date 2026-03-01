// Show form dynamically
function showForm(form) {
    document.getElementById('forms').classList.remove('d-none');
    if (form === 'register') {
        document.getElementById('registerForm').classList.remove('d-none');
        document.getElementById('loginForm').classList.add('d-none');
    } else {
        document.getElementById('loginForm').classList.remove('d-none');
        document.getElementById('registerForm').classList.add('d-none');
    }
}

// Register User
document.getElementById('register').addEventListener('submit', (e) => {
    e.preventDefault();
    const username = document.getElementById('regUsername').value;
    const password = document.getElementById('regPassword').value;
    const role = document.getElementById('role').value;

    const user = { username, password, role };

    fetch('db/db.json', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(user),
    }).then((res) => {
        if (res.ok) alert('Registration successful!');
    });
});

// Login User
document.getElementById('login').addEventListener('submit', (e) => {
    e.preventDefault();
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;

    fetch('db/db.json')
        .then((res) => res.json())
        .then((users) => {
            const user = users.find(
                (u) => u.username === username && u.password === password
            );
            if (user) {
                alert('Login successful!');
                window.location.href =
                    user.role === 'admin'
                        ? 'admin_dashboard.html'
                        : 'farmer_dashboard.html';
            } else {
                alert('Invalid credentials!');
            }
        });
});


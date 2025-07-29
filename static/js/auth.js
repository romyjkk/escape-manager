// Authentication JavaScript

document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const profileView = document.getElementById('profileView');
    const logoutButton = document.getElementById('logoutButton');
    const adminPanelButton = document.getElementById('adminPanelButton');

    // Check if user is already logged in
    checkAuthStatus();

    // Login form submission
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const username = document.getElementById('loginUsername').value;
        const password = document.getElementById('loginPassword').value;

        fetch('/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username: username,
                password: password
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showSuccess('Login successful!');
                localStorage.setItem('userSession', JSON.stringify(data.user));
                showProfileView(data.user);
            } else {
                showError('Login failed: ' + data.message);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showError('An error occurred during login');
        });
    });

    // Admin panel button
    if (adminPanelButton) {
        adminPanelButton.addEventListener('click', function() {
            window.location.href = '/admin';
        });
    }

    // Logout
    logoutButton.addEventListener('click', function() {
        localStorage.removeItem('userSession');
        profileView.classList.add('invisible');
        loginForm.classList.remove('invisible');
        showSuccess('Logged out successfully!');
    });

    function checkAuthStatus() {
        const userSession = localStorage.getItem('userSession');
        if (userSession) {
            const user = JSON.parse(userSession);
            // Validate session with server
            validateSession(user);
        }
    }

    function validateSession(user) {
        fetch('/current_user')
        .then(response => {
            if (response.status === 401) {
                // Session invalid, log out
                localStorage.removeItem('userSession');
                profileView.classList.add('invisible');
                loginForm.classList.remove('invisible');
                showWarning('Your session has expired. Please login again.');
                return;
            }
            return response.json();
        })
        .then(data => {
            if (data && data.success) {
                // Session valid, show profile
                showProfileView(user);
            } else {
                // Session invalid, log out
                localStorage.removeItem('userSession');
                profileView.classList.add('invisible');
                loginForm.classList.remove('invisible');
                showWarning('Your session has expired. Please login again.');
            }
        })
        .catch(error => {
            console.error('Error validating session:', error);
            // On error, assume session is invalid and log out
            localStorage.removeItem('userSession');
            profileView.classList.add('invisible');
            loginForm.classList.remove('invisible');
            showError('Unable to validate session. Please login again.');
        });
    }

    function showProfileView(user) {
        loginForm.classList.add('invisible');
        profileView.classList.remove('invisible');

        // Populate user info
        document.getElementById('userName').textContent = user.username;
        document.getElementById('userRole').textContent = 'Role: ' + user.role;
        
        // Show admin panel button for admin and manager roles
        if (user.role === 'admin' || user.role === 'manager') {
            adminPanelButton.classList.remove('invisible');
        } else {
            adminPanelButton.classList.add('invisible');
        }
    }
});

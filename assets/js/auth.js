// Authentication handler - Updated for Supabase

function fillCredentials(email, password) {
    $('#username').val(email);
    $('#password').val(password);
}

function showToast(message, type = 'success') {
    const toastClass = type === 'success' ? 'toast-success' : type === 'error' ? 'toast-error' : 'toast-warning';
    const iconPath = type === 'success' 
        ? 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' 
        : 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z';
    
    const toast = $(`
        <div class="toast ${toastClass}">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="${iconPath}"></path>
            </svg>
            <span class="font-medium">${message}</span>
        </div>
    `);
    
    $('body').append(toast);
    
    setTimeout(() => {
        toast.fadeOut(300, function() {
            $(this).remove();
        });
    }, 3000);
}

// UPDATED: Now async to work with Supabase
async function login(email, password) {
    try {
        // Get users from Supabase (async)
        const users = await getUsers();
        
        // Find matching user
        const user = users.find(u => u.email === email && u.password === password);
        
        if (user) {
            // Check if user is active
            if (user.status === 'inactive') {
                showToast('Your account has been deactivated. Please contact admin.', 'error');
                return false;
            }
            
            // Store session
            sessionStorage.setItem('hpgas_current_user', JSON.stringify(user));
            
            showToast('Login successful!', 'success');
            
            // Redirect based on role
            setTimeout(() => {
                switch(user.role) {
                    case 'super_admin':
                        window.location.href = 'admin-dashboard.html';
                        break;
                    case 'manager':
                        window.location.href = 'manager-dashboard.html';
                        break;
                    case 'driver':
                        window.location.href = 'driver-dashboard.html';
                        break;
                }
            }, 500);
            
            return true;
        } else {
            showToast('Invalid credentials!', 'error');
            return false;
        }
    } catch (error) {
        console.error('Login error:', error);
        showToast('Login failed. Please try again.', 'error');
        return false;
    }
}

function getCurrentUser() {
    const userJson = sessionStorage.getItem('hpgas_current_user');
    return userJson ? JSON.parse(userJson) : null;
}

function logout() {
    sessionStorage.removeItem('hpgas_current_user');
    window.location.href = 'index.html';
}

function checkAuth() {
    const user = getCurrentUser();
    if (!user) {
        window.location.href = 'index.html';
        return null;
    }
    return user;
}

// Login form handler - UPDATED: async
$(document).ready(function() {
    $('#loginForm').on('submit', async function(e) {  // ← Added async
        e.preventDefault();
        
        const email = $('#username').val().trim();
        const password = $('#password').val().trim();
        
        if (!email || !password) {
            showToast('Please enter email and password', 'error');
            return;
        }
        
        await login(email, password);  // ← Added await
    });
});
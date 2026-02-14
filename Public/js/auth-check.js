// auth-check.js
// This script checks for an active Supabase session and synchronizes it with localStorage

async function checkAuthSession() {
    try {
        if (!window.sbClient) {
            console.warn('sbClient not found during auth check');
            return false;
        }
        const { data: { session }, error } = await sbClient.auth.getSession();
        
        if (error) throw error;

        if (session) {
            const user = session.user;
            
            // Sync with local storage used by the existing app
            localStorage.setItem('loggedIn', 'true');
            localStorage.setItem('userEmail', user.email);
            localStorage.setItem('userId', user.id);
            localStorage.setItem('userName', user.user_metadata.full_name || user.email.split('@')[0]);
            
            // Check if admin (based on email as per app.py logic)
            const isAdmin = ['admin@groundbooking.com', 'owner@groundbooking.com'].includes(user.email);
            localStorage.setItem('isAdmin', isAdmin ? 'true' : 'false');
            
            return true;
        }
        return false;
    } catch (err) {
        console.error('Auth session check error:', err);
        return false;
    }
}

// Global Toast Notification System
window.showToast = function(message, type = 'info') {
    let container = document.getElementById('notification-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'notification-container';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = 'custom-toast';
    
    const icons = {
        info: '🔔',
        success: '✅',
        error: '❌',
        warning: '⚠️'
    };

    toast.innerHTML = `
        <span style="font-size: 1.5rem;">${icons[type] || '🔔'}</span>
        <div style="font-weight: 700;">${message}</div>
        <div class="toast-progress"></div>
    `;
    
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'fadeOut 0.5s forwards';
        setTimeout(() => toast.remove(), 500);
    }, 4000);
};

// Update header based on login status
function updateHeader() {
    const isLoggedIn = localStorage.getItem('loggedIn') === 'true';
    const isAdmin = localStorage.getItem('isAdmin') === 'true';
    const userPhoto = localStorage.getItem('userPhoto');
    const userName = localStorage.getItem('userName') || 'Profile';

    const profileLink = document.getElementById('profileLink');
    const loginBtn = document.getElementById('loginBtn');
    const adminLink = document.getElementById('adminLink');

    if (profileLink) {
        if (isLoggedIn) {
            profileLink.style.display = 'flex';
            if (userPhoto && userPhoto !== 'null' && userPhoto !== 'undefined') {
                profileLink.innerHTML = `<img src="${userPhoto}" class="profile-pill-img" alt="Profile"> ${userName}`;
            } else {
                profileLink.innerHTML = `👤 ${userName}`;
            }
        } else {
            profileLink.style.display = 'none';
        }
    }

    if (loginBtn) {
        loginBtn.style.display = isLoggedIn ? 'none' : 'inline-block';
    }

    if (adminLink) {
        adminLink.style.display = (isLoggedIn && isAdmin) ? 'inline-block' : 'none';
    }
}

// Run immediately to avoid flicker
updateHeader();

// Run on page load and after session check
document.addEventListener('DOMContentLoaded', async () => {
    updateHeader(); // Check again after DOM is ready
    
    await checkAuthSession();
    updateHeader(); // Check again after async session check
    
    // If we are on login.html and just logged in, redirect
    if (localStorage.getItem('loggedIn') === 'true' && window.location.pathname.endsWith('login.html')) {
        const redirect = localStorage.getItem('redirectAfterLogin');
        if (redirect) {
            localStorage.removeItem('redirectAfterLogin');
            window.location.href = redirect;
        } else {
            const isAdmin = localStorage.getItem('isAdmin') === 'true';
            window.location.href = isAdmin ? 'admin.html' : 'index.html';
        }
    }
});

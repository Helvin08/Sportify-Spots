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

// Run on page load
document.addEventListener('DOMContentLoaded', async () => {
    await checkAuthSession();
    
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

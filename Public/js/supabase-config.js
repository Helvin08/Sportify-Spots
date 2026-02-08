var SUPABASE_URL = "https://cpcfetigpjuezazevkqw.supabase.co";
var SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNwY2ZldGlncGp1ZXphemV2a3F3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDM3MDk4NCwiZXhwIjoyMDg1OTQ2OTg0fQ.Fi5nF8G5LOLYtxUvFeIBn-Waf1kyVpX388Kn4kO4F7I";

// Initialize the Supabase client
// Using a unique name 'sbClient' to avoid conflict with the 'supabase' library object
var sbClient;
try {
    if (window.supabase && typeof window.supabase.createClient === 'function') {
        sbClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
        console.log('Supabase client initialized successfully as sbClient');
    } else {
        console.error('Supabase library not loaded correctly');
    }
} catch (e) {
    console.error('Error initializing Supabase:', e);
}

// Runtime configuration for BADGENODE
// Questo file viene caricato dal browser per ottenere le credenziali Supabase

window.BADGENODE_CONFIG = {
  SUPABASE_URL: 'https://txmjqrnitfsiytbytxlc.supabase.co',
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR4bWpxcm5pdGZzaXl0Ynl0eGxjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE1MzY1MDcsImV4cCI6MjA2NzExMjUwN30.lag16Oxh_UQL4WOeU9-pVxIzvUyiNQMhKUY5Y5s9DPg',
  VERSION: '1.1.0',
  ENV: 'production'
};

console.log('🔧 BADGENODE Config caricato:', {
  url: window.BADGENODE_CONFIG.SUPABASE_URL,
  env: window.BADGENODE_CONFIG.ENV,
  version: window.BADGENODE_CONFIG.VERSION
});

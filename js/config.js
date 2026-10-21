/* Site configuration.
   Paste your Supabase project URL and anon (public) key here to turn on
   accounts, the shared product database and saved orders (see SETUP.md).
   Leave them empty to run the site in demo mode.

   The anon key is designed to be public: what it can do is limited by the
   database rules in supabase/schema.sql. NEVER put the service_role key here. */
window.SITE_CONFIG = {
  supabaseUrl: 'https://hrxzliarbyfidrbsbgvk.supabase.co',
  supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhyeHpsaWFyYnlmaWRyYnNiZ3ZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI1OTI4ODYsImV4cCI6MjEwODE2ODg4Nn0.qgH1vAM4f9DeVr5ofnhMsYW9wpaCUJSbToE6mqIbzlI', // public anon key
  adminEmail: 'paquejefferson@gmail.com' // shown in the UI only; the real check is in the database
};

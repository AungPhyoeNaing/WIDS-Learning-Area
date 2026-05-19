import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://pbonkrdpjxiedfrqkipa.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBib25rcmRwanhpZWRmcnFraXBhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkxOTM2OTgsImV4cCI6MjA5NDc2OTY5OH0.AactghdOkumBurCY652OZqJs4zL0FZ8M90VQGvslf6I';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

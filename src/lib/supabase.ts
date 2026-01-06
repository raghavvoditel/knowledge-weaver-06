import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://rbrmthytuumssrgqjasr.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJicm10aHl0dXVtc3NyZ3FqYXNyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc2NDQ2MDIsImV4cCI6MjA4MzIyMDYwMn0.QzeZoAG65NaN8QFkz5GM-LAeRqIxole0dKaCoJx_XdM';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

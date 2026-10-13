import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const key = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '';
export const isSupabaseConfigured = Boolean(url && key);

// The publishable key is safe in a client only when every table and storage
// bucket has the RLS policies in supabase/migrations enabled.
export const supabase = createClient(url || 'https://example.supabase.co', key || 'missing-publishable-key', {
  auth: { storage: AsyncStorage, autoRefreshToken: true, persistSession: true, detectSessionInUrl: false },
});

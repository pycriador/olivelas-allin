import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || 'https://pkbjoxzqllextmtmjoia.supabase.co';
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_o1__puYMRdwn6HLkN2uzMQ_6s2OLgSa';

export const supabaseAdmin = createClient(supabaseUrl, supabaseSecretKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
  db: {
    schema: 'olivelas_iam_forms',
  },
});

export const supabasePublic = createClient(supabaseUrl, supabaseAnonKey, {
  db: {
    schema: 'olivelas_iam_forms',
  },
});

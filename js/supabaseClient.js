import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const SUPABASE_URL = 'https://vswmvhkmhwoiklknqbcz.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_TtaZcjsV0Ucf1sf9FWqUOw_pp8QezU0';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

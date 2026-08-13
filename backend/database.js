const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

const isConfigured = supabaseUrl && supabaseKey && 
                      supabaseUrl.indexOf('YOUR_') !== 0 && 
                      supabaseKey.indexOf('YOUR_') !== 0;

if (!isConfigured) {
  console.warn('⚠️  Supabase URL or Key is not configured in .env. Database operations will fail until configured.');
}

// Fallback to placeholders if not set, to prevent the server from crashing on boot
const supabase = createClient(
  isConfigured ? supabaseUrl : 'https://placeholder-url.supabase.co',
  isConfigured ? supabaseKey : 'placeholder-key'
);

module.exports = {
  supabase,
  isConfigured
};

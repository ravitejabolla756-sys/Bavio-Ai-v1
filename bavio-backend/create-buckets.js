/**
 * create-buckets.js
 * ─────────────────────────────────────────────────────────────────────
 * Programmatically creates the public 'tts-audio' and private 'call-recordings'
 * storage buckets in Supabase using the service role key.
 *
 * Run: node create-buckets.js
 * (from the bavio-backend directory)
 */

require('dotenv').config();
const supabase = require('./config/supabase');

async function createBuckets() {
  console.log('═══════════════════════════════════════════════');
  console.log('  BAVIO AI — SUPABASE STORAGE BUCKET CREATOR');
  console.log('═══════════════════════════════════════════════\n');

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !serviceKey) {
    console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env file.');
    process.exit(1);
  }

  // 1. Create tts-audio (Public)
  console.log('📦 Setting up "tts-audio" bucket...');
  try {
    // Check if it already exists by listing buckets
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    if (listError) throw listError;

    const ttsExists = buckets.some(b => b.name === 'tts-audio');
    if (ttsExists) {
      console.log('  ✓ "tts-audio" bucket already exists.');
    } else {
      const { data, error } = await supabase.storage.createBucket('tts-audio', {
        public: true, // Needs to be public for Exotel/Twilio to access files via URL
        allowedMimeTypes: ['audio/wav', 'audio/mpeg', 'audio/mp3', 'audio/x-wav'],
        fileSizeLimit: 10485760 // 10MB
      });
      if (error) throw error;
      console.log('  🎉 Successfully created public "tts-audio" bucket!');
    }
  } catch (err) {
    console.error('  ❌ Failed to setup "tts-audio":', err.message);
  }

  // 2. Create call-recordings (Private)
  console.log('\n📦 Setting up "call-recordings" bucket...');
  try {
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    if (listError) throw listError;

    const recExists = buckets.some(b => b.name === 'call-recordings');
    if (recExists) {
      console.log('  ✓ "call-recordings" bucket already exists.');
    } else {
      const { data, error } = await supabase.storage.createBucket('call-recordings', {
        public: false, // Keep private for user security/data integrity
        allowedMimeTypes: ['audio/wav', 'audio/mpeg', 'audio/mp3', 'audio/x-wav'],
        fileSizeLimit: 15728640 // 15MB
      });
      if (error) throw error;
      console.log('  🎉 Successfully created private "call-recordings" bucket!');
    }
  } catch (err) {
    console.error('  ❌ Failed to setup "call-recordings":', err.message);
  }

  console.log('\n═══════════════════════════════════════════════');
  console.log('  Setup check completed.');
  console.log('═══════════════════════════════════════════════\n');
}

createBuckets();

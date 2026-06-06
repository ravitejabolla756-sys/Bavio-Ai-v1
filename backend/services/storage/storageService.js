const { v4: uuidv4 } = require('uuid');
const supabase = require('../../config/supabase');

const TTS_BUCKET = 'tts-audio';
const RECORDINGS_BUCKET = 'call-recordings';

// ── 1. Upload TTS audio buffer to Supabase Storage ─────────────────────────
// Returns: { audioUrl, filePath }
async function uploadTtsAudio(buffer, fileName) {
  const filePath = `tts/${fileName}`;

  console.log(`[STORAGE] Uploading TTS audio → ${TTS_BUCKET}/${filePath} (${buffer.length} bytes)`);

  const { data, error } = await supabase.storage
    .from(TTS_BUCKET)
    .upload(filePath, buffer, {
      contentType: 'audio/wav',
      upsert: true        // overwrite if same name (safe for per-call filenames)
    });

  if (error) {
    console.error('[STORAGE] TTS upload failed:', error.message);
    throw new Error(`[STORAGE] Failed to upload TTS audio: ${error.message}`);
  }

  // Get the public URL (bucket must be public in Supabase dashboard)
  const { data: urlData } = supabase.storage
    .from(TTS_BUCKET)
    .getPublicUrl(filePath);

  const audioUrl = urlData.publicUrl;
  console.log(`[STORAGE] TTS audio uploaded: ${audioUrl}`);

  return { audioUrl, filePath };
}

// ── 2. Delete a TTS audio file after call ends ──────────────────────────────
async function deleteTtsAudio(filePath) {
  console.log(`[STORAGE] Deleting TTS file: ${TTS_BUCKET}/${filePath}`);

  const { error } = await supabase.storage
    .from(TTS_BUCKET)
    .remove([filePath]);

  if (error) {
    // Non-fatal — log and continue
    console.error('[STORAGE] TTS delete failed:', error.message);
  } else {
    console.log(`[STORAGE] Deleted: ${filePath}`);
  }
}

// ── 3. Upload full call recording (private) ─────────────────────────────────
// Returns: { filePath }  — no public URL, use signed URL if needed
async function uploadCallRecording(buffer, fileName) {
  const filePath = `recordings/${fileName}`;

  console.log(`[STORAGE] Uploading recording → ${RECORDINGS_BUCKET}/${filePath} (${buffer.length} bytes)`);

  const { data, error } = await supabase.storage
    .from(RECORDINGS_BUCKET)
    .upload(filePath, buffer, {
      contentType: 'audio/wav',
      upsert: false
    });

  if (error) {
    console.error('[STORAGE] Recording upload failed:', error.message);
    throw new Error(`[STORAGE] Failed to upload recording: ${error.message}`);
  }

  console.log(`[STORAGE] Recording stored at: ${filePath}`);
  return { filePath };
}

// ── 4. Get public URL from tts-audio bucket ─────────────────────────────────
function getPublicAudioUrl(filePath) {
  const { data } = supabase.storage
    .from(TTS_BUCKET)
    .getPublicUrl(filePath);

  return data.publicUrl;
}

// ── 5. Cleanup: delete TTS files older than 24 hours ────────────────────────
// Call this from a cron job or server startup interval
async function cleanupOldTtsFiles() {
  console.log('[STORAGE] Running TTS cleanup — deleting files older than 24h...');

  try {
    const { data: files, error } = await supabase.storage
      .from(TTS_BUCKET)
      .list('tts', {
        limit: 200,
        offset: 0,
        sortBy: { column: 'created_at', order: 'asc' }
      });

    if (error) {
      console.error('[STORAGE] Cleanup list failed:', error.message);
      return;
    }

    if (!files || files.length === 0) {
      console.log('[STORAGE] No TTS files to clean up.');
      return;
    }

    const cutoff = Date.now() - 24 * 60 * 60 * 1000; // 24 hours ago

    const staleFiles = files.filter(file => {
      const created = new Date(file.created_at).getTime();
      return created < cutoff;
    });

    if (staleFiles.length === 0) {
      console.log('[STORAGE] No stale TTS files found.');
      return;
    }

    const pathsToDelete = staleFiles.map(f => `tts/${f.name}`);
    console.log(`[STORAGE] Deleting ${pathsToDelete.length} stale TTS files...`);

    const { error: deleteError } = await supabase.storage
      .from(TTS_BUCKET)
      .remove(pathsToDelete);

    if (deleteError) {
      console.error('[STORAGE] Cleanup delete failed:', deleteError.message);
    } else {
      console.log(`[STORAGE] ✅ Cleaned up ${pathsToDelete.length} old TTS files.`);
    }
  } catch (err) {
    console.error('[STORAGE] Cleanup error:', err.message);
  }
}

// ── 6. Generate a unique filename for a call turn ────────────────────────────
function buildTtsFileName(callSid, turn) {
  return `${callSid}-turn${turn}-${uuidv4()}.wav`;
}

// ── 7. Delete all TTS files for a specific call (called on call end) ────────
async function cleanupCallTtsFiles(callSid) {
  console.log(`[STORAGE] Cleaning up TTS files for call: ${callSid}`);

  try {
    const { data: files, error } = await supabase.storage
      .from(TTS_BUCKET)
      .list('tts', {
        limit: 100,
        search: callSid   // files are named {callSid}-turn{n}-{uuid}.wav
      });

    if (error) {
      console.error('[STORAGE] cleanupCallTtsFiles list error:', error.message);
      return;
    }

    if (!files || files.length === 0) {
      console.log(`[STORAGE] No TTS files found for call ${callSid}`);
      return;
    }

    const pathsToDelete = files
      .filter(f => f.name.startsWith(callSid))
      .map(f => `tts/${f.name}`);

    if (pathsToDelete.length === 0) return;

    const { error: deleteError } = await supabase.storage
      .from(TTS_BUCKET)
      .remove(pathsToDelete);

    if (deleteError) {
      console.error('[STORAGE] cleanupCallTtsFiles delete error:', deleteError.message);
    } else {
      console.log(`[STORAGE] Deleted ${pathsToDelete.length} TTS files for call ${callSid}`);
    }
  } catch (err) {
    console.error('[STORAGE] cleanupCallTtsFiles error:', err.message);
  }
}

module.exports = {
  uploadTtsAudio,
  deleteTtsAudio,
  uploadCallRecording,
  getPublicAudioUrl,
  cleanupOldTtsFiles,
  cleanupCallTtsFiles,
  buildTtsFileName,
  TTS_BUCKET,
  RECORDINGS_BUCKET
};
